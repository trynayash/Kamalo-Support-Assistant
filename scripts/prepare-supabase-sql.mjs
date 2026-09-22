import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.resolve(rootDir, process.argv[2] || "development_db.sql");
const outputDir = path.resolve(rootDir, "supabase");

function parseCopyFields(line) {
  const fields = [];
  let current = "";

  const pushField = (value) => {
    fields.push(value);
    current = "";
  };

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\\") {
      const next = line[index + 1];
      if (next === "N" && current === "") {
        const after = line[index + 2];
        if (after === undefined || after === "\t") {
          pushField(null);
          index += after === "\t" ? 2 : 1;
          continue;
        }
      }
      if (next === "t") { current += "\t"; index += 1; continue; }
      if (next === "n") { current += "\n"; index += 1; continue; }
      if (next === "r") { current += "\r"; index += 1; continue; }
      if (next === "\\") { current += "\\"; index += 1; continue; }
      current += next ?? "\\";
      index += 1;
      continue;
    }
    if (char === "\t") {
      pushField(current);
      continue;
    }
    current += char;
  }

  if (current.length > 0) pushField(current);
  return fields;
}

function sqlLiteral(value) {
  if (value === null) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function convertCopyToInserts(copyHeader, dataLines, batchSize = 40) {
  const match = copyHeader.match(/^COPY\s+([\w."]+)\s*\(([^)]+)\)\s+FROM stdin;/i);
  if (!match) return [];

  const table = match[1];
  const columns = match[2].split(",").map((column) => column.trim());
  const inserts = [];

  for (let offset = 0; offset < dataLines.length; offset += batchSize) {
    const batch = dataLines.slice(offset, offset + batchSize);
    const values = batch.map((line) => {
      const fields = parseCopyFields(line);
      return `(${fields.map(sqlLiteral).join(", ")})`;
    });
    inserts.push(`INSERT INTO ${table} (${columns.join(", ")}) VALUES\n${values.join(",\n")};`);
  }

  return inserts;
}

function transformSql(raw) {
  const lines = raw.split(/\r?\n/).filter((line) => !line.startsWith("\\restrict") && !line.startsWith("\\unrestrict"));
  const schemaLines = [];
  const dataFiles = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (/^COPY\s+/i.test(line)) {
      const copyHeader = line;
      index += 1;
      const dataLines = [];
      while (index < lines.length && lines[index] !== "\\.") {
        if (lines[index].trim()) dataLines.push(lines[index]);
        index += 1;
      }
      const tableName = copyHeader.match(/^COPY\s+(?:public\.)?(\w+)/i)?.[1] || "data";
      dataFiles.push({ tableName, sql: convertCopyToInserts(copyHeader, dataLines).join("\n\n") });
      index += 1;
      continue;
    }
    schemaLines.push(line);
    index += 1;
  }

  return { schemaLines, dataFiles };
}

function sanitizeSchemaForSupabase(lines) {
  return lines
    .filter((line) => !line.includes("set_config('search_path', '', false)"))
    .filter((line) => !/^CREATE EXTENSION IF NOT EXISTS vector/i.test(line))
    .filter((line) => !/^COMMENT ON EXTENSION vector/i.test(line))
    .map((line) => line.replace(/\bpublic\.vector\b/g, "vector"));
}

const raw = readFileSync(sourcePath, "utf8");
const { schemaLines, dataFiles } = transformSql(raw);

mkdirSync(outputDir, { recursive: true });

const enableVectorPath = path.resolve(outputDir, "00-enable-vector.sql");
writeFileSync(enableVectorPath, `-- Run this FIRST in Supabase before 01-schema.sql
--
-- Option A (recommended): Supabase Dashboard -> Database -> Extensions -> search "vector" -> Enable
-- Option B: run this query once:
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

SET search_path TO public, extensions;
`, "utf8");

const schemaHeader = `-- KAMALO Supabase schema (no COPY blocks)
-- Source: ${path.basename(sourcePath)}
-- Prerequisite: run 00-enable-vector.sql OR enable "vector" in Supabase Extensions first.
--
SET search_path TO public, extensions;

`;

const schemaPath = path.resolve(outputDir, "01-schema.sql");
writeFileSync(
  schemaPath,
  `${schemaHeader}${sanitizeSchemaForSupabase(schemaLines).join("\n").trimEnd()}\n`,
  "utf8",
);

const importOrder = [
  "conversations",
  "knowledge_articles",
  "knowledge_chunks",
  "messages",
  "message_attachments",
  "message_feedback",
  "support_tickets",
  "support_ticket_attachments",
];

const sortedDataFiles = [...dataFiles].sort((left, right) => {
  const leftIndex = importOrder.indexOf(left.tableName);
  const rightIndex = importOrder.indexOf(right.tableName);
  return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
});

for (const [fileIndex, file] of sortedDataFiles.entries()) {
  const padded = String(fileIndex + 2).padStart(2, "0");
  const previous = fileIndex === 0 ? "01-schema.sql" : `${String(fileIndex + 1).padStart(2, "0")}-data-${sortedDataFiles[fileIndex - 1].tableName}.sql`;
  const dataPath = path.resolve(outputDir, `${padded}-data-${file.tableName}.sql`);
  const dataHeader = `-- KAMALO Supabase data import: ${file.tableName}
-- Run after ${previous}
--
`;
  writeFileSync(dataPath, `${dataHeader}${file.sql}\n`, "utf8");
}

console.log(`Wrote ${enableVectorPath}`);
console.log(`Wrote ${schemaPath}`);
for (const file of sortedDataFiles) {
  console.log(`Wrote ${path.resolve(outputDir, `*-data-${file.tableName}.sql`)}`);
}
console.log("\nImport order in Supabase SQL Editor:");
console.log("1. 00-enable-vector.sql  (or enable vector in Dashboard -> Extensions)");
console.log("2. 01-schema.sql");
for (const file of sortedDataFiles) {
  console.log(`   *-data-${file.tableName}.sql`);
}

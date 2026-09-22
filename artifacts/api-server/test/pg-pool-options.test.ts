import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createSupabaseDirectHostError,
  normalizeSupabaseDatabaseUrl,
} from "../../../lib/db/src/pg-pool-options.ts";

test("throws in production when Supabase direct host has no pooler override", () => {
  const previousEnv = process.env.NODE_ENV;
  const previousPooler = process.env.DATABASE_POOLER_URL;
  const previousRegion = process.env.SUPABASE_DB_REGION;
  process.env.NODE_ENV = "production";
  delete process.env.DATABASE_POOLER_URL;
  delete process.env.SUPABASE_DB_REGION;

  try {
    assert.throws(
      () => normalizeSupabaseDatabaseUrl("postgresql://postgres:secret@db.abcdefghijklmnop.supabase.co:5432/postgres"),
      (error: unknown) => {
        assert.match(String(error), /db\.abcdefghijklmnop\.supabase\.co/i);
        assert.match(String(error), /pooler\.supabase\.com/i);
        return true;
      },
    );
  } finally {
    process.env.NODE_ENV = previousEnv;
    if (previousPooler) process.env.DATABASE_POOLER_URL = previousPooler;
    else delete process.env.DATABASE_POOLER_URL;
    if (previousRegion) process.env.SUPABASE_DB_REGION = previousRegion;
    else delete process.env.SUPABASE_DB_REGION;
  }
});

test("uses DATABASE_POOLER_URL override for direct Supabase URLs", () => {
  const previousPooler = process.env.DATABASE_POOLER_URL;
  process.env.DATABASE_POOLER_URL = "postgresql://postgres.abcdefgh:secret@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";

  try {
    const normalized = normalizeSupabaseDatabaseUrl("postgresql://postgres:secret@db.abcdefgh.supabase.co:5432/postgres");
    assert.match(normalized, /pooler\.supabase\.com/i);
  } finally {
    if (previousPooler) process.env.DATABASE_POOLER_URL = previousPooler;
    else delete process.env.DATABASE_POOLER_URL;
  }
});

test("rewrites direct Supabase URL when SUPABASE_DB_REGION is set", () => {
  const previousRegion = process.env.SUPABASE_DB_REGION;
  const previousPooler = process.env.DATABASE_POOLER_URL;
  delete process.env.DATABASE_POOLER_URL;
  process.env.SUPABASE_DB_REGION = "ap-south-1";

  try {
    const normalized = normalizeSupabaseDatabaseUrl("postgresql://postgres:secret@db.abcdefgh.supabase.co:5432/postgres");
    assert.match(normalized, /aws-0-ap-south-1\.pooler\.supabase\.com/i);
    assert.match(normalized, /postgres\.abcdefgh/i);
  } finally {
    if (previousRegion) process.env.SUPABASE_DB_REGION = previousRegion;
    else delete process.env.SUPABASE_DB_REGION;
    if (previousPooler) process.env.DATABASE_POOLER_URL = previousPooler;
  }
});

test("createSupabaseDirectHostError includes project ref", () => {
  const error = createSupabaseDirectHostError("myprojectref");
  assert.equal(error.code, "SUPABASE_DIRECT_HOST");
  assert.equal(error.projectRef, "myprojectref");
  assert.match(error.message, /myprojectref/);
});

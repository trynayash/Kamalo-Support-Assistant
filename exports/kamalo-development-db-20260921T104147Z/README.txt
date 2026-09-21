KAMALO AI development database export

Contents:
- full.sql: complete logical SQL dump with original ownership/ACL statements
- portable.sql: complete logical SQL dump without environment-specific ownership/ACL statements
- schema-only.sql: schema objects only
- data-only.sql: table data, sequences, and large objects only
- full.dump: native PostgreSQL custom-format archive for pg_restore

Examples:
  psql "$TARGET_DATABASE_URL" -f portable.sql
  pg_restore --clean --if-exists --dbname="$TARGET_DATABASE_URL" full.dump

The export is from the development database. Connection credentials are not included.

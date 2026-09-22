-- Run this FIRST in Supabase before 01-schema.sql
--
-- Option A (recommended): Supabase Dashboard -> Database -> Extensions -> search "vector" -> Enable
-- Option B: run this query once:
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

SET search_path TO public, extensions;

-- KAMALO Supabase data import: message_attachments
-- Run after 05-data-messages.sql
--
INSERT INTO public.message_attachments (id, conversation_id, message_id, original_filename, media_type, size, storage_key, created_at) VALUES
('3d09da2d-2bce-4370-b796-00efa43dd7c8', 'd12b399b-2fc3-4b93-8168-1742f8354573', NULL, 'kamalo-ticket-evidence.png', 'image/png', '68', '3d09da2d-2bce-4370-b796-00efa43dd7c8.png', '2026-09-17 06:25:16.732389+00'),
('4137b75c-057a-40df-8cd2-a5dd0747c029', '91ec33f0-0e99-4310-9f04-f6edf9b4b363', 'a8dc2f52-9e5b-440c-a206-d68b8e56ea71', 'KAMALO.png', 'image/png', '152094', '4137b75c-057a-40df-8cd2-a5dd0747c029.png', '2026-09-18 07:03:52.634953+00'),
('c429bd40-b9d7-4301-9177-dfcbf9264cef', 'c0292ae9-91ae-450b-9891-e3e8ec620afb', NULL, 'BARS_LOGO.png', 'image/png', '9531', 'c429bd40-b9d7-4301-9177-dfcbf9264cef.png', '2026-09-21 09:00:17.473887+00');

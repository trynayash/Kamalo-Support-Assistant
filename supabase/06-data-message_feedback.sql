-- KAMALO Supabase data import: message_feedback
-- Run after 01-schema.sql
--
INSERT INTO public.message_feedback (id, message_id, rating, feedback, created_at, score) VALUES
('d56b7012-255d-446c-b7e8-5968b20d741b', '9f9891d7-411b-4129-8c6c-0d662f1e9d71', 'helpful', NULL, '2026-09-17 06:13:45.999368+00', NULL),
('c9e191fe-b342-4d22-89df-d38f24322e10', '9f9891d7-411b-4129-8c6c-0d662f1e9d71', 'helpful', NULL, '2026-09-17 06:13:48.123044+00', NULL),
('9832d707-10e3-494a-9375-f9702c68281f', '9f9891d7-411b-4129-8c6c-0d662f1e9d71', 'helpful', NULL, '2026-09-17 06:13:48.982088+00', NULL),
('f2140195-e953-46a9-a7bf-918a50858484', '9f9891d7-411b-4129-8c6c-0d662f1e9d71', 'helpful', NULL, '2026-09-17 06:18:48.010462+00', NULL),
('789bb8a1-aaac-4277-97e5-febf897f3b2c', '9f9891d7-411b-4129-8c6c-0d662f1e9d71', 'helpful', NULL, '2026-09-17 06:18:48.696807+00', NULL),
('0915f648-fff3-400b-9e41-020462f247f1', '9f9891d7-411b-4129-8c6c-0d662f1e9d71', 'helpful', NULL, '2026-09-17 06:18:49.235219+00', NULL),
('7a16d5a6-fe8b-4dd2-b540-b5f5a7a6d6c9', '9f9891d7-411b-4129-8c6c-0d662f1e9d71', 'not_helpful', NULL, '2026-09-17 06:18:50.091238+00', NULL),
('6843b2db-e73a-4b24-aa10-023caa0df1f6', '7eb901d8-d90b-4579-9383-677c9539eb91', 'not_helpful', 'The answer needed a clearer explanation and next steps.', '2026-09-17 06:24:33.473894+00', '2'),
('68d8f8ff-08ed-46b3-a79c-9a228429b917', '9f9891d7-411b-4129-8c6c-0d662f1e9d71', 'helpful', NULL, '2026-09-17 06:31:22.432736+00', '5'),
('663b09fa-ab51-4519-8970-0ae96675625a', '9f9891d7-411b-4129-8c6c-0d662f1e9d71', 'not_helpful', NULL, '2026-09-17 06:31:31.68301+00', '1'),
('62c10dd4-0fbb-4cb8-942c-ba17c9cc877c', 'f5f91af9-1c04-4018-84e5-7200c6ce80c4', 'not_helpful', NULL, '2026-09-22 07:32:07.825097+00', '1');

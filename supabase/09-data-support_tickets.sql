-- KAMALO Supabase data import: support_tickets
-- Run after 01-schema.sql
--
INSERT INTO public.support_tickets (id, ticket_number, user_id, conversation_id, message_id, category, summary, details, contact_email, feedback_rating, status, priority, assigned_to, resolution, resolution_source, email_status, created_at, updated_at, resolved_at, level, language) VALUES
('f211ea82-dfa7-42e1-8982-ae77b675fb11', 'KAM-20260916-D8C3A80B', 'demo-user', '56456090-cb53-42b7-b7c4-9e46c7df62fa', '8b9c8722-d637-4302-bc55-78ae333acec5', 'Answer quality', 'QA ticket flow check', 'Tester is checking the complete support ticket lifecycle from chat feedback through specialist resolution.', 'kamalo-qa-1789559018@example.invalid', 'not_helpful', 'resolved', 'normal', 'QA specialist', 'This QA resolution confirms the support ticket lifecycle works.', 'human', 'sent', '2026-09-16 11:43:41.952+00', '2026-09-16 11:47:41.298+00', '2026-09-16 11:43:42.277+00', '2', 'en'),
('5f642949-0363-4121-a44f-eb4b218a30a0', 'KAM-20260917-6673BE6C', 'demo-user', 'db6462ed-dc22-4d27-8b10-ec805704a8ea', '7eb901d8-d90b-4579-9383-677c9539eb91', 'Product question', 'Answer was not helpful', 'The answer needed a clearer explanation and next steps.', NULL, 'not_helpful', 'open', 'normal', NULL, NULL, NULL, 'skipped', '2026-09-17 06:24:34.016+00', '2026-09-17 06:24:34.016+00', NULL, '2', 'en'),
('fe7029d9-8b7a-44bf-85f2-b5b6f3f3fbbc', 'KAM-20260917-5AA72C84', 'demo-user', 'd12b399b-2fc3-4b93-8168-1742f8354573', NULL, 'Technical issue', 'Screenshot evidence attached', 'The customer included a reference image for the support team.', NULL, NULL, 'open', 'high', NULL, NULL, NULL, 'skipped', '2026-09-17 06:25:16.803+00', '2026-09-17 06:25:16.803+00', NULL, '3', 'en'),
('c6b6f0b3-3ca1-4e9d-9450-bca6eb49b206', 'KAM-20260916-112A2163', 'demo-user', 'a132d388-8dbc-402b-8507-f7b455ba9724', '47232cbc-7b2a-4764-88b8-6db061ad9a72', 'Lifecycle test', 'Verify support ticket lifecycle', 'Automated runtime verification of ticket creation, human review, and resolution persistence.', NULL, 'not_helpful', 'in_review', 'urgent', 'Human specialist', 'Lifecycle verification completed. The support record is visible in both workspaces.', 'human', 'skipped', '2026-09-16 09:21:16.925+00', '2026-09-18 07:06:10.218+00', NULL, '4', 'en'),
('c4759dc6-7e84-49cb-9a0b-e9d2494ac437', 'KAM-20260917-7C2F5649', 'demo-user', '0777aee0-1026-4b01-88ee-bd8319392e18', '9f9891d7-411b-4129-8c6c-0d662f1e9d71', 'Technical issue', 'KAMALO answer was not helpful', 'bbh h  bbyb bb', NULL, 'not_helpful', 'in_review', 'normal', 'KAMALO AI', NULL, NULL, 'skipped', '2026-09-17 06:31:56.435+00', '2026-09-21 05:51:02.587+00', NULL, '2', 'en'),
('ad2dfb9c-73d1-4814-900c-62bddc48925e', 'KAM-20260922-202573B4', 'demo-user', '5ca4f016-9a41-45c1-85d1-db0089c51344', 'f5f91af9-1c04-4018-84e5-7200c6ce80c4', 'Rewards', 'KAMALO could not confirm an answer', 'User message:
ybtbtb

Assistant answer:
I don''t have confirmed information about that in the KAMALO information available to me.

Ticket details:
Question:
ybtbtb

Assistant response:
I don''t have confirmed information about that in the KAMALO information available to me.', 'rvacharya76@gmail.com', 'not_helpful', 'open', 'high', 'L3 support specialist · agent email unavailable', NULL, NULL, 'failed', '2026-09-22 07:32:07.942+00', '2026-09-22 07:32:08.895+00', NULL, '3', 'en-US');

-- KAMALO Supabase schema (no COPY blocks)
-- Source: development_db.sql
-- Prerequisite: run 00-enable-vector.sql OR enable "vector" in Supabase Extensions first.
--
SET search_path TO public, extensions;

--
-- PostgreSQL database dump
--


-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--



--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--



SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id text NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cleared_at timestamp with time zone
);


--
-- Name: knowledge_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_articles (
    id text NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    content text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    effective_from timestamp with time zone,
    effective_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: knowledge_chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_chunks (
    id text NOT NULL,
    article_id text NOT NULL,
    content text NOT NULL,
    embedding vector(1536)
);


--
-- Name: message_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_attachments (
    id text NOT NULL,
    conversation_id text NOT NULL,
    message_id text,
    original_filename text NOT NULL,
    media_type text NOT NULL,
    size integer NOT NULL,
    storage_key text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: message_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_feedback (
    id text NOT NULL,
    message_id text NOT NULL,
    rating text NOT NULL,
    feedback text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    score integer
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id text NOT NULL,
    conversation_id text NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    feedback text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_ticket_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_ticket_attachments (
    id text NOT NULL,
    ticket_id text NOT NULL,
    attachment_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id text NOT NULL,
    ticket_number text NOT NULL,
    user_id text NOT NULL,
    conversation_id text NOT NULL,
    message_id text,
    category text NOT NULL,
    summary text NOT NULL,
    details text NOT NULL,
    contact_email text,
    feedback_rating text,
    status text DEFAULT 'open'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    assigned_to text,
    resolution text,
    resolution_source text,
    email_status text DEFAULT 'not_sent'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    level integer DEFAULT 1 NOT NULL,
    language text DEFAULT 'en'::text NOT NULL
);


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: knowledge_articles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: knowledge_chunks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: message_attachments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: message_feedback; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: support_ticket_attachments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: knowledge_articles knowledge_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_articles
    ADD CONSTRAINT knowledge_articles_pkey PRIMARY KEY (id);


--
-- Name: knowledge_chunks knowledge_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_chunks
    ADD CONSTRAINT knowledge_chunks_pkey PRIMARY KEY (id);


--
-- Name: message_attachments message_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_pkey PRIMARY KEY (id);


--
-- Name: message_attachments message_attachments_storage_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_storage_key_unique UNIQUE (storage_key);


--
-- Name: message_feedback message_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_feedback
    ADD CONSTRAINT message_feedback_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: support_ticket_attachments support_ticket_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_attachments
    ADD CONSTRAINT support_ticket_attachments_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_ticket_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_ticket_number_unique UNIQUE (ticket_number);


--
-- Name: knowledge_chunks knowledge_chunks_article_id_knowledge_articles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_chunks
    ADD CONSTRAINT knowledge_chunks_article_id_knowledge_articles_id_fk FOREIGN KEY (article_id) REFERENCES public.knowledge_articles(id) ON DELETE CASCADE;


--
-- Name: message_attachments message_attachments_conversation_id_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_conversation_id_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: message_attachments message_attachments_message_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_attachments
    ADD CONSTRAINT message_attachments_message_id_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_feedback message_feedback_message_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_feedback
    ADD CONSTRAINT message_feedback_message_id_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: support_ticket_attachments support_ticket_attachments_attachment_id_message_attachments_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_attachments
    ADD CONSTRAINT support_ticket_attachments_attachment_id_message_attachments_id FOREIGN KEY (attachment_id) REFERENCES public.message_attachments(id) ON DELETE CASCADE;


--
-- Name: support_ticket_attachments support_ticket_attachments_ticket_id_support_tickets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_attachments
    ADD CONSTRAINT support_ticket_attachments_ticket_id_support_tickets_id_fk FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_conversation_id_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_conversation_id_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_message_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_message_id_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

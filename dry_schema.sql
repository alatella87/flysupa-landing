--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.12 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', 'public', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

-- CREATE SCHEMA IF NOT EXISTS pgbouncer;


--
-- Name: pgsodium; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS pgsodium;


--
-- Name: pgsodium; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgsodium WITH SCHEMA pgsodium;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS supabase_migrations;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: completion_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.completion_status AS ENUM (
    'Trained',
    'Mastered'
);


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

-- CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
--     LANGUAGE plpgsql SECURITY DEFINER
--     AS $$
-- BEGIN
--     RAISE WARNING 'PgBouncer auth request: %', p_usename;

--     RETURN QUERY
--     SELECT usename::TEXT, passwd::TEXT FROM pg_catalog.pg_shadow
--     WHERE usename = p_usename;
-- END;
-- $$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$BEGIN
  INSERT INTO public.profiles (id, avatar_url, email)
  VALUES (new.id, new.raw_user_meta_data->>'avatar_url', new.email);
  RETURN new;
END;$$;


--
-- Name: update_all_days_left(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_all_days_left() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE profiles
  SET days_left = GREATEST(0, (licenza_date - CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day');
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: lesson_item_associations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_item_associations (
    lesson_id bigint NOT NULL,
    lesson_item_id bigint NOT NULL,
    completion_degree public.completion_status
);


--
-- Name: lessons_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons_items (
    id bigint NOT NULL,
    title text NOT NULL,
    description text
);


--
-- Name: lesson_item_details_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.lesson_item_details_view AS
 SELECT lia.lesson_id,
    lia.lesson_item_id,
    lia.completion_degree,
    li.title,
    li.description
   FROM (public.lesson_item_associations lia
     JOIN public.lessons_items li ON ((lia.lesson_item_id = li.id)));


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id bigint NOT NULL,
    profile_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    amount_hours integer DEFAULT 0 NOT NULL,
    date date,
    "time" time without time zone
);


--
-- Name: lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.lessons ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.lessons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: lessons_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.lessons_items ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.lessons_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    updated_at timestamp with time zone,
    nome_utente text,
    avatar_url text,
    admin boolean DEFAULT false,
    email text,
    phone text DEFAULT '+41 (0) '::text,
    date_of_birth date,
    nip text,
    address text,
    sensibilizzazione boolean,
    licenza_date date,
    soccorritori boolean,
    license_url text
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


--
-- Name: lesson_item_associations lesson_item_associations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_item_associations
    ADD CONSTRAINT lesson_item_associations_pkey PRIMARY KEY (lesson_id, lesson_item_id);


--
-- Name: lessons_items lessons_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons_items
    ADD CONSTRAINT lessons_items_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: lessons_profile_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lessons_profile_id_idx ON public.lessons USING btree (profile_id);


--
-- Name: lesson_item_associations lesson_item_associations_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_item_associations
    ADD CONSTRAINT lesson_item_associations_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lesson_item_associations lesson_item_associations_lesson_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_item_associations
    ADD CONSTRAINT lesson_item_associations_lesson_item_id_fkey FOREIGN KEY (lesson_item_id) REFERENCES public.lessons_items(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: lessons_items Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.lessons_items FOR SELECT USING (true);


--
-- Name: profiles Enable update for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for all users" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: profiles Public profiles are viewable by everyone.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);


--
-- Name: profiles Users can insert their own profile.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK ((( SELECT auth.uid() AS uid) = id));


--
-- Name: profiles Users can update own profile.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING ((( SELECT auth.uid() AS uid) = id));


--
-- Name: lessons_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lessons_items ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

-- CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

-- CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
--          WHEN TAG IN ('DROP EXTENSION')
--    EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

-- CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
--          WHEN TAG IN ('CREATE EXTENSION')
--    EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

-- CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
--          WHEN TAG IN ('CREATE FUNCTION')
--    EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

-- CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
--          WHEN TAG IN ('CREATE EXTENSION')
--    EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

-- CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
--    EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

-- CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
--    EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- Name: on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow admin users to create buckets
CREATE POLICY "Allow admin users to create buckets" ON storage.buckets
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IN (
  SELECT id FROM public.profiles WHERE admin = true
));

ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;


--
-- Storage setup for avatar uploads
--

-- Create function to set up storage policies
CREATE OR REPLACE FUNCTION setup_storage_policies()
RETURNS void AS $$
BEGIN
  -- Create a policy for users to read their own avatars
  BEGIN
    EXECUTE format('
      CREATE POLICY "Users can read their own avatars" ON storage.objects
      FOR SELECT USING (bucket_id = ''avatars'' AND auth.uid()::text = (storage.foldername(name))[1]);
    ');
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Users can read their own avatars" already exists, skipping...';
  END;
  
  -- Create a policy for users to insert their own avatars
  BEGIN
    EXECUTE format('
      CREATE POLICY "Users can upload their own avatars" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = ''avatars'' AND auth.uid()::text = (storage.foldername(name))[1]);
    ');
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Users can upload their own avatars" already exists, skipping...';
  END;
  
  -- Create a policy for users to update their own avatars
  BEGIN
    EXECUTE format('
      CREATE POLICY "Users can update their own avatars" ON storage.objects
      FOR UPDATE USING (bucket_id = ''avatars'' AND auth.uid()::text = (storage.foldername(name))[1]);
    ');
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Users can update their own avatars" already exists, skipping...';
  END;
  
  -- Create a policy for users to read their own licenses
  BEGIN
    EXECUTE format('
      CREATE POLICY "Users can read their own licenses" ON storage.objects
      FOR SELECT USING (bucket_id = ''licenses'' AND auth.uid()::text = (storage.foldername(name))[1]);
    ');
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Users can read their own licenses" already exists, skipping...';
  END;
  
  -- Create a policy for users to insert their own licenses
  BEGIN
    EXECUTE format('
      CREATE POLICY "Users can upload their own licenses" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = ''licenses'' AND auth.uid()::text = (storage.foldername(name))[1]);
    ');
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Users can upload their own licenses" already exists, skipping...';
  END;
  
  -- Create a policy for users to update their own licenses
  BEGIN
    EXECUTE format('
      CREATE POLICY "Users can update their own licenses" ON storage.objects
      FOR UPDATE USING (bucket_id = ''licenses'' AND auth.uid()::text = (storage.foldername(name))[1]);
    ');
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Users can update their own licenses" already exists, skipping...';
  END;
END;
$$ LANGUAGE plpgsql;

--
-- PostgreSQL database dump complete
--
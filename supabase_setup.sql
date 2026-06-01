-- ==========================================
-- NEXORA DEMO DB SYNC - SUPABASE SETUP SCRIPT
-- ==========================================
-- Run this script in the Supabase SQL Editor to set up the sync table 
-- and enable real-time replication.

-- 1. Create the sync table
CREATE TABLE IF NOT EXISTS public.nexora_sync (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Realtime for the sync table
ALTER TABLE public.nexora_sync REPLICA IDENTITY FULL;

-- Use a DO block to safely check and add the table to the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'nexora_sync'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.nexora_sync;
  END IF;
END $$;


-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.nexora_sync ENABLE ROW LEVEL SECURITY;

-- 4. Create public access policies for effortless demo setup
-- (Note: In a production environment, restrict write privileges using auth.uid())

CREATE POLICY "Allow public read access"
  ON public.nexora_sync FOR SELECT
  USING (true);

CREATE POLICY "Allow public write access"
  ON public.nexora_sync FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON public.nexora_sync FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access"
  ON public.nexora_sync FOR DELETE
  USING (true);

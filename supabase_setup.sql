-- ==========================================================================
-- SUPABASE DATABASE SETUP FOR BIRTHDAY SURPRISE WEBSITE
-- Is poore code ko copy karke Supabase ke "SQL Editor" me paste karke RUN kijiye!
-- ==========================================================================

-- 1. Photos Table
CREATE TABLE IF NOT EXISTS public.birthday_photos (
    id TEXT PRIMARY KEY,
    src TEXT NOT NULL,
    caption TEXT,
    badge TEXT,
    angle FLOAT DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Settings & Letter Table
CREATE TABLE IF NOT EXISTS public.birthday_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Timeline / Memories Table
CREATE TABLE IF NOT EXISTS public.birthday_timeline (
    id TEXT PRIMARY KEY,
    kissa TEXT,
    title TEXT,
    story TEXT,
    tag TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS) & Add Public Access Policies
ALTER TABLE public.birthday_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birthday_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birthday_timeline ENABLE ROW LEVEL SECURITY;

-- Allow Public Read & Write (Anon Access for Birthday Site)
CREATE POLICY "Public Read Photos" ON public.birthday_photos FOR SELECT USING (true);
CREATE POLICY "Public Insert Photos" ON public.birthday_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Photos" ON public.birthday_photos FOR UPDATE USING (true);
CREATE POLICY "Public Delete Photos" ON public.birthday_photos FOR DELETE USING (true);

CREATE POLICY "Public Read Settings" ON public.birthday_settings FOR SELECT USING (true);
CREATE POLICY "Public Upsert Settings" ON public.birthday_settings FOR ALL USING (true);

CREATE POLICY "Public Read Timeline" ON public.birthday_timeline FOR SELECT USING (true);
CREATE POLICY "Public Upsert Timeline" ON public.birthday_timeline FOR ALL USING (true);

-- 5. Storage Bucket "birthday-media" (If not already created in dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('birthday-media', 'birthday-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Storage Read" ON storage.objects FOR SELECT USING (bucket_id = 'birthday-media');
CREATE POLICY "Public Storage Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'birthday-media');
CREATE POLICY "Public Storage Update" ON storage.objects FOR UPDATE USING (bucket_id = 'birthday-media');

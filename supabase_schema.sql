-- SQL Schema generation for OS_Vlab_V2 Supabase Data.
-- Run this in your Supabase SQL Editor.

-- Simulations table
CREATE TABLE IF NOT EXISTS public.simulations (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    algorithm_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    simulation_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    gantt_chart_data JSONB,
    results JSONB,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for privacy
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can fully manage their own simulations."
    ON public.simulations FOR ALL USING (auth.uid() = user_id);

-- Quiz Progress table
CREATE TABLE IF NOT EXISTS public.quiz_progress (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    attempt_number INT NOT NULL DEFAULT 1,
    score INT NOT NULL DEFAULT 0,
    max_score INT NOT NULL DEFAULT 100,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Quiz Progress
ALTER TABLE public.quiz_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can fully manage their own quiz progress."
    ON public.quiz_progress FOR ALL USING (auth.uid() = user_id);

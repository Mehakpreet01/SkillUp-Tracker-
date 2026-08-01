-- Run this in your Supabase Dashboard → SQL Editor
-- Adds 'deadline' and 'is_completed' columns to weekly_targets table

ALTER TABLE weekly_targets
  ADD COLUMN IF NOT EXISTS deadline date,
  ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false;

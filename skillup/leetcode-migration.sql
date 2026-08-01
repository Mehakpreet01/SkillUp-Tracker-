-- Run this in your Supabase Dashboard -> SQL Editor
-- This adds the missing columns to the 'profiles' table for LeetCode Sync to work without throwing a 500 error.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS leetcode_username text,
  ADD COLUMN IF NOT EXISTS problems_solved int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

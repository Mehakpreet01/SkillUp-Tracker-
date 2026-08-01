-- Yeh SQL Supabase dashboard -> SQL Editor me paste karke RUN karo.

create extension if not exists "uuid-ossp";

-- Profiles (name + resume text)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  resume_text text default '',
  created_at timestamp with time zone default now()
);

-- Skills learned
create table if not exists skills (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  created_at timestamp with time zone default now()
);

-- Weekly targets
create table if not exists weekly_targets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  target_count int default 1,
  done_count int default 0,
  week_start date,
  created_at timestamp with time zone default now()
);

-- LeetCode log
create table if not exists leetcode_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  problem_name text not null,
  difficulty text,
  solved_at timestamp with time zone default now()
);

-- Enable Row Level Security (har user apna hi data dekhe)
alter table profiles enable row level security;
alter table skills enable row level security;
alter table weekly_targets enable row level security;
alter table leetcode_log enable row level security;

-- Policies: profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Policies: skills
create policy "Users can view own skills" on skills for select using (auth.uid() = user_id);
create policy "Users can insert own skills" on skills for insert with check (auth.uid() = user_id);
create policy "Users can delete own skills" on skills for delete using (auth.uid() = user_id);

-- Policies: weekly_targets
create policy "Users can view own targets" on weekly_targets for select using (auth.uid() = user_id);
create policy "Users can insert own targets" on weekly_targets for insert with check (auth.uid() = user_id);
create policy "Users can update own targets" on weekly_targets for update using (auth.uid() = user_id);
create policy "Users can delete own targets" on weekly_targets for delete using (auth.uid() = user_id);

-- Policies: leetcode_log
create policy "Users can view own leetcode logs" on leetcode_log for select using (auth.uid() = user_id);
create policy "Users can insert own leetcode logs" on leetcode_log for insert with check (auth.uid() = user_id);
create policy "Users can delete own leetcode logs" on leetcode_log for delete using (auth.uid() = user_id);

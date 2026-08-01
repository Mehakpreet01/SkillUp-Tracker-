import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, problems_solved, leetcode_username')
      .order('problems_solved', { ascending: false });

    if (error) {
      console.error("Leaderboard DB Error:", error);
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true, leaderboard: data || [] });
  } catch (error) {
    console.error("Leaderboard Runtime Exception:", error);
    return NextResponse.json({ success: false, error: "Failed to load standings." });
  }
}
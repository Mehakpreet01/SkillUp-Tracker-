import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { leetcodeUser } = await request.json();
    if (!leetcodeUser) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // 1. Fetch live metrics from LeetCode GraphQL API
    const query = `
      query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
          submitStats {
            acSubmissionNum { difficulty count }
          }
        }
      }
    `;

    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { username: leetcodeUser } }),
    });

    const result = await response.json();
    
    if (!result.data?.matchedUser) {
      return NextResponse.json({ error: "User not found on LeetCode" }, { status: 404 });
    }

    const stats = result.data.matchedUser.submitStats.acSubmissionNum;
    const totalSolved = stats.find(d => d.difficulty === 'All')?.count || 0;
    const easySolved = stats.find(d => d.difficulty === 'Easy')?.count || 0;
    const mediumSolved = stats.find(d => d.difficulty === 'Medium')?.count || 0;
    const hardSolved = stats.find(d => d.difficulty === 'Hard')?.count || 0;

    return NextResponse.json({
      success: true,
      data: { totalSolved, easySolved, mediumSolved, hardSolved, leetcodeUser }
    });

  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
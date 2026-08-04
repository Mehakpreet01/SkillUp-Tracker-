# SkillUp Tracker

A full-stack skill tracking app with AI-powered recommendations, weekly goal tracking, and an integrated LeetCode progress log. Built with Supabase (auth + database) and deployed on Vercel.

## Features

- 🔐 **Authentication** — Email/password signup and login via Supabase Auth
- 📚 **Skills Tracker** — Log and manage skills you're learning
- 🤖 **AI Dashboard** — Get AI-driven suggestions on what skill to focus on next
- 🎯 **Weekly Targets** — Set and track weekly goals and progress
- 💻 **LeetCode Tracker** — Log solved problems with easy/medium/hard breakdowns
- 📝 **Revision & Quizzes** — AI-generated quizzes based on your logged skills
- 📄 **Auto Resume Builder** — Automatically updates your resume as new skills are added

## Tech Stack

- **Frontend/Backend:** Next.js
- **Database & Auth:** Supabase
- **AI:** Anthropic Claude API
- **Hosting:** Vercel

## Getting Started

### 1. Set Up Supabase (Database + Auth)

1. Create an account at [supabase.com](https://supabase.com) and start a new project.
2. Choose a region close to your users for best performance.
3. Open the **SQL Editor** in your project dashboard.
4. Run the contents of [`supabase.sql`](./supabase.sql) to create all required tables (skills, weekly targets, LeetCode log, profiles) along with Row Level Security policies to keep each user's data private.
5. Go to **Project Settings → API** and note down:
   - `Project URL`
   - `anon public` key

### 2. Get an Anthropic API Key

1. Sign up at [console.anthropic.com](https://console.anthropic.com).
2. Generate a new key under **API Keys**.
3. Usage is pay-as-you-go with low per-request cost; free starter credits are included. Add a small billing credit (e.g., $5) to ensure uninterrupted usage.

### 3. Clone the Repository

```bash
git clone https://github.com/<your-username>/skillup-tracker.git
cd skillup-tracker
```

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 5. Deploy on Vercel

1. Push this repository to your own GitHub account.
2. Go to [vercel.com](https://vercel.com) and log in with GitHub.
3. Click **Add New Project**, select your repository, and click **Import**.
4. Add the same three environment variables listed above under **Environment Variables**.
5. Click **Deploy**. Your app will be live within 1–2 minutes at a URL like:
   ```
   https://skillup-tracker-yourname.vercel.app
   ```

Share the link — each user who signs up gets their own private, isolated data.

## Roadmap

- [ ] Profile photo upload
- [ ] Skill categories/tags
- [ ] Leaderboard among friends
- [ ] Google OAuth login

## Support

If you run into any issues during setup, open an issue with the specific error message for help troubleshooting.

## License

This project is open source and available under the [MIT License](./LICENSE).


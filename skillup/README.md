# SkillUp Tracker — Setup Guide (Beginner Friendly)

Yeh guide step-by-step batati hai ki apni website ko FREE me live kaise karna hai,
taaki aap aur aapke dost sab login karke use kar sakein.

Total time: ~30-40 minutes (pehli baar).

---

## STEP 1: Supabase account banao (login + database ke liye)

1. https://supabase.com pe jao, "Start your project" pe click karo, GitHub/Google se signup karo.
2. "New Project" banao — koi bhi naam do (e.g. `skillup-tracker`), password set karo, region "Mumbai/Singapore" choose karo (India ke liye fast rahega).
3. Project ban jaane ke baad (1-2 min lagta hai), left sidebar me **SQL Editor** pe jao.
4. Is project ke andar `supabase.sql` file khol kar uska POORA content copy karo, SQL Editor me paste karo, aur **RUN** button dabao.
   - Isse database tables ban jaayengi (skills, weekly targets, leetcode log, profiles) — with security bhi set ho jaayegi taaki har user ka data private rahe.
5. Left sidebar me **Project Settings -> API** pe jao. Yahan se do cheezein copy karo:
   - `Project URL`
   - `anon public` key

---

## STEP 2: Anthropic API key lo (AI features ke liye)

1. https://console.anthropic.com pe jao, account banao.
2. **API Keys** section me jaake ek nayi key generate karo, copy kar lo.
3. Note: is API ka usage paid hai (bahut hi kam cost per request), console pe kuch free credits bhi milte hain shuru me. Agar aap chahte ho, aap billing me thoda credit add kar sakte ho (jaise $5) taaki app chalta rahe.

---

## STEP 3: Code apne computer/GitHub pe le jao

1. Yahan diya gaya poora `skillup` folder download karo.
2. Ek naya GitHub account/repo banao (github.com pe free hai): repo name `skillup-tracker`.
3. Is folder ko GitHub repo me upload kar do (GitHub website pe directly "uploading an existing file" se drag-drop bhi kar sakte ho, coding ki zaroorat nahi).

---

## STEP 4: Vercel pe deploy karo (yeh aapki website LIVE karega)

1. https://vercel.com pe jao, "Continue with GitHub" se login karo.
2. "Add New Project" pe click karo, apna `skillup-tracker` GitHub repo select karo, "Import" pe click karo.
3. Deploy karne se pehle, **Environment Variables** section me yeh 3 values add karo:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Step 1 se copy kiya hua Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Step 1 se copy kiya hua anon key |
   | `ANTHROPIC_API_KEY` | Step 2 se copy ki hui key |

4. "Deploy" button dabao. 1-2 minute me aapki website live ho jaayegi, ek URL milega jaise:
   `https://skillup-tracker-yourname.vercel.app`

5. Yeh URL apne dosto ke saath share karo — woh sign up karke apna account bana sakte hain, aur sab ka data alag-alag, private rahega (koi kisi ka data nahi dekh sakta).

---

## Features jo bane hain

- ✅ Signup/Login (email + password, Supabase Auth)
- ✅ Skills page — kya seekha add karo
- ✅ Dashboard — AI batayega next kya skill pe kaam karna chahiye
- ✅ Weekly Targets — is hafte ke goals aur progress
- ✅ LeetCode Tracker — problems log karo, total/easy/medium/hard count dikhta hai
- ✅ Revision/Test — AI aapki skills pe based quiz banata hai
- ✅ Resume — jab bhi nayi skill add karo (checkbox se), AI usi format me resume me add kar deta hai

## Aage kya improve kar sakte ho (optional)

- Profile photo upload
- Skill categories/tags
- Leaderboard dosto ke beech (kaun zyada LeetCode solve kar raha hai)
- Email/password ke saath Google login bhi add karna (Supabase me easy hai)

Kisi bhi step pe atko to bata dena, us specific error ke hisaab se help kar dunga.

Vercel builds from repository root by default, but root lacked build scripts, so it could not execute the Next.js app located in `skillup/`. This change adds root-level npm scripts that delegate to the existing `skillup` app scripts, enabling root-based Vercel builds.

- **What changed**
  - Added root `package.json` scripts to proxy app commands into `skillup/`:
    - `dev`
    - `build`
    - `start`
  - Marked root package as `private` to reflect workspace/deployment orchestration usage.

- **Why this resolves deployment**
  - Root now exposes standard lifecycle commands expected by Vercel while preserving the current app location and existing `skillup/package.json` behavior.

- **Script mapping**
  ```json
  {
    "scripts": {
      "dev": "cd skillup \u0026\u0026 npm run dev",
      "build": "cd skillup \u0026\u0026 npm install \u0026\u0026 npm run build",
      "start": "cd skillup \u0026\u0026 npm run start"
    }
  }
  ```

- **Post-merge deploy note**
  - Ensure Vercel project env vars are configured:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `ANTHROPIC_API_KEY`
  - After merge, trigger Vercel redeploy.

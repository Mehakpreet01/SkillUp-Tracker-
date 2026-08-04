import "./globals.css";
import { GlobalProvider } from "../lib/GlobalContext";

const supabasePublicConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
};

export const metadata = {
  title: "SkillUp Tracker",
  description: "Track what you learn, get AI guidance, and grow your resume.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {supabasePublicConfig.url && supabasePublicConfig.anonKey && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__SUPABASE_CONFIG__ = ${JSON.stringify(supabasePublicConfig)};`,
            }}
          />
        )}
        <GlobalProvider>
          {children}
        </GlobalProvider>
      </body>
    </html>
  );
}

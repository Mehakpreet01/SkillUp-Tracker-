import "./globals.css";
import Script from "next/script";
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
      <head>
        {supabasePublicConfig.url && supabasePublicConfig.anonKey && (
          <Script id="supabase-config" strategy="beforeInteractive">
            {`window.__SUPABASE_CONFIG__ = ${JSON.stringify(supabasePublicConfig)};`}
          </Script>
        )}
      </head>
      <body>
        <GlobalProvider>
          {children}
        </GlobalProvider>
      </body>
    </html>
  );
}

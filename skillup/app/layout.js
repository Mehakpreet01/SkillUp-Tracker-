import "./globals.css";
import { GlobalProvider } from "../lib/GlobalContext";

export const metadata = {
  title: "SkillUp Tracker",
  description: "Track what you learn, get AI guidance, and grow your resume.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <GlobalProvider>
          {children}
        </GlobalProvider>
      </body>
    </html>
  );
}

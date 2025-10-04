import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Add brand script font
import { Dancing_Script } from "next/font/google";
import { readSessionCookie } from "../lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Brand script font
const dancingScript = Dancing_Script({
  variable: "--font-dance-script",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Dance 4 You",
  description:
    "ONE STOP SOLUTION TO FIND DANCE EVENTS — Welcome to Dance 4 You, your ultimate destination for dance services.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await readSessionCookie();
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${dancingScript.variable} antialiased`}>
        <header className="sticky top-0 z-30 bg-[#fff9e6] shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo-dance.svg" alt="Dance 4 You" className="h-10 w-10" />
              <span
                className="text-2xl font-bold italic"
                style={{ fontFamily: "var(--font-dance-script)", color: "#f97316" }}
              >
                Dance 4 You
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-[15px] italic" style={{ color: "#167C36" }}>
              <a href="/" className="hover:underline">Home</a>
              <a href="/learn-live" className="hover:underline">Learn &amp; Live</a>
              <a href="/events" className="hover:underline">Book Online</a>
              <a href="/submit-event" className="hover:underline">Submit Event</a>
            </nav>

            <div className="flex items-center gap-3">
              {session ? (
                <a href="/dashboard" className="text-sm font-medium hover:underline">My Dashboard</a>
              ) : (
                <a href="/auth/login" className="text-sm font-medium hover:underline">Log In</a>
              )}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 opacity-80"
                aria-hidden
              >
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.33 0-10 1.67-10 5v1h20v-1c0-3.33-6.67-5-10-5Z" />
              </svg>
              <button aria-label="Menu" className="md:hidden p-2 border rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <path d="M3 6h18v2H3Zm0 5h18v2H3Zm0 5h18v2H3Z" />
                </svg>
              </button>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

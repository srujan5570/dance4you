import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Add brand script font
import { Dancing_Script } from "next/font/google";
import { readSessionCookie } from "../lib/auth";
import Link from "next/link";

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
              <Link href="/" className="flex items-center gap-3">
                <img src="/logo-dance.svg" alt="Dance 4 You" className="h-10 w-10" />
                <span
                  className="text-2xl font-bold italic"
                  style={{ fontFamily: "var(--font-dance-script)", color: "#f97316" }}
                >
                  Dance 4 You
                </span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-[15px] italic" style={{ color: "#167C36" }}>
              <Link href="/" className="hover:underline">Home</Link>
              <Link href="/learn-live" className="hover:underline">Learn &amp; Live</Link>
              <Link href="/events" className="hover:underline">Book Online</Link>
              <Link href="/submit-event" className="hover:underline">Submit Event</Link>
            </nav>

            <div className="flex items-center gap-3">
              {session ? (
                <Link href="/dashboard" className="text-sm font-medium hover:underline">My Dashboard</Link>
              ) : (
                <Link href="/auth/login" className="text-sm font-medium hover:underline">Log In</Link>
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
              {/* Mobile menu */}
              <details className="md:hidden relative">
                <summary aria-label="Menu" className="p-2 border rounded-full list-none cursor-pointer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                    aria-hidden
                  >
                    <path d="M3 6h18v2H3Zm0 5h18v2H3Zm0 5h18v2H3Z" />
                  </svg>
                </summary>
                <div className="absolute right-0 mt-2 w-48 rounded-md border bg-white shadow-lg p-3">
                  <nav className="flex flex-col text-sm italic" style={{ color: "#167C36" }}>
                    <Link href="/" className="py-1 hover:underline">Home</Link>
                    <Link href="/learn-live" className="py-1 hover:underline">Learn &amp; Live</Link>
                    <Link href="/events" className="py-1 hover:underline">Book Online</Link>
                    <Link href="/submit-event" className="py-1 hover:underline">Submit Event</Link>
                  </nav>
                </div>
              </details>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

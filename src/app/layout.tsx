import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Add brand script font
import { Dancing_Script } from "next/font/google";
import { readSessionCookie } from "../lib/auth";
import Link from "next/link";
import MobileNav from "../components/MobileNav";
import Image from "next/image";

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
                <Image src="/logo-dance.svg" alt="Dance 4 You" width={40} height={40} priority />
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
              <MobileNav />
            </div>
          </div>
        </header>
        {children}
        <footer className="mt-12 border-t bg-[#fffdf7]">
          <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="font-semibold">Contact Us</div>
              <div className="mt-2">Email: <a href="mailto:itsforyou.dance4you@gmail.com" className="underline text-[#167C36]">itsforyou.dance4you@gmail.com</a></div>
              <div className="mt-1">Phone: <span className="opacity-80">+91 6302 476 414</span></div>
            </div>
            <div>
              <div className="font-semibold">Location</div>
              <div className="mt-2 opacity-80">Hyderabad, Telangana, India</div>
              <a href="https://maps.google.com/?q=Hyderabad" target="_blank" rel="noopener noreferrer" className="underline text-[#167C36] mt-1 inline-block">View on Map</a>
            </div>
            <div>
              <div className="font-semibold">Support</div>
              <p className="mt-2 opacity-80">For booking support or event inquiries, reach out via email.</p>
            </div>
          </div>
          <div className="text-center text-xs opacity-70 pb-6">© {new Date().getFullYear()} Dance 4 You. All rights reserved.</div>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Brand font: modern sans to match logo style
import { Poppins } from "next/font/google";
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

// Brand font
const brandFont = Poppins({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} ${brandFont.variable} antialiased`}>
        <header className="sticky top-0 z-30 bg-[#fff9e6] shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/logo-dance.svg" alt="Dance 4 You" width={40} height={40} priority />
                <span
                  className="text-2xl sm:text-[1.7rem] font-extrabold tracking-tight"
                  style={{ fontFamily: "var(--font-brand)", color: "#f97316" }}
                >
                  Dance 4 You
                </span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium" style={{ color: "#167C36" }}>
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
              {/* Mobile menu */}
              <MobileNav />
            </div>
          </div>
        </header>
        {children}
        {/* Professional footer */}
        <footer className="mt-12 border-t bg-[#fff9e6]">
          <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2">
                <Image src="/logo-dance.svg" alt="Dance 4 You" width={28} height={28} />
                <span className="text-lg font-bold" style={{ fontFamily: "var(--font-brand)", color: "#f97316" }}>Dance 4 You</span>
              </div>
              <p className="mt-3 text-[13px] opacity-80">Your one-stop destination to discover and book dance events across styles and cities.</p>
            </div>

            {/* Quick Links */}
            <div>
              <div className="font-semibold">Quick Links</div>
              <ul className="mt-3 space-y-2">
                <li><Link className="hover:underline text-[#167C36]" href="/events">Explore Events</Link></li>
                <li><Link className="hover:underline text-[#167C36]" href="/submit-event">Submit an Event</Link></li>
                <li><Link className="hover:underline text-[#167C36]" href="/learn-live">Learn &amp; Live</Link></li>
                <li><Link className="hover:underline text-[#167C36]" href="/dashboard">My Dashboard</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <div className="font-semibold">Contact</div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#167C36]" aria-hidden>
                    <path d="M2 8.5V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.5l-9 5.625a2 2 0 0 1-2 0L2 8.5Zm20-3V6l-10 6.25L2 6v-.5A2 2 0 0 1 4 3h16a2 2 0 0 1 2 2Z" />
                  </svg>
                  <a href="mailto:itsforyou.dance4you@gmail.com" className="underline text-[#167C36]">itsforyou.dance4you@gmail.com</a>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#167C36]" aria-hidden>
                    <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.08-.23 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 7a1 1 0 0 1 1-1h2.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.23 1.08l-2.2 2.15Z" />
                  </svg>
                  <span className="opacity-90">+91 0000000000</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#167C36]" aria-hidden>
                    <path d="M12 2a10 10 0 0 0-10 10c0 6.5 10 10 10 10s10-3.5 10-10A10 10 0 0 0 12 2Zm0 13a3 3 0 1 1 3-3 3 3 0 0 1-3 3Z" />
                  </svg>
                  <span className="opacity-90">Hyderabad, Telangana, India</span>
                </div>
                <a href="https://maps.google.com/?q=Hyderabad" target="_blank" rel="noopener noreferrer" className="underline text-[#167C36] inline-block">View on Map</a>
              </div>
            </div>

            {/* Support */}
            <div>
              <div className="font-semibold">Support</div>
              <p className="mt-3 opacity-80">For booking support or event inquiries, reach out via email. We aim to respond within 24 hours.</p>
            </div>
          </div>
          <div className="border-t">
            <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-xs opacity-70">
              <div>© {new Date().getFullYear()} Dance 4 You. All rights reserved.</div>
              <div className="mt-2 sm:mt-0 flex items-center gap-4">
                <a href="mailto:itsforyou.dance4you@gmail.com" className="hover:underline text-[#167C36]">Email</a>
                <a href="https://maps.google.com/?q=Hyderabad" target="_blank" rel="noopener noreferrer" className="hover:underline text-[#167C36]">Map</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Brand font: modern sans to match logo style
import { Poppins } from "next/font/google";
import { readSessionCookie } from "../lib/auth";
import Link from "next/link";
import MobileNav from "../components/MobileNav";
import Image from "next/image";
import CitySelectorModal from "../components/CitySelectorModal";
import DesktopCityControl from "../components/DesktopCityControl";

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
    <html lang="en" className="overflow-x-hidden">
      <body className={`${geistSans.variable} ${geistMono.variable} ${brandFont.variable} antialiased overflow-x-hidden min-h-screen`}>
        <header className="sticky top-0 z-30 bg-[#fff9e6] shadow-md backdrop-blur-sm bg-opacity-95">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative overflow-hidden rounded-full transition-all duration-300 transform group-hover:scale-110">
                  <Image src="/logo-dance.svg" alt="Dance 4 You" width={40} height={40} priority className="transition-transform duration-500 ease-in-out group-hover:rotate-12" />
                </div>
                <span
                  className="text-xl sm:text-[1.5rem] md:text-[1.7rem] font-extrabold tracking-tight relative"
                  style={{ fontFamily: "var(--font-brand)", color: "var(--primary)" }}
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#f97316] to-[#f59e0b] group-hover:from-[#ea580c] group-hover:to-[#f97316] transition-all duration-300">
                  </span>
                 <span
                 style={{
                      fontFamily: "Playfair Display, serif",
                      fontWeight: "bold",
                      fontStyle: "italic",
                      color: "#f97316",
                      textShadow: "4px 8px 10pxrgb(28, 27, 26)" // light tan, wide and soft
                    }} 
                        >
                        Dance 4 You
                        </span>



                </span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium">
              <Link href="/" className="relative px-2 py-1 overflow-hidden group">
                <span className="relative z-10 text-[#167C36] group-hover:text-white transition-colors duration-300 ease-out">Home</span>
                <span className="absolute inset-0 bg-[#167C36] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
              </Link>
              {session && (
                <Link href="/dashboard" className="relative px-2 py-1 overflow-hidden group">
                  <span className="relative z-10 text-[#167C36] group-hover:text-white transition-colors duration-300 ease-out">My Dashboard</span>
                  <span className="absolute inset-0 bg-[#167C36] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                </Link>
              )}
              {session && (
                <Link href="/chat" className="relative px-2 py-1 overflow-hidden group">
                  <span className="relative z-10 text-[#167C36] group-hover:text-white transition-colors duration-300 ease-out">Chat</span>
                  <span className="absolute inset-0 bg-[#167C36] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                </Link>
              )}
              {session?.role === "STUDIO_OWNER" ? (
                <Link href="/dashboard" className="relative px-2 py-1 overflow-hidden group">
                  <span className="relative z-10 text-[#167C36] group-hover:text-white transition-colors duration-300 ease-out">My Bookings</span>
                  <span className="absolute inset-0 bg-[#167C36] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                </Link>
              ) : (
                <Link href="/learn-live" className="relative px-2 py-1 overflow-hidden group">
                  <span className="relative z-10 text-[#167C36] group-hover:text-white transition-colors duration-300 ease-out">Learn &amp; Live</span>
                  <span className="absolute inset-0 bg-[#167C36] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                </Link>
              )}
              <Link href="/events" className="relative px-2 py-1 overflow-hidden group">
                <span className="relative z-10 text-[#167C36] group-hover:text-white transition-colors duration-300 ease-out">Book Online</span>
                <span className="absolute inset-0 bg-[#167C36] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
              </Link>
              {session?.role === "STUDIO_OWNER" && (
                <Link href="/submit-event" className="relative px-2 py-1 overflow-hidden group">
                  <span className="relative z-10 text-[#167C36] group-hover:text-white transition-colors duration-300 ease-out">Submit Event</span>
                  <span className="absolute inset-0 bg-[#167C36] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                </Link>
              )}
              {/* Persistent Change City control for desktop */}
              <DesktopCityControl />
            </nav>

            <div className="flex items-center gap-4">
              {session ? (
                <Link href="/dashboard" className="relative group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#f97316] to-[#f59e0b] text-white font-medium shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-110">
                    <span className="text-lg">{"U"}</span>
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </Link>
              ) : (
                <Link href="/auth/login" className="relative inline-flex items-center justify-center px-6 py-2 overflow-hidden font-medium text-[#167C36] transition duration-300 ease-out border-2 border-[#167C36] rounded-full shadow-md group">
                  <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-[#167C36] group-hover:translate-x-0 ease">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </span>
                  <span className="absolute flex items-center justify-center w-full h-full text-[#167C36] transition-all duration-300 transform group-hover:translate-x-full ease">Log In</span>
                  <span className="relative invisible">Log In</span>
                </Link>
              )}
              {/* Mobile menu */}
              <MobileNav />
            </div>
          </div>
        </header>
        {/* City selector modal shown on first visit if no saved region */}
        <CitySelectorModal />
        {children}
        {/* Professional footer */}
        <footer className="mt-12 bg-gradient-to-b from-[#fff9e6] to-[#fff5d6] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/hero-placeholder.svg')] opacity-5 mix-blend-overlay"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#f97316] via-[#167C36] to-[#5b2a86]"></div>
          <div className="absolute -top-8 left-1/4 w-16 h-16 rounded-full bg-[#f97316]/10"></div>
          <div className="absolute -top-12 right-1/3 w-24 h-24 rounded-full bg-[#167C36]/10"></div>
          <div className="absolute top-1/4 right-10 w-32 h-32 rounded-full bg-[#5b2a86]/5"></div>
          
          <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative overflow-hidden rounded-full p-1 bg-gradient-to-br from-[#f97316] to-[#f59e0b]">
                  <Image src="/logo-dance.svg" alt="Dance 4 You" width={36} height={36} className="bg-white rounded-full p-1" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#f97316] to-[#f59e0b]" style={{ fontFamily: "var(--font-brand)" }}>
                  Dance 4 You
                </span>
              </div>
              <p className="text-sm text-gray-600">Your one-stop destination to discover and book dance events across styles and cities.</p>
              <div className="pt-2 flex items-center gap-3">
                <a href="#" className="text-gray-500 hover:text-[#f97316] transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-500 hover:text-[#f97316] transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-500 hover:text-[#f97316] transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-500 hover:text-[#f97316] transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-5 relative inline-block">
                Quick Links
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#f97316] to-transparent rounded-full"></span>
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link className="group flex items-center text-gray-600 hover:text-[#f97316] transition-colors" href="/events">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#f97316] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Explore Events
                  </Link>
                </li>
                {session?.authenticated && session?.user?.role === "STUDIO_OWNER" && (
                  <li>
                    <Link className="group flex items-center text-gray-600 hover:text-[#f97316] transition-colors" href="/submit-event">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#f97316] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Submit an Event
                    </Link>
                  </li>
                )}
                {session?.role === "STUDIO_OWNER" ? (
                  <li>
                    <Link className="group flex items-center text-gray-600 hover:text-[#f97316] transition-colors" href="/dashboard">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#f97316] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      My Bookings
                    </Link>
                  </li>
                ) : (
                  <li>
                    <Link className="group flex items-center text-gray-600 hover:text-[#f97316] transition-colors" href="/learn-live">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#f97316] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Learn &amp; Live
                    </Link>
                  </li>
                )}
                <li>
                  <Link className="group flex items-center text-gray-600 hover:text-[#f97316] transition-colors" href="/dashboard">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#f97316] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    My Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-5 relative inline-block">
                Contact Us
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#f97316] to-transparent rounded-full"></span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#f97316]" aria-hidden>
                      <path d="M2 8.5V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.5l-9 5.625a2 2 0 0 1-2 0L2 8.5Zm20-3V6l-10 6.25L2 6v-.5A2 2 0 0 1 4 3h16a2 2 0 0 1 2 2Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Us:</p>
                    <a href="mailto:itsforyou.dance4you@gmail.com" className="text-[#167C36] hover:text-[#f97316] transition-colors">itsforyou.dance4you@gmail.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#f97316]" aria-hidden>
                      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.08-.23 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 7a1 1 0 0 1 1-1h2.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.23 1.08l-2.2 2.15Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Call Us:</p>
                    <a href="tel:1234567890" className="text-gray-700 hover:text-[#f97316] transition-colors">+91 0000000000</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#f97316]" aria-hidden>
                      <path d="M12 2a10 10 0 0 0-10 10c0 6.5 10 10 10 10s10-3.5 10-10A10 10 0 0 0 12 2Zm0 13a3 3 0 1 1 3-3 3 3 0 0 1-3 3Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location:</p>
                    <span className="text-gray-700">Hyderabad, Telangana, India</span>
                    <div className="mt-1">
                      <a href="https://maps.google.com/?q=Hyderabad" target="_blank" rel="noopener noreferrer" className="text-[#167C36] hover:text-[#f97316] transition-colors text-sm inline-flex items-center">
                        View on Map
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="text-lg font-semibold mb-5 relative inline-block">
                Stay Updated
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#f97316] to-transparent rounded-full"></span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">Subscribe to our newsletter for the latest dance events and updates.</p>
              <div className="flex">
                <input type="email" placeholder="Your email" className="flex-1 px-4 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent" />
                <button className="bg-[#f97316] hover:bg-[#ea580c] text-white px-4 py-2 rounded-r-md transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <span>© {new Date().getFullYear()} Dance 4 You. All rights reserved.</span>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center gap-6">
                <a href="#" className="hover:text-[#f97316] transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-[#f97316] transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-[#f97316] transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
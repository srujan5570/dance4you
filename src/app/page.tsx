import { headers } from "next/headers";
import Link from "next/link";

export default async function Home() {
  // Build absolute base URL for server-side fetch
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const runtimeBase = `${proto}://${host}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? runtimeBase;

  let events: Array<{ id: string; title: string; date: string }> = [];
  try {
    const res = await fetch(`${baseUrl}/api/events`, { cache: "no-store" });
    if (res.ok) {
      events = await res.json();
    }
  } catch {}
  const latestEvents = (events || [])
    .slice() // copy
    .sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return db - da;
    })
    .slice(0, 3);

  // Determine if current user is a Studio Owner to adjust CTAs in "Our Services"
  let isOwner = false;
  try {
    const cookieHeader = h.get("cookie") ?? "";
    const sess = await fetch(`${baseUrl}/api/session`, { cache: "no-store", headers: { cookie: cookieHeader } });
    if (sess.ok) {
      const data = await sess.json();
      isOwner = !!(data?.authenticated && data?.user?.role === "STUDIO_OWNER");
    }
  } catch {}

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Gradient headline band */}
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-6xl mx-auto px-6 py-5 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">
            ONE STOP SOLUTION TO FIND DANCE EVENTS
          </h1>
          <p className="mt-1 text-sm sm:text-base opacity-95">
            Welcome to Dance 4 You, your ultimate destination for dance services. Join us to experience a world of rhythm, movement, and creativity.
          </p>
        </div>
      </div>

      {/* Hero background area with subtle overlay to mimic screenshot */}
      <section
        className="relative w-full"
        style={{
          backgroundImage: "url('/hero-placeholder.svg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="h-[420px]" />
        {/* dark top bar mimic */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-black/30" />
      </section>

      {/* Services - Offering */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold relative inline-block">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#167C36] to-[#5b2a86]">
              Our Services
            </span>
            <div className="absolute -bottom-3 left-0 right-0 h-1 bg-gradient-to-r from-[#f97316] to-[#f59e0b] rounded-full"></div>
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Discover our range of dance experiences designed to help you express yourself, improve your skills, and connect with others through movement.</p>
        </div>
        
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              name: "Drop-In Class",
              desc: "Dance Your Heart Out",
              cta: { label: "Book Now", href: "/events?category=DROP_IN_CLASS" },
              ownerHref: "/submit-event?category=DROP_IN_CLASS",
              readMoreHref: "/learn-live",
              img: "https://static.wixstatic.com/media/197520_31dbc12750c544149102ab9ca7587db6~mv2.jpg/v1/fill/w_224,h_226,fp_0.50_0.50,q_80,usm_0.66_1.00_0.01,enc_auto/197520_31dbc12750c544149102ab9ca7587db6~mv2.jpg",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )
            },
            {
              name: "Dance Workshop",
              desc: "Enhance Your Skills with Experts",
              cta: { label: "Book Now", href: "/events?category=DANCE_WORKSHOP" },
              ownerHref: "/submit-event?category=DANCE_WORKSHOP",
              readMoreHref: "/dance-workshop",
              img: "https://static.wixstatic.com/media/197520_41e825beb8f64a41a4158773c61036f7~mv2.jpg/v1/fill/w_224,h_226,fp_0.50_0.50,q_80,usm_0.66_1.00_0.01,enc_auto/197520_41e825beb8f64a41a4158773c61036f7~mv2.jpg",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )
            },
            {
              name: "Regular Class",
              desc: "Express Yourself Through Dance",
              cta: { label: "Book Now", href: "/events?category=REGULAR_CLASS" },
              ownerHref: "/submit-event?category=REGULAR_CLASS",
              readMoreHref: "/regular-classes",
              img: "https://static.wixstatic.com/media/11062b_5689103989fb4598829462af189dec4e~mv2.jpg/v1/fill/w_224,h_226,fp_0.50_0.50,q_80,usm_0.66_1.00_0.01,enc_auto/11062b_5689103989fb4598829462af189dec4e~mv2.jpg",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )
            },
            {
              name: "Battles/Competition",
              desc: "Bring Your Best Moves",
              cta: { label: "Book Now", href: "/events?category=BATTLE_COMPETITION" },
              ownerHref: "/submit-event?category=BATTLE_COMPETITION",
              readMoreHref: "/learn-live",
              img: "https://static.wixstatic.com/media/11062b_9b788b37b9054864934bbb1e85592b06~mv2.jpg/v1/fill/w_224,h_226,fp_0.50_0.50,q_80,usm_0.66_1.00_0.01,enc_auto/11062b_9b788b37b9054864934bbb1e85592b06~mv2.jpg",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )
            },
            
          ].map((s, index) => (
            <div key={s.name} className="card group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="relative overflow-hidden h-48">
                <div
                  className="absolute inset-0 transition-transform duration-700 ease-in-out group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${s.img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-70"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#f97316] rounded-full text-white">
                      {s.icon}
                    </div>
                    <h3 className="text-xl font-bold">{s.name}</h3>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-gray-600 mb-4">{s.desc}</p>
                <div className="flex justify-between items-center">
                  <Link href={isOwner ? s.ownerHref : s.cta.href} className="inline-block">
                    <button className="relative inline-flex items-center justify-center px-6 py-2 overflow-hidden font-medium transition-all bg-[#167C36] rounded-md text-white group-hover:bg-[#f97316] duration-300">
                      <span className="relative">{isOwner ? `List your ${s.name}` : s.cta.label}</span>
                      <svg className="relative w-4 h-4 ml-2 transition-transform duration-500 ease-out group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Updates */}
      <section className="w-full text-white py-16">
        <div className="bg-gradient-to-r from-[#5b2a86] via-[#f97316] to-[#f59e0b] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/hero-placeholder.svg')] opacity-10 mix-blend-overlay"></div>
          <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold mb-2 tracking-tight">Latest Events</h2>
              <div className="w-24 h-1 bg-white mx-auto rounded-full"></div>
              <p className="mt-4 text-white/80 max-w-2xl mx-auto">Stay updated with our newest dance events and opportunities</p>
            </div>
            
            {/* Latest 3 events */}
            {latestEvents.length > 0 ? (
              <ul className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
                {latestEvents.map((ev, index) => (
                  <li key={ev.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
                    <div className="flex items-start mb-4">
                      <div className="flex-shrink-0 bg-white/20 rounded-full p-3 mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{ev.title}</div>
                        <div className="text-sm text-white/70 mt-1">{ev.date}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs bg-white/20 px-3 py-1 rounded-full">New Event</span>
                      <Link href={`/events/${ev.id}`} className="group inline-flex items-center text-sm font-medium hover:text-white/90 transition-colors">
                        View Details
                        <svg className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                        </svg>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-10 min-h-[220px] flex flex-col items-center justify-center opacity-90 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-lg font-medium">No updates yet. Check back soon!</p>
                <p className="text-sm text-white/70 mt-2">We&apos;re constantly adding new events and opportunities.</p>
              </div>
            )}
            
            <div className="mt-12 text-center">
              <Link href="/events" className="inline-flex items-center justify-center px-8 py-3 border-2 border-white rounded-full text-white hover:bg-white hover:text-[#f97316] transition-colors duration-300 font-medium">
                View All Events
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-[#5b2a86]/10 via-[#f1e4e8]/10 to-[#f59e0b]/10"></div>
            <div className="relative z-10 p-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#167C36]">Get In Touch</h3>
                <p className="mt-2 text-gray-600">We&apos;d love to hear from you! Reach out through any of these channels.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#167C36]/10 text-[#167C36] mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Call Us</h4>
                  <a href="tel:1234567890" className="text-[#167C36] font-medium hover:underline transition-colors">123-456-7890</a>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#f97316]/10 text-[#f97316] mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Email Us</h4>
                  <a href="mailto:itsforyou.dance4you@gmail.com" className="text-[#f97316] font-medium hover:underline transition-colors break-all">itsforyou.dance4you@gmail.com</a>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#5b2a86]/10 text-[#5b2a86] mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Follow Us</h4>
                  <div className="flex items-center justify-center gap-3 mt-3">
                    <a href="#" className="group">
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-[#1877F2] to-[#0A66C2] text-white text-lg shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </a>
                    <a href="#" className="group">
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-[#000000] to-[#333333] text-white text-lg shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </span>
                    </a>
                    <a href="#" className="group">
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#0077B5] text-white text-lg shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </span>
                    </a>
                    <a href="#" className="group">
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-[#E1306C] to-[#C13584] text-white text-lg shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[.06] dark:border-white/[.12] mt-8 py-8 text-center text-sm opacity-80">
        © {new Date().getFullYear()} Dance 4 You. All rights reserved.
      </footer>
    </div>
  );
}

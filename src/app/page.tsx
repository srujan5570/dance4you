import { headers } from "next/headers";
import Link from "next/link";
import HeroEventCarousel from "@/components/HeroEventCarousel";

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

      {/* Hero Event Carousel */}
      <HeroEventCarousel />

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
    </div>
  );
}

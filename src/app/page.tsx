import Image from "next/image";
import { headers } from "next/headers";

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
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-center" style={{ color: "#167C36" }}>
          Services - Offering
        </h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {[
            {
              name: "Drop-In Class",
              desc: "Dance Your Heart Out",
              cta: { label: "Book Now", href: "/events" },
              readMoreHref: "/learn-live",
              img: "https://static.wixstatic.com/media/197520_31dbc12750c544149102ab9ca7587db6~mv2.jpg/v1/fill/w_224,h_226,fp_0.50_0.50,q_80,usm_0.66_1.00_0.01,enc_auto/197520_31dbc12750c544149102ab9ca7587db6~mv2.jpg",
            },
            {
              name: "Dance Workshop",
              desc: "Enhance Your Skills with Experts",
              cta: { label: "View Course", href: "/learn-live" },
              readMoreHref: "/learn-live",
              img: "https://static.wixstatic.com/media/197520_41e825beb8f64a41a4158773c61036f7~mv2.jpg/v1/fill/w_224,h_226,fp_0.50_0.50,q_80,usm_0.66_1.00_0.01,enc_auto/197520_41e825beb8f64a41a4158773c61036f7~mv2.jpg",
            },
            {
              name: "Regular Class",
              desc: "Express Yourself Through Dance",
              cta: { label: "Book Now", href: "/events" },
              readMoreHref: "/learn-live",
              img: "https://static.wixstatic.com/media/11062b_5689103989fb4598829462af189dec4e~mv2.jpg/v1/fill/w_224,h_226,fp_0.50_0.50,q_80,usm_0.66_1.00_0.01,enc_auto/11062b_5689103989fb4598829462af189dec4e~mv2.jpg",
            },
            {
              name: "Battles/Competition",
              desc: "Bring Your Best Moves",
              cta: { label: "Book Now", href: "/events" },
              readMoreHref: "/learn-live",
              img: "https://static.wixstatic.com/media/11062b_9b788b37b9054864934bbb1e85592b06~mv2.jpg/v1/fill/w_224,h_226,fp_0.50_0.50,q_80,usm_0.66_1.00_0.01,enc_auto/11062b_9b788b37b9054864934bbb1e85592b06~mv2.jpg",
            },
          ].map((s) => (
            <div key={s.name} className="flex flex-col items-start">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden shadow-sm">
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${s.img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                  aria-label={s.name}
                />
              </div>
              <div className="mt-3">
                <div className="text-[#f97316] font-semibold">{s.name}</div>
                <div className="text-sm opacity-80">{s.desc}</div>
                <a href={s.readMoreHref} className="text-xs mt-1 inline-block underline">
                  Read More
                </a>
                <a href={s.cta.href} className="inline-block mt-2">
                  <button className="rounded bg-black text-white text-xs px-3 py-1 border border-[#f97316]">
                    {s.cta.label}
                  </button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Updates */}
      <section className="w-full text-white">
        <div className="bg-gradient-to-b from-black via-orange-700 to-orange-400">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-dance-script)" }}>Recent Updates</h2>
            <div className="mt-2 border-b-2 border-dashed border-orange-300" />
            {/* Latest 3 events */}
            {latestEvents.length > 0 ? (
              <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {latestEvents.map((ev) => (
                  <li key={ev.id} className="bg-black/20 rounded p-4">
                    <div className="text-sm font-semibold">{ev.title}</div>
                    <div className="text-xs opacity-80 mt-1">{ev.date}</div>
                    <a href={`/events/${ev.id}`} className="inline-block mt-3 text-xs underline">
                      Read More
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-6 min-h-[220px] flex items-center justify-center opacity-90 text-sm">
                No updates yet. Check back soon!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <section className="bg-gradient-to-r from-[#5b2a86] via-[#f1e4e8] to-[#f59e0b]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl shadow-sm p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-xs opacity-70">Call</div>
              <a href="tel:1234567890" className="text-sm text-[#167C36] font-medium">123-456-7890</a>
            </div>
            <div>
              <div className="text-xs opacity-70">Email</div>
              <a href="mailto:itsforyou.dance4you@gmail.com" className="text-sm text-[#167C36] font-medium">itsforyou.dance4you@gmail.com</a>
            </div>
            <div>
              <div className="text-xs opacity-70">Follow</div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-black text-white text-xs">F</span>
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-black text-white text-xs">X</span>
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-black text-white text-xs">in</span>
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-black text-white text-xs">IG</span>
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

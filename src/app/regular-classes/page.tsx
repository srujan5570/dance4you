"use client";

import Link from "next/link";

export default function RegularClassesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Gradient headline band */}
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-6xl mx-auto px-6 py-5 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">
            REGULAR CLASSES
          </h1>
          <p className="mt-1 text-sm sm:text-base opacity-95">
    Join our structured dance programs designed for consistent progress and skill development
  </p>
        </div>
      </div>

      {/* Classes content */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Adult Classes */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 overflow-hidden">
              <img 
                src="https://thecenterdance.files.wordpress.com/2018/06/facebook-collage-adult-summer-classes.jpg" 
                alt="Adult Dance Classes" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#f97316]">Adult Dance Classes (Batch)</h2>
              <p className="mt-2 text-gray-700">
                Structured training for adults of all skill levels. Our adult classes provide a supportive environment 
                to learn and master various dance styles at your own pace.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="mr-2 text-[#f97316]">✓</span> Beginner to advanced levels
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-[#f97316]">✓</span> Multiple dance styles available
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-[#f97316]">✓</span> Flexible scheduling options
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-[#f97316]">✓</span> Professional instructors
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/events" className="inline-block">
                  <button className="rounded bg-black text-white px-4 py-2 border border-[#f97316]">
                    Explore Classes
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Children Classes */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 overflow-hidden">
              <img 
                src="https://www.bing.com/th/id/OIP.ZaqEPdw3_ol5Q0XB_ug4BQHaE7?w=263&h=211&c=8&rs=1&qlt=90&o=6&cb=12&dpr=1.3&pid=3.1&rm=2" 
                alt="Children Dance Classes" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#f97316]">Children Dance Classes (Batch)</h2>
              <p className="mt-2 text-gray-700">
                Fun, safe, and engaging classes designed specifically for kids. Our children&apos;s programs focus on 
                building confidence, coordination, and creativity through dance.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="mr-2 text-[#f97316]">✓</span> Age-appropriate instruction
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-[#f97316]">✓</span> Fun, engaging environment
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-[#f97316]">✓</span> Build confidence and social skills
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-[#f97316]">✓</span> Recitals and performance opportunities
                </li>
              </ul>
              <div className="mt-6">
                <Link href="/events" className="inline-block">
                  <button className="rounded bg-black text-white px-4 py-2 border border-[#f97316]">
                    Explore Classes
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-10 text-center">
          <Link href="/" className="text-[#f97316] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
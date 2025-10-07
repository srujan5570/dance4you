"use client";

import Link from "next/link";

export default function DanceWorkshopPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Gradient headline band */}
      <div className="w-full bg-gradient-to-b from-black via-orange-700 to-orange-400 text-white">
        <div className="max-w-6xl mx-auto px-6 py-5 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">
            DANCE WORKSHOPS
          </h1>
          <p className="mt-1 text-sm sm:text-base opacity-95">
            Enhance your skills with expert-led workshops and special events
          </p>
        </div>
      </div>

      {/* Workshop content */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-72 overflow-hidden">
            <img 
              src="https://tse2.mm.bing.net/th/id/OIP.CYx7GHjr9TfWvkrm7vtCAAHaEC?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3" 
              alt="Dance Workshop Event" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[#f97316]">Dance Workshop Events</h2>
            <p className="mt-3 text-gray-700">
              Our intensive workshop events bring top industry professionals to teach specialized techniques, 
              choreography, and performance skills. These one-time events are perfect for dancers looking to 
              expand their repertoire and connect with the dance community.
            </p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-orange-50 p-5 rounded-lg">
                <h3 className="font-semibold text-[#f97316]">What to Expect</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2 text-[#f97316] mt-0.5">•</span> 
                    <span>Expert instruction from industry professionals</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#f97316] mt-0.5">•</span> 
                    <span>Focused training on specific dance styles or techniques</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#f97316] mt-0.5">•</span> 
                    <span>Networking opportunities with fellow dancers</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#f97316] mt-0.5">•</span> 
                    <span>Certificate of participation</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-orange-50 p-5 rounded-lg">
                <h3 className="font-semibold text-[#f97316]">Benefits</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2 text-[#f97316] mt-0.5">•</span> 
                    <span>Accelerated skill development</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#f97316] mt-0.5">•</span> 
                    <span>Exposure to different teaching styles</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#f97316] mt-0.5">•</span> 
                    <span>Inspiration for new choreography</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-[#f97316] mt-0.5">•</span> 
                    <span>Performance opportunities</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <Link href="/events" className="inline-block">
                <button className="rounded bg-black text-white px-6 py-3 border border-[#f97316] font-medium">
                  View Upcoming Workshops
                </button>
              </Link>
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
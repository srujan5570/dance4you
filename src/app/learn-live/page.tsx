"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function LearnLive() {
  const dances = [
    {
      name: "Bharatanatyam",
      img:
        "https://static.wixstatic.com/media/197520_f1d93436aeaf4f6dbf02094c3ee27647~mv2.jpg/v1/crop/x_117,y_114,w_782,h_743/fill/w_590,h_560,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Bharatanatyam.jpg",
      desc:
        "Bharatanatyam is a classical dance form that originates in Tamil Nadu. It expresses South Indian religious themes and spiritual ideas.",
      more:
        "Bharatanatyam features precise footwork, mudras (hand gestures), and expressive abhinaya. Traditionally performed by solo female dancers, it has evolved with contemporary interpretations while preserving its devotional roots.",
      category: "Indian" as const,
    },
    {
      name: "Hip Hop",
      img:
        "https://static.wixstatic.com/media/197520_cb8e9aa626524ef3a20c97bc0fc1c8d9~mv2.webp/v1/fill/w_590,h_560,al_c,lg_1,q_80,enc_avif,quality_auto/Hip%20Hop.webp",
      desc:
        "Hip hop is a freestyle street style that emerged with hip hop culture in 1970s America, influenced by DJs, MCs, and dance crews.",
      more:
        "Hip hop includes styles like popping, locking, breaking, and krumping. It values individuality, groove, and musicality, often blending choreography with freestyle.",
      category: "Western" as const,
    },
    {
      name: "Bhangra",
      img:
        "https://static.wixstatic.com/media/197520_29936e0d4def49d187039e4676a310eb~mv2.jpg/v1/crop/x_58,y_0,w_379,h_360/fill/w_531,h_504,al_c,lg_1,q_80,enc_avif,quality_auto/bhangra.jpg",
      desc:
        "Bhangra is a lively folk dance of Punjab traditionally performed during the harvest festival of Vaisakhi.",
      more:
        "Known for energetic movements and vibrant music, Bhangra celebrates joy and community, and is often performed in cultural events and competitions worldwide.",
      category: "Indian" as const,
    },
    {
      name: "House",
      img:
        "https://static.wixstatic.com/media/197520_4103bec3b16e453c8371667ab175fce9~mv2.jpg/v1/crop/x_0,y_31,w_1200,h_1139/fill/w_590,h_560,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/house%202.jpg",
      desc:
        "House dance is a freestyle club style shaped by Chicago and New York's underground house music scene.",
      more:
        "Characterized by jacking, footwork, and lofting, House dance emphasizes flow and rhythm, drawing from Afro-Latin and disco influences.",
      category: "Western" as const,
    },
    {
      name: "Mohiniyattam",
      img:
        "https://static.wixstatic.com/media/197520_263388d2d7ac4dc88ae7bc3ef7babf1f~mv2.jpg/v1/crop/x_0,y_0,w_1286,h_1221/fill/w_590,h_560,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Mohiniyattam_edited.jpg",
      desc:
        "Mohiniyattam is a graceful classical dance from Kerala, rooted in the Natya Shastra and known for its delicate, expressive movements.",
      more:
        "Performed traditionally by women, Mohiniyattam blends Lasya (graceful) movements with emotive storytelling set to Carnatic music.",
      category: "Indian" as const,
    },
    {
      name: "Breaking",
      img:
        "https://static.wixstatic.com/media/197520_eb5ec2852a1b4261a6270bd5164319b9~mv2.jpg/v1/crop/x_0,y_162,w_1080,h_1025/fill/w_590,h_560,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Snapinsta_app_424828023_401270659118885_4702449124022064646_n_1080.jpg",
      desc:
        "Breaking (breakdance) is an acrobatic street style pioneered by hip hop crews, featuring toprock, downrock, power moves, and freezes.",
      more:
        "Originating in the Bronx, Breaking showcases athleticism and creativity, and is now recognized globally, even entering the Olympic stage.",
      category: "Western" as const,
    },
  ];

  const [category, setCategory] = useState<"Indian" | "Western">("Indian");
  const [modalDance, setModalDance] = useState<(typeof dances)[number] | null>(null);
  const [activeTab, setActiveTab] = useState<"Indian" | "Western">("Indian");
  const filtered = dances.filter((d) => d.category === category);

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      {/* Gradient banner */}
      <div className="w-full bg-gradient-to-b from-[#64b6ac] via-[#d6c7b0] to-[#f59e0b] text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 text-center">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide drop-shadow"
            style={{ fontFamily: "var(--font-dance-script)" }}
          >
            Curious To Know Things Here It is.
          </h2>
          <p className="mt-3 text-sm sm:text-base md:text-lg" style={{ color: "#d35400" }}>
            Don&apos;t you feel that &quot;Dance&quot; is the language we can connect with anyone in this world,
            no matter where they are from?
          </p>
        </div>
      </div>

      {/* Category panel with cards */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="relative rounded-3xl bg-gradient-to-b from-orange-200 via-amber-100 to-orange-300 p-6 md:p-8 shadow-xl">
          {/* Tabs */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {( ["Indian", "Western"] as const ).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCategory(tab); }}
                aria-pressed={activeTab === tab}
                className={`px-4 py-2 rounded-full text-sm ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-md"
                    : "bg-white/80 border border-black/10 text-gray-800 hover:bg-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Grid of styles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map((d) => (
              <div
                key={d.name}
                className="bg-white rounded-lg shadow-lg p-1 group cursor-pointer border-[0.5px] border-black/20 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-200 transition"
                onClick={() => setModalDance(d)}
              >
                <div className="rounded-md overflow-hidden border-[0.05px] border-black/70">
                  <Image
                    src={d.img}
                    alt={d.name}
                    width={590}
                    height={560}
                    className="block w-full h-56 object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  />
                </div>
                <div className="bg-white text-black mt-3 rounded-md shadow p-3">
                  <div className="font-semibold flex items-center justify-between">
                    <span>{d.name}</span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">{d.category}</span>
                  </div>
                  <p className="mt-1 text-sm opacity-90">{d.desc}</p>
                  <div className="mt-2 text-xs text-orange-600">Tap to learn more</div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More button */}
          <div className="mt-8 flex justify-center">
            <button className="rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white px-6 py-2 font-semibold shadow-lg hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 transition-transform transform hover:-translate-y-0.5 active:translate-y-0">Show More</button>
          </div>
        </div>
      </section>

      {/* Modal */}
      {modalDance && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={`${modalDance.name} details`}
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setModalDance(null)}
          />
          <div className="relative z-10 max-w-2xl w-[92%] md:w-[80%] rounded-3xl border border-black/10 bg-white/90 backdrop-blur-md shadow-xl overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2">
                <Image
                  src={modalDance.img}
                  alt={modalDance.name}
                  width={590}
                  height={560}
                  className="w-full h-64 md:h-full object-cover"
                />
              </div>
              <div className="md:w-1/2 p-5">
                <h3 className="text-xl font-semibold">{modalDance.name}</h3>
                <p className="mt-2 text-sm text-gray-700">{modalDance.desc}</p>
                <p className="mt-3 text-sm text-gray-700">{modalDance.more}</p>
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    onClick={() => setModalDance(null)}
                    className="px-4 py-2 rounded-xl bg-white/80 border border-black/10 text-gray-800 hover:bg-white"
                  >
                    Close
                  </button>
                  <Link href="/events" className="rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white px-4 py-2 font-semibold shadow-lg hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 transition-transform transform hover:-translate-y-0.5 active:translate-y-0">
                    Explore Classes
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

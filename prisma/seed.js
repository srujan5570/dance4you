// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const base = [
    {
      title: "Bollywood Night",
      city: "Hyderabad",
      state: "Telangana",
      date: "2025-10-12",
      style: "Indian",
      image: "/dance-bharatanatyam.svg",
      description:
        "Experience a vibrant Bollywood evening packed with high-energy performances and community dance circles.",
    },
    {
      title: "Hip Hop Jam",
      city: "Bengaluru",
      state: "Karnataka",
      date: "2025-11-07",
      style: "Western",
      image: "/dance-hip-hop.svg",
      description: "An open-floor hip hop jam with cyphers, beats, and beginner-friendly sessions.",
    },
    {
      title: "Bhangra Fiesta",
      city: "Delhi",
      state: "Delhi",
      date: "2025-10-20",
      style: "Indian",
      image: "/dance-bhangra.svg",
      description: "Traditional Bhangra rhythms meet modern grooves in this spirited social.",
    },
    {
      title: "House Groove",
      city: "Mumbai",
      state: "Maharashtra",
      date: "2025-12-02",
      style: "Western",
      image: "/dance-house.svg",
      description: "Feel-good house music, soulful footwork, and a welcoming vibe for all levels.",
    },
  ];

  // Clear existing data, then insert fresh sample events
  await prisma.event.deleteMany({});
  await prisma.event.createMany({ data: base });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
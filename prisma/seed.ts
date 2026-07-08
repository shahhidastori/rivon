import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const skarduImages = [
  "https://images.unsplash.com/photo-1679951124125-50cc4029d727?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1704050929730-65753014c435?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1703185358665-4277e34a3dea?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1678260462226-3380792d52bd?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1642267043123-bd7dbe76c6c7?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1695405918676-eb8dcfcf7a2c?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1691645420225-1b76f83c9c08?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1630700246857-3113649eb3b6?auto=format&fit=crop&q=80&w=1600"
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.roomImage.deleteMany();
  await prisma.roomAmenity.deleteMany();
  await prisma.room.deleteMany();
  await prisma.adminUser.deleteMany();

  await prisma.adminUser.upsert({
    where: { email: "admin@hotel.test" },
    update: {
      name: "Actual User name",
      passwordHash
    },
    create: {
      name: "Actual User name",
      email: "admin@hotel.test",
      passwordHash,
      role: "administrator"
    }
  });

  const amenities = [
    ["Free Wi-Fi", "Wifi"],
    ["Breakfast Included", "Coffee"],
    ["Heated Rooms", "Flame"],
    ["Valley View", "Mountain"],
    ["Lake View", "Waves"],
    ["Secure Parking", "Car"],
    ["Airport Transfer", "Plane"],
    ["Room Service", "Bell"],
    ["Local Breakfast", "Utensils"],
    ["Tour Assistance", "Map"]
  ];

  for (const [name, icon] of amenities) {
    await prisma.amenity.upsert({
      where: { name },
      update: { icon },
      create: { name, icon }
    });
  }

  const amenityRows = await prisma.amenity.findMany();
  const amenityByName = new Map(amenityRows.map((item) => [item.name, item.id]));

  const rooms = [
    {
      name: "Deluxe Mountain View Room",
      type: "Deluxe",
      pricePerNight: 28000,
      beds: 1,
      capacity: 2,
      sizeSqm: 38,
      featured: true,
      description:
        "A warm room facing the Skardu mountains, with heated bedding, calm interiors, and easy access to the terrace.",
      amenities: ["Free Wi-Fi", "Breakfast Included", "Heated Rooms", "Valley View", "Room Service"]
    },
    {
      name: "Family Valley Suite",
      type: "Family Suite",
      pricePerNight: 42000,
      beds: 3,
      capacity: 5,
      sizeSqm: 72,
      featured: true,
      description:
        "A spacious suite for families exploring Skardu, with separate sleeping zones and views toward the valley.",
      amenities: ["Free Wi-Fi", "Breakfast Included", "Heated Rooms", "Valley View", "Tour Assistance"]
    },
    {
      name: "Executive Lake View Room",
      type: "Executive",
      pricePerNight: 36000,
      beds: 1,
      capacity: 2,
      sizeSqm: 46,
      featured: true,
      description:
        "A peaceful executive stay inspired by Satpara and Kachura lake views, ideal for scenic tourism and work retreats.",
      amenities: ["Free Wi-Fi", "Lake View", "Heated Rooms", "Airport Transfer", "Local Breakfast"]
    },
    {
      name: "Standard Twin Room",
      type: "Standard",
      pricePerNight: 18000,
      beds: 2,
      capacity: 2,
      sizeSqm: 32,
      featured: false,
      description:
        "A comfortable twin room for trekkers and friends, with practical storage, warm linens, and simple mountain styling.",
      amenities: ["Free Wi-Fi", "Heated Rooms", "Secure Parking", "Tour Assistance"]
    }
  ];

  for (const [index, room] of rooms.entries()) {
    const savedRoom = await prisma.room.create({
      data: {
        name: room.name,
        slug: slugify(room.name),
        type: room.type,
        pricePerNight: room.pricePerNight,
        beds: room.beds,
        capacity: room.capacity,
        sizeSqm: room.sizeSqm,
        featured: room.featured,
        description: room.description,
        status: "AVAILABLE"
      }
    });

    await prisma.roomAmenity.createMany({
      data: room.amenities.map((amenity) => ({
        roomId: savedRoom.id,
        amenityId: amenityByName.get(amenity)!
      }))
    });

    await prisma.roomImage.createMany({
      data: [0, 1, 2].map((offset) => ({
        roomId: savedRoom.id,
        url: skarduImages[(index + offset) % skarduImages.length],
        alt: `${room.name} with Skardu scenery ${offset + 1}`,
        isPrimary: offset === 0,
        sortOrder: offset
      }))
    });
  }

  const customer = await prisma.customer.create({
    data: {
      firstName: "Ayesha",
      lastName: "Khan",
      email: "ayesha@example.com",
      phone: "+92 300 555 1234",
      country: "Pakistan",
      notes: "Prefers a quiet room with a mountain view."
    }
  });

  const demoRoom = await prisma.room.findFirstOrThrow({
    where: { slug: "deluxe-mountain-view-room" }
  });

  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 8);
  checkIn.setHours(15, 0, 0, 0);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);

  await prisma.booking.create({
    data: {
      reference: "RVN-DEMO-1001",
      customerId: customer.id,
      roomId: demoRoom.id,
      checkIn,
      checkOut,
      guests: 2,
      status: "CONFIRMED",
      paymentStatus: "PARTIALLY_PAID",
      totalAmount: demoRoom.pricePerNight * 3,
      source: "website",
      specialRequests: "Warm room setup for evening arrival from Skardu Airport.",
      payments: {
        create: {
          method: "CARD",
          amount: demoRoom.pricePerNight,
          status: "CAPTURED",
          transactionId: "demo-card-001",
          paidAt: new Date()
        }
      }
    }
  });

  const sections = [
    {
      key: "branding",
      title: "Brand Logo",
      subtitle: "Rivon Resort",
      body: "Logo used across public and admin brand areas.",
      imageUrl: null,
      metadataJson: JSON.stringify({ alt: "Hotel logo" })
    },
    {
      key: "hero",
      title: "Peaceful Stays Beside Skardu's Mountains",
      subtitle: "Skardu, Pakistan",
      body:
        "A Skardu-based retreat for lake days, valley drives, cold desert sunsets, and warm local hospitality in Gilgit-Baltistan.",
      imageUrl: skarduImages[0],
      metadataJson: JSON.stringify({ cta: "Book Your Stay", secondaryCta: "Explore Rooms" })
    },
    {
      key: "about",
      title: "A quiet base for northern Pakistan journeys",
      subtitle: "About the Stay",
      body:
        "Our team welcomes travelers to Skardu with mountain-facing rooms, peaceful common spaces, local breakfast, and helpful guidance for valleys, lakes, and nearby scenic routes.",
      imageUrl: skarduImages[1]
    },
    {
      key: "facilities",
      title: "Facilities for mountain travel",
      subtitle: "Services",
      body:
        "Heated rooms, local dining, airport transfers, secure parking, tour assistance, and high-speed Wi-Fi are available for every guest.",
      metadataJson: JSON.stringify([
        { title: "Local Dining", body: "Breakfast and seasonal meals inspired by Balti hospitality." },
        { title: "Heated Comfort", body: "Warm bedding and heated rooms for cool Skardu evenings." },
        { title: "Tour Assistance", body: "Help planning Kachura Lake, Deosai, Shigar, and cold desert visits." },
        { title: "Transfers", body: "Skardu Airport pickup and local transport support." }
      ])
    },
    {
      key: "gallery",
      title: "Skardu around the hotel",
      subtitle: "Gallery",
      body: "Lakes, valleys, mountain roads, and quiet northern Pakistan scenery near your stay.",
      metadataJson: JSON.stringify(skarduImages)
    },
    {
      key: "testimonials",
      title: "What Our Guests Say",
      subtitle: "Reviews",
      metadataJson: JSON.stringify([
        {
          name: "Mariam S.",
          quote: "The stay felt peaceful after long days around Kachura Lake and Shigar Valley.",
          rating: 5
        },
        {
          name: "Daniel R.",
          quote: "Warm rooms, beautiful views, and staff who knew the best Skardu routes.",
          rating: 5
        },
        {
          name: "Hamza A.",
          quote: "A great family base for Deosai, the cold desert, and local food in Skardu.",
          rating: 5
        }
      ])
    },
    {
      key: "contact",
      title: "Visit us in Skardu",
      subtitle: "Contact",
      body: "Satpara Road, Skardu, Gilgit-Baltistan, Pakistan",
      metadataJson: JSON.stringify({
        phone: "+92 5815 555 019",
        email: "reservations@yourdomain.com",
        map: "https://maps.google.com"
      })
    }
  ];

  for (const section of sections) {
    await prisma.cmsSection.upsert({
      where: { key: section.key },
      update: section,
      create: section
    });
  }

  await prisma.cmsPage.upsert({
    where: { key: "terms" },
    update: {
      title: "Terms & Conditions",
      content:
        "Bookings are subject to room availability. Guests may cancel confirmed bookings up to 24 hours before check-in unless a special rate says otherwise."
    },
    create: {
      key: "terms",
      title: "Terms & Conditions",
      content:
        "Bookings are subject to room availability. Guests may cancel confirmed bookings up to 24 hours before check-in unless a special rate says otherwise."
    }
  });

  await prisma.cmsPage.upsert({
    where: { key: "privacy" },
    update: {
      title: "Privacy Policy",
      content:
        "We use guest information to manage bookings, process payments, and provide stay-related service. We do not sell guest data."
    },
    create: {
      key: "privacy",
      title: "Privacy Policy",
      content:
        "We use guest information to manage bookings, process payments, and provide stay-related service. We do not sell guest data."
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

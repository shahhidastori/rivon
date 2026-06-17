export const adminSeed = {
  name: "Hotel Admin",
  email: "admin@hotel.test",
  password: "password123",
  role: "administrator"
};

export const skarduImages = [
  "https://images.unsplash.com/photo-1679951124125-50cc4029d727?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1704050929730-65753014c435?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1703185358665-4277e34a3dea?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1678260462226-3380792d52bd?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1642267043123-bd7dbe76c6c7?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1695405918676-eb8dcfcf7a2c?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1691645420225-1b76f83c9c08?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1630700246857-3113649eb3b6?auto=format&fit=crop&q=80&w=1600"
];

export const amenitySeeds = [
  { name: "Free Wi-Fi", icon: "Wifi" },
  { name: "Breakfast Included", icon: "Coffee" },
  { name: "Heated Rooms", icon: "Flame" },
  { name: "Valley View", icon: "Mountain" },
  { name: "Lake View", icon: "Waves" },
  { name: "Secure Parking", icon: "Car" },
  { name: "Airport Transfer", icon: "Plane" },
  { name: "Room Service", icon: "Bell" },
  { name: "Local Breakfast", icon: "Utensils" },
  { name: "Tour Assistance", icon: "Map" }
];

export const roomSeeds = [
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

export const cmsSectionSeeds = [
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

export const cmsPageSeeds = [
  {
    key: "terms",
    title: "Terms & Conditions",
    content:
      "Bookings are subject to room availability. Guests may cancel confirmed bookings up to 24 hours before check-in unless a special rate says otherwise."
  },
  {
    key: "privacy",
    title: "Privacy Policy",
    content:
      "We use guest information to manage bookings, process payments, and provide stay-related service. We do not sell guest data."
  }
];

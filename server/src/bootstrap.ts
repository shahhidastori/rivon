import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { prisma } from "./db.js";
import { adminSeed, amenitySeeds, cmsPageSeeds, cmsSectionSeeds, roomSeeds, skarduImages } from "./demoContent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../uploads");

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const imageMimeTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif"
};

function uploadedAssetPath(uploadUrl: string) {
  const filename = uploadUrl.replace(/^\/uploads\//, "");
  if (!filename || filename.includes("..") || path.isAbsolute(filename)) return null;
  return path.join(uploadsDir, filename);
}

async function ensurePersistentBrandLogo() {
  const branding = await prisma.cmsSection.findUnique({ where: { key: "branding" } });
  const imageUrl = branding?.imageUrl?.trim();

  if (!branding || !imageUrl?.startsWith("/uploads/")) return;

  const filePath = uploadedAssetPath(imageUrl);
  if (filePath && fs.existsSync(filePath)) {
    const extension = path.extname(filePath).toLowerCase();
    const mimeType = imageMimeTypes[extension];
    if (!mimeType) {
      await prisma.cmsSection.update({
        where: { key: "branding" },
        data: { imageUrl: null }
      });
      return;
    }
    const file = await fs.promises.readFile(filePath);
    await prisma.cmsSection.update({
      where: { key: "branding" },
      data: { imageUrl: `data:${mimeType};base64,${file.toString("base64")}` }
    });
    return;
  }

  await prisma.cmsSection.update({
    where: { key: "branding" },
    data: { imageUrl: null }
  });
}

export async function ensureBaselineContent() {
  if (process.env.AUTO_SEED === "false") return;

  const passwordHash = await bcrypt.hash(adminSeed.password, 12);

  await prisma.adminUser.upsert({
    where: { email: adminSeed.email },
    update: {},
    create: {
      name: adminSeed.name,
      email: adminSeed.email,
      passwordHash,
      role: adminSeed.role
    }
  });

  for (const amenity of amenitySeeds) {
    await prisma.amenity.upsert({
      where: { name: amenity.name },
      update: {},
      create: amenity
    });
  }

  const amenityRows = await prisma.amenity.findMany();
  const amenityByName = new Map(amenityRows.map((item) => [item.name, item.id]));

  for (const [index, room] of roomSeeds.entries()) {
    const slug = slugify(room.name);
    const existingRoom = await prisma.room.findUnique({
      where: { slug },
      include: { images: true, amenities: true }
    });

    if (existingRoom) {
      if (!existingRoom.images.length) {
        await prisma.roomImage.createMany({
          data: [0, 1, 2].map((offset) => ({
            roomId: existingRoom.id,
            url: skarduImages[(index + offset) % skarduImages.length],
            alt: `${room.name} with Skardu scenery ${offset + 1}`,
            isPrimary: offset === 0,
            sortOrder: offset
          }))
        });
      }
      continue;
    }

    const savedRoom = await prisma.room.create({
      data: {
        name: room.name,
        slug,
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

  for (const section of cmsSectionSeeds) {
    await prisma.cmsSection.upsert({
      where: { key: section.key },
      update: {},
      create: section
    });
  }

  await ensurePersistentBrandLogo();

  for (const page of cmsPageSeeds) {
    await prisma.cmsPage.upsert({
      where: { key: page.key },
      update: {},
      create: page
    });
  }
}

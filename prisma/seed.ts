import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const churches = [
  { name: "First Slav Church — Brooklyn", city: "Brooklyn", state: "NY" },
  { name: "First Slav Church — Manhattan", city: "New York", state: "NY" },
  { name: "First Slav Church — Philadelphia", city: "Philadelphia", state: "PA" },
  { name: "First Slav Church — Chicago", city: "Chicago", state: "IL" },
  { name: "First Slav Church — Cleveland", city: "Cleveland", state: "OH" },
  { name: "First Slav Church — Detroit", city: "Detroit", state: "MI" },
  { name: "First Slav Church — Sacramento", city: "Sacramento", state: "CA" },
  { name: "First Slav Church — Portland", city: "Portland", state: "OR" },
  { name: "First Slav Church — Seattle", city: "Seattle", state: "WA" },
  { name: "First Slav Church — Denver", city: "Denver", state: "CO" },
  { name: "First Slav Church — Atlanta", city: "Atlanta", state: "GA" },
  { name: "First Slav Church — Miami", city: "Miami", state: "FL" },
];

async function main() {
  console.log("Seeding Shepherd Connect database...");

  for (const church of churches) {
    const existing = await db.church.findFirst({
      where: { name: church.name },
    });
    if (!existing) {
      await db.church.create({ data: church });
    }
  }

  const allChurches = await db.church.findMany({ orderBy: { name: "asc" } });
  const passwordHash = await bcrypt.hash("pastor123", 12);

  const pastorData = [
    {
      email: "pastor1@example.com",
      firstName: "Michael",
      lastName: "Ivanov",
      churchIndex: 0,
    },
    {
      email: "pastor2@example.com",
      firstName: "David",
      lastName: "Petrov",
      churchIndex: 3,
    },
    {
      email: "pastor3@example.com",
      firstName: "Andrew",
      lastName: "Sokolov",
      churchIndex: 6,
    },
  ];

  const pastors = [];
  for (const p of pastorData) {
    const pastor = await db.pastor.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        passwordHash,
        firstName: p.firstName,
        lastName: p.lastName,
        churchId: allChurches[p.churchIndex].id,
      },
    });
    pastors.push(pastor);
  }

  const existingProfile = await db.singleProfile.findFirst({
    where: {
      firstName: "Anna",
      lastName: "Volkova",
      churchId: allChurches[0].id,
    },
  });

  if (!existingProfile) {
    await db.singleProfile.create({
      data: {
        churchId: allChurches[0].id,
        createdById: pastors[0].id,
        firstName: "Anna",
        lastName: "Volkova",
        dateOfBirth: new Date("1995-03-15"),
        gender: "female",
        height: "5'6\"",
        city: "Brooklyn",
        state: "NY",
        phone: "718-555-0101",
        email: "anna.volkova@example.com",
        occupation: "Registered Nurse",
        education: "BSN, Hunter College",
        bio: "Active in youth ministry and worship team. Enjoys hiking, reading, and volunteering at community outreach events.",
        faithBackground:
          "Raised in the church, baptized at 16. Regular attendee and small group leader.",
        interests: "Hiking, music, cooking, missions",
        lookingFor:
          "A faithful believer who shares a heart for service and family values.",
        languages: "English, Russian",
        status: "active",
        pastorNotes:
          "Mature in faith, well-respected in the congregation. Ready for intentional introduction.",
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  ${allChurches.length} church branches`);
  console.log(`  3 demo pastors (password: pastor123)`);
  console.log(`  1 sample profile (Anna Volkova)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });

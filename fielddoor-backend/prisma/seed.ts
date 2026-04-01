import { PrismaClient, Role } from "@prisma/client";

import logger from "../src/utils/logger";

const prisma = new PrismaClient();

async function main() {
  const sports = [
    ["Box Cricket", "🏏"],
    ["Football", "⚽"],
    ["Badminton", "🏸"],
    ["Tennis", "🎾"],
    ["Bowling", "🎳"],
    ["Drift Bikes", "🏍️"],
    ["Paintball", "🎯"]
  ];

  for (const [name, emoji] of sports) {
    await prisma.sport.upsert({
      where: { name },
      update: { emoji, isActive: true },
      create: { name, emoji }
    });
  }

  const adminUser = await prisma.user.upsert({
    where: { phone: "+911111111111" },
    update: { role: Role.ADMIN, name: "Field Door Admin", countryCode: "+91" },
    create: {
      phone: "+911111111111",
      countryCode: "+91",
      role: Role.ADMIN,
      name: "Field Door Admin"
    }
  });

  const ownerUser = await prisma.user.upsert({
    where: { phone: "+919999999999" },
    update: { role: Role.VENUE_OWNER, name: "Venue Ops Lead" },
    create: {
      phone: "+919999999999",
      countryCode: "+91",
      role: Role.VENUE_OWNER,
      name: "Venue Ops Lead",
      email: "owner@fielddoor.in"
    }
  });

  const owner = await prisma.venueOwner.upsert({
    where: { userId: ownerUser.id },
    update: {},
    create: {
      userId: ownerUser.id,
      businessName: "Field Door Sports Pvt Ltd",
      gstNumber: "29ABCDE1234F1Z7",
      bankAccount: {
        accountNumber: "1234567890",
        ifsc: "HDFC0001234",
        holderName: "Field Door Sports Pvt Ltd"
      }
    }
  });

  const sportByName = Object.fromEntries(
    (await prisma.sport.findMany()).map((sport) => [sport.name, sport])
  );

  const venues = [
    {
      name: "Galaxy Zone",
      description: "High-energy multi-sport turf in Koramangala.",
      addressLine: "80 Feet Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560034",
      latitude: 12.9352,
      longitude: 77.6245,
      avgRating: 4.8,
      sports: [
        { name: "Box Cricket", pricePerHour: 800 },
        { name: "Football", pricePerHour: 1000 }
      ]
    },
    {
      name: "Skyline Sports Hub",
      description: "Premium rooftop arena with bright match lighting.",
      addressLine: "27th Main Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560102",
      latitude: 12.9116,
      longitude: 77.6474,
      avgRating: 4.9,
      sports: [
        { name: "Box Cricket", pricePerHour: 900 },
        { name: "Badminton", pricePerHour: 400 }
      ]
    },
    {
      name: "Velocity Arena",
      description: "Fast, floodlit match venue built for league nights.",
      addressLine: "ITPL Main Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560066",
      latitude: 12.9719,
      longitude: 77.7500,
      avgRating: 4.7,
      sports: [
        { name: "Football", pricePerHour: 1200 },
        { name: "Tennis", pricePerHour: 600 }
      ]
    }
  ];

  for (const venueData of venues) {
    const venue = await prisma.venue.upsert({
      where: { id: `${venueData.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `${venueData.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: venueData.name,
        description: venueData.description,
        ownerId: owner.id,
        addressLine: venueData.addressLine,
        city: venueData.city,
        state: venueData.state,
        pincode: venueData.pincode,
        latitude: venueData.latitude,
        longitude: venueData.longitude,
        openTime: "06:00",
        closeTime: "23:00",
        isActive: true,
        isApproved: true,
        avgRating: venueData.avgRating,
        totalReviews: 12,
        amenities: {
          parking: true,
          lights: true,
          showers: true,
          water: true,
          recording: false,
          gear: true,
          shoes: false,
          airflow: true
        }
      }
    });

    await prisma.venueImage.upsert({
      where: { id: `${venue.id}-primary` },
      update: {},
      create: {
        id: `${venue.id}-primary`,
        venueId: venue.id,
        url: "https://images.fielddoor.in/venue-placeholder.jpg",
        isPrimary: true,
        order: 0
      }
    });

    for (const sport of venueData.sports) {
      await prisma.venueSport.upsert({
        where: {
          venueId_sportId: {
            venueId: venue.id,
            sportId: sportByName[sport.name].id
          }
        },
        update: { pricePerHour: sport.pricePerHour },
        create: {
          venueId: venue.id,
          sportId: sportByName[sport.name].id,
          pricePerHour: sport.pricePerHour,
          pitchName: "Main Pitch",
          maxPlayers: 14
        }
      });
    }
  }

  logger.info(`Seed complete. Admin: ${adminUser.phone}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    logger.error("Seed failed", { error });
    await prisma.$disconnect();
    process.exit(1);
  });

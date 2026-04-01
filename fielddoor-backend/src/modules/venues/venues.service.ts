import { Prisma } from "@prisma/client";

import { prisma } from "@config/database";
import { buildPaginationArgs } from "@utils/paginateQuery";

type VenueListParams = {
  sportId?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radius: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  date?: string;
  page: number;
  limit: number;
  sortBy?: "rating" | "price" | "distance";
  userId?: string;
};

export const venuesService = {
  async list(params: VenueListParams) {
    const where: Prisma.VenueWhereInput = {
      isActive: true,
      isApproved: true,
      ...(params.city
        ? {
            city: {
              equals: params.city,
              mode: "insensitive"
            }
          }
        : {}),
      ...(params.minRating ? { avgRating: { gte: params.minRating } } : {}),
      ...(params.sportId
        ? {
            sports: {
              some: {
                sportId: params.sportId,
                ...(params.minPrice || params.maxPrice
                  ? {
                      pricePerHour: {
                        ...(params.minPrice ? { gte: params.minPrice } : {}),
                        ...(params.maxPrice ? { lte: params.maxPrice } : {})
                      }
                    }
                  : {})
              }
            }
          }
        : {})
    };

    if (params.date) {
      where.slots = {
        some: {
          date: params.date,
          status: "AVAILABLE"
        }
      };
    }

    const venues = await prisma.venue.findMany({
      where,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
          orderBy: { order: "asc" }
        },
        sports: { include: { sport: true } },
        savedBy: params.userId ? { where: { userId: params.userId }, take: 1 } : false,
        slots: params.date
          ? {
              where: { date: params.date, status: "AVAILABLE" }
            }
          : false
      },
      ...buildPaginationArgs(params.page, params.limit),
      orderBy:
        params.sortBy === "rating"
          ? { avgRating: "desc" }
          : { createdAt: "desc" }
    });

    let hydrated = venues.map((venue) => {
      const prices = venue.sports.map((sport) => sport.pricePerHour);
      return {
        ...venue,
        primaryImage: venue.images[0]?.url ?? null,
        priceRange: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
        availableSlotCount: Array.isArray(venue.slots) ? venue.slots.length : 0,
        isSaved: Array.isArray(venue.savedBy) ? venue.savedBy.length > 0 : false
      };
    });

    if (typeof params.lat === "number" && typeof params.lng === "number") {
      const distances = await prisma.$queryRaw<
        Array<{ id: string; distance_km: number }>
      >`SELECT id,
          (6371 * acos(
            cos(radians(${params.lat})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${params.lng})) +
            sin(radians(${params.lat})) * sin(radians(latitude))
          )) AS distance_km
        FROM "Venue"
        WHERE "isActive" = true AND "isApproved" = true`;

      const distanceMap = new Map(distances.map((row) => [row.id, Number(row.distance_km)]));
      hydrated = hydrated
        .map((venue) => ({
          ...venue,
          distanceKm: distanceMap.get(venue.id) ?? null
        }))
        .filter((venue) => venue.distanceKm === null || venue.distanceKm <= params.radius);

      if (params.sortBy === "distance") {
        hydrated.sort(
          (a, b) =>
            ((a as typeof a & { distanceKm?: number }).distanceKm ?? Infinity) -
            ((b as typeof b & { distanceKm?: number }).distanceKm ?? Infinity)
        );
      }
    }

    if (params.sortBy === "price") {
      hydrated.sort((a, b) => (a.priceRange?.min ?? 0) - (b.priceRange?.min ?? 0));
    }

    const total = await prisma.venue.count({ where });
    return { venues: hydrated, total };
  },

  async getById(id: string, userId?: string) {
    const venue = await prisma.venue.findUniqueOrThrow({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        sports: { include: { sport: true } },
        reviews: {
          where: { isVisible: true },
          include: {
            user: {
              select: { name: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 5
        },
        savedBy: userId ? { where: { userId }, take: 1 } : false
      }
    });

    return {
      ...venue,
      isSaved: Array.isArray(venue.savedBy) ? venue.savedBy.length > 0 : false,
      reviews: venue.reviews.map((review) => ({
        ...review,
        userName: review.user.name ?? "Player",
        avatarInitial: (review.user.name ?? "P").charAt(0).toUpperCase()
      }))
    };
  },

  async search(query: string) {
    const venues = await prisma.venue.findMany({
      where: {
        isActive: true,
        isApproved: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          {
            sports: {
              some: {
                sport: {
                  name: { contains: query, mode: "insensitive" }
                }
              }
            }
          }
        ]
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        sports: { include: { sport: true } }
      },
      take: 10
    });

    return venues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      city: venue.city,
      primaryImage: venue.images[0]?.url ?? null,
      sports: venue.sports.map((item) => item.sport.name)
    }));
  }
};

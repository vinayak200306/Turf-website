import { prisma } from "@config/database";
import { ApiError } from "@utils/ApiError";
import { buildPaginationArgs } from "@utils/paginateQuery";

export const reviewsService = {
  async create(userId: string, bookingId: string, rating: number, comment: string) {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { slot: true, venue: true }
    });

    if (booking.userId !== userId || booking.status !== "COMPLETED") {
      throw new ApiError(400, "Only completed bookings can be reviewed", true, "REVIEW_NOT_ALLOWED");
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        userId,
        venueId: booking.venueId,
        rating,
        comment
      }
    });

    const aggregate = await prisma.review.aggregate({
      where: { venueId: booking.venueId, isVisible: true },
      _avg: { rating: true },
      _count: { _all: true }
    });

    await prisma.venue.update({
      where: { id: booking.venueId },
      data: {
        avgRating: aggregate._avg.rating ?? 0,
        totalReviews: aggregate._count._all
      }
    });

    return review;
  },

  async venueReviews(venueId: string, page: number, limit: number, sortBy: "recent" | "highest" | "lowest") {
    const orderBy =
      sortBy === "highest"
        ? { rating: "desc" as const }
        : sortBy === "lowest"
          ? { rating: "asc" as const }
          : { createdAt: "desc" as const };

    const where = { venueId, isVisible: true };
    const total = await prisma.review.count({ where });
    const reviews = await prisma.review.findMany({
      where,
      ...buildPaginationArgs(page, limit),
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy
    });

    return {
      reviews: reviews.map((review) => ({
        ...review,
        userName: review.user.name ?? "Player",
        avatarInitial: (review.user.name ?? "P").charAt(0).toUpperCase()
      })),
      total
    };
  }
};

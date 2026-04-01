import { prisma } from "@config/database";
import { redis } from "@config/redis";
import { buildPaginationArgs } from "@utils/paginateQuery";

export const usersService = {
  async getMe(userId: string) {
    return prisma.user.findUniqueOrThrow({
      where: { id: userId }
    });
  },

  async updateMe(userId: string, payload: { name?: string; email?: string; avatarUrl?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: payload
    });
    await redis.del(`user:session:${userId}`);
    return user;
  },

  async saveFcmToken(userId: string, token: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token }
    });
  },

  async getMyBookings(userId: string, status: string | undefined, page: number, limit: number) {
    const where = {
      userId,
      ...(status ? { status: status as never } : {})
    };

    const total = await prisma.booking.count({ where });
    const bookings = await prisma.booking.findMany({
      where,
      ...buildPaginationArgs(page, limit),
      include: {
        venue: true,
        slot: true,
        payment: true,
        sport: true
      },
      orderBy: { createdAt: "desc" }
    });

    return { bookings, total };
  },

  async getSavedVenues(userId: string) {
    return prisma.savedVenue.findMany({
      where: { userId },
      include: {
        venue: {
          include: {
            images: { orderBy: { order: "asc" }, take: 1 },
            sports: { include: { sport: true } }
          }
        }
      }
    });
  },

  async toggleSavedVenue(userId: string, venueId: string) {
    const existing = await prisma.savedVenue.findUnique({
      where: {
        userId_venueId: { userId, venueId }
      }
    });

    if (existing) {
      await prisma.savedVenue.delete({ where: { id: existing.id } });
      return { saved: false };
    }

    await prisma.savedVenue.create({
      data: { userId, venueId }
    });
    return { saved: true };
  },

  async getNotifications(userId: string, page: number, limit: number, unreadOnly?: boolean) {
    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {})
    };
    const total = await prisma.notification.count({ where });
    const notifications = await prisma.notification.findMany({
      where,
      ...buildPaginationArgs(page, limit),
      orderBy: { createdAt: "desc" }
    });
    return { notifications, total };
  },

  async markAllNotificationsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    return { updated: true };
  }
};

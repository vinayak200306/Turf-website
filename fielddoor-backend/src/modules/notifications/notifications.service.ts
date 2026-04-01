import { prisma } from "@config/database";
import { buildPaginationArgs } from "@utils/paginateQuery";

export const notificationsService = {
  async list(userId: string, page: number, limit: number) {
    const where = { userId };
    const total = await prisma.notification.count({ where });
    const notifications = await prisma.notification.findMany({
      where,
      ...buildPaginationArgs(page, limit),
      orderBy: { createdAt: "desc" }
    });
    return { notifications, total };
  },

  async markRead(userId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true }
    });
  }
};

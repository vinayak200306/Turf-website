import { prisma } from "@config/database";
import { buildPaginationArgs } from "@utils/paginateQuery";

export const adminService = {
  async dashboard() {
    const today = new Date();
    const todayString = today.toISOString().slice(0, 10);
    const [totalUsers, totalVenues, totalBookings, pendingVenueApprovals, payments, bookingsToday] =
      await Promise.all([
        prisma.user.count(),
        prisma.venue.count(),
        prisma.booking.count(),
        prisma.venue.count({ where: { isApproved: false } }),
        prisma.payment.findMany({ where: { status: "CAPTURED" } }),
        prisma.booking.count({ where: { createdAt: { gte: new Date(`${todayString}T00:00:00`) } } })
      ]);

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const revenueToday = payments
      .filter((payment) => payment.paidAt?.toISOString().slice(0, 10) === todayString)
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      totalUsers,
      totalVenues,
      totalBookings,
      totalRevenue,
      bookingsToday,
      revenueToday,
      pendingVenueApprovals
    };
  },

  async venues(approved: string | undefined, page: number, limit: number) {
    const where = approved === undefined ? {} : { isApproved: approved === "true" };
    const total = await prisma.venue.count({ where });
    const venues = await prisma.venue.findMany({
      where,
      ...buildPaginationArgs(page, limit),
      include: {
        owner: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return { venues, total };
  },

  async approveVenue(id: string, approved: boolean) {
    return prisma.venue.update({
      where: { id },
      data: { isApproved: approved }
    });
  },

  async users(role: string | undefined, page: number, limit: number) {
    const where = role ? { role: role as never } : {};
    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      ...buildPaginationArgs(page, limit),
      orderBy: { createdAt: "desc" }
    });
    return { users, total };
  },

  async updateUserStatus(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive }
    });
  },

  async bookings(status: string | undefined, date: string | undefined, venueId: string | undefined, page: number, limit: number) {
    const where = {
      ...(status ? { status: status as never } : {}),
      ...(venueId ? { venueId } : {}),
      ...(date ? { slot: { date } } : {})
    };
    const total = await prisma.booking.count({ where });
    const bookings = await prisma.booking.findMany({
      where,
      ...buildPaginationArgs(page, limit),
      include: { venue: true, slot: true, payment: true, user: true },
      orderBy: { createdAt: "desc" }
    });
    return { bookings, total };
  },

  async payments(status: string | undefined, page: number, limit: number) {
    const where = status ? { status: status as never } : {};
    const total = await prisma.payment.count({ where });
    const payments = await prisma.payment.findMany({
      where,
      ...buildPaginationArgs(page, limit),
      include: { booking: true },
      orderBy: { createdAt: "desc" }
    });
    return { payments, total };
  }
};

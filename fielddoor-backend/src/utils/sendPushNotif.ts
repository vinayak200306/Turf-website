import { prisma } from "@config/database";
import { firebaseMessaging } from "@config/firebase";
import logger from "@utils/logger";
import type { NotificationPayload } from "../types";

export const sendToUser = async (userId: string, payload: NotificationPayload) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true }
    });

    if (!user?.fcmToken || !firebaseMessaging) {
      return;
    }

    await firebaseMessaging.send({
      token: user.fcmToken,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: payload.data
    });
  } catch (error) {
    logger.error("Push notification send failed", { error, userId, payload });
  }
};

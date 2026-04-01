import logger from "@utils/logger";
import { bookingCompletionJob } from "./bookingCompletion.job";
import { bookingReminderJob } from "./bookingReminder.job";
import { slotExpiryJob } from "./slotExpiry.job";

export const registerJobs = () => {
  slotExpiryJob.start();
  bookingReminderJob.start();
  bookingCompletionJob.start();
  logger.info("Cron jobs registered");
};

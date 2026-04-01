"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerJobs = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const bookingCompletion_job_1 = require("./bookingCompletion.job");
const bookingReminder_job_1 = require("./bookingReminder.job");
const slotExpiry_job_1 = require("./slotExpiry.job");
const registerJobs = () => {
    slotExpiry_job_1.slotExpiryJob.start();
    bookingReminder_job_1.bookingReminderJob.start();
    bookingCompletion_job_1.bookingCompletionJob.start();
    logger_1.default.info("Cron jobs registered");
};
exports.registerJobs = registerJobs;

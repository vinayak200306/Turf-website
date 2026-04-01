"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToUser = void 0;
const database_1 = require("../config/database");
const firebase_1 = require("../config/firebase");
const logger_1 = __importDefault(require("./logger"));
const sendToUser = async (userId, payload) => {
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { fcmToken: true }
        });
        if (!user?.fcmToken || !firebase_1.firebaseMessaging) {
            return;
        }
        await firebase_1.firebaseMessaging.send({
            token: user.fcmToken,
            notification: {
                title: payload.title,
                body: payload.body
            },
            data: payload.data
        });
    }
    catch (error) {
        logger_1.default.error("Push notification send failed", { error, userId, payload });
    }
};
exports.sendToUser = sendToUser;

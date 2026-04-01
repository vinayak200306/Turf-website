"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBookingId = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateBookingId = (date = new Date()) => {
    const yyyy = date.getFullYear();
    const mm = `${date.getMonth() + 1}`.padStart(2, "0");
    const dd = `${date.getDate()}`.padStart(2, "0");
    const randomPart = crypto_1.default
        .randomBytes(3)
        .toString("base64")
        .replace(/[^A-Z0-9]/gi, "")
        .toUpperCase()
        .slice(0, 4);
    return `FD-${yyyy}${mm}${dd}-${randomPart}`;
};
exports.generateBookingId = generateBookingId;

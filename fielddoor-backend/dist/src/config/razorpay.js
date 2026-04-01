"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRazorpayConfigured = exports.razorpay = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const env_1 = require("./env");
exports.razorpay = env_1.env.RAZORPAY_KEY_ID && env_1.env.RAZORPAY_KEY_SECRET
    ? new razorpay_1.default({
        key_id: env_1.env.RAZORPAY_KEY_ID,
        key_secret: env_1.env.RAZORPAY_KEY_SECRET
    })
    : null;
exports.isRazorpayConfigured = Boolean(exports.razorpay);

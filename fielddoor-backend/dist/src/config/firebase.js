"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseMessaging = exports.firebaseAdmin = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const env_1 = require("./env");
const canInitFirebase = Boolean(env_1.env.FIREBASE_PROJECT_ID && env_1.env.FIREBASE_CLIENT_EMAIL && env_1.env.FIREBASE_PRIVATE_KEY);
if (!firebase_admin_1.default.apps.length && canInitFirebase) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert({
            projectId: env_1.env.FIREBASE_PROJECT_ID,
            clientEmail: env_1.env.FIREBASE_CLIENT_EMAIL,
            privateKey: env_1.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        })
    });
}
exports.firebaseAdmin = firebase_admin_1.default;
exports.firebaseMessaging = canInitFirebase ? firebase_admin_1.default.messaging() : null;

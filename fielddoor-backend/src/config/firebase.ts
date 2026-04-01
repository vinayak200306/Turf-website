import admin from "firebase-admin";

import { env } from "./env";

const canInitFirebase = Boolean(
  env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY
);

if (!admin.apps.length && canInitFirebase) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
}

export const firebaseAdmin = admin;
export const firebaseMessaging = canInitFirebase ? admin.messaging() : null;

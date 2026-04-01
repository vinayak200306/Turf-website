import crypto from "crypto";

export const generateOTP = () => String(crypto.randomInt(100000, 1000000));

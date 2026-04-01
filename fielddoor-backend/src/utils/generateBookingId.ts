import crypto from "crypto";

export const generateBookingId = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  const randomPart = crypto
    .randomBytes(3)
    .toString("base64")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 4);

  return `FD-${yyyy}${mm}${dd}-${randomPart}`;
};

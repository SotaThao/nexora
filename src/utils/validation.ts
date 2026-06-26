import { isPossiblePhoneNumber } from "libphonenumber-js";

const value = (input: unknown) => String(input ?? "").trim();

export const isValidEmail = (input: unknown) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value(input));

export const isValidPhone = (input: unknown) => {
  const phone = value(input);
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;

  // Normalize thin spaces (U+2009) used by phone formatters before validation
  const normalizedPhone = phone.replace(/ /g, " ");
  try {
    return isPossiblePhoneNumber(normalizedPhone);
  } catch {
    return digits.length >= 10 && digits.length <= 15;
  }
};

export const isValidHttpUrl = (input: unknown) => {
  try {
    const url = new URL(value(input));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

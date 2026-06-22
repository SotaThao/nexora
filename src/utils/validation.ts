import { isValidPhoneNumber } from "libphonenumber-js";

const value = (input: unknown) => String(input ?? "").trim();

export const isValidEmail = (input: unknown) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value(input));

export const isValidPhone = (input: unknown) => {
  const phone = value(input);
  if (!phone) return false;
  if (phone.replace(/\D/g, "").length >= 10) return true;

  try {
    return isValidPhoneNumber(phone);
  } catch {
    return false;
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

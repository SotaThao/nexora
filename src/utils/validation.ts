import { isPossiblePhoneNumber, parsePhoneNumberFromString } from "libphonenumber-js";

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
    // A bare national number (no "+" country prefix — e.g. this app's own
    // formatNationalNumber output like "123-456-7890") is ambiguous without a
    // default country: libphonenumber-js returns false rather than throwing,
    // so every un-prefixed US number was rejected. "US" is only a fallback —
    // an already "+"-prefixed number (any country) still parses by its own
    // embedded country code and ignores this default.
    return isPossiblePhoneNumber(normalizedPhone, "US");
  } catch {
    return digits.length >= 10 && digits.length <= 15;
  }
};

/** Zelle accepts a registered email or a US mobile number (10 national digits). */
export const isValidUsPhone = (input: unknown) => {
  const phone = value(input);
  if (!phone || phone.includes("@")) return false;

  const normalizedPhone = phone.replace(/ /g, " ");
  try {
    const parsed = parsePhoneNumberFromString(normalizedPhone, "US");
    if (parsed?.country === "US" && parsed.nationalNumber.length === 10) {
      return parsed.isValid() || parsed.isPossible();
    }
  } catch {
    // fall through to digit check
  }

  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return true;
  if (digits.length === 11 && digits.startsWith("1")) return true;
  return false;
};

export const isValidZelleAccount = (input: unknown) =>
  isValidEmail(input) || isValidUsPhone(input);

export const isValidHttpUrl = (input: unknown) => {
  try {
    const url = new URL(value(input));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

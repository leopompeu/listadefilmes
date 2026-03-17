import { compare, hash } from "bcryptjs";

export function sanitizeUsername(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 40);
}

export function validatePassword(password: string) {
  return password.length >= 6 && password.length <= 72;
}

export async function hashPassword(password: string) {
  return hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

import { createHash, pbkdf2 as pbkdf2Callback, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2 = promisify(pbkdf2Callback);
const passwordAlgorithm = "pbkdf2-sha256";
const passwordIterations = 210_000;
const passwordKeyLength = 32;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = await pbkdf2(password, salt, passwordIterations, passwordKeyLength, "sha256");
  return [
    passwordAlgorithm,
    passwordIterations.toString(),
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join(":");
}

export async function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;

  const [algorithm, iterationsText, saltText, keyText] = storedHash.split(":");
  const iterations = Number(iterationsText);
  if (
    algorithm !== passwordAlgorithm ||
    !Number.isInteger(iterations) ||
    iterations <= 0 ||
    !saltText ||
    !keyText
  ) {
    return false;
  }

  const expectedKey = Buffer.from(keyText, "base64url");
  const actualKey = await pbkdf2(
    password,
    Buffer.from(saltText, "base64url"),
    iterations,
    expectedKey.length,
    "sha256",
  );

  return expectedKey.length === actualKey.length && timingSafeEqual(expectedKey, actualKey);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export function createSecureToken(byteLength = 32) {
  return randomBytes(byteLength).toString("base64url");
}

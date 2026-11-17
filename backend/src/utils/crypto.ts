/**
 * Web Crypto utilities for Cloudflare Workers
 * Uses PBKDF2 with SHA-256 for password hashing and SHA-256 for session token hashing.
 */

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(new Uint8Array(derivedKey));
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;

  const [saltHex, expectedHashHex] = parts;
  const salt = hexToBuffer(saltHex);
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const actualHashHex = bufferToHex(new Uint8Array(derivedKey));
  return timingSafeEqual(actualHashHex, expectedHashHex);
}

export function generateToken(byteLength = 32): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return bufferToHex(randomBytes);
}

export async function hashToken(token: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(token));
  return bufferToHex(new Uint8Array(hashBuffer));
}

export function generateUuid(): string {
  return crypto.randomUUID();
}

export async function generatePseudonymousId(userId: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(userId + salt));
  return bufferToHex(new Uint8Array(hashBuffer)).slice(0, 24);
}

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

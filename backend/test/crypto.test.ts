import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateToken, hashToken, timingSafeEqualHex } from '../src/utils/crypto';

describe('Web Crypto Utilities', () => {
  it('should hash and verify passwords using PBKDF2', async () => {
    const password = 'SuperSecurePassword2026!';
    const hash = await hashPassword(password);

    expect(hash).toContain(':');
    const [salt, derived] = hash.split(':');
    expect(salt.length).toBe(32); // 16 bytes in hex
    expect(derived.length).toBe(64); // 32 bytes in hex

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('should generate secure tokens and hash them with SHA-256', async () => {
    const token = generateToken(32);
    expect(token.length).toBe(64);

    const hashed = await hashToken(token);
    expect(hashed.length).toBe(64);

    const hashedAgain = await hashToken(token);
    expect(hashedAgain).toBe(hashed);
  });
});

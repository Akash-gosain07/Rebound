import bcrypt from 'bcrypt';
import { generateNumericOtp } from './ids.js';

const SALT_ROUNDS = 10;

export async function createHashedOtp() {
  const code = generateNumericOtp(6);
  const otpHash = await bcrypt.hash(code, SALT_ROUNDS);
  return { code, otpHash };
}

export async function verifyOtp(code, hash) {
  return bcrypt.compare(code, hash);
}

import { randomBytes } from 'node:crypto';

export function randomStringGenerator(length) {
  return randomBytes(length / 2).toString('hex');
}

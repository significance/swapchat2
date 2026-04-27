import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.test') });

export const TEST_SIGNER_KEY = process.env.VITE_BEE_SIGNER_KEY || '';
export const TEST_BATCH_ID = process.env.VITE_BEE_STAMP || '';
export const TEST_BEE_API = process.env.VITE_BEE_API || 'http://localhost:1633';

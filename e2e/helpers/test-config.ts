import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync, readdirSync } from 'fs';
import { deserialize, toHex } from 'book-of-stamps';

config({ path: resolve(process.cwd(), '.env.test') });

export const TEST_BEE_API = process.env.VITE_BEE_API || 'http://localhost:1633';

// Load book of stamps from project root (swapchat2/ parent)
const projectRoot = resolve(process.cwd(), '..');
const bookFile = readdirSync(projectRoot).find(f => f.startsWith('book-of-stamps-') && f.endsWith('.txt'));
if (!bookFile) throw new Error(`No book-of-stamps-*.txt found in ${projectRoot}`);

export const TEST_BOOK_TEXT = readFileSync(resolve(projectRoot, bookFile), 'utf-8');
const book = deserialize(TEST_BOOK_TEXT);
export const TEST_SIGNER_KEY = toHex(book.privateKey);
export const TEST_BATCH_ID = book.batchId;
export const TEST_STAMP_DEPTH = book.depth;

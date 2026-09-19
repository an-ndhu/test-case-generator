import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createApp } from './app.js';

const srcDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(srcDir, '../.env') });
dotenv.config({ path: path.join(srcDir, '../../.env'), override: true });

function stripQuotes(value = '') {
  return String(value).trim().replace(/^["']|["']$/g, '');
}

function mongoUri() {
  const user = stripQuotes(process.env.MONGODB_USERNAME);
  const pass = stripQuotes(process.env.MONGODB_PASSWORD);
  const host = stripQuotes(process.env.MONGODB_HOST) || 'melo.dzdofyh.mongodb.net';
  const db = stripQuotes(process.env.MONGODB_DB) || 'melo';

  if (user && pass) {
    return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${db}?retryWrites=true&w=majority`;
  }

  return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/melo';
}

const port = Number(process.env.PORT) || 5000;
const uri = mongoUri();

async function main() {
  await mongoose.connect(uri);
  const app = createApp();
  app.listen(port, () => {
    console.log(`MELO API on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});

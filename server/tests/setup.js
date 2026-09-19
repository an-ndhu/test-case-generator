import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const here = path.dirname(fileURLToPath(import.meta.url));
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.GEMINI_API_KEY = 'test-key';
process.env.MONGOMS_DOWNLOAD_DIR = path.join(here, '../.cache/mongodb-binaries');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({
    binary: {
      version: '6.0.26',
      systemBinary: process.env.MONGOMS_SYSTEM_BINARY || '/usr/bin/mongod',
    },
  });
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongo) await mongo.stop();
});

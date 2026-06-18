import { loadEnvFile } from "node:process";
import { MongoClient } from "mongodb";

try {
  loadEnvFile();
} catch {
  // .env is optional when variables are set elsewhere
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const MONGODB_URI = requireEnv("MONGODB_URI");
const DB_NAME = requireEnv("MONGODB_DB_NAME");

let client;
let db;

export async function connectDb() {
  if (db) {
    return db;
  }

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);

  const collectionName =
    process.env.MONGODB_LOCATIONS_COLLECTION ?? "locations";
  await db
    .collection(collectionName)
    .createIndex({ "address.coordinates": "2dsphere" });

  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not connected.");
  }

  return db;
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}

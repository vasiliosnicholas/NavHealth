import "dotenv/config";
import { MongoClient } from "mongodb";

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

import { getDb } from "../db.js";

const LOCATIONS_COLLECTION =
  process.env.MONGODB_LOCATIONS_COLLECTION ?? "locations";

export async function getInsurances(_req, res) {
  try {
    const insurances = await getDb()
      .collection(LOCATIONS_COLLECTION)
      .distinct("insurances");

    insurances.sort((a, b) => a.localeCompare(b));
    res.json(insurances);
  } catch (error) {
    console.error("Failed to load insurances:", error);
    res.status(500).json({ error: "Failed to load insurances" });
  }
}

import { getDb } from "../db.js";

const LOCATIONS_COLLECTION =
  process.env.MONGODB_LOCATIONS_COLLECTION ?? "locations";

async function getDistinctTags(collection) {
  const tags = await collection.distinct("tags");
  return tags.sort((a, b) => a.localeCompare(b));
}

async function getDistinctLocations(collection) {
  const results = await collection
    .aggregate([
      {
        $group: {
          _id: { city: "$address.city", state: "$address.state" },
        },
      },
      {
        $project: {
          _id: 0,
          value: {
            $concat: ["$_id.city", ", ", "$_id.state"],
          },
        },
      },
      { $sort: { value: 1 } },
    ])
    .toArray();

  return results.map((entry) => entry.value);
}

async function getDistinctNames(collection) {
  const names = await collection.distinct("name");
  return names.sort((a, b) => a.localeCompare(b));
}

export async function getCategories(_req, res) {
  try {
    const collection = getDb().collection(LOCATIONS_COLLECTION);
    const [services, location, name] = await Promise.all([
      getDistinctTags(collection),
      getDistinctLocations(collection),
      getDistinctNames(collection),
    ]);

    res.json({
      Services: services,
      Location: location,
      Name: name,
    });
  } catch (error) {
    console.error("Failed to load categories:", error);
    res.status(500).json({ error: "Failed to load categories" });
  }
}

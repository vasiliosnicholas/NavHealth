import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

const LOCATIONS_COLLECTION =
  process.env.MONGODB_LOCATIONS_COLLECTION ?? "locations";
const REVIEWS_COLLECTION =
  process.env.MONGODB_REVIEWS_COLLECTION ?? "reviews";

function decodeSearchString(value) {
  return value.replace(/_/g, " ");
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseQueryParams(query) {
  const lat = parseNumber(query.lat);
  const lon = parseNumber(query.lon);
  const maxDistanceRaw = parseNumber(query.maxDistance);
  const maxDistance =
    maxDistanceRaw === undefined
      ? 100
      : Math.min(100, Math.max(0, maxDistanceRaw));

  const insurances = query.insurances
    ? query.insurances.split(",").filter(Boolean)
    : [];

  const searchType = query.searchType?.trim().toLowerCase();
  const searchString = query.searchString?.trim();

  return {
    locationType: query.locationType?.trim() || "urgent_care",
    zip: query.zip?.trim() ?? "",
    lat,
    lon,
    maxDistance,
    insurances,
    sort: query.sort === "name" ? "name" : "distance",
    searchType: searchType || undefined,
    searchString: searchString || undefined,
  };
}

function applyRequestFilter(filter, searchType, searchString) {
  const decoded = decodeSearchString(searchString);

  switch (searchType) {
    case "services":
      filter.tags = decoded;
      break;
    case "name":
      filter.name = { $regex: decoded.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      break;
    case "location": {
      const [city, state] = decoded.split(",").map((part) => part.trim());
      if (city) {
        filter["address.city"] = city;
      }
      if (state) {
        filter["address.state"] = state;
      }
      break;
    }
    default:
      break;
  }
}

function buildMatchFilter(params) {
  const filter = { locationType: params.locationType };

  if (params.zip.length === 5) {
    filter["address.zipCode"] = params.zip;
  }

  if (params.insurances.length > 0) {
    filter.insurances = { $in: params.insurances };
  }

  if (params.searchType && params.searchString) {
    applyRequestFilter(filter, params.searchType, params.searchString);
  }

  return filter;
}

async function queryLocations(collection, params) {
  const matchFilter = buildMatchFilter(params);

  if (params.lat === undefined || params.lon === undefined) {
    let cursor = collection.find(matchFilter);
    if (params.sort === "name") {
      cursor = cursor.sort({ name: 1 });
    }
    return cursor.toArray();
  }

  const pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [params.lon, params.lat] },
        distanceField: "distanceMeters",
        maxDistance: params.maxDistance * 1609.34, // Converting miles to meters for mongo
        spherical: true,
        query: matchFilter,
      },
    },
  ];

  if (params.sort === "name") {
    pipeline.push({ $sort: { name: 1 } });
  }

  return collection.aggregate(pipeline).toArray();
}

export async function getLocations(req, res) {
  try {
    const params = parseQueryParams(req.query);
    const collection = getDb().collection(LOCATIONS_COLLECTION);
    const locations = await queryLocations(collection, params);
    res.json(locations);
  } catch (error) {
    console.error("Failed to load locations:", error);
    res.status(500).json({ error: "Failed to load locations" });
  }
}

export async function deleteLocation(req, res) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid location id" });
    }

    const objectId = new ObjectId(id);
    const db = getDb();
    const deleteResult = await db
      .collection(LOCATIONS_COLLECTION)
      .deleteOne({ _id: objectId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    await db
      .collection(REVIEWS_COLLECTION)
      .deleteMany({ business_id: objectId });

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete location:", error);
    res.status(500).json({ error: "Failed to delete location" });
  }
}

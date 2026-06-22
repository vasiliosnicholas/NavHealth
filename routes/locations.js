import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { geocodeAddress } from "../utils/geocodeMaps.js";

const LOCATIONS_COLLECTION =
  process.env.MONGODB_LOCATIONS_COLLECTION ?? "locations";

const VALID_LOCATION_TYPES = new Set([
  "urgent_care",
  "hospital_acute",
  "retail_clinic",
]);

function parseCommaSeparatedList(value) {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasCoordinateValue(value) {
  return (
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
  );
}

function validateLocationBody(body) {
  const errors = [];
  const name = body.name?.trim();
  const locationType = body.locationType?.trim();
  const street = body.address?.street?.trim();
  const city = body.address?.city?.trim();
  const state = body.address?.state?.trim();
  const zipCode = body.address?.zipCode?.trim();
  const coordinateInput = body.address?.coordinates?.coordinates;
  const hasLon = hasCoordinateValue(coordinateInput?.[0]);
  const hasLat = hasCoordinateValue(coordinateInput?.[1]);
  let parsedCoordinates = null;

  if (!name) {
    errors.push("Name is required");
  }
  if (!locationType || !VALID_LOCATION_TYPES.has(locationType)) {
    errors.push("A valid location type is required");
  }
  if (!street) {
    errors.push("Street is required");
  }
  if (!city) {
    errors.push("City is required");
  }
  if (!state) {
    errors.push("State is required");
  }
  if (!zipCode) {
    errors.push("Zip code is required");
  }
  if (hasLon && hasLat) {
    const lon = parseNumber(coordinateInput[0]);
    const lat = parseNumber(coordinateInput[1]);
    if (lon === undefined || lat === undefined) {
      errors.push(
        "Valid longitude and latitude are required when specifying coordinates",
      );
    } else {
      parsedCoordinates = { lon, lat };
    }
  }

  if (errors.length > 0) {
    return { errors: errors };
  }

  const address = { street, city, state, zipCode };
  if (parsedCoordinates) {
    address.coordinates = {
      type: "Point",
      coordinates: [parsedCoordinates.lon, parsedCoordinates.lat],
    };
  }

  return {
    location: {
      name,
      locationType,
      address,
      contactDetails: {
        phone: body.contactDetails?.phone?.trim() ?? "",
        email: body.contactDetails?.email?.trim() ?? "",
      },
      websiteLink: body.websiteLink?.trim() ?? "",
      tags: Array.isArray(body.tags)
        ? body.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : (body.tags ?? "").split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      insurances: Array.isArray(body.insurances)
        ? body.insurances.map((item) => String(item).trim()).filter(Boolean)
        : (body.insurances ?? "").split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    },
  };
}

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

function parseLocationId(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return ObjectId.createFromHexString(id);
}

async function tryGeoCodeIfNoCoordinates(location) {
  if (location.address.coordinates) {
    return null;
  }

  try {
    const geocoded = await geocodeAddress({
      street: location.address.street,
      city: location.address.city,
      state: location.address.state,
      zipCode: location.address.zipCode,
    });

    if (!geocoded) {
      return { status: 400, error: "Could not geocode the provided address" };
    }

    location.address.coordinates = {
      type: "Point",
      coordinates: [geocoded.lon, geocoded.lat],
    };
    return null;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return { status: 502, error: error.message };
  }
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

export async function createLocation(req, res) {
  try {
    const { errors, location } = validateLocationBody(req.body ?? {});
    if (errors) {
      return res.status(400).json({ error: errors.join(". ") });
    }

    const geocodeError = await tryGeoCodeIfNoCoordinates(location);
    if (geocodeError) {
      return res.status(geocodeError.status).json({ error: geocodeError.error });
    }

    const db = getDb();
    const insertResult = await db
      .collection(LOCATIONS_COLLECTION)
      .insertOne(location);

    res.status(201).json({ _id: insertResult.insertedId, ...location });
  } catch (error) {
    console.error("Failed to create location:", error);
    res.status(500).json({ error: "Failed to create location" });
  }
}

export async function getLocationById(req, res) {
  try {
    const objectId = parseLocationId(req.params.id);
    if (!objectId) {
      return res.status(400).json({ error: "Invalid location id" });
    }

    const location = await getDb()
      .collection(LOCATIONS_COLLECTION)
      .findOne({ _id: objectId });

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json(location);
  } catch (error) {
    console.error("Failed to load location:", error);
    res.status(500).json({ error: "Failed to load location" });
  }
}

export async function updateLocation(req, res) {
  try {
    const objectId = parseLocationId(req.params.id);
    if (!objectId) {
      return res.status(400).json({ error: "Invalid location id" });
    }

    const { errors, location } = validateLocationBody(req.body ?? {});
    if (errors) {
      return res.status(400).json({ error: errors.join(". ") });
    }

    const geocodeError = await tryGeoCodeIfNoCoordinates(location);
    if (geocodeError) {
      return res.status(geocodeError.status).json({ error: geocodeError.error });
    }

    const collection = getDb().collection(LOCATIONS_COLLECTION);
    const updateResult = await collection.updateOne(
      { _id: objectId },
      { $set: location },
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json({ _id: objectId, ...location });
  } catch (error) {
    console.error("Failed to update location:", error);
    res.status(500).json({ error: "Failed to update location" });
  }
}

export async function deleteLocation(req, res) {
  try {
    const objectId = parseLocationId(req.params.id);
    if (!objectId) {
      return res.status(400).json({ error: "Invalid location id" });
    }

    const db = getDb();
    const deleteResult = await db
      .collection(LOCATIONS_COLLECTION)
      .deleteOne({ _id: objectId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete location:", error);
    res.status(500).json({ error: "Failed to delete location" });
  }
}

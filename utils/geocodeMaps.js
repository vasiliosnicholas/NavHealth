const GEOCODE_API_ENDPOINT = "https://geocode.maps.co/search";

export async function geocodeAddress({ street, city, state, zipCode }) {
  const apiKey = process.env.GEOCODE_MAPS_API_KEY;
  if (!apiKey) {
    const error = new Error("Geocoding is not configured. Please manually enter the coordinates.");
    error.code = "GEOCODE_NOT_CONFIGURED";
    throw error;
  }

  const params = new URLSearchParams({
    street,
    city,
    state,
    postalcode: zipCode,
    country: "US",
    limit: "1",
    api_key: apiKey,
  });

  const response = await fetch(`${GEOCODE_API_ENDPOINT}?${params}`);
  if (!response.ok) {
    const error = new Error(`Geocode API returned ${response.status}`);
    error.code = "GEOCODE_API_ERROR";
    throw error;
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const lat = Number(results[0].lat);
  const lon = Number(results[0].lon);
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  return { lat, lon };
}

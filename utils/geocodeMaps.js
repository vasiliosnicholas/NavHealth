const GEOCODE_API_ENDPOINT = "https://geocode.maps.co/search";

function formatGeocodeLabel(result) {
  const address = result.address ?? {};
  const locality =
    address.suburb?.trim() ||
    address.neighbourhood?.trim() ||
    address.city?.trim() ||
    address.town?.trim() ||
    address.village?.trim();

  const stateAbbr = address["ISO3166-2-lvl4"]?.split("-")[1]?.trim();

  if (locality && stateAbbr) {
    return `${locality}, ${stateAbbr}`;
  }

  return null;
}

export async function geocodeAddress({ street, city, state, zipCode } = {}) {
  const apiKey = process.env.GEOCODE_MAPS_API_KEY;
  if (!apiKey) {
    const error = new Error("Geocoding is not configured. Please manually enter the coordinates.");
    error.code = "GEOCODE_NOT_CONFIGURED";
    throw error;
  }

  const params = new URLSearchParams({
    country: "US",
    limit: "1",
    api_key: apiKey,
  });

  if (street) {
    params.set("street", street);
  }
  if (city) {
    params.set("city", city);
  }
  if (state) {
    params.set("state", state);
  }
  if (zipCode) {
    params.set("postalcode", zipCode);
  }

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

  return {
    lat,
    lon,
    label: formatGeocodeLabel(results[0]),
  };
}

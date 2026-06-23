import SearchAndDropDownGenerator from "./SearchAndDropDownGenerator.js";
import getInitials from "./getInitials.js";

const FLOAT_PRECISION = 1;
const LOCATION_TYPE_LABELS = {
  urgent_care: "Urgent Care Center",
  hospital_acute: "Hospital",
  retail_clinic: "Retail Clinic",
};

// TODO: Figure out ip-location to set default search origin, use boston as fallback
const DEFAULT_SEARCH_ORIGIN = {
  lat: 42.3601,
  lon: -71.0589,
  label: "Boston, MA",
};

const URGENT_CARE_HOURS = "Mon-Sun: 8:00 AM - 8:00 PM";
const DEBOUNCE_MS = 300;
const CATEGORIES_URL = "/api/categories";
const CATEGORY_PREFIX = "by";
const SEARCH_TYPE_TO_CATEGORY = {
  services: "Services",
  name: "Name",
  location: "Location",
};

const REVIEWS_BASE_URL = "reviews.html";
const REVIEWS_METADATA_URL = "/api/Reviews/GetReviewsMetaData";

const isAdminMode =
  new URLSearchParams(window.location.search).get("admin") === "true";

const manageListingsNavItem = document.getElementById("manage-listings-nav");

function handleAdminNav() {
  if (!manageListingsNavItem) {
    return;
  }

  if (isAdminMode) {
    manageListingsNavItem.textContent = "Stop Managing Items";
    manageListingsNavItem.classList.add("active");
    manageListingsNavItem.href = "search.html";
  } else {
    manageListingsNavItem.textContent = "Manage Listings";
    manageListingsNavItem.classList.remove("active");
    manageListingsNavItem.href = "search.html?admin=true";
  }
}

let searchBarGen;

const state = {
  results: [],
  searchOrigin: { ...DEFAULT_SEARCH_ORIGIN },
  selectedInsurances: new Set(),
  selectedLocation: null,
  reviewsMetaData: [],
};

const elements = {
  resultsList: document.getElementById("results-list"),
  matchCount: document.getElementById("match-count"),
  noResults: document.getElementById("no-results"),
  searchForm: document.getElementById("search-form"),
  searchBar: document.getElementById("search-bar"),
  dataList: document.getElementById("searchDatalistOptions"),
  dropDown: document.getElementById("search-dropdown"),
  dropDownBtnName: document.getElementById("search-dropdown-btn-name"),
  sortSelect: document.getElementById("sort-select"),
  zipCode: document.getElementById("zip-code"),
  useLocationBtn: document.getElementById("use-location-btn"),
  locationStatus: document.getElementById("location-status"),
  distanceRange: document.getElementById("distance-range"),
  distanceLabel: document.getElementById("distance-label"),
  insuranceCheckboxes: document.getElementById("insurance-checkboxes"),
  resultsMap: document.getElementById("results-map"),
};

function decodeSearchString(value) {
  return value.replace(/_/g, " ");
}

function encodeSearchString(value) {
  return value.trim().replace(/ /g, "_");
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function formatAddress(address) {
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
}

function starIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
  <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
</svg>`;
}

function pinIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16">
  <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
</svg>`;
}

function clockIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock" viewBox="0 0 16 16">
  <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
</svg>`;
}

function phoneIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-telephone-fill" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z"/>
</svg>`;
}

function globeIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-globe" viewBox="0 0 16 16">
  <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472M3.82 11a13.7 13.7 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5zm6.853 3.472A7 7 0 0 0 13.745 12H11.91a9.3 9.3 0 0 1-.64 1.539 7 7 0 0 1-.597.933M8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855q.26-.487.468-1.068zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.7 13.7 0 0 1-.312 2.5m2.802-3.5a7 7 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7 7 0 0 0-3.072-2.472c.218.284.418.598.597.933M10.855 4a8 8 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4z"/>
</svg>`;
}

function getSelectedLocationType() {
  return (
    document.querySelector('input[name="location-type"]:checked')?.value ?? ""
  );
}

function buildLocationsQuery() {
  const params = new URLSearchParams();
  params.set("locationType", getSelectedLocationType());
  params.set("lat", String(state.searchOrigin.lat));
  params.set("lon", String(state.searchOrigin.lon));
  params.set("maxDistance", elements.distanceRange.value);
  params.set("sort", elements.sortSelect.value);

  const zip = elements.zipCode.value.trim();
  if (zip) {
    params.set("zip", zip);
  }

  if (state.selectedInsurances.size > 0) {
    params.set("insurances", [...state.selectedInsurances].join(","));
  }

  const searchString = encodeSearchString(elements.searchBar.value);
  if (searchString && searchBarGen) {
    params.set(
      "searchType",
      searchBarGen.getActiveSearchCategory().toLowerCase(),
    );
    params.set("searchString", searchString);
  }

  return params;
}

function buildMapEmbedUrl(lat, lon, { lonPad = 0.08, latPad = 0.05 } = {}) {
  const minLon = lon - lonPad;
  const maxLon = lon + lonPad;
  const minLat = lat - latPad;
  const maxLat = lat + latPad;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lon}`;
}

function getLocationCoordinates(location) {
  return location?.address?.coordinates?.coordinates ?? null;
}

function updateMap() {
  const selectedCoords = getLocationCoordinates(state.selectedLocation);
  if (selectedCoords) {
    const [lon, lat] = selectedCoords;
    elements.resultsMap.src = buildMapEmbedUrl(lat, lon, {
      lonPad: 0.03,
      latPad: 0.02,
    });
    return;
  }

  const { lat, lon } = state.searchOrigin;
  elements.resultsMap.src = buildMapEmbedUrl(lat, lon);
}

function updateSelectedCardStyles() {
  for (const card of elements.resultsList.children) {
    const isSelected =
      card.dataset.locationIndex !== undefined &&
      state.results[Number(card.dataset.locationIndex)] ===
      state.selectedLocation;
    card.classList.toggle("is-selected", isSelected);
  }
}

function handleResultCardSelect(index) {
  const location = state.results[index];
  if (!location) {
    return;
  }

  state.selectedLocation = location;
  updateSelectedCardStyles();

  if (getLocationCoordinates(location)) {
    return updateMap();
  }
  console.warn("Selected location has no coordinates; map unchanged.");
}

function renderAdminActions(location) {
  return `
    <button type="button" class="btn btn-danger btn-delete" data-location-id="${location._id}">Delete</button>
    <a class="btn btn-outline-secondary" href="add-location.html?edit=true&id=${location._id}">Edit</a>
  `;
}

function renderAdminContactBadges(location) {
  const phone = location.contactDetails?.phone ?? "";
  const website = location.websiteLink ?? "";

  return `
    <span class="result-badge">${phoneIcon()}${phone || "No phone listed"}</span>
    <span class="result-badge">${globeIcon()}${website || "No website listed"}</span>
  `;
}

function renderNormalActions(location, reviewsMetaData) {
  const phone = location.contactDetails?.phone ?? "";
  const website = location.websiteLink ?? "#";
  const reviewsFullUrl = `${REVIEWS_BASE_URL}?id=${reviewsMetaData._id}`;

  return `
    <a class="btn btn-call" href="tel:${phone.replace(/[^\d+]/g, "")}">
      ${phoneIcon()} Call
    </a>
    <a class="btn btn-primary" href="${website}" target="_blank" rel="noopener noreferrer">Visit Website</a>
    <a class="btn btn-secondary" href="${reviewsFullUrl}">View Reviews</a>
  `;
}

function renderResultCard(location, index) {
  const address = formatAddress(location.address);
  const category =
    LOCATION_TYPE_LABELS[location.locationType] ?? "Healthcare Location";
  const tags = location.tags;
  const website = location.websiteLink ?? "#";
  //TODO: Add hours to database
  const hours =
    location.locationType === "urgent_care" ? URGENT_CARE_HOURS : "Hours vary";
  const reviewsMetaData = state.reviewsMetaData
    ? state.reviewsMetaData[location._id]
    : undefined;
  const reviewsFullUrl = reviewsMetaData
    ? `${REVIEWS_BASE_URL}?id=${reviewsMetaData._id}`
    : null;
  const ratingBadge =
    !isAdminMode && reviewsMetaData
      ? `<a class="result-badge align-items-end" style="text-decoration:none" href="${reviewsFullUrl}">${starIcon()}Rating: ${parseFloat(reviewsMetaData.average_rating).toFixed(FLOAT_PRECISION)} <small> from ${reviewsMetaData.num_reviews} reviews</small></a>`
      : "";
  const adminContactBadges = isAdminMode
    ? renderAdminContactBadges(location)
    : "";
  const actionsHtml = isAdminMode
    ? renderAdminActions(location)
    : renderNormalActions(location, reviewsMetaData);
  const card = document.createElement("div");
  card.className = "result-card";
  card.dataset.locationIndex = String(index);
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.innerHTML = `
    <div class="result-thumb">${getInitials(location.name)}</div>
    <div class="result-body">
      <a class="result-title" href="${website}" target="_blank" rel="noopener noreferrer">${location.name}</a>
      <p class="result-category">${category}</p>
      <div class="result-badges">
        <span class="result-badge">${pinIcon()}${address}</span>
        <span class="result-badge">${clockIcon()}${hours}</span>
        ${adminContactBadges}
        ${ratingBadge}
      </div>
      <div class="result-tags">
        ${tags.map((tag) => `<span class="result-tag">${tag}</span>`).join("")}
      </div>
    </div>
    <div class="result-actions">
      ${actionsHtml}
    </div>
  `;
  return card;
}

function renderResults() {
  elements.resultsList.replaceChildren();
  state.results.forEach((location, index) => {
    elements.resultsList.appendChild(renderResultCard(location, index));
  });

  const countLabel = state.results.length === 1 ? "match" : "matches";
  elements.matchCount.textContent = `${state.results.length} ${countLabel} found`;
  elements.noResults.classList.toggle("d-none", state.results.length > 0);
  updateMap();
}

async function reviewsMetaDataQueryBuilder() {
  let urlParams = undefined;
  if ((await state.results.length) > 0) {
    urlParams = new URLSearchParams();
    urlParams.set(
      `business_ids`,
      (await state.results)
        .map((location) => location._id)
        .reduce((str, id) => `${str}_${id}`),
    );
  }
  return urlParams;
}

async function parseReviewsMetaData(reviewsMetaData) {
  state.reviewsMetaData = {};
  if (reviewsMetaData && Array.isArray(reviewsMetaData)) {
    reviewsMetaData.forEach(
      (reviewDocument, index) =>
        (state.reviewsMetaData[reviewDocument.business_id] = reviewDocument),
    );
  }
}

async function fetchAndRenderResults() {
  elements.matchCount.textContent = "Searching...";
  state.selectedLocation = null;

  try {
    const query = buildLocationsQuery();
    const response = await fetch(`/api/locations?${query}`);
    if (!response.ok) {
      throw new Error(`Failed to load locations (${response.status})`);
    }

    state.results = await response.json();
    const reviewsQuery = await reviewsMetaDataQueryBuilder();
    if (!isAdminMode && reviewsQuery) {
      const reviewsResponse = await fetch(
        `${REVIEWS_METADATA_URL}?${reviewsQuery}`,
      );

      if (!reviewsResponse.ok) {
        throw new Error(`Failed to load reviews (${reviewsResponse.status})`);
      }
      await parseReviewsMetaData(await reviewsResponse.json());
    } else {
      state.reviewsMetaData = {};
    }

    renderResults();
  } catch (error) {
    elements.matchCount.textContent = "Unable to load results";
    elements.noResults.textContent =
      "We could not load location data. Please refresh and try again.";
    elements.noResults.classList.remove("d-none");
    console.error(error);
  }
}

async function buildInsurancesList(debouncedFetch) {
  const response = await fetch("/api/insurances");
  if (!response.ok) {
    throw new Error(`Failed to load insurances (${response.status})`);
  }

  const insurancesList = await response.json();
  elements.insuranceCheckboxes.replaceChildren();

  insurancesList.forEach((insurance) => {
    const id = `insurance-${insurance.toLowerCase()}`;
    const insuranceItem = document.createElement("div");
    insuranceItem.className = "form-check";
    insuranceItem.innerHTML = `
      <input class="form-check-input" type="checkbox" value="${insurance}" id="${id}" />
      <label class="form-check-label" for="${id}">${insurance}</label>
    `;
    elements.insuranceCheckboxes.appendChild(insuranceItem);
  });

  elements.insuranceCheckboxes.addEventListener("change", (event) => {
    const checkbox = event.target;
    if (
      !(checkbox instanceof HTMLInputElement) ||
      checkbox.type !== "checkbox"
    ) {
      return;
    }

    if (checkbox.checked) {
      state.selectedInsurances.add(checkbox.value);
    } else {
      state.selectedInsurances.delete(checkbox.value);
    }

    debouncedFetch();
  });
}

function updateDistanceLabel() {
  const maxDistance = Number(elements.distanceRange.value);
  elements.distanceLabel.textContent = `0 – ${maxDistance} miles`;
}

function initSearchBar(categories, onCategoryChange) {
  const searchParams = new URLSearchParams(window.location.search);
  // We use SEARCH_TYPE_TO_CATEGORY to only allow our accepted search types
  const searchCategory =
    SEARCH_TYPE_TO_CATEGORY[
    searchParams.get("searchType")?.trim().toLowerCase()
    ] ?? "Name";
  const searchString = searchParams.get("searchString")?.trim();

  searchBarGen = SearchAndDropDownGenerator(
    elements.dropDown,
    elements.dropDownBtnName,
    elements.dataList,
    categories,
    searchCategory,
    CATEGORY_PREFIX,
    onCategoryChange,
  );

  elements.dropDownBtnName.textContent = `${CATEGORY_PREFIX} ${searchCategory}`;

  if (searchString) {
    elements.searchBar.value = decodeSearchString(searchString);
  }
}

function setOrigin(lat, lon, label) {
  state.searchOrigin = { lat, lon, label };
  elements.locationStatus.textContent = `Searching near ${label}.`;
  fetchAndRenderResults();
}

async function deleteLocation(locationId, index, locationName) {
  if (
    !window.confirm(
      `Delete "${locationName}" and all associated reviews? This cannot be undone.`,
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`/api/locations/${locationId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Failed to delete location (${response.status})`);
    }

    if (state.selectedLocation === state.results[index]) {
      state.selectedLocation = null;
    }
    state.results.splice(index, 1);
    renderResults();
  } catch (error) {
    window.alert("Unable to delete this location. Please try again.");
    console.error(error);
  }
}

function bindEvents(debouncedFetch) {
  elements.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    debouncedFetch();
  });
  elements.searchBar.addEventListener("input", debouncedFetch);

  elements.sortSelect.addEventListener("change", debouncedFetch);
  elements.zipCode.addEventListener("input", debouncedFetch);
  elements.distanceRange.addEventListener("input", () => {
    updateDistanceLabel();
    debouncedFetch();
  });

  document.querySelectorAll('input[name="location-type"]').forEach((input) => {
    input.addEventListener("change", debouncedFetch);
  });

  elements.resultsList.addEventListener("click", (event) => {
    const deleteBtn = event.target.closest(".btn-delete");
    if (deleteBtn) {
      event.stopPropagation();
      const card = deleteBtn.closest(".result-card");
      const index = Number(card?.dataset.locationIndex);
      const location = state.results[index];
      if (location) {
        deleteLocation(location._id, index, location.name);
      }
      return;
    }

    if (event.target.closest("a, button, input")) {
      return;
    }

    const card = event.target.closest(".result-card");
    if (!card?.dataset.locationIndex) {
      return;
    }

    handleResultCardSelect(Number(card.dataset.locationIndex));
  });

  elements.useLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      elements.locationStatus.textContent =
        "Geolocation is not supported in this browser.";
      return;
    }

    elements.locationStatus.textContent = "Detecting your location...";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin(
          position.coords.latitude,
          position.coords.longitude,
          "your current location",
        );
      },
      () => {
        elements.locationStatus.textContent =
          "Unable to detect location. Using Boston, MA instead.";
        state.searchOrigin = { ...DEFAULT_SEARCH_ORIGIN };
        debouncedFetch();
      },
    );
  });
}

async function init() {
  try {
    handleAdminNav();
    const debouncedFetch = debounce(fetchAndRenderResults, DEBOUNCE_MS);
    const categoriesResponse = await fetch(CATEGORIES_URL);
    if (!categoriesResponse.ok) {
      throw new Error(
        `Failed to load categories (${categoriesResponse.status})`,
      );
    }
    const categories = await categoriesResponse.json();
    initSearchBar(categories, debouncedFetch);
    await buildInsurancesList(debouncedFetch);
    updateDistanceLabel();
    bindEvents(debouncedFetch);
    elements.locationStatus.textContent = `Searching near ${state.searchOrigin.label}.`;
    if (isAdminMode) {
      elements.searchForm
        .querySelector(".btn-group")
        ?.insertAdjacentHTML(
          "afterend",
          '<span class="btn btn-warning text-dark admin-mode-badge">Admin</span>',
        );
    }
    await fetchAndRenderResults();
  } catch (error) {
    elements.matchCount.textContent = "Unable to load results";
    elements.noResults.textContent =
      "We could not load location data. Please refresh and try again.";
    elements.noResults.classList.remove("d-none");
    console.error(error);
  }
}

init();

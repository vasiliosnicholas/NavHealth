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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" data-name="Layer 1" viewBox="0 0 100 100" x="0px" y="0px"><title>icon</title><path d="M54.8,17.3l7.4,14.9a5.3,5.3,0,0,0,4,2.9l16.5,2.4a5.3,5.3,0,0,1,3,9.1L73.7,58.3A5.3,5.3,0,0,0,72.1,63L75,79.4A5.3,5.3,0,0,1,67.2,85L52.5,77.3a5.3,5.3,0,0,0-5,0L32.8,85A5.3,5.3,0,0,1,25,79.4L27.9,63a5.3,5.3,0,0,0-1.5-4.7L14.4,46.6a5.3,5.3,0,0,1,3-9.1l16.5-2.4a5.3,5.3,0,0,0,4-2.9l7.4-14.9A5.3,5.3,0,0,1,54.8,17.3Z"/></svg>`;
}

function pinIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/></svg>`;
}

function clockIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/></svg>`;
}

function phoneIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58z"/></svg>`;
}

function globeIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="18" height="18" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"><path d="M50,0.394C22.647,0.394,0.394,22.647,0.394,50S22.647,99.606,50,99.606S99.606,77.353,99.606,50S77.353,0.394,50,0.394z   M92.285,32.647c-3.745-4.079-8.764-7.578-14.688-10.245c-2.667-5.923-6.167-10.942-10.245-14.687  C78.624,12.356,87.644,21.376,92.285,32.647z M78.291,37.927c-4.423-0.836-9.29-1.456-14.364-1.854  c-0.398-5.074-1.018-9.941-1.854-14.364c4.518,0.794,8.756,2.025,12.604,3.613C76.266,29.171,77.497,33.41,78.291,37.927z   M79.67,27.708c7.236,3.972,12.518,9.364,14.796,15.498c-3.01-1.776-7.178-3.252-12.104-4.417  C81.758,34.901,80.849,31.188,79.67,27.708z M79.338,50c0,2.705-0.159,5.352-0.45,7.928c-4.227,0.876-9.142,1.602-14.7,2.068  C64.37,56.7,64.465,53.348,64.465,50c0-3.347-0.095-6.7-0.277-9.997c5.559,0.467,10.474,1.193,14.7,2.069  C79.179,44.648,79.338,47.295,79.338,50z M50,60.574c-3.602,0-7.027-0.108-10.276-0.299c-0.19-3.248-0.298-6.674-0.298-10.275  c0-3.602,0.108-7.027,0.298-10.276c3.249-0.19,6.674-0.298,10.276-0.298c3.602,0,7.027,0.108,10.275,0.298  c0.19,3.249,0.299,6.674,0.299,10.276c0,3.602-0.108,7.027-0.299,10.275C57.027,60.466,53.602,60.574,50,60.574z M59.996,64.188  c-0.467,5.559-1.192,10.474-2.068,14.7c-2.576,0.291-5.223,0.45-7.928,0.45s-5.352-0.159-7.928-0.45  c-0.875-4.227-1.602-9.142-2.069-14.7C43.3,64.37,46.653,64.465,50,64.465C53.348,64.465,56.7,64.37,59.996,64.188z M20.662,50  c0-2.705,0.16-5.352,0.45-7.928c4.227-0.875,9.142-1.602,14.7-2.069C35.63,43.3,35.535,46.653,35.535,50  c0,3.348,0.095,6.7,0.277,9.996c-5.559-0.467-10.473-1.192-14.7-2.068C20.822,55.352,20.662,52.705,20.662,50z M40.003,35.812  c0.467-5.559,1.193-10.473,2.069-14.7c2.576-0.291,5.223-0.45,7.928-0.45s5.352,0.16,7.928,0.45c0.876,4.227,1.602,9.142,2.068,14.7  C56.7,35.63,53.348,35.535,50,35.535C46.653,35.535,43.3,35.63,40.003,35.812z M61.21,17.638c-1.164-4.926-2.641-9.094-4.416-12.103  c6.134,2.277,11.525,7.559,15.498,14.795C68.812,19.152,65.1,18.242,61.21,17.638z M57.008,17.109  c-2.291-0.218-4.627-0.338-7.008-0.338c-2.38,0-4.717,0.12-7.008,0.338C45.114,8.91,47.808,4.284,50,4.284  S54.886,8.91,57.008,17.109z M43.207,5.535c-1.776,3.009-3.252,7.177-4.417,12.103c-3.889,0.604-7.601,1.514-11.081,2.692  C31.681,13.094,37.072,7.812,43.207,5.535z M37.927,21.709c-0.836,4.422-1.456,9.29-1.854,14.364  c-5.074,0.399-9.941,1.019-14.364,1.854c0.794-4.518,2.025-8.756,3.613-12.605C29.171,23.734,33.41,22.503,37.927,21.709z   M17.638,38.79c-4.926,1.165-9.094,2.641-12.103,4.417c2.277-6.134,7.559-11.526,14.795-15.498  C19.152,31.188,18.242,34.901,17.638,38.79z M17.109,42.992c-0.218,2.291-0.338,4.628-0.338,7.008c0,2.381,0.12,4.717,0.338,7.008  C8.91,54.886,4.284,52.192,4.284,50S8.91,45.114,17.109,42.992z M17.638,61.21c0.604,3.89,1.514,7.602,2.692,11.082  c-7.236-3.973-12.518-9.364-14.795-15.498C8.543,58.569,12.712,60.046,17.638,61.21z M21.709,62.073  c4.422,0.836,9.29,1.455,14.364,1.854c0.399,5.074,1.019,9.941,1.854,14.364c-4.518-0.794-8.756-2.025-12.605-3.613  C23.734,70.829,22.503,66.591,21.709,62.073z M38.79,82.362c1.165,4.926,2.641,9.094,4.417,12.104  c-6.134-2.278-11.526-7.56-15.498-14.796C31.188,80.849,34.901,81.758,38.79,82.362z M42.992,82.891  c2.291,0.218,4.628,0.338,7.008,0.338c2.381,0,4.717-0.12,7.008-0.338C54.886,91.09,52.192,95.716,50,95.716  S45.114,91.09,42.992,82.891z M56.794,94.466c1.775-3.01,3.252-7.178,4.416-12.104c3.89-0.604,7.602-1.514,11.082-2.692  C68.319,86.906,62.928,92.188,56.794,94.466z M62.073,78.291c0.836-4.423,1.455-9.29,1.854-14.364  c5.074-0.398,9.941-1.018,14.364-1.854c-0.794,4.518-2.025,8.756-3.613,12.604C70.829,76.266,66.591,77.497,62.073,78.291z   M82.362,61.21c4.926-1.164,9.094-2.641,12.104-4.416c-2.278,6.134-7.56,11.525-14.796,15.498  C80.849,68.812,81.758,65.1,82.362,61.21z M82.891,57.008c0.218-2.291,0.338-4.627,0.338-7.008c0-2.38-0.12-4.717-0.338-7.008  C91.09,45.114,95.716,47.808,95.716,50S91.09,54.886,82.891,57.008z M32.647,7.715c-4.079,3.745-7.578,8.764-10.245,14.687  c-5.923,2.667-10.942,6.167-14.687,10.245C12.356,21.376,21.376,12.356,32.647,7.715z M7.715,67.353  c3.745,4.078,8.764,7.578,14.687,10.245c2.667,5.924,6.167,10.942,10.245,14.688C21.376,87.644,12.356,78.624,7.715,67.353z   M67.353,92.285c4.078-3.745,7.578-8.764,10.245-14.688c5.924-2.667,10.942-6.167,14.688-10.245  C87.644,78.624,78.624,87.644,67.353,92.285z"/></svg>`;
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
      ? `<a class="result-badge align-items center" style="text-decoration:none" href="${reviewsFullUrl}">${starIcon()}Rating: ${parseFloat(reviewsMetaData.average_rating).toFixed(FLOAT_PRECISION)} <small> from ${reviewsMetaData.num_reviews} reviews</small></a>`
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

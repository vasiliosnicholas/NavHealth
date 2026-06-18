import SearchAndDropDownGenerator from "./SearchAndDropDownGenerator.js";

const LOCATION_TYPE_LABELS = {
  urgent_care: "Urgent Care Center",
  hospital_acute: "Hospital",
  hospital_nonacute: "Hospital",
  private_practice: "Private Practice",
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

let searchBarGen;

const state = {
  results: [],
  searchOrigin: { ...DEFAULT_SEARCH_ORIGIN },
  selectedInsurances: new Set(),
  selectedLocation: null,
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

function getInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initial1 = words[0] ? words[0].substring(0, 1) : '';
  const initial2 = words[1] ? words[1].substring(0, 1) : words[0] ? words[0].substring(1, 2) : '';
  return (initial1 + initial2).toUpperCase();
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
    params.set("searchType", searchBarGen.getActiveSearchCategory().toLowerCase());
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
      state.results[Number(card.dataset.locationIndex)] === state.selectedLocation;
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

function renderResultCard(location, index) {
  const address = formatAddress(location.address);
  const category =
    LOCATION_TYPE_LABELS[location.locationType] ?? "Healthcare Location";
  const tags = location.tags;
  const phone = location.contactDetails?.phone ?? "";
  const website = location.websiteLink ?? "#";
  //TODO: Add hours to database
  const hours =
    location.locationType === "urgent_care" ? URGENT_CARE_HOURS : "Hours vary";

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
      </div>
      <div class="result-tags">
        ${tags.map((tag) => `<span class="result-tag">${tag}</span>`).join("")}
      </div>
    </div>
    <div class="result-actions">
      <a class="btn btn-call" href="tel:${phone.replace(/[^\d+]/g, "")}">
        ${phoneIcon()} Call
      </a>
      <a class="btn btn-primary" href="${website}" target="_blank" rel="noopener noreferrer">Visit Website</a>
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
  const searchCategory = SEARCH_TYPE_TO_CATEGORY[searchParams.get("searchType")?.trim().toLowerCase()] ?? "Name";
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
          "your current location"
        );
      },
      () => {
        elements.locationStatus.textContent =
          "Unable to detect location. Using Boston, MA instead.";
        state.searchOrigin = { ...DEFAULT_SEARCH_ORIGIN };
        debouncedFetch();
      }
    );
  });
}

async function init() {
  try {
    const debouncedFetch = debounce(fetchAndRenderResults, DEBOUNCE_MS);
    const categoriesResponse = await fetch(CATEGORIES_URL);
    if (!categoriesResponse.ok) {
      throw new Error(`Failed to load categories (${categoriesResponse.status})`);
    }
    const categories = await categoriesResponse.json();
    initSearchBar(categories, debouncedFetch);
    await buildInsurancesList(debouncedFetch);
    updateDistanceLabel();
    bindEvents(debouncedFetch);
    elements.locationStatus.textContent = `Searching near ${state.searchOrigin.label}.`;
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

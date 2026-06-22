const form = document.getElementById("add-location-form");
const pageHeading = document.getElementById("page-heading");
const submitBtn = document.getElementById("submit-btn");
const cancelLink = document.getElementById("cancel-link");

const params = new URLSearchParams(window.location.search);
const isEditMode = params.get("edit") === "true";
const locationId = params.get("id")?.trim();

function buildLocationPayload(formData) {
  const address = {
    street: formData.get("street")?.trim(),
    city: formData.get("city")?.trim(),
    state: formData.get("state")?.trim(),
    zipCode: formData.get("zipCode")?.trim(),
  };

  const longitude = formData.get("longitude")?.trim();
  const latitude = formData.get("latitude")?.trim();
  if (longitude && latitude) {
    const lon = Number(longitude);
    const lat = Number(latitude);
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      address.coordinates = {
        type: "Point",
        coordinates: [lon, lat],
      };
    }
  }

  return {
    name: formData.get("name")?.trim(),
    locationType: formData.get("locationType")?.trim(),
    address,
    contactDetails: {
      phone: formData.get("phone")?.trim() ?? "",
      email: formData.get("email")?.trim() ?? "",
    },
    websiteLink: formData.get("websiteLink")?.trim() ?? "",
    tags: (formData.get("tags") ?? "").split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    insurances: (formData.get("insurances") ?? "").split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function populateForm(location) {
  form.elements.name.value = location.name ?? "";
  form.elements.locationType.value = location.locationType ?? "urgent_care";
  form.elements.street.value = location.address?.street ?? "";
  form.elements.city.value = location.address?.city ?? "";
  form.elements.state.value = location.address?.state ?? "";
  form.elements.zipCode.value = location.address?.zipCode ?? "";

  const coords = location.address?.coordinates?.coordinates;
  form.elements.longitude.value =
    coords?.[0] !== undefined ? String(coords[0]) : "";
  form.elements.latitude.value =
    coords?.[1] !== undefined ? String(coords[1]) : "";

  form.elements.phone.value = location.contactDetails?.phone ?? "";
  form.elements.email.value = location.contactDetails?.email ?? "";
  form.elements.websiteLink.value = location.websiteLink ?? "";
  form.elements.tags.value = (location.tags ?? []).join(", ");
  form.elements.insurances.value = (location.insurances ?? []).join(", ");
}

function setEditModeUi() {
  document.title = "Edit Location | NavHealth";
  pageHeading.textContent = "Edit Location";
  submitBtn.textContent = "Update Location";
  cancelLink.href = "search.html?admin=true";
}

function setFormPlaceholders(remove) {
  form.querySelectorAll("input, select, button").forEach((element) => {
    remove ? element.classList.remove("placeholder") : element.classList.add("placeholder");
  });
}

async function loadLocationForEdit() {
  setEditModeUi();
  setFormPlaceholders();

  try {
    const response = await fetch(`/api/locations/${locationId}`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? `Failed to load location (${response.status})`);
    }

    const location = await response.json();
    populateForm(location);
    setFormPlaceholders(true);
  } catch (error) {
    window.alert(error.message ?? "Unable to load this location.");
    console.error(error);
    window.location.href = "search.html?admin=true";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = buildLocationPayload(new FormData(form));
  const url = isEditMode && locationId
    ? `/api/locations/${locationId}`
    : "/api/locations";
  const method = isEditMode && locationId ? "PUT" : "POST";
  const failureMessage = `Unable to ${isEditMode ? "update" : "add"} this location. Please try again.`;

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        data.error ??
        `Failed to ${isEditMode ? "update" : "add"} location (${response.status})`,
      );
    }

    window.location.href = isEditMode ? "search.html?admin=true" : "search.html";
  } catch (error) {
    window.alert(error.message ?? failureMessage);
    console.error(error);
  }
});

if (isEditMode && locationId) {
  loadLocationForEdit();
} 

const form = document.getElementById("add-location-form");

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

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = buildLocationPayload(new FormData(form));

  try {
    const response = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? `Failed to add location (${response.status})`);
    }

    window.location.href = "search.html";
  } catch (error) {
    window.alert(error.message ?? "Unable to add this location. Please try again.");
    console.error(error);
  }
});

const descriptions = document.querySelectorAll(".description");

for (const description of descriptions) {
  description.classList.remove("placeholder");
  description.innerHTML = `Reviews for ${reviewsDocument.business_name}`;
}

for (const placeholderParentElement of document.querySelectorAll(
  ".placeholder-wave",
  ".placeholder-glow",
)) {
  placeholderParentElement.classList.remove(
    "placeholder-wave",
    "placeholder-glow",
  );
}

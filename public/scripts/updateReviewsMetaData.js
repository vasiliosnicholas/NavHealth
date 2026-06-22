const UPDATE_REVIEWS_METADATA_URL = "/api/Reviews/UpdateReviewsMetaData";

export default async function updateReviewsMetaData(
  id,
  operation,
  field,
  value,
) {
  const updateParams = new URLSearchParams();
  updateParams.set("id", id);
  updateParams.set("operation", operation);
  updateParams.set("field", field);
  updateParams.set("value", value);
  return await fetch(`${UPDATE_REVIEWS_METADATA_URL}?${updateParams}`, {
    method: "PUT",
  });
}

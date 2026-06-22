import DropDownGenerator from "./DropDownGenerator.js";

const descriptions = document.querySelectorAll(".description");
const reviewsParentElement = document.getElementById("reviews");
const postReviewButton = document.getElementById("post-review");
const thumbnail = document.querySelector(".result-thumb");
const ratingElement = document.getElementById("average-rating");
const dropDown = document.getElementById("dropdown-filter");
const dropDownBtnName = document.getElementById("filter-dropdown-btn-name");
const adminAnchor = document.querySelector(".admin");

const GET_REVIEWS_URL = "/api/Reviews/GetReviews";
const UPDATE_REVIEW_URL = "/api/Reviews/UpdateReview";
const UPDATE_REVIEWS_METADATA_URL = "/api/Reviews/UpdateReviewsMetaData";
const DELETE_REVIEW_URL = "/api/Reviews/DeleteReview";
const POST_REVIEW_URL = "post-review.html";
const REVIEWS_URL = "reviews.html";
const FLOAT_PRECISION = 1;

let reviewElements = {};

function getInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initial1 = words[0] ? words[0].substring(0, 1) : "";
  const initial2 = words[1]
    ? words[1].substring(0, 1)
    : words[0]
      ? words[0].substring(1, 2)
      : "";
  return (initial1 + initial2).toUpperCase();
}

function comparator(field, parser, flip = false) {
  return (r1, r2) => {
    const x1 = parser(r1[field]);
    const x2 = parser(r2[field]);
    if (x1 === x2) return 0;
    const comp = x1 > x2 ? -1 : 1;
    if (flip) return -1 * comp;
    return comp;
  };
}

function popularityComparator(flip = false) {
  return (r1, r2) => {
    const r1Sum = parseFloat(r1.num_likes) / parseFloat(r1.num_dislikes);
    const r2Sum = parseFloat(r2.num_likes) / parseFloat(r2.num_dislikes);
    if (r1Sum === r2Sum) return 0;
    const comp = r1Sum > r2Sum ? -1 : 1;
    if (flip) return -1 * comp;
    return comp;
  };
}

const categories = {
  "Most Recent": comparator("submitted_at", Date.parse),
  Oldest: comparator("submitted_at", Date.parse, true),
  "Highest Rating": comparator("rating", parseInt),
  "Lowest Rating": comparator("rating", parseInt, true),
  "Most Popular": popularityComparator(),
  "Least Popular": popularityComparator(true),
};
const eventListenerFunctionsToExecute = [sortReviews];
const executeEventListenerFunctionsOnInitialization = true;
const categoryPrefix = undefined;

let reviewsDocument = undefined;
let params = undefined;

export function toggleAction(action, reverseAction = undefined) {
  let hasRun = false;

  function reset() {
    if (hasRun && reverseAction) reverseAction();
    hasRun = false;
  }
  function run() {
    if (!hasRun) {
      action();
      hasRun = true;
      return true;
    }
    reset();
    return false;
  }
  return { reset, run };
}

async function getReviews() {
  params = new URLSearchParams(window.location.search);
  const response = await fetch(`${GET_REVIEWS_URL}?id=${params.get("id")}`);

  if (!response.ok) {
    console.error(
      "Failed to fetch reviews",
      response.status,
      response.statusText,
    );
    return false;
  }
  reviewsDocument = await response.json();
  postReviewButton.href = `${POST_REVIEW_URL}?${params}`;
  return true;
}

function likeButtonUpdate(likeButton, review) {
  likeButton.innerHTML = `Like | <small>${review.num_likes}</small>`;
}
function dislikeButtonUpdate(dislikeButton, review) {
  dislikeButton.innerHTML = `Dislike | <small>${review.num_dislikes}</small>`;
}

async function updateReview(review_id, operation, field, value) {
  const updateParams = new URLSearchParams();
  updateParams.set("review_id", review_id);
  updateParams.set("operation", operation);
  updateParams.set("field", field);
  updateParams.set("value", value);
  return await fetch(`${UPDATE_REVIEW_URL}?${updateParams}`, { method: "PUT" });
}

async function updateReviewsMetaData(id, operation, field, value) {
  const updateParams = new URLSearchParams();
  updateParams.set("id", id);
  updateParams.set("operation", operation);
  updateParams.set("field", field);
  updateParams.set("value", value);
  return await fetch(`${UPDATE_REVIEWS_METADATA_URL}?${updateParams}`, {
    method: "PUT",
  });
}

async function deleteReview(review_id) {
  const deleteParams = new URLSearchParams();
  deleteParams.set("review_id", review_id);
  return await fetch(`${DELETE_REVIEW_URL}?${deleteParams}`, {
    method: "DELETE",
  });
}

function genReviews() {
  reviewsDocument.average_rating = parseFloat(reviewsDocument.average_rating);
  ratingElement.innerHTML = `Overall Rating: ${reviewsDocument.average_rating.toFixed(FLOAT_PRECISION)}`;
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
  thumbnail.innerHTML = getInitials(reviewsDocument.business_name);
  thumbnail.classList.remove("placeholder");
  reviewsParentElement.innerHTML =
    reviewsDocument.reviews.length > 0 ? `` : "No reviews found";
  for (const review of reviewsDocument.reviews) {
    const reviewSection = document.createElement("section");
    reviewSection.className = `list-group-item`;
    reviewsParentElement.appendChild(reviewSection);
    reviewElements[review._id] = reviewSection;
    const reviewHeader = document.createElement("div");
    reviewHeader.className = `d-flex w-100 justify-content-between`;
    reviewSection.appendChild(reviewHeader);

    const reviewHeading = document.createElement("h3");
    reviewHeading.className = `mb-1`;
    reviewHeading.innerHTML = review.review_title;
    reviewHeader.appendChild(reviewHeading);

    const reviewRating = document.createElement("small");
    reviewRating.className = `mb-1`;
    reviewRating.innerHTML = `Rating: ${review.rating}`;
    reviewHeader.appendChild(reviewRating);

    const reviewBody = document.createElement("p");
    reviewBody.className = `mb-1`;
    reviewBody.innerHTML = review.review_body;
    reviewSection.appendChild(reviewBody);

    const reviewFooter = document.createElement("div");
    reviewFooter.className = `d-flex justify-content-between`;
    reviewSection.appendChild(reviewFooter);

    const reviewDate = document.createElement("small");
    reviewDate.className = "col";
    reviewDate.innerHTML = `Posted on: ${review.submitted_at}`;
    reviewFooter.appendChild(reviewDate);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "btn-group";
    buttonContainer.role = "group";
    reviewFooter.appendChild(buttonContainer);

    if (!params.has("admin")) {
      const likeButton = document.createElement("button");
      likeButton.className = "btn btn-primary";
      likeButton.type = "button";
      likeButtonUpdate(likeButton, review);
      buttonContainer.appendChild(likeButton);

      const likeAction = toggleAction(
        async () => {
          review.num_likes = parseInt(review.num_likes) + 1;
          likeButtonUpdate(likeButton, review);
          try {
            dislikeAction.reset();
            //TODO: Add Post request here.
            await updateReview(review._id, "$inc", "num_likes", 1);
          } catch (error) {
            console.error("Error processing like update", error);
          }
        },
        async () => {
          review.num_likes = parseInt(review.num_likes) - 1;
          likeButtonUpdate(likeButton, review);
          try {
            await updateReview(review._id, "$inc", "num_likes", -1);
          } catch (error) {
            console.error("Error processing like reversal update", error);
          }
        },
      );

      likeButton.addEventListener("click", () => {
        likeAction.run();
      });

      const dislikeButton = document.createElement("button");
      dislikeButton.className = "btn btn-secondary";
      dislikeButton.type = "button";
      dislikeButtonUpdate(dislikeButton, review);
      buttonContainer.appendChild(dislikeButton);

      const dislikeAction = toggleAction(
        async () => {
          review.num_dislikes = parseInt(review.num_dislikes) + 1;
          dislikeButtonUpdate(dislikeButton, review);
          try {
            likeAction.reset();
            await updateReview(review._id, "$inc", "num_dislikes", 1);
          } catch (error) {
            console.error("Error processing dislike update", error);
          }
        },
        async () => {
          review.num_dislikes = parseInt(review.num_dislikes) - 1;
          dislikeButtonUpdate(dislikeButton, review);
          try {
            await updateReview(review._id, "$inc", "num_dislikes", -1);
          } catch (error) {
            console.error("Error processing like reversal update", error);
          }
        },
      );
      dislikeButton.addEventListener("click", () => {
        dislikeAction.run();
      });
    } else {
      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-danger";
      deleteButton.type = "button";
      deleteButton.innerHTML = "Delete Review";
      buttonContainer.appendChild(deleteButton);
      deleteButton.addEventListener("click", async () => {
        const rating = review.rating;
        reviewsDocument.average_rating =
          (reviewsDocument.average_rating * reviewsDocument.num_reviews -
            rating) /
          --reviewsDocument.num_reviews;
        await updateReviewsMetaData(
          reviewsDocument._id,
          "$set",
          "average_rating",
          reviewsDocument.average_rating,
        );
        await updateReviewsMetaData(
          reviewsDocument._id,
          "$inc",
          "num_reviews",
          -1,
        );
        ratingElement.innerHTML = `Overall Rating: ${reviewsDocument.average_rating.toFixed(FLOAT_PRECISION)}`;
        await deleteReview(review._id);
        delete reviewsDocument[review._id];
        delete reviewSection.remove();
      });
    }
  }
}

function handleAdmin() {
  if (params.has("admin")) {
    adminAnchor.innerHTML = "Stop Managing Reviews";
    adminAnchor.classList.add("active");
    adminAnchor.href = `${REVIEWS_URL}?id=${params.get("id")}`;
  } else {
    adminAnchor.href = `${REVIEWS_URL}?id=${params.get("id")}&admin`;
  }
}

async function genElements() {
  if (await getReviews()) {
    genReviews();
    handleAdmin();
    const sort = DropDownGenerator(
      dropDown,
      dropDownBtnName,
      Object.keys(categories),
      Object.keys(categories)[0],
      eventListenerFunctionsToExecute,
      executeEventListenerFunctionsOnInitialization,
      categoryPrefix,
    );
  } else {
    reviewsParentElement.innerHTML =
      "Error: Incorrect query or failed to connect to database";
  }
}

function updateReviews() {
  for (const review of reviewsDocument.reviews) {
    reviewsParentElement.appendChild(reviewElements[review._id]);
  }
}

async function sortReviews(sortKey) {
  if (reviewsDocument.reviews.length > 0)
    reviewsDocument.reviews.sort(categories[sortKey]);
  updateReviews();
}

await genElements();

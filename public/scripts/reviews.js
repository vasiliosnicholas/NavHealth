import DropDownGenerator from "./DropDownGenerator.js";
import getInitials from "./getInitials.js";
import updateReviewsMetaData from "./updateReviewsMetaData.js";

const descriptions = document.querySelectorAll(".description");
const reviewsParentElement = document.getElementById("reviews");
const postReviewButton = document.getElementById("post-review");
const thumbnail = document.querySelector(".result-thumb");
const ratingElement = document.getElementById("average-rating");
const dropDown = document.getElementById("dropdown-filter");
const dropDownBtnName = document.getElementById("filter-dropdown-btn-name");
const adminAnchor = document.querySelector(".admin");
const adminModeBadge = document.querySelector(".admin-mode-badge");

const GET_REVIEWS_URL = "/api/Reviews/GetReviews";
const UPDATE_REVIEW_URL = "/api/Reviews/UpdateReview";
const DELETE_REVIEW_URL = "/api/Reviews/DeleteReview";
const POST_REVIEW_URL = "post-review.html";
const REVIEWS_URL = "reviews.html";
const FLOAT_PRECISION = 1;

let reviewElements = {};

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
    const r1Ratio =
      parseFloat(r1.num_dislikes) > 0
        ? parseFloat(r1.num_likes) / parseFloat(r1.num_dislikes)
        : parseFloat(r1.num_likes);
    const r2Ratio =
      parseFloat(r2.num_dislikes) > 0
        ? parseFloat(r2.num_likes) / parseFloat(r2.num_dislikes)
        : parseFloat(r2.num_likes);
    if (r1Ratio === r2Ratio) return 0;
    const comp = r1Ratio > r2Ratio ? -1 : 1;
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
  const response = await fetch(`${GET_REVIEWS_URL}?${params}`);

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
  if ((await reviewsDocument) == null) return false;
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

async function deleteReview(review_id) {
  const deleteParams = new URLSearchParams();
  deleteParams.set("review_id", review_id);
  return await fetch(`${DELETE_REVIEW_URL}?${deleteParams}`, {
    method: "DELETE",
  });
}

function genReviews() {
  reviewsDocument.average_rating = parseFloat(reviewsDocument.average_rating);
  ratingElement.innerHTML = `Overall Rating: ${reviewsDocument.num_reviews > 0 ? reviewsDocument.average_rating.toFixed(FLOAT_PRECISION) : "Unrated"}`;
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
  if (reviewsDocument.reviews.length <= 0) {
    reviewsParentElement.classList.add("text-center");
  }
  for (const review of reviewsDocument.reviews) {
    const reviewSection = document.createElement("section");
    reviewSection.className = `list-group-item`;
    reviewsParentElement.appendChild(reviewSection);
    reviewElements[review._id] = reviewSection;
    const reviewHeader = document.createElement("div");
    reviewHeader.className = `container-fluids p-0 b-0`;
    reviewSection.appendChild(reviewHeader);

    const firstRow = document.createElement("div");
    firstRow.className = `w-100 row justify-content-between align-items-center`;
    reviewHeader.appendChild(firstRow);

    const reviewHeading = document.createElement("h3");
    reviewHeading.className = `mb-1 col`;
    reviewHeading.innerHTML = review.review_title;
    firstRow.appendChild(reviewHeading);
    const userNameThumbnail = document.createElement("div");
    userNameThumbnail.className = `mb-1 col-1 result-thumb h-25 w-auto`;
    userNameThumbnail.innerHTML = getInitials(review.reviewer_username);
    firstRow.appendChild(userNameThumbnail);

    const secondRow = document.createElement("div");
    secondRow.className = `d-flex w-100 mx-3 row container-fluid justify-content-between align-items-center`;
    reviewHeader.appendChild(secondRow);

    const reviewRating = document.createElement("small");
    reviewRating.className = `mb-1 col-8 `;
    reviewRating.innerHTML = `Rating: ${review.rating}`;
    secondRow.appendChild(reviewRating);

    const userName = document.createElement("small");
    userName.className = `mb-1 mx-1 col text-end`;
    userName.innerHTML = review.reviewer_username;
    secondRow.appendChild(userName);

    const reviewBody = document.createElement("p");
    reviewBody.className = `mb-1`;
    reviewBody.innerHTML = review.review_body;
    reviewSection.appendChild(reviewBody);

    const reviewFooter = document.createElement("div");
    reviewFooter.className = `d-flex justify-content-between align-items-center`;
    reviewSection.appendChild(reviewFooter);

    const reviewDate = document.createElement("small");
    reviewDate.className = "col";
    reviewDate.innerHTML = `Posted on: ${review.submitted_at}`;
    reviewFooter.appendChild(reviewDate);
    const submittedDate = document.createElement("small");
    submittedDate.className = "col";
    submittedDate.innerHTML = `Visit date: ${review.visit_date}`;
    reviewFooter.appendChild(submittedDate);
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
          reviewsDocument.num_reviews > 1
            ? (reviewsDocument.average_rating * reviewsDocument.num_reviews -
                rating) /
              --reviewsDocument.num_reviews
            : --reviewsDocument.num_reviews;
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
        ratingElement.innerHTML = `Overall Rating: ${reviewsDocument.num_reviews > 0 ? reviewsDocument.average_rating.toFixed(FLOAT_PRECISION) : "unrated"}`;
        console.log(reviewsDocument.num_reviews);
        if (reviewsDocument.num_reviews <= 0) {
          reviewsParentElement.innerHTML = "All reviews deleted!";
          reviewsParentElement.classList.add("text-center");
        }
        await deleteReview(review._id);
        delete reviewsDocument[review._id];
        delete reviewSection.remove();
      });
    }
  }
}

function genQueryParam() {
  return params.has("id")
    ? `?id=${params.get("id")}`
    : `?business_id=${params.get("business_id")}`;
}

function handleAdmin() {
  if (params.has("admin")) {
    adminModeBadge.classList.remove("d-none");
    adminAnchor.innerHTML = "Stop Managing Reviews";
    adminAnchor.classList.add("active");
    adminAnchor.href = `${REVIEWS_URL}${genQueryParam()}`;
  } else {
    adminAnchor.href = `${REVIEWS_URL}${genQueryParam()}&admin`;
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

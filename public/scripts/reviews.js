import DropDownGenerator from "./DropDownGenerator.js";

const descriptions = document.querySelectorAll(".description");
const reviewsParentElement = document.getElementById("reviews");
const postReviewButton = document.getElementById("post-review");

const GET_REVIEWS_URL = "/api/Reviews/GetReviews";
const POST_REVIEW_URL = "post-review.html";

const dropDown = document.getElementById("dropdown-filter");
const dropDownBtnName = document.getElementById("filter-dropdown-btn-name");

let htmlElements = {};

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
  const response = await fetch(`${GET_REVIEWS_URL}?${params}`);

  if (!response.ok) {
    console.error(
      "Failed to fetch reviews",
      response.status,
      response.statusText,
    );
  }
  reviewsDocument = await response.json();
  postReviewButton.href = `${POST_REVIEW_URL}?${params}`;
}

function likeButtonUpdate(likeButton, review) {
  likeButton.innerHTML = `Like | <small>${review.num_likes}</small>`;
}
function dislikeButtonUpdate(dislikeButton, review) {
  dislikeButton.innerHTML = `Dislike | <small>${review.num_dislikes}</small>`;
}

function genReviews() {
  reviewsParentElement.innerHTML = ``;
  for (const review of reviewsDocument.reviews) {
    const reviewSection = document.createElement("section");
    reviewSection.className = `list-group-item`;
    reviewsParentElement.appendChild(reviewSection);
    htmlElements[review._id] = reviewSection;
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

    const likeButton = document.createElement("button");
    likeButton.className = "btn btn-primary";
    likeButton.type = "button";
    likeButtonUpdate(likeButton, review);
    buttonContainer.appendChild(likeButton);

    const likeAction = toggleAction(
      () => {
        review.num_likes = parseInt(review.num_likes) + 1;
        likeButtonUpdate(likeButton, review);
        try {
          dislikeAction.reset();
          //TODO: Add Post request here.
        } catch (error) {
          console.error("Error processing like update", error);
        }
      },
      () => {
        review.num_likes = parseInt(review.num_likes) - 1;
        likeButtonUpdate(likeButton, review);
        try {
          //TODO: Add Post request here.
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
      () => {
        review.num_dislikes = parseInt(review.num_dislikes) + 1;
        dislikeButtonUpdate(dislikeButton, review);
        try {
          likeAction.reset();
          //TODO: Add Post request here.
        } catch (error) {
          console.error("Error processing dislike update", error);
        }
      },
      () => {
        review.num_dislikes = parseInt(review.num_dislikes) - 1;
        dislikeButtonUpdate(dislikeButton, review);
        try {
          //TODO: Add Post request here.
        } catch (error) {
          console.error("Error processing like reversal update", error);
        }
      },
    );
    dislikeButton.addEventListener("click", () => {
      dislikeAction.run();
    });
  }
}

function updateReviews() {
  for (const review of reviewsDocument.reviews) {
    reviewsParentElement.appendChild(htmlElements[review._id]);
  }
}

async function sortReviews(sortKey) {
  if (reviewsDocument.reviews.length > 0)
    reviewsDocument.reviews.sort(categories[sortKey]);
  updateReviews();
}

await getReviews();

genReviews();

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

document.getElementById("average-rating").innerHTML =
  `Overall Rating: ${parseFloat(reviewsDocument.average_rating).toFixed(1)}`;

const sort = DropDownGenerator(
  dropDown,
  dropDownBtnName,
  Object.keys(categories),
  Object.keys(categories)[0],
  eventListenerFunctionsToExecute,
  executeEventListenerFunctionsOnInitialization,
  categoryPrefix,
);

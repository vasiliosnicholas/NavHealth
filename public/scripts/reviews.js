import DropDownGenerator from "./DropDownGenerator.js";

const descriptions = document.querySelectorAll(".description");
const reviewsParentElement = document.getElementById("reviews");

const GET_REVIEWS_URL = "/api/Reviews/GetReviews";

const dropDown = document.getElementById("dropdown-filter");
const dropDownBtnName = document.getElementById("filter-dropdown-btn-name");

const categories = [
  "Most Recent",
  "Oldest",
  "Highest Rating",
  "Lowest Rating",
  "Most Popular",
  "Least Popular",
];
const eventListenerFunctionsToExecute = undefined;
const executeEventListenerFunctionsOnInitialization = false;
const categoryPrefix = undefined;

let reviewsDocument = undefined;

async function getReviews() {
  const params = new URLSearchParams(window.location.search);
  const response = await fetch(
    `${GET_REVIEWS_URL}?${new URLSearchParams(window.location.search)}`,
  );

  if (!response.ok) {
    console.error(
      "Failed to fetch reviews",
      response.status,
      response.statusText,
    );
  }
  reviewsDocument = await response.json();
}

function genReviews() {
  reviewsParentElement.innerHTML = ``;
  for (const review of reviewsDocument.reviews) {
    const reviewSection = document.createElement("section");
    reviewSection.className = `list-group-item`;
    reviewsParentElement.appendChild(reviewSection);

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
    likeButton.innerHTML = `Like | <small>${review.num_likes}</small>`;
    buttonContainer.appendChild(likeButton);

    const dislikeButton = document.createElement("button");
    dislikeButton.className = "btn btn-secondary";
    dislikeButton.type = "button";
    dislikeButton.innerHTML = `Disike | <small>${review.num_dislikes}</small>`;
    buttonContainer.appendChild(dislikeButton);
  }
}

await getReviews();

for (const description of descriptions) {
  description.classList.remove("placeholder");
  description.innerHTML = `Reviews for ${reviewsDocument.business_name}`;
}

document.getElementById("average-rating").innerHTML =
  `Overall Rating: ${parseFloat(reviewsDocument.average_rating).toFixed(1)}`;

genReviews();

const filter = DropDownGenerator(
  dropDown,
  dropDownBtnName,
  categories,
  categories[0],
  eventListenerFunctionsToExecute,
  executeEventListenerFunctionsOnInitialization,
  categoryPrefix,
);

import getInitials from "./getInitials.js";
import updateReviewsMetaData from "./updateReviewsMetaData.js";

const REVIEWS_URL = "reviews.html";
const REVIEWS_METADATA_URL = "/api/Reviews/GetReviewsMetaData";
const CREATE_REVIEW_URL = "/api/Reviews/CreateReview";
const WAIT_TIME = 10000;
const descriptions = document.querySelectorAll(".description");
const cancelBtn = document.getElementById("cancel");
const form = document.getElementById("review-form");
const thumbnail = document.querySelector(".result-thumb");
const urlParams = new URLSearchParams(window.location.search);
const emailInput = document.getElementById("email-input");
const usernameInput = document.getElementById("username-input");
const titleInput = document.getElementById("review-title");
const dateInput = document.getElementById("visit-date");
const ratingSlider = document.getElementById("rating");
const ratingOutput = document.getElementById("rating-output");
const bodyInput = document.getElementById("review-body");

cancelBtn.href += window.location.search;

ratingOutput.textContent = ratingSlider.value;

let metadata = null;
console.log();
ratingSlider.addEventListener("input", () => {
  ratingOutput.textContent = ratingSlider.value;
});

async function getReviewsMetaData() {
  const result = await fetch(`${REVIEWS_METADATA_URL}?${urlParams}`);
  if (result.ok) return await result.json();
  return null;
}

async function submitReview() {
  const submissionDate = new Date();
  const review = {
    _id: null,
    review_title: titleInput.value,
    review_body: bodyInput.value,
    rating: parseInt(ratingSlider.value),
    reviewer_username: usernameInput.value,
    reviewer_email: emailInput.value,
    visit_date: dateInput.value,
    submitted_at: `${submissionDate.getMonth() + 1}/${submissionDate.getDate()}/${submissionDate.getFullYear()}`,
    num_likes: 0,
    num_dislikes: 0,
  };

  return await fetch(`${CREATE_REVIEW_URL}?${urlParams}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(review),
  });
}

async function genElements() {
  metadata = await getReviewsMetaData();
  if (metadata !== null && metadata.length > 0) {
    metadata = metadata[0];
    thumbnail.innerHTML = getInitials(metadata.business_name);
    for (const description of descriptions) {
      description.classList.remove("placeholder");
      description.innerHTML = `Add a Review for ${metadata.business_name}`;
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

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await submitReview();
        await updateReviewsMetaData(
          metadata._id,
          "$set",
          "average_rating",
          (metadata.average_rating * metadata.num_reviews++ +
            parseInt(ratingSlider.value)) /
            metadata.num_reviews,
        );
        await updateReviewsMetaData(metadata._id, "$inc", "num_reviews", 1);
        form.innerHTML = `<p class="text-center">Thank you for submitting a review!<br>
  You will be redirected back to the reviews page in ${WAIT_TIME / 1000} seconds.</p>`;
        setTimeout(() => {
          window.location.href = `${REVIEWS_URL}${window.location.search}`;
        }, WAIT_TIME);
      } catch (error) {
        console.error("Error submitting review:", error);
        form.innerHTML = `<p class="text-center">Submission Unsucessful!<br>
  Page will reload in ${WAIT_TIME / 1000} seconds.</p>`;
        setTimeout(() => {
          window.location.reload();
        }, WAIT_TIME);
      }
    });
  } else {
    form.innerHTML = `Database error`;
  }
}

genElements();

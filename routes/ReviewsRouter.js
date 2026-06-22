import express from "express";
import {
  getReviews,
  getReviewsMetaData,
  updateReview,
} from "../data/reviewsCollectionOperations.js";

const reviewsRouter = express.Router();

const UPDATE_OPERATIONS = new Set(["$inc", "$set"]);

reviewsRouter.get("/GetReviews/", async (req, res) => {
  const business_id = req.query.business_id;
  const review_id = req.query.id;
  if (!business_id && !review_id) {
    /**
     * TODO: using HTTP respone code for not implemented for now.
     * Don't want to accept query to get all documents in reviews collection,
     * only for a specific business.
     */
    res.status(501).send("You must request reviews for a specific business!");
  } else {
    const query = business_id
      ? { business_id: business_id }
      : { _id: review_id };
    try {
      const reviews = await getReviews(query);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews: ", error);
      res.status(500).send("Error fetching reviews!");
    }
  }
});

reviewsRouter.get("/GetReviewsMetaData/", async (req, res) => {
  const business_ids = req.query.business_ids;
  if (!business_ids) {
    /**
     * TODO: using HTTP respone code for not implemented for now.
     * Don't want to accept query to get all documents in reviews collection,
     * only for a specific business.
     */
    res.status(501).send("You must request reviews for a specific business!");
  } else {
    const query = { business_id: { $in: business_ids.split("_") } };
    try {
      const reviews = await getReviewsMetaData(query);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews metadata: ", error);
      res.status(500).send("Error fetching reviews metadata!");
    }
  }
});

reviewsRouter.post("/CreateReview/", async (req, res) => {});

reviewsRouter.delete("/DeleteReviews/", async (req, res) => {});

reviewsRouter.delete("/DeleteReview/", async (req, res) => {});

reviewsRouter.put("/UpdateReview/", async (req, res) => {
  console.log("reached");
  const review_id = req.query.review_id;
  const field = req.query.field;
  const operation = req.query.operation;
  let value = req.query.value;
  if (!review_id || !field || !operation || !value) {
    res
      .status(500)
      .send(
        "You must pass a review id, an operation, a field and a value to update the field to!",
      );
    console.error("fail");
  } else if (!UPDATE_OPERATIONS.has(operation)) {
    res
      .status(500)
      .send(
        "Operation must be one of the following operations:",
        UPDATE_OPERATIONS,
      );
    console.error("fail 2", operation);
  } else {
    try {
      if (operation === "$inc") {
        value = parseFloat(value);
      }
      const query = { "reviews._id": review_id };
      const update = {
        [operation]: { [`reviews.$.${field}`]: value },
      };
      updateReview(query, update);
      res.send(`${field} for review ${review_id} updated`);
    } catch (error) {
      console.error("Error updating review field: ", error);
    }
  }
});

export default reviewsRouter;

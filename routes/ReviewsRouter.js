import express from "express";
import {
  deleteReview,
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
  const id = req.query.id;
  if (!business_ids && !id) {
    /**
     * TODO: using HTTP respone code for not implemented for now.
     * Don't want to accept query to get all documents in reviews collection,
     * only for a specific business.
     */
    res
      .status(501)
      .send("You must request reviews metadata for a specific business!");
  } else {
    const query = business_ids
      ? { business_id: { $in: business_ids.split("_") } }
      : { _id: id };
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

reviewsRouter.post("/CreateNewReviewsDoucment", async (req, res) => {});

reviewsRouter.delete("/DeleteReviewsDocument/", async (req, res) => {});

reviewsRouter.delete("/DeleteReview/", async (req, res) => {
  const review_id = req.query.review_id;
  if (!review_id) {
    res.status(500).send("You must pass a review id to delete a review!");
  }
  const query = { "reviews._id": review_id };
  const deleteQuery = { _id: review_id };
  try {
    deleteReview(query, deleteQuery);
    res.send(`Deleted ${review_id}`);
  } catch (error) {
    console.error(`Error deleting review ${review_id}:`, error);
    res.error(500).send(`Error deleting review ${review_id}:`, error);
  }
});

reviewsRouter.put("/UpdateReviewsMetaData/", async (req, res) => {
  const business_id = req.query.business_id;
  const review_id = req.query.id;
  const field = req.query.field;
  const operation = req.query.operation;
  let value = req.query.value;
  if ((!business_id && !review_id) || !field || !operation || !value) {
    /**
     * TODO: using HTTP respone code for not implemented for now.
     * Don't want to accept query to get all documents in reviews collection,
     * only for a specific business.
     */
    res.status(501).send("You must request reviews for a specific business!");
  } else if (!UPDATE_OPERATIONS.has(operation)) {
    res
      .status(500)
      .send(
        "Operation must be one of the following operations:",
        UPDATE_OPERATIONS,
      );
  } else {
    try {
      if (operation === "$inc" || operation === "$set") {
        value = parseFloat(value);
      }
      const query = business_id
        ? { business_id: business_id }
        : { _id: review_id };

      const update = { [operation]: { [field]: value } };

      updateReview(query, update);
      res.send(`Updated ${field} for ${review_id}`);
    } catch (error) {
      res.error(500).send(`Error updating ${field} for ${review_id}:`, error);
      console.error(`Error updating ${field} for ${review_id}:`, error);
    }
  }
});

reviewsRouter.put("/UpdateReview/", async (req, res) => {
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
  } else if (!UPDATE_OPERATIONS.has(operation)) {
    res
      .status(500)
      .send(
        "Operation must be one of the following operations:",
        UPDATE_OPERATIONS,
      );
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
      res.error(500).send(`Error updating ${field} for ${review_id}:`, error);
      console.error(`Error updating ${field} for ${review_id}:`, error);
    }
  }
});

export default reviewsRouter;

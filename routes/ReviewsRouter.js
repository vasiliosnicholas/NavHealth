import express from "express";
import { getReviews, getReviewsMetaData } from "../data/reviewsCollectionOperations.js";

const reviewsRouter = express.Router();

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
  }
  const query = business_id ? { business_id: business_id } : { _id: review_id };
  try {
    const reviews = await getReviews(query);
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews: ", error);
    res.status(500).send("Error fetching reviews!");
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
  }
  const query = { business_id: { $in: business_ids.split("_") } };
  try {
    const reviews = await getReviewsMetaData(query);
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews metadata: ", error);
    res.status(500).send("Error fetching reviews metadata!");
  }
});

reviewsRouter.post("/CreateReview/", async (req, res) => {});

reviewsRouter.delete("/DeleteReview/", async (req, res) => {});

reviewsRouter.put("/UpdateReview/", async (req, res) => {});

export default reviewsRouter;

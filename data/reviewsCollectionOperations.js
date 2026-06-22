import { isConnected, connectDb, getDb } from "../db.js";
import { ObjectId } from "mongodb";

process.loadEnvFile();

const reviewsCollectionName =
  process.env.MONGODB_REVIEWS_COLLECTION || "reviews";

if (!isConnected()) {
  await connectDb();
}

const reviewsCollection = getDb().collection(reviewsCollectionName);

function parseObjectId(query) {
  for (const key of Object.keys(query)) {
    if (key.includes("_id")) {
      if (typeof query[key] == "object") {
        const idArray = Object.values(query[key])[0];
        for (let i = 0; i < idArray.length; i++) {
          idArray[i] = new ObjectId(idArray[i]);
        }
      } else {
        query[key] = new ObjectId(query[key]);
      }
    }
  }
}

export function getReviews(query) {
  parseObjectId(query);
  return reviewsCollection.findOne(query);
}

export function getReviewsMetaData(query) {
  parseObjectId(query);
  return reviewsCollection
    .find(query)
    .project({
      business_id: 1,
      business_name: 1,
      num_reviews: 1,
      average_rating: 1,
    })
    .toArray();
}

export function createReviewsDocument(document) {
  parseObjectId(document);
  reviewsCollection.insertOne(document);
}

export function deleteReviewsDocument(query) {
  parseObjectId(query);
  reviewsCollection.deleteOne(query);
}

export function updateReview(query, update, options = undefined) {
  parseObjectId(query);
  reviewsCollection.updateOne(query, update, options);
}

export function deleteReview(query, deleteQuery) {
  parseObjectId(query);
  parseObjectId(deleteQuery);

  reviewsCollection.updateOne(query, { $pull: { reviews: deleteQuery } });
}

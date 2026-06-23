import { isConnected, connectDb, getDb } from "../db.js";
import { ObjectId } from "mongodb";

process.loadEnvFile();

const reviewsCollectionName =
  process.env.MONGODB_REVIEWS_COLLECTION || "reviews";

if (!isConnected()) {
  await connectDb();
}

const reviewsCollection = getDb().collection(reviewsCollectionName);

function createObjectId(value) {
  if (value == null) {
    return new ObjectId();
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    value instanceof ObjectId
  ) {
    return new ObjectId(value);
  }
  return new ObjectId();
}

function parseObjectId(query) {
  for (const key of Object.keys(query)) {
    if (key.includes("_id")) {
      if (
        typeof query[key] == "object" &&
        Array.isArray(Object.values(query[key])) &&
        Object.values(query[key]).length > 0
      ) {
        const idArray = Object.values(query[key])[0];
        for (let i = 0; i < idArray.length; i++) {
          idArray[i] = createObjectId(idArray[i]);
        }
      } else {
        query[key] = createObjectId(query[key]);
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

export function createReview(query, review) {
  parseObjectId(query);
  parseObjectId(review);
  reviewsCollection.updateOne(query, { $push: { reviews: review } });
}

export function updateReview(query, update, options = undefined) {
  parseObjectId(query);
  parseObjectId(update);
  reviewsCollection.updateOne(query, update, options);
}

export function deleteReview(query, deleteQuery) {
  parseObjectId(query);
  parseObjectId(deleteQuery);
  reviewsCollection.updateOne(query, { $pull: { reviews: deleteQuery } });
}

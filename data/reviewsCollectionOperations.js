import { isConnected, connectDb, getDb } from "../db.js";
import { ObjectId } from "mongodb";

const OBJ_ID_ANALOGUES = ["_id", "business_id"];

process.loadEnvFile();

const reviewsCollectionName =
  process.env.MONGODB_REVIEWS_COLLECTION || "reviews";

if (!isConnected()) {
  await connectDb();
}

const reviewsCollection = getDb().collection(reviewsCollectionName);

function parseObjectId(query) {
  for (const key of OBJ_ID_ANALOGUES) {
    if (Object.keys(query).includes(key)) {
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
    .project({ business_id: 1, num_reviews: 1, average_rating: 1 })
    .toArray();
}

import fs from "fs";

console.log("loading data");
const locations = JSON.parse(
  fs.readFileSync("./data/processed/locations.json"),
);
const reviews = JSON.parse(
  fs.readFileSync("./raw_data/mockaroo_generated_reviews.json"),
);

console.log("replacing fields");
for (let i = 0; i < reviews.length; i++) {
  reviews[i].business_id = locations[i]._id;
  reviews[i].business_name = locations[i].name;
  reviews[i].num_reviews = reviews[i].reviews.length;
  reviews[i].average_rating =
    reviews[i].reviews.length > 0
      ? reviews[i].reviews.reduce((total, review) => {
          return total + parseInt(review.rating);
        }, 0) / reviews[i].reviews.length
      : 0;
}

console.log("complete");

const outputFilePath = "./data/processed/reviews.json";

fs.writeFile(outputFilePath, JSON.stringify(reviews, null, 4), "utf8", () => {
  console.log(`Data written to ${outputFilePath} as JSON.`);
});

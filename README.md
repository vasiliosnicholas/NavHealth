# ![NavHealth](./public/images/favicon.png)NavHealth

## Project Description

**NavHealth** is a full-stack application that aggregates and displays information about healthcare resources, serving as a custom search engine focused on making it easy to find relevant health services near the end-user's location. It offers more information than a Google search or yelp listing, allowing users to search by healthcare services offered and filter locations by the insurances they accept. It also supports rating and reviewing healthcare businesses. Overall, NavHealth is designed to be a reliable endpoint for users seeking healthcare services to find the best facility to receive care at.
NavHealth was built with HTML5, CSS3, ES6, Express, Bootstrap 5, and MongoDB.

For our live demo, our database hosts health facility locations with mock data for certain fields. The reviews collection is entirely composed of mock data.

## Live Demo and Documentation

- **[Deployed Site Link](https://navhealth.onrender.com/)**
- add video walk-through link
- **[Project slides](https://docs.google.com/presentation/d/1lVG5qM9A-txAdIopvvzvcrpaC5UkR5t9ZHaHdSgv4-E/edit?usp=sharing)**
- **[Design Document](https://docs.google.com/document/d/1MQpSzL3qbQXs4yLTmgZi3iF11Dt9O2r0WlpWrBq2_uk/edit?usp=sharing)**

## Authors

- Aryan Yadav: Search full-stack.
- Vasilios Nicholas: Reviews full-stack.

## Project Structure

```
NavHealth
├── eslint.config.js                            #eslint config file.
├── .env.example                                #example of the properties/attributes needed to run our app in a local/hosted environment.
├── LICENSE                                     #Our project uses an MIT license.
├── package.json                                #lists project dependencies.
├── package-lock.json
├── README.md                                   #project README
├── backend
│   ├── app.js                                  #Creates an instance of the express server, adds all routes, and starts the server.
│   ├── dev.js                                  #Runs our app using livereload, which hard refreshes our pages in a browser upon static file changes.
│   ├── index.js                                #Invokes imports app from app.js and invokes app.run() to run our app.
│   ├── database
│   │   ├── db.js                               #Singleton pattern for connecting to our MongoDB database using MongoClient.
│   │   └── reviewsCollectionOperations.js      #Service Module for interacting with our MongoDB singleton in db.js.
│   ├── routes
│   │   ├── categories.js
│   │   ├── insurances.js
│   │   ├── locations.js
│   │   └── ReviewsRouter.js                    #Router that contains CRUD operations for the reviews collection.
│   └── utils
│       └── geocodeMaps.js
├── data                                        #Final data in json format that was added to our MongoDB database.
│   └── processed
│       ├── locations.json
│       └── reviews.json
├── public                                      #Directory for static content.
│   ├── index.html                              #Landing page with initial search by health business name, location, or services offered.
│   ├── search.html                             #Search page displays results for initial and subsequent searches and adds more search features.
│   ├── reviews.html                            #Displays reviews for a particular location.
│   ├── add-location.html                       #Allows a business user to add a location to the NavHealth database.
│   ├── post-review.html                        #Allows a user to add a review for a location to the NavHealth database.
│   ├── images
│   │   ├── favicon.png                         #favicon for site.
│   │   ├── NavHealth.png                       #NavHealth logo.
│   │   └── splash.webp                         #Background image for most pages.
│   ├── scripts
│   │   ├── add-location.js
│   │   ├── DropDownGenerator.js                #Common code for generating and maintaining event listeners for a dropdown element.
│   │   ├── getInitials.js                      #Returns two chars from a String.
│   │   ├── landing.js                          #Frontend code for index.html.
│   │   ├── post-review.js                      #Frontend code for post-review.html.
│   │   ├── reviews.js
│   │   ├── SearchAndDropDownGenerator.js       #Links a datalist to a dropdown element, displaying new data on dropdown selection change.
│   │   ├── search.js
│   │   └── updateReviewsMetaData.js
│   └── styles
│       ├── main.css                            #main stylesheet.
│       ├── reviews.css                         #adds reviews-module specific styling.
│       └── search.css                          #adds search-module specific styling.
└── raw_data                                    #Directory for storing the raw data we used to build our MongoDB collections.
    ├── example-location.txt
    ├── FY24-Massachusetts-Hospital-Profiles-Databook.xlsx
    ├── mockaroo_generated_reviews.json
    ├── provider-list.txt
    └── Retail-and-Urgent-Care-Clinics-data-7-2024.xlsx
```

## Gen AI Usage Disclosure

- Vasilios Nicholas:
  - App logo and favicon generation:
    - Model used: **GPT Image 2** via **Adobe Firefly**
    - Prompt used: Website faveicon/logo blue-green compass with a single black stethoscope. Ensure stethoscope is anatomically accurate.
  - **[Mockaroo](https://www.mockaroo.com/)** used for generating reviews mock data. See any of the objects in [./data/processed/reviews/json](https://github.com/vasiliosnicholas/NavHealth/blob/main/data/processed/reviews.json) to see the fields I used for generating the mock data.

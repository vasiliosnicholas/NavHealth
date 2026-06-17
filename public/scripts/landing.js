import SearchAndDropDownGenerator from "./SearchAndDropDownGenerator.js";

const dataList = document.getElementById("searchDatalistOptions");
const dropDown = document.getElementById("search-dropdown");
const dropDownBtnName = document.getElementById("search-dropdown-btn-name");
const searchForm = document.getElementById("search-form");
const searchBar = document.getElementById("search-bar");
const SEARCH_URL = "search.html"; //TODO: ReplaceURL with correct destination.

const categories = {
  Services: ["Family Care", "Emergency Medicine", "Urgent Care"],
  Location: ["Boston, MA", "Athol, MA", "Greenfield, MA"],
  Name: [
    "Boston Medical Center",
    "Brigham and Women's Hospital",
    "Boston Children's Hospital",
  ],
}; //TODO: Replace this with data from Databases.

const initialSearchCategory = `Services`;
const categoryPrefix = `by`;

const mainSearchBarGen = SearchAndDropDownGenerator(
  dropDown,
  dropDownBtnName,
  dataList,
  categories,
  initialSearchCategory,
  categoryPrefix,
);

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  window.location.href = `${SEARCH_URL}?searchType=${mainSearchBarGen.getActiveSearchCategory().toLowerCase()}&searchString=${searchBar.value.replace(" ", "_")}`;
});

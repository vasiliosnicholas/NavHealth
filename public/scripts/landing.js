import SearchAndDropDownGenerator from "./SearchAndDropDownGenerator.js";

const dataList = document.getElementById("searchDatalistOptions");
const dropDown = document.getElementById("search-dropdown");
const dropDownBtnName = document.getElementById("search-dropdown-btn-name");
const searchForm = document.getElementById("search-form");
const searchBar = document.getElementById("search-bar");
const SEARCH_URL = "search.html"; //TODO: ReplaceURL with correct destination.
const CATEGORIES_URL = "/api/categories";

const initialSearchCategory = `Services`;
const categoryPrefix = `by`;


try {
  const response = await fetch(CATEGORIES_URL);
  if (!response.ok) {
    throw new Error(`Failed to load categories (${response.status})`);
  }

  const categories = await response.json();
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
    window.location.href = `${SEARCH_URL}?searchType=${mainSearchBarGen.getActiveSearchCategory().toLowerCase()}&searchString=${searchBar.value.replace(/ /g, "_")}`;
  });
} catch (error) {
  console.error(error);
  searchBar.disabled = true;
  document.getElementById("submit-search").disabled = true;
}
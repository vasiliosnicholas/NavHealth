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

let searchType = `Services`;

function populateDataList() {
  dataList.innerHTML = ``;
  for (const option of categories[searchType]) {
    const optn = document.createElement("option");
    optn.value = option;
    dataList.appendChild(optn);
  }
}

function genDropDown() {
  dropDown.innerHTML = ``;
  for (const category of Object.keys(categories)) {
    const btn = document.createElement("button");
    btn.classList.add("dropdown-item");
    btn.innerHTML = `by ${category}`;
    if (category === searchType) {
      btn.classList.add("active");
    }
    dropDown.appendChild(btn);
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      if (!btn.classList.contains("active")) {
        for (const element of dropDown.children) {
          if (element.classList.contains("active")) {
            element.classList.remove("active");
          }
        }
        btn.classList.add("active");
        searchType = btn.innerHTML.replace("by ", "");
        dropDownBtnName.innerHTML = btn.innerHTML;
        populateDataList();
      }
    });
  }
}
genDropDown();
populateDataList();

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  window.location.href = `${SEARCH_URL}?searchType=${searchType.toLowerCase()}&searchString=${searchBar.value.replace(" ", "_")}`;
});

const descriptions = document.querySelectorAll(".description");
import DropDownGenerator from "./DropDownGenerator.js";

const dropDown = document.getElementById("dropdown-filter");
const dropDownBtnName = document.getElementById("filter-dropdown-btn-name");

const categories = ["Most Recent", "Oldest", "Highest Rating", "Lowest Rating"];
const eventListenerFunctionsToExecute = undefined;
const executeEventListenerFunctionsOnInitialization = false;
const categoryPrefix = undefined;

const filter = DropDownGenerator(
  dropDown,
  dropDownBtnName,
  categories,
  categories[0],
  eventListenerFunctionsToExecute,
  executeEventListenerFunctionsOnInitialization,
  categoryPrefix,
);

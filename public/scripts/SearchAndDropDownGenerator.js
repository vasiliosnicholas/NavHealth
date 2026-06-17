/**
 * Links a HTML datalist element with a Bootstrap v5 dropdown component.
 * @param {*} dropDown HTML element that will contain the dropdown categories.
 * @param {*} dropDownBtnName HTML element that will contian the name current categories selected.
 * @param {*} dataList HTML element representing the datalist to which children
 * of type option the category values will be appended to.
 * @param {*} categories Object with keys represent categories and values represent a serializable
 *  collection of options to display in the datalist.
 * @param {*} initialSearchCategory initial category key to be "selected"/considered active.
 * @param {*} prefix a String to add to each dropdown category. Optional parameter.
 * @returns an Object with a single function for getting the current search category.
 */
export default function SearchAndDropDownGenerator(
  dropDown,
  dropDownBtnName,
  dataList,
  categories,
  initialSearchCategory,
  prefix = undefined,
) {
  if (typeof categories !== "object") {
    throw new Error(`@param categories must be a Object with keys represent categories and values represent a serializable
   collection of options to display in the datalist.`);
  }
  if (!new Set(Object.keys(categories)).has(initialSearchCategory)) {
    throw new Error(
      `@param initialSearchCategory must be a key in @param categories!`,
    );
  }
  //TODO: Add error handling for html element params.
  let searchType = initialSearchCategory;
  const gen = {};

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
      btn.innerHTML = `${prefix} ${category}`;
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
          searchType = btn.innerHTML.replace(`${prefix} `, "");
          dropDownBtnName.innerHTML = btn.innerHTML;
          populateDataList();
        }
      });
    }
  }

  /**
   * Returns the active search category.
   * @returns a String representing the active search category.
   */
  function getActiveSearchCategory() {
    return searchType;
  }

  genDropDown();
  populateDataList();
  gen.getActiveSearchCategory = getActiveSearchCategory;
  return gen;
}

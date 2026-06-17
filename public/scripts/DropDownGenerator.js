export default function SearchAndDropDownGenerator(
  dropDown,
  dropDownBtnName,
  categories,
  initialCategory,
  eventListFunctionsToExecute = undefined,
  prefix = undefined,
) {
  if (typeof categories !== "object") {
    throw new Error(`@param categories must be a Object with keys represent categories and values represent a serializable
   collection of options to display in the datalist.`);
  }
  if (!new Set(Object.keys(categories)).has(initialCategory)) {
    throw new Error(
      `@param initialSearchCategory must be a key in @param categories!`,
    );
  }
  //TODO: Add error handling for html element params.
  let currentCategory = initialCategory;
  const gen = {};

  function genDropDown() {
    dropDown.innerHTML = ``;
    for (const category of Object.keys(categories)) {
      const btn = document.createElement("button");
      btn.classList.add("dropdown-item");
      btn.innerHTML =
        prefix !== undefined ? `${prefix} ${category}` : `${category}`;
      if (category === currentCategory) {
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
          if (prefix !== undefined) {
            currentCategory = btn.innerHTML.replace(`${prefix} `, "");
          } else {
            currentCategory = btn.innerHTML;
          }
          dropDownBtnName.innerHTML = btn.innerHTML;
          if (eventListFunctionsToExecute !== undefined) {
            for (const func of eventListFunctionsToExecute) {
              func(currentCategory);
            }
          }
        }
      });
    }
  }
  /**
   * Returns the active search category.
   * @returns a String representing the active category.
   */
  function getActiveCategory() {
    return currentCategory;
  }
  gen.genDropDown = genDropDown();
  gen.getActiveSearchCategory = getActiveCategory;
  return gen;
}

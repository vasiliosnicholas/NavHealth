/**
 * Generates Bootstrap v5 dropdown component.
 * @param {*} dropDown HTML element that will contain the dropdown categories.
 * @param {*} dropDownBtnName HTML element that will contian the name current categories selected.
 * @param {*} categories list of Strings that represent categories to display.
 * @param {*} initialCategory initial active category.
 * @param {*} eventListenerFunctionsToExecute functions to execute on new dropdown selection.
 * @param {*} executeEventListenerFunctionsOnInitialization boolean as to whether to execute
 * functions passed in parameter above on initialization of generator.
 * @param {*} prefix a String to add to each dropdown category. Optional parameter.
 * @returns an Object with a function for getting the active category.
 */
export default function DropDownGenerator(
  dropDown,
  dropDownBtnName,
  categories,
  initialCategory,
  eventListenerFunctionsToExecute = undefined,
  executeEventListenerFunctionsOnInitialization = true,
  prefix = undefined,
) {
  if (!new Set(categories).has(initialCategory)) {
    throw new Error(
      `@param initialSearchCategory must be a key in @param categories!`,
    );
  }
  //TODO: Add error handling for html element params.
  let currentCategory = initialCategory;
  const gen = {};

  function executeEventListenerFunctions() {
    if (eventListenerFunctionsToExecute !== undefined) {
      for (const func of eventListenerFunctionsToExecute) {
        func(currentCategory);
      }
    }
  }

  function genDropDown() {
    dropDown.innerHTML = ``;
    for (const category of categories) {
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
          executeEventListenerFunctions();
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
  //execute for functions on initial category.
  if (executeEventListenerFunctionsOnInitialization) {
    executeEventListenerFunctions();
  }
  gen.executeEventListenerFunctions = executeEventListenerFunctions;
  gen.genDropDown = genDropDown();
  gen.getActiveSearchCategory = getActiveCategory;
  return gen;
}

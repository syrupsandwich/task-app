let tabConfigurations = [];
let tabContainer = document.querySelector("#tab-container");
let spacer = tabContainer.querySelector(".spacer");

if (Object.hasOwn(localStorage, "tab-configurations")) {
  let configObjects = JSON.parse(localStorage.getItem("tab-configurations"));
  configObjects.forEach((object) => {
    let config = new window.ListConfiguration(object);
    tabConfigurations.push(config);
    spacer.before(makeTabBtn(config));
  });
}

function toggleTabOptions(config) {
  let tabOptionsNode = document.querySelector("#tab-options-container");
  if (tabOptionsNode === null) {
    let tabOptionsNode = makeTabOptionsNode(config);
    tabContainer.after(tabOptionsNode);
  } else {
    removeTabOptionsNode();
  }
}

function removeTabOptionsNode() {
  let tabOptionsNode = document.querySelector("#tab-options-container");
  if (tabOptionsNode === null) {
    return;
  }
  tabOptionsNode.remove();
}

function makeTabBtn(config) {
  let tabButton = document.createElement("button");
  tabButton.textContent = config.name;
  tabButton.id = config.name.replaceAll(" ", "-");
  tabButton.addEventListener("click", () => {
    if (writeTaskBtn.classList.contains("hidden")) {
      writeTaskBtn.classList.remove("hidden");
    }
    if (tabButton.classList.contains("selected")) {
      toggleTabOptions(config);
    } else {
      removeTabOptionsNode();
      removePreviousSelection();
      tabButton.classList.add("selected");
      localStorage.setItem("lastTab", tabButton.id);
      displayTasksFromConfig(config);
    }
  });
  return tabButton;
}

let writeTaskBtn = document.querySelector("button#write-task");
let tabOptionsTemplate = document.querySelector("#tab-options-container");
tabOptionsTemplate.remove();

let settingsContainer = document.querySelector("#settings-container");
settingsContainer.remove();
function showSettingsContainer() {
  document.querySelector("#task-container").replaceChildren(settingsContainer);
  settingsContainer.classList.remove("hidden");
}

let settingsTabBtn = tabContainer.querySelector("button#settings");
settingsTabBtn.addEventListener("click", () => {
  removePreviousSelection();
  settingsTabBtn.classList.add("selected");
  showSettingsContainer();
  writeTaskBtn.classList.add("hidden");
  removeTabOptionsNode();
});

function removePreviousSelection() {
  let tabs = Array.from(tabContainer.children);
  let previousSelection = tabs.some((tab) => {
    return tab.classList.contains("selected");
  });
  if (previousSelection) {
    tabContainer.querySelector(".selected").classList.remove("selected");
  }
}

let eraseAllDataBtn = settingsContainer.querySelector("button#erase-all-data");
eraseAllDataBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to erase all user data?") === false) {
    return;
  }
  localStorage.clear();
  window.location.reload();
});

function displayTasksFromConfig(config) {
  let taskObjects = [];
  if (config.tagOption === "disregard tags") {
    taskObjects = window.tasks;
  } else if (config.tagOption === "all tags") {
    taskObjects = window.getTasksWithTags(config.tags, window.tasks);
  } else if (config.tagOption === "some tags") {
    taskObjects = window.getTasksWithTags(config.tags, window.tasks, false);
  } else if (config.tagOption === "no tags") {
    taskObjects = window.getTasksWithNoTags(window.tasks);
  }

  let overdueTasks = [];
  if (config.showOverdue) {
    overdueTasks = window.sortTasksByDate(
      window.getTasksWithStatus(-1, taskObjects),
      config.overdueSortProp,
      true,
    );
  }
  if (config.gracePeriod.type === "finite") {
    let days = config.gracePeriod.length;
    let endDate = window.shiftDate(window.getCurrentDate(), 1, "subtract");
    let startDate = window.shiftDate(window.getCurrentDate(), days, "subtract");
    let acceptableTasks = window.getTasksWithinDateRange(
      "due date",
      [startDate, endDate],
      overdueTasks,
    );
    overdueTasks = acceptableTasks;
  }

  let pendingTasks = [];
  if (config.showPending) {
    pendingTasks = window.sortTasksByDate(
      window.getTasksWithStatus(0, taskObjects),
      config.pendingSortProp,
      true,
    );
  }
  if (config.timeSpan.enabled) {
    let numberOfDays = config.timeSpan.numberOfDays;
    let endDate = window.shiftDate(
      window.getCurrentDate(),
      numberOfDays - 1,
      "add",
    );
    let startDate = window.getCurrentDate();
    let nextTasksUp = window.getTasksWithinDateRange(
      "due date",
      [startDate, endDate],
      pendingTasks,
    );
    let tasksWithoutDeadline = window.getTasksWithNoDueDate(pendingTasks);
    pendingTasks = [...nextTasksUp, ...tasksWithoutDeadline];
  }

  let completedTasks = [];
  if (config.showCompleted) {
    completedTasks = window.sortTasksByDate(
      window.getTasksWithStatus(1, taskObjects),
      config.completedSortProp,
      true,
    );
  }
  if (config.dateRange.enabled) {
    let startDate = config.dateRange.start;
    let endDate = config.dateRange.end;
    let dateProperty = config.dateRange.property;
    let dateRangeFilteredTasks = window.getTasksWithinDateRange(
      dateProperty,
      [startDate, endDate],
      completedTasks,
    );
    completedTasks = dateRangeFilteredTasks;
  }

  let dateRangeFilteredTasks = [];
  if (config.dateRangeProp === "do not apply") {
    dateRangeFilteredTasks = [
      ...overdueTasks,
      ...pendingTasks,
      ...completedTasks,
    ];
  } else {
    dateRangeFilteredTasks = window.getTasksWithinDateRange(
      config.dateRangeProp,
      [config.dateRangeStart, config.dateRangeEnd],
      [...overdueTasks, ...pendingTasks, ...completedTasks],
    );
  }

  document
    .querySelector("#task-container")
    .replaceChildren(...window.makeTaskNodeArray(dateRangeFilteredTasks));
}

function makeTabOptionsNode(config) {
  let clone = tabOptionsTemplate.cloneNode(true);
  let tabNameInput = clone.querySelector("input#tab-name");
  tabNameInput.value = config.name.replaceAll("-", " ");
  let tagInput = clone.querySelector("#tag-requirements");
  tagInput.value = config.tags.join(" ");
  if (config.tagOption === "disregard tags" || config.tagOption === "no tags") {
    tagInput.disabled = true;
  }
  let someTagsRadio = clone.querySelector("input#some-tags");
  someTagsRadio.addEventListener("click", () => {
    tagInput.disabled = false;
  });
  let allTagsRadio = clone.querySelector("input#all-tags");
  allTagsRadio.addEventListener("click", () => {
    tagInput.disabled = false;
  });
  let noTagsRadio = clone.querySelector("input#no-tags");
  noTagsRadio.addEventListener("click", () => {
    tagInput.disabled = true;
  });
  let disregardTagsRadio = clone.querySelector("input#disregard-tags");
  disregardTagsRadio.addEventListener("click", () => {
    tagInput.disabled = true;
  });

  clone.querySelector(`input[value="${config.tagOption}"]`).checked = true;

  let showOverdueCheckbox = clone.querySelector("input#show-overdue");
  showOverdueCheckbox.checked = config.showOverdue;
  let showPendingCheckbox = clone.querySelector("input#show-pending");
  showPendingCheckbox.checked = config.showPending;
  let showCompletedCheckbox = clone.querySelector("input#show-completed");
  showCompletedCheckbox.checked = config.showCompleted;

  let overdueSortPropSelect = clone.querySelector("select#overdue-sort-method");
  overdueSortPropSelect.value = config.overdueSortProp;
  let pendingSortPropSelect = clone.querySelector("select#pending-sort-method");
  pendingSortPropSelect.value = config.pendingSortProp;
  let completedSortPropSelect = clone.querySelector(
    "select#completed-sort-method",
  );
  completedSortPropSelect.value = config.completedSortProp;

  let finiteGracePeriodRadioInput = clone.querySelector(
    "input#finite-grace-period",
  );
  let gracePeriodLengthInput = clone.querySelector("input#grace-period-length");
  gracePeriodLengthInput.value = config.gracePeriod.length;
  if (config.gracePeriod.type === "endless") {
    gracePeriodLengthInput.disabled = true;
  } else {
    finiteGracePeriodRadioInput.checked = true;
    gracePeriodLengthInput.disabled = false;
  }
  finiteGracePeriodRadioInput.addEventListener("change", (e) => {
    if (e.target.checked) {
      gracePeriodLengthInput.disabled = false;
    } else {
      gracePeriodLengthInput.disabled = true;
    }
  });

  let enablePendingFilterInput = clone.querySelector("input#filter-pending");
  let numberOfDaysInput = clone.querySelector("input#number-of-days");
  numberOfDaysInput.value = config.timeSpan.numberOfDays;
  enablePendingFilterInput.addEventListener("change", (e) => {
    if (e.target.checked) {
      numberOfDaysInput.disabled = false;
    } else {
      numberOfDaysInput.disabled = true;
    }
  });
  if (config.timeSpan.enabled) {
    enablePendingFilterInput.checked = true;
  } else {
    enablePendingFilterInput.checked = false;
    numberOfDaysInput.disabled = true;
  }

  let dateRangeFilterInput = clone.querySelector("input#date-range");
  let datePropertySelect = clone.querySelector("select#date-property");
  datePropertySelect.value = config.dateRange.property;
  let dateRangeStartInput = clone.querySelector("input#date-range-start");
  dateRangeStartInput.value = config.dateRange.start;
  let dateRangeEndInput = clone.querySelector("input#date-range-end");
  dateRangeEndInput.value = config.dateRange.end;
  function disableDateRangeInputs() {
    datePropertySelect.disabled = true;
    dateRangeStartInput.disabled = true;
    dateRangeEndInput.disabled = true;
  }
  function enableDateRangeInputs() {
    datePropertySelect.disabled = false;
    dateRangeStartInput.disabled = false;
    dateRangeEndInput.disabled = false;
  }
  dateRangeFilterInput.addEventListener("change", (e) => {
    if (e.target.checked) {
      enableDateRangeInputs();
    } else {
      disableDateRangeInputs();
    }
  });
  if (config.dateRange.enabled) {
    dateRangeFilterInput.checked = true;
    enableDateRangeInputs();
  } else {
    dateRangeFilterInput.checked = false;
    disableDateRangeInputs();
  }

  let removeBtn = clone.querySelector("button#remove-tab");
  removeBtn.addEventListener("click", () => {
    if (confirm(`Confirm to remove the tab named ${config.name}`)) {
      clone.remove();
      tabContainer.querySelector(`button#${config.name}`).remove();
      let index = tabConfigurations.findIndex((object) => {
        return object.name === config.name;
      });
      tabConfigurations.splice(index, 1);
      localStorage.setItem(
        "tab-configurations",
        JSON.stringify(tabConfigurations),
      );
      tabContainer.querySelector("button").click();
    }
  });

  function checkForValidNameChange() {
    return (
      tabNameInput.value !== config.name &&
      tabConfigurations.some((config) => {
        return config.name === tabNameInput.value;
      })
    );
  }

  function updateName() {
    let previousId = `button#${config.name.replaceAll(" ", "-")}`;
    let tabButton = tabContainer.querySelector(previousId);
    tabButton.textContent = tabNameInput.value;

    config.name = tabNameInput.value;
    tabButton.id = config.name.replaceAll(" ", "-");
    localStorage.setItem("lastTab", config.name.replaceAll(" ", "-"));
  }

  let saveBtn = clone.querySelector("button#save-config");
  saveBtn.addEventListener("click", () => {
    if (checkForValidNameChange()) {
      alert("There is already a tab with that name.");
      tabNameInput.focus();
    } else {
      updateName();
    }
    config.tags = tagInput.value.split(" ");
    let selectedTagOption = document.querySelector(
      `input[name="tag-option"]:checked`,
    );
    config.tagOption = selectedTagOption.value;
    config.showOverdue = showOverdueCheckbox.checked;
    config.showPending = showPendingCheckbox.checked;
    config.showCompleted = showCompletedCheckbox.checked;
    config.overdueSortProp = overdueSortPropSelect.value;
    config.pendingSortProp = pendingSortPropSelect.value;
    config.completedSortProp = completedSortPropSelect.value;

    if (finiteGracePeriodRadioInput.checked) {
      config.gracePeriod.type = "finite";
    } else {
      config.gracePeriod.type = "endless";
    }
    config.gracePeriod.length = gracePeriodLengthInput.value;

    if (enablePendingFilterInput.checked) {
      config.timeSpan.enabled = true;
    } else {
      config.timeSpan.enabled = false;
    }
    config.timeSpan.numberOfDays = numberOfDaysInput.value;

    if (dateRangeFilterInput.checked && dateRangeStartInput.value !== "") {
      config.dateRange.enabled = true;
    } else {
      config.dateRange.enabled = false;
    }
    config.dateRange.property = datePropertySelect.value;
    config.dateRange.start = dateRangeStartInput.value;
    if (dateRangeEndInput.value === "") {
      delete config.dateRange.end;
    } else {
      config.dateRange.end = dateRangeEndInput.value;
    }

    displayTasksFromConfig(config);
    localStorage.setItem(
      "tab-configurations",
      JSON.stringify(tabConfigurations),
    );
  });
  return clone;
}

if (
  Object.hasOwn(localStorage, "lastTab") &&
  Array.from(tabContainer.children).some((button) => {
    return button.id === localStorage.getItem("lastTab");
  })
) {
  let tabName = localStorage.getItem("lastTab");
  let tabButton = Array.from(tabContainer.children).find((button) => {
    return button.id === tabName;
  });
  tabButton.classList.add("selected");
  let config = tabConfigurations.find((config) => {
    return config.name === tabName;
  });
  displayTasksFromConfig(config);
} else if (tabConfigurations.length > 0) {
  let tabName = tabConfigurations[0].name;
  tabContainer.querySelector(`button#${tabName}`).classList.add("selected");
  displayTasksFromConfig(tabConfigurations[0]);
} else {
  settingsTabBtn.click();
}

let pendingTab = new window.ListConfiguration({
  name: "pending",
  showCompleted: false,
  sortFn: "sortTasksByDueDate",
  timeSpan: {
    enabled: false,
    numberOfDays: 3,
  },
});
let addPendingTabBtn = settingsContainer.querySelector("button#add-pending");
addPendingTabBtn.addEventListener("click", () => {
  if (tabContainer.querySelector("button#pending") === null) {
    spacer.before(makeTabBtn(pendingTab));
    tabConfigurations.push(pendingTab);
    localStorage.setItem(
      "tab-configurations",
      JSON.stringify(tabConfigurations),
    );
    window.updateStorageQuotaText();
  }
});

let todayTab = new window.ListConfiguration({
  name: "today",
  showOverdue: false,
  showCompleted: false,
  sortFn: "sortTasksByDueDate",
  timeSpan: {
    enabled: true,
    numberOfDays: 1,
  },
});
let addTodayTabBtn = settingsContainer.querySelector("button#add-today");
addTodayTabBtn.addEventListener("click", () => {
  if (tabContainer.querySelector("button#today") === null) {
    spacer.before(makeTabBtn(todayTab));
    tabConfigurations.push(todayTab);
    localStorage.setItem(
      "tab-configurations",
      JSON.stringify(tabConfigurations),
    );
    window.updateStorageQuotaText();
  }
});

let completedTab = new window.ListConfiguration({
  name: "completed",
  showOverdue: false,
  showPending: false,
  sortFn: "sortTasksByDueDate",
  timeSpan: {
    enabled: false,
    numberOfDays: 1,
  },
});
let addCompletedTabBtn = settingsContainer.querySelector(
  "button#add-completed",
);
addCompletedTabBtn.addEventListener("click", () => {
  if (tabContainer.querySelector("button#completed") === null) {
    spacer.before(makeTabBtn(completedTab));
    tabConfigurations.push(completedTab);
    localStorage.setItem(
      "tab-configurations",
      JSON.stringify(tabConfigurations),
    );
    window.updateStorageQuotaText();
  }
});

let addTabBtn = settingsContainer.querySelector("button#add-tab");
addTabBtn.addEventListener("click", () => {
  let name = prompt("Please input the name for the new tab.");
  if (name === "") {
    return;
  }
  let tab = new window.ListConfiguration({ name: name });
  spacer.before(makeTabBtn(tab));
  tabConfigurations.push(tab);
  localStorage.setItem("tab-configurations", JSON.stringify(tabConfigurations));
  window.updateStorageQuotaText();
});

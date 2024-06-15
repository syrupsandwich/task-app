let taskNodeTemplate = document.getElementById("task-node-template");
taskNodeTemplate.remove();

let taskEditorNodeTemplate = document.getElementById(
  "task-editor-node-template",
);
taskEditorNodeTemplate.remove();

let taskContainer = document.getElementById("task-container");

function makeTaskNode(object, displayContents = false) {
  let clone = taskNodeTemplate.cloneNode(true);
  clone.classList.remove("hidden");

  let detailsTag = clone.querySelector("details");
  detailsTag.open = displayContents;

  let taskButtons = clone.querySelector(".buttons");
  if (displayContents) {
    taskButtons.classList.remove("hidden");
  } else {
    taskButtons.classList.add("hidden");
  }

  let taskTitle = clone.querySelector(".task-title");
  taskTitle.textContent = object.title;
  taskTitle.addEventListener("click", () => {
    taskButtons.classList.toggle("hidden");
  });

  let taskDetails = clone.querySelector(".task-details");
  if (object.details === undefined) {
    taskDetails.classList.add("hidden");
  } else {
    taskDetails.textContent = object.details;
  }

  let dueDateWarning = clone.querySelector(".due-date-none");
  let taskDueDate = clone.querySelector(".task-due-date");
  if (object.dueDate === undefined) {
    taskDueDate.parentElement.classList.add("hidden");
    dueDateWarning.classList.remove("hidden");
  } else {
    taskDueDate.textContent = object.dueDate;
    dueDateWarning.classList.add("hidden");
  }

  let taskTags = clone.querySelector(".task-tags");
  if (object.tags.length === 0) {
    taskTags.parentElement.classList.add("hidden");
  } else {
    taskTags.textContent = object.tags.join(" ");
  }

  let prereqContainer = clone.querySelector(".prerequisite-container");
  let prereqList = prereqContainer.querySelector("ul");
  if (object.requiredTaskIds.length === 0) {
    prereqContainer.classList.add("hidden");
  } else {
    let requiredTasks = window.getTasks(object.requiredTaskIds);
    prereqList.replaceChildren(...makePrereqListItems(requiredTasks));
  }

  let editBtn = clone.querySelector("button.edit");
  editBtn.addEventListener("click", () => {
    let editor = makeEditorClone(object);
    taskContainer.replaceChild(editor, clone);
    editor.scrollIntoView();
  });

  let markCompleteBtn = clone.querySelector("button.mark-complete");
  markCompleteBtn.addEventListener("click", () => {
    object.isComplete = true;
    window.saveData();
    updateStorageQuotaText();
    clone.classList.remove("overdue");
    clone.classList.remove("pending");
    clone.classList.add("complete");
    markCompleteBtn.classList.add("hidden");
    markIncompleteBtn.classList.remove("hidden");
  });

  let removeBtn = clone.querySelector("button.remove");
  removeBtn.addEventListener("click", () => {
    if (checkForRegistration(object, window.tasks)) {
      window.removeTasks([object.id], window.tasks);
    }
    if (checkForRegistration(object, window.records)) {
      window.removeTasks([object.id], window.records);
    }
    clone.remove();
    window.saveData();
    updateStorageQuotaText();
  });

  let markIncompleteBtn = clone.querySelector("button.mark-incomplete");
  markIncompleteBtn.addEventListener("click", () => {
    object.isComplete = false;
    window.saveData();
    updateStorageQuotaText();
    clone.classList.remove("complete");
    if (object.getStatus() === -1) {
      clone.classList.add("overdue");
    } else {
      clone.classList.add("pending");
    }
    markCompleteBtn.classList.remove("hidden");
    markIncompleteBtn.classList.add("hidden");
  });

  let archiveBtn = clone.querySelector("button.archive");
  archiveBtn.addEventListener("click", () => {
    let task = window.removeTasks([object.id]);
    window.records.push(task);
    clone.remove();
    window.saveData();
    updateStorageQuotaText();
  });

  if (object.getStatus() === 1) {
    clone.classList.add("complete");
    markCompleteBtn.classList.add("hidden");
    markIncompleteBtn.classList.remove("hidden");
  } else if (object.getStatus() === -1) {
    clone.classList.add("overdue");
  }

  return clone;
}

function makeTaskNodeArray(taskArray) {
  let nodes = [];
  taskArray.forEach((task) => {
    nodes.push(makeTaskNode(task));
  });
  return nodes;
}

let pendingTab = document.querySelector("button#pending");
pendingTab.addEventListener("click", () => {
  let overdueTasks = window.getTasksWithStatus(-1);
  let sortedOverdueTasks = window.sortTasksByDueDate(overdueTasks);
  let overdueTaskNodes = makeTaskNodeArray(sortedOverdueTasks);
  let pendingTasks = window.getTasksWithStatus(0);
  let sortedPendingTasks = window.sortTasksByDueDate(pendingTasks);
  let pendingTaskNodes = makeTaskNodeArray(sortedPendingTasks);
  taskContainer.replaceChildren(...overdueTaskNodes, ...pendingTaskNodes);
});

let completedTab = document.querySelector("button#completed");
completedTab.addEventListener("click", () => {
  let completedTasks = window.getTasksWithStatus(1, window.tasks);
  let taskNodes = makeTaskNodeArray(completedTasks);
  taskContainer.replaceChildren(...taskNodes);
});

let todayTab = document.querySelector("button#today");
todayTab.addEventListener("click", () => {
  let today = window.getCurrentDate();
  let todaysTasks = window.getTasksByDueDate([today], window.tasks);
  let taskNodes = makeTaskNodeArray(todaysTasks);
  taskContainer.replaceChildren(...taskNodes);
});

let introduction = document.querySelector("#introduction");
if (localStorage.getItem("hide-intro")) {
  introduction.remove();
}
let hideIntroductionBtn = introduction.querySelector(
  "button#hide-introduction",
);
hideIntroductionBtn.addEventListener("click", () => {
  localStorage.setItem("hide-intro", true);
  introduction.remove();
});

let settingsTab = document.querySelector("button#settings");
let settingsContainer = document.querySelector("#settings-container");
let eraseAllDataBtn = document.querySelector("button#erase-all-data");
settingsTab.addEventListener("click", () => {
  taskContainer.replaceChildren(settingsContainer);
  settingsContainer.classList.remove("hidden");
});

function checkForRegistration(object, array) {
  return array.some((task) => {
    return object.id === task.id;
  });
}

function makePrereqListItems(taskArray) {
  let listItems = [];
  taskArray.forEach((task) => {
    let li = document.createElement("li");
    let title = task.title;
    li.textContent = title;
    listItems.push(li);
  });
  return listItems;
}

function makeEditorClone(object = new window.Task({})) {
  let editorClone = taskEditorNodeTemplate.cloneNode(true);
  editorClone.classList.remove("hidden");

  let titleInput = editorClone.querySelector("#title");
  titleInput.value = object.title || "";

  let detailsInput = editorClone.querySelector("#details");
  detailsInput.value = object.details || "";

  let dueDateInput = editorClone.querySelector("#dueDate");
  dueDateInput.value = object.dueDate || "";

  let tagsInput = editorClone.querySelector("#tags");
  tagsInput.value = object.tags.join(" ");

  let prereqCountSpan = editorClone.querySelector("span#prereq-count");
  let prereqContainer = editorClone.querySelector(".prerequisite-container");
  let prereqList = editorClone.querySelector(".prerequisite-container>ul");

  function updatePrereqList() {
    let requiredTasks = window.getTasks(object.requiredTaskIds);
    prereqList.replaceChildren(...makePrereqListItems(requiredTasks));
  }

  if (object.requiredTaskIds.length > 0) {
    updatePrereqList();
    prereqCountSpan.textContent = object.requiredTaskIds.length;
  } else {
    prereqList.replaceChildren();
    prereqContainer.classList.add("hidden");
  }

  let prerequisiteSelector = editorClone.querySelector(
    "#prerequisite-selector",
  );
  let viewSelectedTasksBtn = editorClone.querySelector(
    "button#view-selected-tasks",
  );

  let addPrereqBtn = editorClone.querySelector("button#add-prereq");
  addPrereqBtn.addEventListener("click", () => {
    prereqContainer.classList.add("hidden");
    prerequisiteSelector.classList.remove("hidden");
    addPrereqBtn.disabled = true;
    prerequisiteSelector.scrollIntoView(true);
    showSelectedPrereqs();
    taskSearch.value = "";
  });

  let hideSelectorBtn = prerequisiteSelector.querySelector(
    "button#hide-selector",
  );

  hideSelectorBtn.addEventListener("click", () => {
    if (object.requiredTaskIds.length > 0) {
      updatePrereqList();
      prereqContainer.classList.remove("hidden");
    } else {
      prereqContainer.classList.add("hidden");
    }
    prerequisiteSelector.classList.add("hidden");
    addPrereqBtn.disabled = false;
  });

  let prereqOption = editorClone.querySelector("#search-results>p");

  let searchResultsContainer = editorClone.querySelector("#search-results");
  searchResultsContainer.replaceChildren();

  function makePrereqOptions(taskArray) {
    let prerequisiteNodes = [];
    taskArray.forEach((task) => {
      let prereqNode = prereqOption.cloneNode();
      if (prereqNode.classList.contains("selected")) {
        prereqNode.classList.remove("selected");
      }
      prereqNode.textContent = task.title;
      if (
        object.requiredTaskIds.some((id) => {
          return id === task.id;
        })
      ) {
        prereqNode.classList.add("selected");
      }

      prereqNode.addEventListener("click", () => {
        if (prereqNode.classList.contains("selected")) {
          let index = object.requiredTaskIds.indexOf(task.id);
          object.requiredTaskIds.splice(index, 1);
          prereqNode.classList.remove("selected");
          prereqCountSpan.textContent = object.requiredTaskIds.length;
        } else {
          object.require([task.id]);
          prereqNode.classList.add("selected");
          prereqCountSpan.textContent = object.requiredTaskIds.length;
        }
      });

      prerequisiteNodes.push(prereqNode);
    });
    return prerequisiteNodes;
  }

  function showSelectedPrereqs() {
    let selected = window.getTasks(object.requiredTaskIds);
    let selectedTaskNodes = makePrereqOptions(selected);
    searchResultsContainer.replaceChildren(...selectedTaskNodes);
  }

  viewSelectedTasksBtn.addEventListener("click", showSelectedPrereqs);

  let taskSearch = editorClone.querySelector("#task-search");
  taskSearch.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") {
      return;
    }
    if (e.target.value.length === 0) {
      return;
    }

    let strings = [];
    if (e.target.value.includes(" ") === false) {
      strings.push(e.target.value);
    } else {
      strings = e.target.value.split(" ");
    }

    let pending = window.getTasksWithStatus(0, window.tasks);
    let overdue = window.getTasksWithStatus(-1, window.tasks);
    let selectableTasks = window.getTasksWithText(strings, [
      ...pending,
      ...overdue,
    ]);

    if (selectableTasks.length === 0) {
      let message = document.createTextNode("no tasks found...");
      searchResultsContainer.replaceChildren(message);
      return;
    }

    let prereqOptions = makePrereqOptions(selectableTasks);
    searchResultsContainer.replaceChildren(...prereqOptions);
  });

  let saveBtn = editorClone.querySelector("button#save");
  saveBtn.addEventListener("click", () => {
    if (titleInput.value === "") {
      alert("Each task must have at leat a title");
      return;
    } else {
      object.title = titleInput.value;
    }
    if (detailsInput.value === "") {
      delete object.details;
    } else {
      object.details = detailsInput.value;
    }
    if (dueDateInput.value === "") {
      delete object.dueDate;
    } else {
      object.dueDate = dueDateInput.value;
    }
    if (tagsInput.value === "") {
      object.tags = [];
    } else {
      object.tags = tagsInput.value.split(" ");
    }
    if (
      checkForRegistration(object, window.tasks) === false &&
      checkForRegistration(object, window.records) === false
    ) {
      window.tasks.push(object);
    }
    window.saveData();
  });

  let inputElements = [titleInput, detailsInput, dueDateInput, tagsInput];

  function checkForChanges() {
    let report = false;
    inputElements.forEach((input) => {
      let taskPropertyValue;
      if (input.id === "tags") {
        taskPropertyValue = object.tags.join(" ");
      } else {
        taskPropertyValue = object[input.id];
      }
      if (
        (input.value !== taskPropertyValue) &
        !(input.value === "" && object[input.id] === undefined)
      ) {
        report = true;
      }
    });
    return report;
  }

  let closeBtn = editorClone.querySelector("button#close");
  closeBtn.addEventListener("click", () => {
    let changesMade = checkForChanges();
    if (
      changesMade &&
      confirm("There were changes made. Exit anyway?") === false
    ) {
      return;
    }
    if (
      checkForRegistration(object, window.tasks) === false &&
      checkForRegistration(object, window.records) === false
    ) {
      editorClone.remove();
      return;
    }
    let task = window.getTasks([object.id])[0];
    let taskNode = makeTaskNode(task, true);
    taskContainer.replaceChild(taskNode, editorClone);
  });

  prerequisiteSelector.classList.add("hidden");
  return editorClone;
}

let writeTaskBtn = document.querySelector("button#write-task");
writeTaskBtn.addEventListener("click", () => {
  let editor = makeEditorClone();
  let completedTask = Array.from(taskContainer.children).find((task) => {
    return task.classList.contains("complete");
  });
  if (completedTask) {
    completedTask.before(editor);
  } else {
    taskContainer.append(editor);
  }
  editor.scrollIntoView();
});

let storageQuotaSpan = document.querySelector("span.storage-quota");
let storageQuotaProgressBar = document.querySelector("#storage-quota");

function updateStorageQuotaText() {
  storageQuotaSpan.textContent = window.estimateQuotaUsage();
  storageQuotaProgressBar.value = window.estimateQuotaUsage();
}

updateStorageQuotaText();

let tabBtns = document.querySelectorAll(".tabs>button");
let tabBar = document.querySelector(".tabs");
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.id === "settings") {
      writeTaskBtn.classList.add("hidden");
    } else {
      writeTaskBtn.classList.remove("hidden");
    }
    let selectedTab = tabBar.querySelector(".selected");
    if (selectedTab) {
      selectedTab.classList.remove("selected");
    }
    btn.classList.add("selected");
    localStorage.setItem("lastTab", btn.id);
  });
});

if (Object.hasOwn(localStorage, "lastTab")) {
  document.getElementById(localStorage.getItem("lastTab")).click();
} else {
  pendingTab.click();
}

eraseAllDataBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to erase all user data?") === false) {
    return;
  }
  localStorage.clear();
  window.location.reload();
});

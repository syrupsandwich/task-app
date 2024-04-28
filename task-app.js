window.tasks = [];
window.records = [];

let tasks = window.tasks;

let counter = (function () {
  let count = 0;
  function increment() {
    return ++count;
  }
  return { increment };
})();

/* exported parseLocalStorageArray */
function parseLocalStorageArray(key) {
  if (Object.hasOwn(localStorage, key)) {
    let tempObjects = JSON.parse(localStorage.getItem(key));
    tempObjects.forEach((object) => {
      window[key].push(new Task(object));
    });
    return true;
  } else {
    return false;
  }
}

function getCurrentDate() {
  let date = new Date();
  let year = date.getFullYear();
  let month = `${date.getMonth() + 1}`.padStart(2, "0");
  let dayOfMonth = date.getDate();
  let string = `${year}-${month}-${dayOfMonth}`;
  return string;
}

function Task(object) {
  if (!(this instanceof Task)) {
    return new Task(object);
  }
  let id = counter.increment();
  Object.defineProperty(this, "id", {
    get: function () {
      return id;
    },
    enumerable: true,
    configurable: false,
  });
  this.title = object.title;
  this.details = object.details;
  if (Object.hasOwn(object, "startDate")) {
    this.startDate = object.startDate;
  } else {
    this.startDate = getCurrentDate();
  }
  this.dueDate = object.dueDate;
  if (Object.hasOwn(object, "tags")) {
    this.tags = object.tags;
  } else {
    this.tags = [];
  }
  if (Object.hasOwn(object, "isComplete")) {
    this.isComplete = object.isComplete;
  } else {
    this.isComplete = false;
  }
  if (Object.hasOwn(object, "endDate")) {
    this.endDate = object.endDate;
  }
  if (Object.hasOwn(object, "requiredTaskIds")) {
    this.requiredTaskIds = object.requiredTaskIds;
  } else {
    this.requiredTaskIds = [];
  }
  Object.defineProperty(this, "dependentTaskIds", {
    get: function () {
      let ids = [];
      tasks.forEach((task) => {
        if (
          task.requiredTaskIds.some((id) => {
            return id === this.id;
          })
        ) {
          ids.push(task.id);
        }
      });
      return ids;
    },
    enumerable: true,
    configurable: false,
  });
}

function checkDateHasPassed(date) {
  let currentDate = getCurrentDate().replaceAll("-", "");
  let dueDate = date.replaceAll("-", "");
  return currentDate > dueDate;
}

Task.prototype.getStatus = function () {
  let complete = 1;
  let incomplete = 0;
  let overdue = -1;
  if (this.isComplete) {
    return complete;
  }
  if (this.dueDate === undefined) {
    return incomplete;
  }
  if (checkDateHasPassed(this.dueDate)) {
    return overdue;
  }
  return incomplete;
};

Task.prototype.getText = function (properties) {
  let text = "";
  for (let property of properties) {
    if (Object.hasOwn(this, property) === false) {
      continue;
    }
    if (this[property === undefined]) {
      continue;
    }
    if (text !== "") {
      text = text.concat("\n");
    }
    text = text.concat(this[property]);
  }
  return text;
};

Task.prototype.require = function (ids) {
  ids.forEach((id) => {
    if (this.requiredTaskIds.some((num) => num === id)) {
      return;
    } else {
      this.requiredTaskIds.push(id);
    }
  });
};

/* exported writeTask */
function writeTask(object) {
  let task = new Task(object);
  tasks.push(task);
  return task.id;
}

/* exported getTasksWithTags */
function getTasksWithTags(strings, array = tasks) {
  let searchResults = array.filter((task) => {
    let score = 0;
    task.tags.forEach((tag) => {
      if (strings.some((string) => string === tag)) {
        score++;
      }
    });
    if (score === strings.length) {
      return true;
    } else {
      return false;
    }
  });
  return searchResults;
}

function getTasks(ids, array = tasks) {
  let list = [];
  ids.forEach((id) => {
    let task = array.find((task) => {
      if (task.id === id) {
        return true;
      }
    });
    if (task !== undefined) {
      list.push(task);
    }
  });
  return list;
}

/* exported markTasksAsComplete */
function markTasksAsComplete(ids, isComplete = true) {
  ids.forEach((id) => {
    let task = getTasks([id])[0];
    if (isComplete) {
      task.isComplete = true;
      task.endDate = getCurrentDate();
      return;
    } else {
      task.isComplete = false;
      delete task.endDate;
      return;
    }
  });
}

/* exported sortTasksByTags */
function sortTasksByTags(strings, array) {
  function getScore(task) {
    let score = 0;
    strings.forEach((string) => {
      if (
        task.tags.some((tag) => {
          tag === string;
        })
      ) {
        score++;
      }
    });
    return score;
  }
  return array.toSorted((a, b) => {
    let aScore = getScore(a);
    let bScore = getScore(b);
    if (aScore > bScore) {
      return -1;
    }
    if (aScore < bScore) {
      return 1;
    }
    return 0;
  });
}

/* exported sortTasksByStartDate */
function sortTasksByStartDate(array, chronological = true) {
  return array.toSorted((a, b) => {
    if (chronological) {
      return a.startDate - b.startdate;
    } else {
      return b.startDate - a.stardDate;
    }
  });
}

/* exported sortTasksByDueDate */
function sortTasksByDueDate(array, chronological = true) {
  return array.toSorted((a, b) => {
    if (chronological) {
      return a.dueDate - b.dueDate;
    } else {
      return b.dueDate - a.dueDate;
    }
  });
}

/* exported getTasksWithNoTags */
function getTasksWithNoTags(array = tasks) {
  return array.filter((task) => {
    if (task.tags.length === 0) {
      return true;
    } else {
      return false;
    }
  });
}

/* exported getTasksWithText */
function getTasksWithText(strings, array = tasks) {
  let results = array.filter((task) => {
    let string = task.getText(["title", "description", "tags"]);
    let score = 0;
    strings.forEach((pattern) => {
      if (string.toLowerCase().includes(pattern)) {
        score++;
      }
    });
    if (score === strings.length) {
      return true;
    }
  });
  return results;
}

/* exported getTasksByDueDate */
function getTasksByDueDate(dateRange, array = tasks) {
  let rangeStart = dateRange[0];
  let rangeEnd = dateRange[1];
  if (rangeEnd === undefined) {
    rangeEnd = rangeStart;
  }
  let results = array.filter((task) => {
    let date = task.dueDate;
    return date >= rangeStart && date <= rangeEnd;
  });
  return results;
}

/* exported getTasksByStartDate */
function getTasksByStartDate(dateRange, array = tasks) {
  let rangeStart = dateRange[0];
  let rangeEnd = dateRange[1];
  if (rangeEnd === undefined) {
    rangeEnd = rangeStart;
  }
  let results = array.filter((task) => {
    let date = task.startDate;
    return date >= rangeStart && date <= rangeEnd;
  });
  return results;
}

/* exported removeTasks */
function removeTasks(ids) {
  let list = [];
  ids.forEach((id) => {
    let index = tasks.findIndex((task) => {
      return task.id === id;
    });
    list.push(tasks.splice(index, 1)[0]);
  });
  return list;
}

/* exported saveData */
function saveData() {
  localStorage.setItem("tasks", JSON.stringify(tasks, minimalTaskObjKeys));
  localStorage.setItem(
    "records",
    JSON.stringify(window.records, minimalTaskObjKeys),
  );
}

function getTasksWithStatus(num, array = tasks) {
  return array.filter((task) => {
    return task.getStatus() === num;
  });
}

/* exported sortTasksByStatus */
function sortTasksByStatus(array) {
  let overdue = getTasksWithStatus(-1, array);
  let pending = getTasksWithStatus(0, array);
  let complete = getTasksWithStatus(1, array);
  return [].concat(overdue, pending, complete);
}

let minimalTaskObjKeys = [
  "id",
  "title",
  "details",
  "dueDate",
  "startDate",
  "endDate",
  "tags",
  "isComplete",
  "requiredTaskIds",
];

/* exported archiveTasks */
function archiveTasks(array) {
  array.forEach((task) => {
    let removedTask = removeTasks([task.id])[0];
    window.records.push(removedTask);
  });
}

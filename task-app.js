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

function formatDate(date) {
  let year = date.getFullYear();
  let month = `${date.getMonth() + 1}`.padStart(2, "0");
  let dayOfMonth = `${date.getDate()}`.padStart(2, "0");
  let string = `${year}-${month}-${dayOfMonth}`;
  return string;
}

function getCurrentDate() {
  let date = new Date();
  return formatDate(date);
}

/* exported shiftDate */
function shiftDate(date, days, operator) {
  let result = new Date(date + "T00:00:00");
  if (operator === "add") {
    result.setDate(result.getDate() + Number(days));
  }
  if (operator === "subtract") {
    result.setDate(result.getDate() - Number(days));
  }
  return formatDate(result);
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
  if (Object.hasOwn(object, "start date")) {
    this["start date"] = object["start date"];
  } else {
    this["start date"] = getCurrentDate();
  }
  if (Object.hasOwn(object, "due date")) {
    this["due date"] = object["due date"];
  }
  if (Object.hasOwn(object, "tags")) {
    this.tags = object.tags;
  } else {
    this.tags = [];
  }
  if (Object.hasOwn(object, "end date")) {
    this["end date"] = object["end date"];
  }
  if (Object.hasOwn(object, "requiredTaskIds")) {
    this.requiredTaskIds = object.requiredTaskIds;
  } else {
    this.requiredTaskIds = [];
  }
  Object.defineProperty(this, "isComplete", {
    get: function () {
      if (Object.hasOwn(this, "end date")) {
        return true;
      } else {
        return false;
      }
    },
  });
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
  if (this["due date"] === undefined) {
    return incomplete;
  }
  if (checkDateHasPassed(this["due date"])) {
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
function getTasksWithTags(strings, array = tasks, containsAll = true) {
  let searchResults = array.filter((task) => {
    let score = 0;
    task.tags.forEach((tag) => {
      if (strings.some((string) => string === tag)) {
        score++;
      }
    });
    if (containsAll) {
      return score === strings.length;
    } else {
      return score >= 1;
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
function markTasksAsComplete(ids, completed = true) {
  ids.forEach((id) => {
    let task = getTasks([id])[0];
    if (completed) {
      task["end date"] = getCurrentDate();
      return;
    } else {
      delete task["end date"];
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

/* exported sortTasksByDate */
function sortTasksByDate(array, dateProperty, chronological = true) {
  return array.toSorted((a, b) => {
    if (Object.hasOwn(a, dateProperty) === false) {
      return 1;
    }
    if (Object.hasOwn(b, dateProperty) === false) {
      return -1;
    }
    let dateA = Number(a[dateProperty].replaceAll("-", ""));
    let dateB = Number(b[dateProperty].replaceAll("-", ""));
    if (chronological) {
      return dateA - dateB;
    } else {
      return dateB - dateA;
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

/* exported getTasksWithinDateRange */
function getTasksWithinDateRange(dateProperty, dateRange, array = tasks) {
  let rangeStart = dateRange[0];
  let rangeEnd = dateRange[1];
  if (rangeEnd === undefined) {
    rangeEnd = rangeStart;
  }
  let results = array.filter((task) => {
    let date = task[dateProperty];
    return date >= rangeStart && date <= rangeEnd;
  });
  return results;
}

/* exported removeTasks */
function removeTasks(ids, array) {
  let list = [];
  ids.forEach((id) => {
    let index = array.findIndex((task) => {
      return task.id === id;
    });
    list.push(array.splice(index, 1)[0]);
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
  "due date",
  "start date",
  "end date",
  "tags",
  "requiredTaskIds",
];

/* exported archiveTasks */
function archiveTasks(array) {
  array.forEach((task) => {
    let removedTask = removeTasks([task.id])[0];
    window.records.push(removedTask);
  });
}

/* exported getTasksWithNoDueDate */
function getTasksWithNoDueDate(array = tasks) {
  let tasksWithoutDeadline = [];
  array.forEach((task) => {
    if (Object.hasOwn(task, "due date") === false) {
      tasksWithoutDeadline.push(task);
    }
  });
  return tasksWithoutDeadline;
}

/* exported ListConfiguration */
function ListConfiguration(obj) {
  if (this instanceof ListConfiguration === false) {
    return new ListConfiguration(obj);
  }
  if (Object.hasOwn(obj, "name") === false) {
    return console.error("object parameter is missing a name property");
  }
  this.name = obj.name;
  if (Object.hasOwn(obj, "tagOption")) {
    this.tagOption = obj.tagOption;
  } else {
    this.tagOption = "disregard tags";
  }
  if (Object.hasOwn(obj, "tags")) {
    this.tags = obj.tags;
  } else {
    this.tags = [];
  }
  if (Object.hasOwn(obj, "showOverdue")) {
    this.showOverdue = obj.showOverdue;
  } else {
    this.showOverdue = true;
  }
  if (Object.hasOwn(obj, "showPending")) {
    this.showPending = obj.showPending;
  } else {
    this.showPending = true;
  }
  if (Object.hasOwn(obj, "showCompleted")) {
    this.showCompleted = obj.showCompleted;
  } else {
    this.showCompleted = true;
  }
  if (Object.hasOwn(obj, "overdueSortProp")) {
    this.overdueSortProp = obj.overdueSortProp;
  } else {
    this.overdueSortProp = "due date";
  }
  if (Object.hasOwn(obj, "pendingSortProp")) {
    this.pendingSortProp = obj.pendingSortProp;
  } else {
    this.pendingSortProp = "due date";
  }
  if (Object.hasOwn(obj, "completedSortProp")) {
    this.completedSortProp = obj.completedSortProp;
  } else {
    this.completedSortProp = "end date";
  }
  if (Object.hasOwn(obj, "dateRangeProp")) {
    this.dateRangeProp = obj.dateRangeProp;
  } else {
    this.dateRangeProp = "do not apply";
  }
  if (Object.hasOwn(obj, "gracePeriod")) {
    this.gracePeriod = obj.gracePeriod;
  } else {
    this.gracePeriod = {
      type: "endless",
      length: 1,
    };
  }
  if (Object.hasOwn(obj, "timeSpan")) {
    this.timeSpan = obj.timeSpan;
  } else {
    this.timeSpan = {
      enabled: false,
      numberOfDays: 6,
    };
  }
  if (Object.hasOwn(obj, "dateRange")) {
    this.dateRange = obj.dateRange;
  } else {
    this.dateRange = {
      property: "due date",
      enabled: false,
      start: "",
      end: "",
    };
  }
}

function showTable(
  array = window.tasks,
  sortFn = window.sortTasksByStatus,
) {
  let sort = sortFn(array);
  if(array.length === 0){
    console.log('There are no task objects to display.')
  };
  array = [];
  sort.forEach(task=>{
    let text = task.getText(['title', 'description']);
    let tags = task.tags.length !== 0 ? task.tags.join(' ') : ' ';
    let statusPropertyValues = ["overdue (!)", "... pending", "completed"];
    let taskStatus = statusPropertyValues[task.getStatus() + 1];
    array.push({
      "id": task.id,
      "task": text,
      "due-date": task.dueDate,
      "tags": tags,
      "status": taskStatus,
    });
  });
  console.table(array);
}

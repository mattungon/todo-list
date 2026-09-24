const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");

taskForm.addEventListener("submit", handleTaskSubmit);

function handleTaskSubmit(event) {
    event.preventDefault();

    const taskText = taskInput.value.trim();

    if (!taskText) {
        alert("Write a task first. I am not doing your thinking for you.");
        taskInput.focus();
        return;
    }

    const li = document.createElement("li");

    li.textContent = taskText;

    taskList.appendChild(li);

    emptyState.hidden = true;

    taskInput.value = "";
    taskInput.focus();
}

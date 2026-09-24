const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const prioritySelect = document.querySelector("#priority-select");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const taskCount = document.querySelector("#task-count");

taskForm.addEventListener("submit", handleTaskSubmit);

function updateTaskCount() {
    const count = taskList.childElementCount;

    if (count === 0) {
        taskCount.textContent = "No tasks yet";
        return;
    }

    if (count === 1) {
        taskCount.textContent = "1 task today";
        return;
    }

    taskCount.textContent = `${count} tasks today`;
}

function handleTaskSubmit(event) {
    event.preventDefault();

    const taskText = taskInput.value.trim();
    const priority = prioritySelect.value;

    if (!taskText) {
        alert("Write a task first. I am not doing your thinking for you.");
        taskInput.focus();
        return;
    }

    const li = document.createElement("li");
    li.className = "task-item";

    const taskIcon = document.createElement("span");
    taskIcon.className = "task-icon";
    taskIcon.textContent = "✦";
    taskIcon.setAttribute("aria-hidden", "true");

    const taskLabel = document.createElement("span");
    taskLabel.className = "task-text";
    taskLabel.textContent = taskText;

    const priorityBadge = document.createElement("span");
    priorityBadge.className = `priority-badge priority-${priority}`;
    priorityBadge.textContent = priority;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-task";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete task: ${taskText}`);

    deleteButton.addEventListener("click", () => {
        li.remove();

        updateTaskCount();

        if (taskList.childElementCount === 0) {
            emptyState.hidden = false;
        }
    });

    li.appendChild(taskIcon);
    li.appendChild(taskLabel);
    li.appendChild(priorityBadge);
    li.appendChild(deleteButton);

    taskList.appendChild(li);

    updateTaskCount();

    emptyState.hidden = true;

    taskInput.value = "";
    taskInput.focus();
}

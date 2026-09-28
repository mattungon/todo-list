const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const prioritySelect = document.querySelector("#priority-select");
const dueDateInput = document.querySelector("#due-date");
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

function getDueDateDetails(dateValue) {
    if (!dateValue) {
        return {
            text: "No due date",
            status: "none",
        };
    }

    const dueDate = new Date(`${dateValue}T00:00:00`);
    const today = new Date();

    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (dueDate.getTime() < today.getTime()) {
        return {
            text: "Overdue",
            status: "overdue",
        };
    }

    if (dueDate.getTime() === today.getTime()) {
        return {
            text: "Due today",
            status: "today",
        };
    }

    if (dueDate.getTime() === tomorrow.getTime()) {
        return {
            text: "Due tomorrow",
            status: "tomorrow",
        };
    }

    return {
        text: `Due ${dueDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        })}`,
        status: "future",
    };
}

function handleTaskSubmit(event) {
    event.preventDefault();

    const taskText = taskInput.value.trim();
    const priority = prioritySelect.value;
    const dueDate = dueDateInput.value;

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

    const dueDateDetails = getDueDateDetails(dueDate);

    const dueDateLabel = document.createElement("span");
    dueDateLabel.className = `due-date due-date-${dueDateDetails.status}`;
    dueDateLabel.textContent = dueDateDetails.text;

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
    li.appendChild(dueDateLabel);
    li.appendChild(deleteButton);

    taskList.appendChild(li);

    updateTaskCount();

    emptyState.hidden = true;

    taskInput.value = "";
    dueDateInput.value = "";
    taskInput.focus();
}

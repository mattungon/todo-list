const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const prioritySelect = document.querySelector("#priority-select");
const dueDateInput = document.querySelector("#due-date");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const taskCount = document.querySelector("#task-count");
const companionMessage = document.querySelector("#companion-message");
const filterButtons = document.querySelectorAll(".filter-button");
const clearCompletedButton = document.querySelector("#clear-completed");

const storageKey = "momentum-tasks";
let tasks = [];
let currentFilter = "all";

const addTaskMessages = [
    "Another task? Fine. Put it on the list.",
    "Good. Momentum is built one task at a time.",
    "A plan. How unexpectedly responsible of you.",
    "Added. Now do not just admire the list.",
];

const deleteTaskMessages = [
    "Gone. Try not to make a habit of it.",
    "Removed. One less thing for future-you to avoid.",
    "Deleted. I saw nothing.",
    "That task has left the realm of possibility.",
];

const emptyTaskMessages = [
    "Nothing left? Suspiciously productive.",
    "The list is clear. Enjoy this rare victory.",
    "No tasks remain. Veyra is almost impressed.",
];

const completeTaskMessages = [
    "Completed. Veyra reluctantly approves.",
    "One task down. Keep the streak alive.",
    "Done. See? You are capable of progress.",
];

const incompleteTaskMessages = [
    "Back on the list. No judgment. Much.",
    "Unfinished again? Veyra has questions.",
    "Restored. Finish it when you are ready.",
];

const clearCompletedMessages = [
    "Clean slate. Your completed tasks have been archived to nowhere.",
    "Cleared. Veyra approves of removing evidence.",
    "Finished tasks removed. The list looks less intimidating now.",
];

taskForm.addEventListener("submit", handleTaskSubmit);

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        setActiveFilter(button);
        renderTasks();
    });
});

clearCompletedButton.addEventListener("click", () => {
    tasks = tasks.filter((task) => !task.completed);

    saveTasks();
    renderTasks();

    if (tasks.length === 0) {
        showCompanionMessage(emptyTaskMessages);
        return;
    }

    showCompanionMessage(clearCompletedMessages);
});

loadTasks();
renderTasks();

function saveTasks() {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem(storageKey);

    if (!savedTasks) {
        tasks = [];
        return;
    }

    try {
        const parsedTasks = JSON.parse(savedTasks);

        tasks = Array.isArray(parsedTasks) ? parsedTasks : [];
    } catch {
        tasks = [];
    }
}

function showCompanionMessage(messages) {
    const randomIndex = Math.floor(Math.random() * messages.length);

    companionMessage.textContent = messages[randomIndex];
}

function updateTaskCount() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;

    clearCompletedButton.disabled = completedTasks === 0;

    if (totalTasks === 0) {
        taskCount.textContent = "No tasks yet";
        return;
    }

    const taskWord = totalTasks === 1 ? "task" : "tasks";

    taskCount.textContent = `${completedTasks} of ${totalTasks} ${taskWord} complete`;
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

function shouldShowTask(task) {
    return (
        currentFilter === "all" ||
        (currentFilter === "active" && !task.completed) ||
        (currentFilter === "completed" && task.completed)
    );
}

function setActiveFilter(selectedButton) {
    filterButtons.forEach((button) => {
        const isSelected = button === selectedButton;

        button.classList.toggle("is-active", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
    });
}

function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach((task) => {
        if (shouldShowTask(task)) {
            taskList.appendChild(createTaskElement(task));
        }
    });

    updateTaskCount();
    emptyState.hidden = tasks.length !== 0;
}

function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = "task-item";

    if (task.completed) {
        li.classList.add("task-completed");
    }

    const completeButton = document.createElement("button");
    completeButton.className = "complete-task";
    completeButton.type = "button";
    completeButton.textContent = task.completed ? "↺" : "✓";
    completeButton.setAttribute(
        "aria-label",
        task.completed
            ? `Mark task incomplete: ${task.text}`
            : `Mark task complete: ${task.text}`,
    );
    completeButton.setAttribute("aria-pressed", String(task.completed));

    completeButton.addEventListener("click", () => {
        task.completed = !task.completed;

        saveTasks();
        renderTasks();

        if (task.completed) {
            showCompanionMessage(completeTaskMessages);
            return;
        }

        showCompanionMessage(incompleteTaskMessages);
    });

    const taskIcon = document.createElement("span");
    taskIcon.className = "task-icon";
    taskIcon.textContent = "✦";
    taskIcon.setAttribute("aria-hidden", "true");

    const taskLabel = document.createElement("span");
    taskLabel.className = "task-text";
    taskLabel.textContent = task.text;

    const priorityBadge = document.createElement("span");
    priorityBadge.className = `priority-badge priority-${task.priority}`;
    priorityBadge.textContent = task.priority;

    const dueDateDetails = getDueDateDetails(task.dueDate);

    const dueDateLabel = document.createElement("span");
    dueDateLabel.className = `due-date due-date-${dueDateDetails.status}`;
    dueDateLabel.textContent = dueDateDetails.text;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-task";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete task: ${task.text}`);

    deleteButton.addEventListener("click", () => {
        tasks = tasks.filter((currentTask) => currentTask.id !== task.id);

        saveTasks();
        renderTasks();

        if (tasks.length === 0) {
            showCompanionMessage(emptyTaskMessages);
            return;
        }

        showCompanionMessage(deleteTaskMessages);
    });

    li.appendChild(completeButton);
    li.appendChild(taskIcon);
    li.appendChild(taskLabel);
    li.appendChild(priorityBadge);
    li.appendChild(dueDateLabel);
    li.appendChild(deleteButton);

    return li;
}

function handleTaskSubmit(event) {
    event.preventDefault();

    const taskText = taskInput.value.trim();

    if (!taskText) {
        alert("Write a task first. I am not doing your thinking for you.");
        taskInput.focus();
        return;
    }

    const newTask = {
        id: crypto.randomUUID(),
        text: taskText,
        priority: prioritySelect.value,
        dueDate: dueDateInput.value,
        completed: false,
    };

    tasks.push(newTask);

    saveTasks();
    renderTasks();
    showCompanionMessage(addTaskMessages);

    taskInput.value = "";
    dueDateInput.value = "";
    taskInput.focus();
}

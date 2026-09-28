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
const saveStatus = document.querySelector("#save-status");

const storageKey = "momentum-tasks";
let tasks = [];
let currentFilter = "all";
let saveStatusTimeout;

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
    showSaveStatus();
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
function showSaveStatus() {
    clearTimeout(saveStatusTimeout);

    saveStatus.textContent = "Saved locally";
    saveStatus.classList.add("is-visible");

    saveStatusTimeout = setTimeout(() => {
        saveStatus.classList.remove("is-visible");
    }, 2200);
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

function startEditingTask(task, taskLabel) {
    const editInput = document.createElement("input");
    editInput.className = "task-edit-input";
    editInput.type = "text";
    editInput.value = task.text;
    editInput.maxLength = 100;
    editInput.setAttribute("aria-label", "Edit task title");

    const editActions = document.createElement("div");
    editActions.className = "task-edit-actions";

    const saveButton = document.createElement("button");
    saveButton.className = "save-edit";
    saveButton.type = "button";
    saveButton.textContent = "Save";

    const cancelButton = document.createElement("button");
    cancelButton.className = "cancel-edit";
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";

    function finishEditing(shouldSave) {
        const newText = editInput.value.trim();

        if (shouldSave && newText) {
            task.text = newText;
            saveTasks();
        }

        renderTasks();
    }

    saveButton.addEventListener("click", () => {
        finishEditing(true);
    });

    cancelButton.addEventListener("click", () => {
        finishEditing(false);
    });

    editInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            finishEditing(true);
        }

        if (event.key === "Escape") {
            finishEditing(false);
        }
    });

    taskLabel.replaceWith(editInput);

    editActions.appendChild(saveButton);
    editActions.appendChild(cancelButton);
    editInput.after(editActions);

    editInput.focus();
    editInput.select();
}

function startEditingPriority(task, priorityBadge) {
    const prioritySelect = document.createElement("select");
    prioritySelect.className = "priority-edit-select";
    prioritySelect.setAttribute(
        "aria-label",
        `Change priority for ${task.text}`,
    );

    const priorityOptions = [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
    ];

    priorityOptions.forEach((priorityOption) => {
        const option = document.createElement("option");
        option.value = priorityOption.value;
        option.textContent = priorityOption.label;

        if (priorityOption.value === task.priority) {
            option.selected = true;
        }

        prioritySelect.appendChild(option);
    });

    function finishPriorityEditing(shouldSave) {
        if (shouldSave) {
            task.priority = prioritySelect.value;
            saveTasks();
            showCompanionMessage([
                "Priority adjusted. Veyra acknowledges the urgency.",
                "Updated. Try respecting your own priorities now.",
                "Priority changed. The task knows its place.",
            ]);
        }

        renderTasks();
    }

    prioritySelect.addEventListener("change", () => {
        finishPriorityEditing(true);
    });

    prioritySelect.addEventListener("blur", () => {
        finishPriorityEditing(false);
    });

    prioritySelect.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            prioritySelect.value = task.priority;
            finishPriorityEditing(false);
        }
    });

    priorityBadge.replaceWith(prioritySelect);

    prioritySelect.focus();
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

    const priorityBadge = document.createElement("button");
    priorityBadge.className = `priority-badge priority-${task.priority}`;
    priorityBadge.type = "button";
    priorityBadge.textContent = task.priority;
    priorityBadge.setAttribute(
        "aria-label",
        `Change priority for ${task.text}. Current priority: ${task.priority}`,
    );

    priorityBadge.addEventListener("click", () => {
        startEditingPriority(task, priorityBadge);
    });

    const dueDateDetails = getDueDateDetails(task.dueDate);

    const dueDateLabel = document.createElement("span");
    dueDateLabel.className = `due-date due-date-${dueDateDetails.status}`;
    dueDateLabel.textContent = dueDateDetails.text;

    const editButton = document.createElement("button");
    editButton.className = "edit-task";
    editButton.type = "button";
    editButton.textContent = "✎";
    editButton.setAttribute("aria-label", `Edit task: ${task.text}`);

    editButton.addEventListener("click", () => {
        startEditingTask(task, taskLabel);
    });

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
    li.appendChild(editButton);
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

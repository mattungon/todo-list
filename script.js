const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskDetailsInput = document.querySelector("#task-details");
const prioritySelect = document.querySelector("#priority-select");
const dueDateInput = document.querySelector("#due-date");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const taskCount = document.querySelector("#task-count");
const companionCard = document.querySelector("#companion-card");
const companionMessage = document.querySelector("#companion-message");
const mimo = document.querySelector("#mimo");
const filterButtons = document.querySelectorAll(".filter-button");
const clearCompletedButton = document.querySelector("#clear-completed");
const saveStatus = document.querySelector("#save-status");
const sortSelect = document.querySelector("#sort-select");
const taskSearchInput = document.querySelector("#task-search-input");
const clearDialog = document.querySelector("#clear-dialog");
const clearDialogMessage = document.querySelector("#clear-dialog-message");
const undoToast = document.querySelector("#undo-toast");
const undoMessage = document.querySelector("#undo-message");
const undoButton = document.querySelector("#undo-button");
const dailySummary = document.querySelector("#daily-summary");
const startFreshButton = document.querySelector("#start-fresh");
const todoApp = document.querySelector(".todo-app");
const shortcutDialog = document.querySelector("#shortcut-dialog");
const shortcutDialogClose = document.querySelector("#shortcut-dialog-close");
const themeToggle = document.querySelector("#theme-toggle");
const themeToggleText = document.querySelector("#theme-toggle-text");

const storageKey = "momentum-tasks";
const sortStorageKey = "momentum-sort";
const themeStorageKey = "momentum-theme";

let tasks = [];
let currentFilter = "all";
let currentSort = "newest";
let currentSearch = "";
let saveStatusTimeout;
let deletedTask = null;
let deletedTaskIndex = null;
let undoTimeout;
let cleanupAction = "clear";
let draggedTaskId = null;
let storageAvailable = true;
let mimoReactionTimeout;

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
    "Nothing left? Mimo is impressed.",
    "The list is clear. Enjoy this tiny victory.",
    "No tasks remain. Mimo gives you a gold star.",
];

const completeTaskMessages = [
    "Completed! Mimo is doing a happy hop.",
    "One task down. Keep the streak alive.",
    "Done. Mimo knew you could do it.",
];

const incompleteTaskMessages = [
    "Back on the list. Mimo will wait.",
    "Unfinished again? It happens. Try once more.",
    "Restored. Mimo believes in a second attempt.",
];

const clearCompletedMessages = [
    "Clean slate. Mimo swept away the finished tasks.",
    "Cleared. Your list looks lighter now.",
    "Finished tasks removed. Mimo approves of the tidying.",
];

const allCompleteMessages = [
    "Every task is complete! Mimo is celebrating!",
    "The list is conquered. Mimo gives you a star.",
    "All done. Momentum achieved!",
];

const startFreshMessages = [
    "A fresh start. Mimo is ready for today.",
    "Yesterday is cleared away. Today gets your focus.",
    "New page, fresh paws, same capable you.",
];

const taskOrderMessages = [
    "Moved. Mimo put the task exactly where you wanted.",
    "Reordered. A tidy list makes Mimo happy.",
    "Task position updated. Nice organization.",
];

const storageMessages = {
    saved: "Saved locally.",
    failed: "Mimo could not save this change. Check your browser storage settings.",
    unavailable:
        "Local saving is unavailable. Your changes may disappear after refresh.",
};

const mimoReactionClasses = [
    "is-proud",
    "is-celebrating",
    "is-skeptical",
    "is-annoyed",
    "is-relieved",
];

/* Event listeners */

if (shortcutDialogClose && shortcutDialog) {
    shortcutDialogClose.addEventListener("click", () => {
        shortcutDialog.close();
        taskInput.focus();
    });

    shortcutDialog.addEventListener("click", (event) => {
        if (event.target === shortcutDialog) {
            shortcutDialog.close();
        }
    });
}

window.addEventListener("keydown", (event) => {
    const activeElement = document.activeElement;

    const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.isContentEditable;

    if (event.key === "Escape") {
        if (shortcutDialog?.open) {
            shortcutDialog.close();
            return;
        }

        if (document.activeElement === taskSearchInput) {
            taskSearchInput.value = "";
            currentSearch = "";
            renderTasks();
            taskInput.focus();
        }

        return;
    }

    if (isTyping) {
        return;
    }

    if (event.key === "/") {
        event.preventDefault();
        taskSearchInput.focus();
        taskSearchInput.select();
        return;
    }

    if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        taskInput.focus();
        return;
    }

    if (event.key === "?") {
        event.preventDefault();

        if (shortcutDialog && !shortcutDialog.open) {
            shortcutDialog.showModal();
        }
    }
});

taskForm.addEventListener("submit", handleTaskSubmit);

taskInput.addEventListener("input", resizeTaskInput);
resizeTaskInput();

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const nextTheme =
            document.documentElement.dataset.theme === "day" ? "night" : "day";

        applyTheme(nextTheme);

        try {
            localStorage.setItem(themeStorageKey, nextTheme);
        } catch (error) {
            console.error("Momentum could not save theme preference:", error);
            showSaveStatus(storageMessages.failed);
        }


        showCompanionMessage(
            nextTheme === "day"
                ? [
                      "Sunlight mode activated. Mimo approves of the brightness.",
                      "A bright new day for small wins.",
                      "Day mode on. Mimo found the sunshine.",
                  ]
                : [
                      "Moonlight mode restored. Mimo feels at home.",
                      "Night mode on. Cozy focus returns.",
                      "Back to the stars. Mimo is ready.",
                  ],
        );

        triggerMimoReaction(nextTheme === "day" ? "is-proud" : "is-relieved");
    });
}
taskInput.addEventListener("keydown", (event) => {
    const shouldSubmit =
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey;

    if (shouldSubmit) {
        event.preventDefault();
        taskForm.requestSubmit();
    }
});

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        setActiveFilter(button);
        renderTasks();
    });
});

clearCompletedButton.addEventListener("click", () => {
    const completedTaskCount = tasks.filter((task) => task.completed).length;
    const taskWord = completedTaskCount === 1 ? "task" : "tasks";

    cleanupAction = "clear";

    clearDialog.querySelector("#clear-dialog-title").textContent =
        "Clear completed tasks?";

    clearDialogMessage.textContent = `This will permanently remove ${completedTaskCount} completed ${taskWord} from Momentum.`;

    clearDialog.querySelector(".dialog-confirm").textContent = "Clear tasks";

    clearDialog.showModal();
});

startFreshButton.addEventListener("click", () => {
    const completedTaskCount = tasks.filter((task) => task.completed).length;
    const taskWord = completedTaskCount === 1 ? "task" : "tasks";

    cleanupAction = "fresh";

    clearDialog.querySelector("#clear-dialog-title").textContent =
        "Start fresh?";

    clearDialogMessage.textContent = `This will remove ${completedTaskCount} completed ${taskWord}. Your active tasks will stay on the list.`;

    clearDialog.querySelector(".dialog-confirm").textContent = "Start fresh";

    clearDialog.showModal();
});

clearDialog.addEventListener("close", () => {
    if (clearDialog.returnValue !== "confirm") {
        return;
    }

    tasks = tasks.filter((task) => !task.completed);

    saveTasks();
    renderTasks();

    if (tasks.length === 0) {
        showCompanionMessage(emptyTaskMessages);
        triggerMimoReaction("is-relieved");
        return;
    }

    showCompanionMessage(
        cleanupAction === "fresh" ? startFreshMessages : clearCompletedMessages,
    );

    triggerMimoReaction("is-relieved");
});

undoButton.addEventListener("click", () => {
    if (!deletedTask) {
        return;
    }

    tasks.splice(deletedTaskIndex, 0, deletedTask);

    currentFilter = "all";
    currentSearch = "";
    taskSearchInput.value = "";

    const allFilterButton = document.querySelector(
        '.filter-button[data-filter="all"]',
    );

    setActiveFilter(allFilterButton);

    saveTasks();
    renderTasks();

    showCompanionMessage([
        "Restored. Mimo saved it from the void.",
        "The task returns. Mimo offers moral support.",
        "Undo accepted. A rare and fluffy second chance.",
    ]);

    triggerMimoReaction("is-annoyed");
    hideUndoToast();
});

sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;

    try {
        localStorage.setItem(sortStorageKey, currentSort);
        storageAvailable = true;
    } catch (error) {
        storageAvailable = false;

        console.error("Momentum could not save sort preference:", error);

        showSaveStatus(storageMessages.failed);
    }

    renderTasks();
});

taskSearchInput.addEventListener("input", () => {
    currentSearch = taskSearchInput.value.trim().toLowerCase();
    renderTasks();
});

window.addEventListener("storage", (event) => {
    if (event.key === storageKey) {
        const isEditing =
            document.querySelector(".task-edit-input") ||
            document.querySelector(".priority-edit-select") ||
            document.querySelector(".due-date-input");

        if (isEditing) {
            showCompanionMessage([
                "Another tab changed the list. Finish this edit before refreshing.",
                "The other Momentum window made a change. Your edit is still active.",
            ]);
            return;
        }

        loadTasks();
        renderTasks();

        showCompanionMessage([
            "Another Momentum window changed the list.",
            "The list synchronized. Mimo noticed.",
            "Tasks updated from another tab.",
        ]);

        triggerMimoReaction("is-skeptical");
    }

    if (event.key === sortStorageKey) {
        loadSortPreference();
        renderTasks();
    }

    if (event.key === themeStorageKey) {
        applyTheme(event.newValue === "day" ? "day" : "night");
    }
});

/* Startup */

loadThemePreference();
loadTasks();
loadSortPreference();
renderTasks();

/* Sorting and storage */

function getSortedTasks() {
    const priorityOrder = {
        high: 0,
        medium: 1,
        low: 2,
    };

    if (currentSort === "manual") {
        return [...tasks];
    }

    return [...tasks].sort((firstTask, secondTask) => {
        const completionDifference =
            Number(firstTask.completed) - Number(secondTask.completed);

        if (completionDifference !== 0) {
            return completionDifference;
        }

        if (currentSort === "due-date") {
            const firstDate = firstTask.dueDate || "9999-12-31";
            const secondDate = secondTask.dueDate || "9999-12-31";

            return firstDate.localeCompare(secondDate);
        }

        if (currentSort === "priority") {
            const priorityDifference =
                priorityOrder[firstTask.priority] -
                priorityOrder[secondTask.priority];

            if (priorityDifference !== 0) {
                return priorityDifference;
            }

            return firstTask.text.localeCompare(secondTask.text);
        }

        if (currentSort === "active-first") {
            return firstTask.text.localeCompare(secondTask.text);
        }

        const firstCreatedAt = firstTask.createdAt || 0;
        const secondCreatedAt = secondTask.createdAt || 0;

        return secondCreatedAt - firstCreatedAt;
    });
}

function saveTasks() {
    const serializedTasks = JSON.stringify(tasks);

    try {
        localStorage.setItem(storageKey, serializedTasks);
        storageAvailable = true;
        showSaveStatus(storageMessages.saved);
        return true;
    } catch (error) {
        storageAvailable = false;

        console.error("Momentum could not save tasks:", error);

        showSaveStatus(storageMessages.failed);

        showCompanionMessage([
            storageMessages.failed,
            "The change exists for now, but local saving failed.",
            "Storage refused the update. Mimo is concerned.",
        ]);

        triggerMimoReaction("is-annoyed");

        return false;
    }
}

function loadTasks() {
    let savedTasks;

    try {
        savedTasks = localStorage.getItem(storageKey);
        storageAvailable = true;
    } catch (error) {
        storageAvailable = false;
        tasks = [];

        console.error("Momentum could not read tasks:", error);

        showSaveStatus(storageMessages.unavailable);
        return;
    }

    if (!savedTasks) {
        tasks = [];
        return;
    }

    try {
        const parsedTasks = JSON.parse(savedTasks);
        const validPriorities = ["low", "medium", "high"];

        tasks = Array.isArray(parsedTasks)
            ? parsedTasks.map((task) => ({
                  id:
                      typeof task.id === "string" && task.id
                          ? task.id
                          : crypto.randomUUID?.() ||
                            `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                  text: typeof task.text === "string" ? task.text : "",
                  details: typeof task.details === "string" ? task.details : "",
                  priority: validPriorities.includes(task.priority)
                      ? task.priority
                      : "medium",
                  dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
                  completed: Boolean(task.completed),
                  completedAt: task.completedAt || null,
                  createdAt: Number(task.createdAt) || Date.now(),
              }))
            : [];
    } catch (error) {
        tasks = [];

        console.error("Momentum found invalid saved task data:", error);

        showCompanionMessage([
            "The saved task data was unreadable, so the list was reset.",
            "Mimo found tangled task magic and cleared the damage.",
        ]);

        triggerMimoReaction("is-annoyed");
    }
}

function loadSortPreference() {
    let savedSort;

    try {
        savedSort = localStorage.getItem(sortStorageKey);
        storageAvailable = true;
    } catch (error) {
        storageAvailable = false;

        console.error("Momentum could not read sort preference:", error);

        showSaveStatus(storageMessages.unavailable);
        return;
    }

    const validSortValues = [
        "newest",
        "due-date",
        "priority",
        "active-first",
        "manual",
    ];

    if (validSortValues.includes(savedSort)) {
        currentSort = savedSort;
        sortSelect.value = savedSort;
    }
}

function applyTheme(theme) {
    const isDayTheme = theme === "day";

    document.documentElement.dataset.theme = isDayTheme ? "day" : "night";

    if (themeToggle) {
        themeToggle.setAttribute("aria-pressed", String(isDayTheme));

        themeToggle.setAttribute(
            "aria-label",
            isDayTheme ? "Switch to night theme" : "Switch to day theme",
        );
    }

    if (themeToggleText) {
        themeToggleText.textContent = isDayTheme ? "Night mode" : "Day mode";
    }
}

function loadThemePreference() {
    let savedTheme;

    try {
        savedTheme = localStorage.getItem(themeStorageKey);
    } catch (error) {
        console.error("Momentum could not read theme preference:", error);
        applyTheme("night");
        return;
    }

    applyTheme(savedTheme === "day" ? "day" : "night");
}

/* Shared helpers */

function resizeTaskInput() {
    taskInput.style.height = "auto";

    const maximumHeight = 180;
    const nextHeight = Math.min(taskInput.scrollHeight, maximumHeight);

    taskInput.style.height = `${nextHeight}px`;
    taskInput.style.overflowY =
        taskInput.scrollHeight > maximumHeight ? "auto" : "hidden";
}

function showCompanionMessage(messages) {
    const randomIndex = Math.floor(Math.random() * messages.length);
    companionMessage.textContent = messages[randomIndex];
}

function triggerMimoReaction(reaction) {
    if (!companionCard || !mimo || !mimoReactionClasses.includes(reaction)) {
        return;
    }

    clearTimeout(mimoReactionTimeout);

    companionCard.classList.remove(...mimoReactionClasses);
    mimo.classList.remove(...mimoReactionClasses);

    requestAnimationFrame(() => {
        companionCard.classList.add(reaction);
        mimo.classList.add(reaction);
    });

    mimoReactionTimeout = setTimeout(() => {
        companionCard.classList.remove(reaction);
        mimo.classList.remove(reaction);
    }, 1050);
}

function showSaveStatus(message = storageMessages.saved) {
    clearTimeout(saveStatusTimeout);

    saveStatus.textContent = message;
    saveStatus.classList.add("is-visible");

    saveStatusTimeout = setTimeout(() => {
        saveStatus.classList.remove("is-visible");
    }, 2600);
}

function showUndoToast(task, taskIndex) {
    clearTimeout(undoTimeout);

    deletedTask = task;
    deletedTaskIndex = taskIndex;

    undoMessage.textContent = `“${task.text}” deleted.`;
    undoToast.hidden = false;

    undoTimeout = setTimeout(() => {
        hideUndoToast();
    }, 5000);
}

function hideUndoToast() {
    clearTimeout(undoTimeout);

    deletedTask = null;
    deletedTaskIndex = null;
    undoToast.hidden = true;
}

/* Task ordering */

function moveTask(taskId, direction) {
    const currentIndex = tasks.findIndex((task) => task.id === taskId);

    if (currentIndex === -1) {
        return;
    }

    const targetIndex = currentIndex + direction;

    if (targetIndex < 0 || targetIndex >= tasks.length) {
        return;
    }

    const [movedTask] = tasks.splice(currentIndex, 1);
    tasks.splice(targetIndex, 0, movedTask);

    saveTasks();
    renderTasks();
    showCompanionMessage(taskOrderMessages);
    triggerMimoReaction("is-skeptical");
}

function reorderTaskByDrag(draggedTaskId, targetTaskId) {
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
        return;
    }

    const draggedIndex = tasks.findIndex((task) => task.id === draggedTaskId);
    const targetIndex = tasks.findIndex((task) => task.id === targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) {
        return;
    }

    const [draggedTask] = tasks.splice(draggedIndex, 1);

    const updatedTargetIndex = tasks.findIndex(
        (task) => task.id === targetTaskId,
    );

    tasks.splice(updatedTargetIndex, 0, draggedTask);

    saveTasks();
    renderTasks();
    showCompanionMessage(taskOrderMessages);
    triggerMimoReaction("is-skeptical");
}

/* Task counts and dates */

function updateTaskCount() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;

    clearCompletedButton.disabled = completedTasks === 0;
    startFreshButton.disabled = completedTasks === 0;

    if (totalTasks === 0) {
        taskCount.textContent = "No tasks yet";
        updateDailySummary();
        return;
    }

    const taskWord = totalTasks === 1 ? "task" : "tasks";

    taskCount.textContent = `${completedTasks} of ${totalTasks} ${taskWord} complete`;

    updateDailySummary();
}

function getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function updateDailySummary() {
    const todayKey = getLocalDateKey(new Date());

    const completedToday = tasks.filter((task) => {
        if (!task.completedAt) {
            return false;
        }

        return getLocalDateKey(new Date(task.completedAt)) === todayKey;
    }).length;

    if (completedToday === 0) {
        dailySummary.textContent = "No tasks completed today";
        return;
    }

    const taskWord = completedToday === 1 ? "task" : "tasks";

    dailySummary.textContent = `${completedToday} ${taskWord} completed today`;
}

function celebrateAllTasksComplete() {
    const hasTasks = tasks.length > 0;
    const allTasksCompleted = tasks.every((task) => task.completed);

    if (!hasTasks || !allTasksCompleted) {
        return;
    }

    todoApp.classList.remove("all-complete");

    requestAnimationFrame(() => {
        todoApp.classList.add("all-complete");
    });

    showCompanionMessage(allCompleteMessages);
    triggerMimoReaction("is-celebrating");
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

/* Filtering and rendering */

function shouldShowTask(task) {
    const matchesFilter =
        currentFilter === "all" ||
        (currentFilter === "active" && !task.completed) ||
        (currentFilter === "completed" && task.completed);

    const taskText = task.text.toLowerCase();
    const taskDetails = task.details.toLowerCase();
    const matchesSearch =
        taskText.includes(currentSearch) || taskDetails.includes(currentSearch);

    return matchesFilter && matchesSearch;
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

    getSortedTasks().forEach((task) => {
        if (shouldShowTask(task)) {
            taskList.appendChild(createTaskElement(task));
        }
    });

    updateTaskCount();
    emptyState.hidden = tasks.length !== 0;
}

/* Editing */

function startEditingTask(task, taskLabel) {
    const editInput = document.createElement("input");
    editInput.className = "task-edit-input";
    editInput.type = "text";
    editInput.value = task.text;
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

            showCompanionMessage([
                "Task wording updated. Mimo accepts the revision.",
                "Edited. Future-you will appreciate the clarity.",
                "Updated. Now the task knows what it is.",
            ]);
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
    const priorityEditor = document.createElement("select");
    priorityEditor.className = "priority-edit-select";
    priorityEditor.setAttribute(
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

        priorityEditor.appendChild(option);
    });

    function finishPriorityEditing(shouldSave) {
        if (shouldSave) {
            task.priority = priorityEditor.value;
            saveTasks();

            showCompanionMessage([
                "Priority adjusted. Mimo understands the urgency.",
                "Updated. A clear priority helps a lot.",
                "Priority changed. Mimo filed it carefully.",
            ]);

            triggerMimoReaction("is-skeptical");
        }

        renderTasks();
    }

    priorityEditor.addEventListener("change", () => {
        finishPriorityEditing(true);
    });

    priorityEditor.addEventListener("blur", () => {
        finishPriorityEditing(false);
    });

    priorityEditor.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            priorityEditor.value = task.priority;
            finishPriorityEditing(false);
        }
    });

    priorityBadge.replaceWith(priorityEditor);
    priorityEditor.focus();
}

function startEditingDueDate(task, dueDateLabel) {
    const dueDateEditor = document.createElement("div");
    dueDateEditor.className = "due-date-editor";

    const dueDateField = document.createElement("input");
    dueDateField.className = "due-date-input";
    dueDateField.type = "date";
    dueDateField.value = task.dueDate;
    dueDateField.setAttribute("aria-label", `Change due date for ${task.text}`);

    const clearDateButton = document.createElement("button");
    clearDateButton.className = "clear-date";
    clearDateButton.type = "button";
    clearDateButton.textContent = "Clear";
    clearDateButton.setAttribute(
        "aria-label",
        `Clear due date for ${task.text}`,
    );

    function finishDueDateEditing(shouldSave) {
        if (shouldSave) {
            task.dueDate = dueDateField.value;
            saveTasks();

            showCompanionMessage([
                "Due date updated. Mimo marked the calendar.",
                "New deadline noted. Mimo believes in you.",
                "Date changed. Time is now watching.",
            ]);

            triggerMimoReaction("is-skeptical");
        }

        renderTasks();
    }

    dueDateField.addEventListener("change", () => {
        finishDueDateEditing(true);
    });

    dueDateField.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            finishDueDateEditing(false);
        }
    });

    clearDateButton.addEventListener("click", () => {
        dueDateField.value = "";
        finishDueDateEditing(true);
    });

    dueDateLabel.replaceWith(dueDateEditor);

    dueDateEditor.appendChild(dueDateField);
    dueDateEditor.appendChild(clearDateButton);

    dueDateField.focus();
}

/* Task elements */

function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = "task-item";

    if (currentSort === "manual") {
        li.addEventListener("dragover", (event) => {
            event.preventDefault();
            li.classList.add("drag-over");
        });

        li.addEventListener("dragleave", () => {
            li.classList.remove("drag-over");
        });

        li.addEventListener("drop", (event) => {
            event.preventDefault();
            li.classList.remove("drag-over");

            reorderTaskByDrag(draggedTaskId, task.id);
            draggedTaskId = null;
        });
    }

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
        const taskIndex = tasks.findIndex(
            (currentTask) => currentTask.id === task.id,
        );

        if (taskIndex === -1) {
            return;
        }

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        tasks.splice(taskIndex, 1);

        if (task.completed) {
            tasks.push(task);
        } else {
            tasks.unshift(task);
        }

        saveTasks();
        renderTasks();

        if (task.completed) {
            const allTasksCompleted = tasks.every(
                (currentTask) => currentTask.completed,
            );

            if (allTasksCompleted) {
                celebrateAllTasksComplete();
                return;
            }

            showCompanionMessage(completeTaskMessages);
            triggerMimoReaction("is-proud");
            return;
        }

        showCompanionMessage(incompleteTaskMessages);
        triggerMimoReaction("is-annoyed");
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

    let detailsButton;
    let detailsPanel;

    if (task.details) {
        detailsButton = document.createElement("button");
        detailsButton.className = "task-details-toggle";
        detailsButton.type = "button";
        detailsButton.textContent = "ⓘ";
        detailsButton.setAttribute("aria-label", `Show info for ${task.text}`);
        detailsButton.setAttribute("aria-expanded", "false");

        detailsPanel = document.createElement("div");
        detailsPanel.className = "task-details-panel";
        detailsPanel.hidden = true;

        const detailsHeading = document.createElement("p");
        detailsHeading.className = "task-details-heading";
        detailsHeading.textContent = "Info";

        const detailsText = document.createElement("p");
        detailsText.className = "task-details-text";
        detailsText.textContent = task.details;

        detailsPanel.appendChild(detailsHeading);
        detailsPanel.appendChild(detailsText);

        detailsButton.addEventListener("click", () => {
            const willOpen = detailsPanel.hidden;

            detailsPanel.hidden = !willOpen;
            detailsButton.setAttribute("aria-expanded", String(willOpen));
            detailsButton.setAttribute(
                "aria-label",
                `${willOpen ? "Hide" : "Show"} info for ${task.text}`,
            );

            li.classList.toggle("has-open-details", willOpen);
        });
    }

    const dueDateDetails = getDueDateDetails(task.dueDate);

    const dueDateLabel = document.createElement("button");
    dueDateLabel.className = `due-date due-date-${dueDateDetails.status}`;
    dueDateLabel.type = "button";
    dueDateLabel.textContent = dueDateDetails.text;
    dueDateLabel.setAttribute(
        "aria-label",
        `Change due date for ${task.text}. Current date: ${dueDateDetails.text}`,
    );

    dueDateLabel.addEventListener("click", () => {
        startEditingDueDate(task, dueDateLabel);
    });

    const editButton = document.createElement("button");
    editButton.className = "edit-task";
    editButton.type = "button";
    editButton.textContent = "✎";
    editButton.setAttribute("aria-label", `Edit task: ${task.text}`);

    editButton.addEventListener("click", () => {
        startEditingTask(task, taskLabel);
    });

    let dragHandle;
    let orderControls;

    if (currentSort === "manual") {
        const taskIndex = tasks.findIndex(
            (currentTask) => currentTask.id === task.id,
        );

        dragHandle = document.createElement("button");
        dragHandle.className = "drag-handle";
        dragHandle.type = "button";
        dragHandle.textContent = "⠿";
        dragHandle.draggable = true;
        dragHandle.setAttribute("aria-label", `Drag to move ${task.text}`);
        dragHandle.setAttribute("title", "Drag to reorder task");

        dragHandle.addEventListener("dragstart", (event) => {
            draggedTaskId = task.id;

            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", task.id);

            li.classList.add("is-dragging");
        });

        dragHandle.addEventListener("dragend", () => {
            draggedTaskId = null;
            li.classList.remove("is-dragging");

            document
                .querySelectorAll(".task-item.drag-over")
                .forEach((taskItem) => {
                    taskItem.classList.remove("drag-over");
                });
        });

        orderControls = document.createElement("div");
        orderControls.className = "task-order-controls";
        orderControls.setAttribute("aria-label", `Move ${task.text}`);

        const moveUpButton = document.createElement("button");
        moveUpButton.className = "move-task";
        moveUpButton.type = "button";
        moveUpButton.textContent = "↑";
        moveUpButton.disabled = taskIndex === 0;
        moveUpButton.setAttribute("aria-label", `Move ${task.text} up`);

        moveUpButton.addEventListener("click", () => {
            moveTask(task.id, -1);
        });

        const moveDownButton = document.createElement("button");
        moveDownButton.className = "move-task";
        moveDownButton.type = "button";
        moveDownButton.textContent = "↓";
        moveDownButton.disabled = taskIndex === tasks.length - 1;
        moveDownButton.setAttribute("aria-label", `Move ${task.text} down`);

        moveDownButton.addEventListener("click", () => {
            moveTask(task.id, 1);
        });

        orderControls.appendChild(moveUpButton);
        orderControls.appendChild(moveDownButton);
    }

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-task";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete task: ${task.text}`);

    deleteButton.addEventListener("click", () => {
        const taskIndex = tasks.findIndex(
            (currentTask) => currentTask.id === task.id,
        );

        if (taskIndex === -1) {
            return;
        }

        tasks.splice(taskIndex, 1);

        saveTasks();
        renderTasks();
        showUndoToast(task, taskIndex);

        if (tasks.length === 0) {
            showCompanionMessage(emptyTaskMessages);
            triggerMimoReaction("is-annoyed");
            return;
        }

        showCompanionMessage(deleteTaskMessages);
        triggerMimoReaction("is-annoyed");
    });

    li.appendChild(completeButton);
    li.appendChild(taskIcon);
    li.appendChild(taskLabel);
    li.appendChild(priorityBadge);

    if (detailsButton) {
        li.appendChild(detailsButton);
    }

    li.appendChild(dueDateLabel);

    if (dragHandle) {
        li.appendChild(dragHandle);
    }

    if (orderControls) {
        li.appendChild(orderControls);
    }

    li.appendChild(editButton);
    li.appendChild(deleteButton);

    if (detailsPanel) {
        li.appendChild(detailsPanel);
    }

    return li;
}

/* Add task */

function handleTaskSubmit(event) {
    event.preventDefault();

    const taskText = taskInput.value.trim();
    const taskDetails = taskDetailsInput.value.trim();

    if (!taskText) {
        alert("Write a task first. Mimo cannot read your mind yet.");
        taskInput.focus();
        return;
    }

    const newTask = {
        id:
            crypto.randomUUID?.() ||
            `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text: taskText,
        details: taskDetails,
        priority: prioritySelect.value,
        dueDate: dueDateInput.value,
        completed: false,
        completedAt: null,
        createdAt: Date.now(),
    };

    tasks.push(newTask);

    saveTasks();
    renderTasks();
    showCompanionMessage(addTaskMessages);
    triggerMimoReaction("is-skeptical");

    taskInput.value = "";
    resizeTaskInput();

    taskDetailsInput.value = "";
    dueDateInput.value = "";
    taskInput.focus();
}

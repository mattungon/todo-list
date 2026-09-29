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

const storageKey = "momentum-tasks";
const sortStorageKey = "momentum-sort";

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

const allCompleteMessages = [
    "Every task is complete. Veyra is genuinely impressed.",
    "The list is conquered. Enjoy your victory.",
    "All done. Momentum achieved.",
];

const startFreshMessages = [
    "A fresh start. Keep the active tasks moving.",
    "Yesterday is cleared away. Today gets your focus.",
    "New page, same capable task mage.",
];

const taskOrderMessages = [
    "Moved. The list now follows your command.",
    "Reordered. Veyra approves of the improved formation.",
    "Task position updated. Proceed accordingly.",
];
shortcutDialogClose.addEventListener("click", () => {
    shortcutDialog.close();
    taskInput.focus();
});

shortcutDialog.addEventListener("click", (event) => {
    if (event.target === shortcutDialog) {
        shortcutDialog.close();
    }
});

window.addEventListener("keydown", (event) => {
    const activeElement = document.activeElement;
    const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.isContentEditable;

    if (event.key === "Escape") {
        if (shortcutDialog.open) {
            shortcutDialog.close();
            return;
        }

        if (document.activeElement === taskSearchInput) {
            taskSearchInput.value = "";
            currentSearch = "";
            renderTasks();
            taskInput.focus();
            return;
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

        if (!shortcutDialog.open) {
            shortcutDialog.showModal();
        }
    }
});

taskForm.addEventListener("submit", handleTaskSubmit);

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
        return;
    }

    showCompanionMessage(
        cleanupAction === "fresh" ? startFreshMessages : clearCompletedMessages,
    );
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
        "Restored. Veyra will pretend that never happened.",
        "The task returns. So does responsibility.",
        "Undo accepted. A rare second chance.",
    ]);

    hideUndoToast();
});

sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    localStorage.setItem(sortStorageKey, currentSort);
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
            "The list synchronized. Multitasking, apparently.",
            "Tasks updated from another tab.",
        ]);
    }

    if (event.key === sortStorageKey) {
        loadSortPreference();
        renderTasks();
    }
});

loadTasks();
loadSortPreference();
renderTasks();

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
            const completionDifference =
                Number(firstTask.completed) - Number(secondTask.completed);

            if (completionDifference !== 0) {
                return completionDifference;
            }

            return firstTask.text.localeCompare(secondTask.text);
        }

        const firstCreatedAt = firstTask.createdAt || 0;
        const secondCreatedAt = secondTask.createdAt || 0;

        return secondCreatedAt - firstCreatedAt;
    });
}

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

function loadSortPreference() {
    const savedSort = localStorage.getItem(sortStorageKey);

    if (savedSort) {
        currentSort = savedSort;
        sortSelect.value = savedSort;
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
}

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
    const matchesFilter =
        currentFilter === "all" ||
        (currentFilter === "active" && !task.completed) ||
        (currentFilter === "completed" && task.completed);

    const taskText = task.text.toLowerCase();
    const matchesSearch = taskText.includes(currentSearch);

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
                "Priority adjusted. Veyra acknowledges the urgency.",
                "Updated. Try respecting your own priorities now.",
                "Priority changed. The task knows its place.",
            ]);
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
                "Due date updated. Time is now officially watching you.",
                "New deadline noted. Veyra expects results.",
                "Date changed. Do not pretend you did not see it.",
            ]);
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
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

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

        tasks.splice(taskIndex, 1);

        saveTasks();
        renderTasks();
        showUndoToast(task, taskIndex);

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

    if (dragHandle) {
        li.appendChild(dragHandle);
    }

    if (orderControls) {
        li.appendChild(orderControls);
    }

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
        completedAt: null,
        createdAt: Date.now(),
    };

    tasks.push(newTask);

    saveTasks();
    renderTasks();
    showCompanionMessage(addTaskMessages);

    taskInput.value = "";
    dueDateInput.value = "";
    taskInput.focus();
}

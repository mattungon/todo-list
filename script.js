const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const prioritySelect = document.querySelector("#priority-select");
const dueDateInput = document.querySelector("#due-date");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const taskCount = document.querySelector("#task-count");
const companionMessage = document.querySelector("#companion-message");

taskForm.addEventListener("submit", handleTaskSubmit);

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

function showCompanionMessage(messages) {
    const randomIndex = Math.floor(Math.random() * messages.length);

    companionMessage.textContent = messages[randomIndex];
}
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
    const completeButton = document.createElement("button");
    completeButton.className = "complete-task";
    completeButton.type = "button";
    completeButton.textContent = "✓";
    completeButton.setAttribute(
        "aria-label",
        `Mark task complete: ${taskText}`,
    );
    completeButton.setAttribute("aria-pressed", "false");

    completeButton.addEventListener("click", () => {
        const isCompleted = li.classList.toggle("task-completed");

        completeButton.setAttribute("aria-pressed", String(isCompleted));
        completeButton.textContent = isCompleted ? "↺" : "✓";

        if (isCompleted) {
            completeButton.setAttribute(
                "aria-label",
                `Mark task incomplete: ${taskText}`,
            );
            showCompanionMessage([
                "Completed. Veyra reluctantly approves.",
                "One task down. Keep the streak alive.",
                "Done. See? You are capable of progress.",
            ]);
            return;
        }

        completeButton.setAttribute(
            "aria-label",
            `Mark task complete: ${taskText}`,
        );
        showCompanionMessage([
            "Back on the list. No judgment. Much.",
            "Unfinished again? Veyra has questions.",
            "Restored. Finish it when you are ready.",
        ]);
    });

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

    taskList.appendChild(li);

    updateTaskCount();
    showCompanionMessage(addTaskMessages);
    emptyState.hidden = true;

    taskInput.value = "";
    dueDateInput.value = "";
    taskInput.focus();
}

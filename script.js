const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");

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

   console.log(li);
}

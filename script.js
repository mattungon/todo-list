const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");

taskForm.addEventListener("submit", handleTaskSubmit);

function handleTaskSubmit(event) {
    event.preventDefault();

    const taskText = taskInput.value;

    console.log(taskText);
}

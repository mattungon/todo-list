const taskForm = document.querySelector("#task-form");

taskForm.addEventListener("submit", handleTaskSubmit);

function handleTaskSubmit(event) {
    console.log("The task form was submitted.");
}

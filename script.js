const taskForm = document.querySelector("#task-form");

taskForm.addEventListener("submit", handleTaskSubmit);

function handleTaskSubmit(event) {
    event.preventDefault();

    console.log("The task form was submitted.");
}

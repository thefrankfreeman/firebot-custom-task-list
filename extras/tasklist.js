class TaskList {
  constructor(filename) {
    this.filename = filename;
    this.taskList = [];
    this.taskListElement = document.getElementById("root");
    this.start;
    this.previousTimeStamp;
    this.animating = false;
    this.scollLength = undefined;
    this.step = this.step.bind(this);
  }

  buildHTMLFromTaskList(taskList) {
    let combinedText = '<div class="list">';
    for (let username in taskList) {
      const userTask = taskList[username] || {};
      const done = userTask.done ? " checked" : "";
      const task = userTask.task || "Invalid task";

      combinedText += '<li class="taskItem">';
      // combinedText += '<input class="taskCheckbox" type="checkbox"' + done + ">";
      combinedText += `<img class="taskIcon" src="${
        done ? "checkmarkDone.png" : "checkmarkDue.png"
      }" />`;

      combinedText += `<span class="username">${username}</span> - <span class="taskText">${task}</span></li>`;
    }
    combinedText += "</div>";
    return combinedText;
  }

  listIsBiggerThanScreen() {
    const taskListElement = document.getElementById("root");
    const cs = getComputedStyle(
      document.querySelector(`#root div:first-child`)
    );
    const paddingBottom = parseFloat(cs.paddingBottom);
    return taskListElement.offsetHeight - paddingBottom > window.innerHeight;
  }

  updateTaskList() {
    let listHTML = this.buildHTMLFromTaskList(this.taskList);
    this.taskListElement.innerHTML = listHTML;
    //this.taskListElement = document.getElementById("root");

    if (this.listIsBiggerThanScreen()) {
      this.taskListElement.innerHTML += listHTML;
      this.scollLength = document.querySelector(
        "#root div:first-child"
      ).offsetHeight;
      window.requestAnimationFrame(this.step);
    }
  }

  getAndUpdateTaskList() {
    const me = this;
    const client = new XMLHttpRequest();
    client.open("GET", "tasklist.txt");
    client.onreadystatechange = function () {
      if (client.readyState === XMLHttpRequest.DONE) {
        if (client.status === 200) {
          try {
            me.taskList = JSON.parse(client.responseText);
          } catch (error) {
            console.error("Error parsing JSON response:", error);
            me.taskList = JSON.parse(
              '{ "debugger": { "task": "unbreak task list", "done": false } }'
            );
          }
          me.updateTaskList();
        } else {
          console.error("Request failed with status:", client.status);
        }
      }
    };
    client.send();
  }

  step(timeStamp) {
    if (this.start === undefined) {
      this.start = timeStamp;
      this.animating = true;
    }
    const elapsed = timeStamp - this.start;

    if (this.previousTimeStamp !== timeStamp) {
      // Math.min() is used here to make sure the element stops at exactly this.scollLength
      const count = Math.min(0.01 * elapsed, this.scollLength);
      this.taskListElement.style.transform = `translateY(-${count}px)`;
      if (count === this.scollLength) {
        this.done = true;
        this.previousTimeStamp = undefined;
        this.start = undefined;
        this.taskListElement.style.transform = "translateY(0px)";
        this.taskListElement.removeChild(
          document.querySelector(`#root div:first-child`)
        );
        this.animating = false;
      } else {
        this.previousTimeStamp = timeStamp;
        window.requestAnimationFrame(this.step);
      }
    }
  }

  run() {
    const me = this;
    this.getAndUpdateTaskList();
    setInterval(() => {
      if (!me.animating) {
        me.getAndUpdateTaskList();
      }
    }, 5000);
  }
}

window.onload = function () {
  const taskList = new TaskList("tasklist.txt");
  taskList.run();
};

const store = require("./store");
const { ipcRenderer } = require("electron");

ipcRenderer.on("action", (event, action) => {
  store.dispatch(action);
});

const valueEl = document.getElementById("value");

function render() {
  valueEl.innerHTML = JSON.stringify(store.getState());
}

render();

store.subscribe(render);

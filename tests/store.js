const { createStore } = require("redux");
const { electronEnhancer } = require("../");
const { ipcRenderer } = require("electron");

const counter = (state, action) => {
  console.warn(`reducer for ${process.type}`);
  switch (action.type) {
    case "INCREMENT":
      return { ...state, count: state.count + 1 };
    case "DECREMENT":
      return { ...state, count: state.count - 1 };
    case "FOO_MAIN":
      return { ...state, mainOnly: (state.mainOnly || 0) + 1 };
    case "DISPATCH_PROXY":
      return { ...state, dispatchProxy: true };
    default:
      return state;
  }
};

let opts = {
  preDispatchCallback: a => {
    if (typeof document !== "undefined") {
      const element = document.createElement("span");

      element.setAttribute("id", "preDispatchCallback");
      element.innerHTML = JSON.stringify(a);

      document.body.appendChild(element);
    }
  },
  postDispatchCallback: a => {
    if (typeof document !== "undefined") {
      const element = document.createElement("span");

      element.setAttribute("id", "postDispatchCallback");
      element.innerHTML = JSON.stringify(a);

      document.body.appendChild(element);
    }
  },
  dispatchProxy: a => {
    if (a && a.type === "DISPATCH_PROXY") {
      const element = document.createElement("span");

      element.setAttribute("id", "dispatchProxy");
      element.innerHTML = JSON.stringify(a);

      document.body.appendChild(element);
    }
  }
};

if (process.type === "renderer") {
  opts = {
    ...opts,
    filter: {
      count: true,
      dispatchProxy: true,
    },
    ...(process.env.RENDERER_OPTIONS
      ? JSON.parse(process.env.RENDERER_OPTIONS)
      : {})
  };
} else {
  opts = {
    ...opts,
    ...(process.env.MAIN_OPTIONS ? JSON.parse(process.env.MAIN_OPTIONS) : {})
  };
}
let store = createStore(counter, { count: 0 }, electronEnhancer(opts));
store.subscribe(() =>
  console.warn(`sub for ${process.type}`, store.getState())
);

global.store = store;
module.exports = store;

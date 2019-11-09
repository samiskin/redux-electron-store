import { ElectronEnhancer } from "./types";
import { mainEnhancer } from "./main-enhancer";
import { renderEnhancer } from "./renderer-enhancer";

let storeEnhancer: ElectronEnhancer;
if (process.type === "browser") {
  storeEnhancer = mainEnhancer;
} else {
  storeEnhancer = renderEnhancer;
}

export const electronEnhancer = storeEnhancer;

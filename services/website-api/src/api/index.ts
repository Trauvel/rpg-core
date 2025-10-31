import { Express } from "express";
import { registerAuthApi } from "./auth";
import { registerGameSessionApi } from "./gameSession";
import { registerInternalApi } from "./internal";

export function registerAllApi(app: Express) {
  registerAuthApi(app);
  registerGameSessionApi(app);
  registerInternalApi(app);
}


import { Express } from "express";
import { registerAuthApi } from "./auth";
import { registerGameSessionApi } from "./gameSession";
import { registerInternalApi } from "./internal";
import { registerRoomHistoryApi } from "./roomHistory";

export function registerAllApi(app: Express) {
  registerAuthApi(app);
  registerGameSessionApi(app);
  registerInternalApi(app);
  registerRoomHistoryApi(app);
}


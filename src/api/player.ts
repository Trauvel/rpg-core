import { Express } from "express";
import { StateManager } from "../core/stateManager";
import { GameState } from "../contracts/state";
import { PlayerMock } from "./data/mock/player";

export function registerV1PlayerApi(app: Express, stateManager: StateManager, initialState: GameState) {
    app.get("/player", (req, res) => {
        res.json(PlayerMock);
    });
}

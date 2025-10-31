import { Express } from "express";
import path from "path";
import fs from "fs";
import { StateManager } from "../core/stateManager";
import { GameState } from "../contracts/state";

export function registerDevApi(app: Express, stateManager: StateManager, initialState: GameState) {
    // Рендер HTML панели
    app.get("/dev", (req, res) => {
        res.sendFile(path.join(__dirname, "..", "views/dev.html"));
    });

    // Получить текущее состояние
    app.get("/dev/state", (req, res) => {
        res.json(stateManager.getState());
    });
    app.get("/dev/publicState", (req, res) => {
        res.json(stateManager.getPublicState());
    });
    app.get("/dev/masterState", (req, res) => {
        res.json(stateManager.getMasterState());
    });

    // Сбросить состояние в начальное
    app.post("/dev/reset", (req, res) => {
        stateManager.updateState({ ...initialState });
        res.json({ ok: true });
    });

    // Сохранить снапшот в файл
    app.post("/dev/save", (req, res) => {
        try {
            fs.writeFileSync("snapshot.json", JSON.stringify(stateManager.getState(), null, 2));
            res.json({ ok: true });
        } catch (error) {
            res.status(500).json({ error: 'Ошибка при сохранении файла' });
        }
    });
}

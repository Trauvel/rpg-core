import { Express } from "express";
import { StateManager } from "../core/stateManager";
import { GameState } from '@rpg-platform/shared';
import { PlayerMock } from "./data/mock/player";

export function registerV1PlayerApi(app: Express, stateManager: StateManager, initialState: GameState) {
    /**
     * @swagger
     * /player:
     *   get:
     *     summary: Получить данные игрока (mock)
     *     tags: [Player]
     *     responses:
     *       200:
     *         description: Данные игрока
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Player'
     */
    app.get("/player", (req, res) => {
        res.json(PlayerMock);
    });
}

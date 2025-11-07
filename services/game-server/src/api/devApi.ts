import { Express } from "express";
import path from "path";
import fs from "fs";
import { StateManager } from "../core/stateManager";
import { GameState } from '@rpg-platform/shared';

export function registerDevApi(app: Express, stateManager: StateManager, initialState: GameState) {
    /**
     * @swagger
     * /dev:
     *   get:
     *     summary: Получить HTML панель разработчика
     *     tags: [Dev]
     *     responses:
     *       200:
     *         description: HTML страница панели разработчика
     *         content:
     *           text/html:
     *             schema:
     *               type: string
     */
    app.get("/dev", (req, res) => {
        res.sendFile(path.join(__dirname, "..", "views/dev.html"));
    });

    /**
     * @swagger
     * /dev/state:
     *   get:
     *     summary: Получить полное состояние игры
     *     tags: [Dev]
     *     responses:
     *       200:
     *         description: Полное состояние игры (публичное и мастерское)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/GameState'
     */
    app.get("/dev/state", (req, res) => {
        res.json(stateManager.getState());
    });

    /**
     * @swagger
     * /dev/publicState:
     *   get:
     *     summary: Получить публичное состояние игры
     *     tags: [Dev]
     *     responses:
     *       200:
     *         description: Публичное состояние игры (видимое всем игрокам)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PublicState'
     */
    app.get("/dev/publicState", (req, res) => {
        res.json(stateManager.getPublicState());
    });

    /**
     * @swagger
     * /dev/masterState:
     *   get:
     *     summary: Получить мастерское состояние игры
     *     tags: [Dev]
     *     responses:
     *       200:
     *         description: Мастерское состояние игры (видимое только мастеру)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/MasterState'
     */
    app.get("/dev/masterState", (req, res) => {
        res.json(stateManager.getMasterState());
    });

    /**
     * @swagger
     * /dev/reset:
     *   post:
     *     summary: Сбросить состояние игры в начальное
     *     tags: [Dev]
     *     responses:
     *       200:
     *         description: Состояние успешно сброшено
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:
     *                   type: boolean
     *                   example: true
     */
    app.post("/dev/reset", (req, res) => {
        stateManager.updateState({ ...initialState });
        res.json({ ok: true });
    });

    /**
     * @swagger
     * /dev/save:
     *   post:
     *     summary: Сохранить снапшот состояния в файл
     *     tags: [Dev]
     *     responses:
     *       200:
     *         description: Снапшот успешно сохранён
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:
     *                   type: boolean
     *                   example: true
     *       500:
     *         description: Ошибка при сохранении файла
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    app.post("/dev/save", (req, res) => {
        try {
            fs.writeFileSync("snapshot.json", JSON.stringify(stateManager.getState(), null, 2));
            res.json({ ok: true });
        } catch (error) {
            res.status(500).json({ error: 'Ошибка при сохранении файла' });
        }
    });
}

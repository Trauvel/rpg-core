import { Express } from "express";
import { SessionManager } from "../services/sessionManager";

export function registerSessionApi(app: Express) {
    /**
     * @swagger
     * /dev/sessions:
     *   get:
     *     summary: Получить все активные игровые сессии
     *     tags: [Sessions]
     *     responses:
     *       200:
     *         description: Список активных сессий
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 count:
     *                   type: number
     *                   description: Количество активных сессий
     *                 sessions:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/GameSession'
     */
    app.get("/dev/sessions", (req, res) => {
        const sessions = SessionManager.getAllSessions();
        res.json({ 
            count: sessions.length,
            sessions 
        });
    });

    /**
     * @swagger
     * /dev/sessions/stats:
     *   get:
     *     summary: Получить статистику игровых сессий
     *     tags: [Sessions]
     *     responses:
     *       200:
     *         description: Статистика сессий
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SessionStats'
     */
    app.get("/dev/sessions/stats", (req, res) => {
        const sessions = SessionManager.getAllSessions();
        const activeCount = SessionManager.getActiveSessionCount();
        
        res.json({
            total: activeCount,
            details: {
                online: activeCount,
                users: sessions.map(s => ({
                    username: s.username,
                    socketId: s.socketId,
                    connected: s.createdAt,
                    lastActivity: s.lastActivity
                }))
            }
        });
    });
}


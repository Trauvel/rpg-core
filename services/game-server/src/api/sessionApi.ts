import { Express } from "express";
import { SessionManager } from "../services/sessionManager";

export function registerSessionApi(app: Express) {
    // Получить все активные сессии
    app.get("/dev/sessions", (req, res) => {
        const sessions = SessionManager.getAllSessions();
        res.json({ 
            count: sessions.length,
            sessions 
        });
    });

    // Получить статистику сессий
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


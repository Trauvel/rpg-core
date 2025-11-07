import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger/config';

import { EventBus } from "./core/eventBus";
import { StateManager } from "./core/stateManager";
import { ActionProcessor } from "./core/actionProcessor";
import { setupSocket } from "./socket";
import { registerAllHandlers } from "./handlers/index";
import { GameState, MasterState, PublicState } from '@rpg-platform/shared';
import { registerAllApi } from "./api/index";
import { gameAuthMiddleware } from "./middleware/gameAuth";
import { RoomManager } from "./services/roomManager";
import { RoomPersistenceService } from "./services/roomPersistence";
import { AutoSaveService } from "./services/autoSave";
import { RoomCleanupService } from "./services/roomCleanup";

/**
 * Game Server - Игровое ядро
 * Обрабатывает игровые события, состояние игры и WebSocket соединения
 */
(async () => {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

    const httpServer = createServer(app);
    const io = new Server(httpServer, { cors: { origin: "*" } });

    // Применяем JWT middleware к WebSocket соединениям
    io.use(gameAuthMiddleware);

    const eventBus = new EventBus();
    const actionProcessor = new ActionProcessor(eventBus);

    // Начальное состояние игры
    const pubicState: PublicState = {
        players: [],
        locations: [
            {
                id: "forest",
                name: "Лес",
                locations: [
                    {
                        id: "village",
                        name: "Деревня",
                    }
                ]
            },
            { id: "castle", name: "Замок" }
        ]
    }
    const masterState: MasterState = {}
    const initialState: GameState = {
        public: pubicState,
        master: masterState
    };
    const stateManager = new StateManager(initialState, io);

    // Регистрация обработчиков и API
    await registerAllApi(app, stateManager, initialState, io);
    await registerAllHandlers(eventBus, stateManager, io);
    setupSocket(io, eventBus, actionProcessor, stateManager);

    // Инициализация сервисов сохранения
    const websiteApiUrl = process.env.WEBSITE_API_URL || 'http://localhost:3000';
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token';
    RoomPersistenceService.initialize(websiteApiUrl, internalToken);
    AutoSaveService.initialize(eventBus);
    
    // Инициализация сервиса очистки комнат
    RoomCleanupService.initialize(io);

    const PORT = process.env.GAME_PORT || 3001;
    
    // Проверяем наличие JWT_SECRET
    if (!process.env.JWT_SECRET) {
        console.warn('⚠️  WARNING: JWT_SECRET не установлен. Используется секрет по умолчанию.');
    }
    
    httpServer.listen(PORT, () => {
        console.log(`🎮 Game Server запущен на http://localhost:${PORT}`);
        console.log(`📚 Swagger UI доступен на http://localhost:${PORT}/api-docs`);
        console.log(`🧹 Room cleanup timers started`);
    });
})();


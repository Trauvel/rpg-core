import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { EventBus } from "./core/eventBus";
import { StateManager } from "./core/stateManager";
import { ActionProcessor } from "./core/actionProcessor";
import { setupSocket } from "./socket";
import { registerAllHandlers } from "./handlers";
import { GameState } from "./contracts/state";
import { registerAllApi } from "./api";

/**
 * Асинхронная точка входа приложения
 * Инициализирует сервер, регистрирует обработчики и запускает слушание порта
 */
(async () => {
    /**
     * Создаёт экземпляр Express-приложения
     * @see https://expressjs.com/
     */
    const app = express();
    /**
     * Создаёт HTTP-сервер для работы с Express
     * @see https://nodejs.org/api/http.html
     */
    const httpServer = createServer(app);
    /**
     * Создаёт сервер Socket.IO для работы с веб-сокетами
     * @param {http.Server} httpServer - HTTP-сервер для подключения
     * @param {Object} cors - Настройки CORS
     * @property {string} origin - Разрешённый источник (в данном случае любой)
     * @see https://socket.io/docs/v4/server-api/
     */
    const io = new Server(httpServer, { cors: { origin: "*" } });

    /**
     * Инициализирует шину событий для управления потоком данных
     * @see EventBus
     */
    const eventBus = new EventBus();
    /**
     * Инициализирует процессор действий, связанный с шиной событий
     * @see ActionProcessor
     */
    const actionProcessor = new ActionProcessor(eventBus);

    /**
     * Начальное состояние игры
     * @typedef {Object} GameState
     * @property {Array<Player>} players - Список игроков
     * @property {Array<Location>} locations - Список локаций
     * @typedef {Object} Player
     * @property {string} id - Уникальный идентификатор игрока
     * @property {string} name - Имя игрока
     * @typedef {Object} Location
     * @property {string} id - Уникальный идентификатор локации
     * @property {string} name - Название локации
     */
    const initialState: GameState = {
        players: [],
        locations: [
            { id: "forest", name: "Лес" },
            { id: "castle", name: "Замок" }
        ]
    };
    /**
     * Инициализирует менеджер состояния с начальным состоянием
     * @see StateManager
     */
    const stateManager = new StateManager(initialState);

    /**
     * Регистрация всех API-маршрутов в Express-приложении
     * @param app Экземпляр Express-приложения для подключения маршрутов
     * @param stateManager Менеджер состояния игры для обработки запросов
     * @param initialState Начальное состояние игры для инициализации данных
     * @description Функция автоматически подключает все REST-эндпоинты,
     * связанные с управлением состоянием и игровыми данными.
     * Используется await, так как регистрация может включать асинхронные операции
     * (например, загрузку данных из базы или инициализацию кэша)
     */
    await registerAllApi(app, stateManager, initialState);

    /**
     * Регистрирует все обработчики событий
     * @param {EventBus} eventBus - Шина событий
     * @param {StateManager} stateManager - Менеджер состояния
     * @param {Server} io - Сервер Socket.IO
     * @description Автоматически подключает модули обработки событий
     */
    await registerAllHandlers(eventBus, stateManager, io);

    /**
     * Настраивает веб-сокеты
     * @param {Server} io - Сервер Socket.IO
     * @param {EventBus} eventBus - Шина событий
     * @param {ActionProcessor} actionProcessor - Процессор действий
     * @param {StateManager} stateManager - Менеджер состояния
     * @description Обрабатывает подключения клиентов и маршрутизацию сообщений
     */
    setupSocket(io, eventBus, actionProcessor, stateManager);

    /**
     * Порт для прослушивания HTTP-запросов
     * @constant {number}
     */
    const PORT = 3000;

    /**
     * Запускает сервер на указанном порту
     * @param {number} PORT - Порт для прослушивания
     * @param {Function} callback - Функция обратного вызова после запуска
     */
    httpServer.listen(PORT, () => {
        console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
})();
import { EventBus } from "../core/eventBus";
import { StateManager } from "../core/stateManager";
import { Server } from "socket.io";
import { glob } from "glob";
import path from "path";

// Функция, которая ищет все файлы обработчиков и подключает их
export async function registerAllHandlers(eventBus: EventBus, stateManager: StateManager, io: Server) {
    // Ищем все ts-файлы кроме index.ts
    const files = await glob(path.join(__dirname, "*.ts").replace(/\\/g, "/"), {
        ignore: ["**/index.ts"]
    });

    const handlers = [];

    for (const file of files) {
        const module = await import(file);

        // Ищем все функции в модуле, которые начинаются с register
        for (const exportKey of Object.keys(module)) {
            const fn = module[exportKey];
            if (exportKey.startsWith("register") && typeof module[exportKey] === "function") {
                handlers.push({
                    "fn": fn,
                    "exportKey": exportKey,
                    "file": path.basename(file),
                    "priority": fn.priority || 0
                });
            }
        }
    }

    handlers
        .sort((a, b) => (a.priority || 0) - (b.priority || 0))
        .forEach((obj) => {
            if (!obj.fn) {
                console.error(`Ошибка: Не удалось загрузить обработчик ${obj.exportKey} из ${obj.file}`);
                return;
            }
            console.log(`🔌 Подключаю обработчик: ${obj.exportKey} из ${path.basename(obj.file)}`);
            obj.fn(eventBus, stateManager, io)
        });
}
import { Express } from "express";
import { StateManager } from "../core/stateManager";
import { GameState } from '@rpg-platform/shared';
import { glob } from "glob";
import path from "path";

export async function registerAllApi(app: Express, stateManager: StateManager, initialState: GameState) {
  // Ищем все ts-файлы кроме index.ts
  const files = await glob(path.join(__dirname, "*.ts").replace(/\\/g, "/"), {
    ignore: ["**/index.ts"]
  });

  for (const file of files) {
    const module = await import(file);

    for (const exportKey of Object.keys(module)) {
      if (exportKey.startsWith("register") && typeof module[exportKey] === "function") {
        console.log(`🔌 Подключаю API: ${exportKey} из ${path.basename(file)}`);
        // sessionApi не требует дополнительных параметров
        if (exportKey === "registerSessionApi") {
          module[exportKey](app);
        } else {
          module[exportKey](app, stateManager, initialState);
        }
      }
    }
  }
}


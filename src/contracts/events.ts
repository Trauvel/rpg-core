import { GameState } from "./state";

export enum GameEvent {
    // Игроки
    PLAYER_ACTION = "PLAYER_ACTION",      // входной WS (общее действие)
    PLAYER_MOVE = "PLAYER_MOVE",
    PLAYER_JOIN = "PLAYER_JOIN",
    PLAYER_LEAVE = "PLAYER_LEAVE",

    // Состояние
    STATE_CHANGED = "STATE_CHANGED",

    // Инвентарь и предметы
    ITEM_ADDED = "ITEM_ADDED",
    ITEM_USED = "ITEM_USED",

    // Локации и события
    LOCATION_ENTER = "LOCATION_ENTER",
    QUEST_UPDATED = "QUEST_UPDATED"
}

// Типизация payload'ов для каждого события
export interface EventPayloadMap {
    // Игроки
    [GameEvent.PLAYER_ACTION]: { action: GameEvent; data: any };
    [GameEvent.PLAYER_MOVE]: { playerId: string; to: string };
    [GameEvent.PLAYER_JOIN]: { id: string, name: string };
    [GameEvent.PLAYER_LEAVE]: { id: string };

    // Состояние
    [GameEvent.STATE_CHANGED]: GameState; // Отправляем целый state (пока без строгой типизации)

    // Инвентарь и предметы
    [GameEvent.ITEM_ADDED]: { playerId: string; itemId: string };
    [GameEvent.ITEM_USED]: { playerId: string; itemId: string };

    // Локации и события
    [GameEvent.LOCATION_ENTER]: { playerId: string; locationId: string };
    [GameEvent.QUEST_UPDATED]: { questId: string; status: "started" | "completed" };
}
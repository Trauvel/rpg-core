import { GameState } from "./state";

export enum GameEvent {
    PLAYER_CONNECT = "player:connect",
    PLAYER_ACTION = "player:action",      // входной WS (общее действие)
    PLAYER_MOVE = "player:move",
    PLAYER_JOIN = "player:join",
    PLAYER_LEAVE = "player:leave",

    // Состояние
    STATE_CHANGED = "state:changed",

    // Инвентарь и предметы
    ITEM_ADDED = "item:added",
    ITEM_USED = "item:used",

    // Локации и события
    LOCATION_ENTER = "location:enter",
    QUEST_UPDATED = "quest:updated",
}

// Типизация payload'ов для каждого события
export interface EventPayloadMap {
    // Пользовательские события
    [GameEvent.PLAYER_CONNECT]: {id: string}
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
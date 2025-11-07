import { CharacterData } from './srd';

export interface Player {
    id?: string;
    userId?: string;  // ID пользователя из БД
    name?: string;
    locationId?: string;
    inventory?: string[]; // список id предметов
    hp?: number;
    maxHp?: number,
    level?: number,
    experience?: number,
    strength?: number,
    dexterity?: number,
    constitution?: number,
    intelligence?: number,
    wisdom?: number,
    charisma?: number,
    class?: string, // Пока строка, позже будет ссылка на DndClass
    race?: string,  // Пока строка, позже будет ссылка на DndRace
    armorClass?: number,
    initiative?: number,
    speed?: number,
    // Дополнительные данные персонажа для D&D 5e SRD
    // Будет содержать: заклинания, черты, умения, экипировку
    characterData?: CharacterData;
}

export interface Location {
    id: string;
    name: string;
    description?: string;
    locations?: Location[];
    traps?: Trap[];
}

export interface Trap {
    id: string;
    name: string;
    description?: string;
}
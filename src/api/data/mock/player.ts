import { Player } from './../../../contracts/player';

export const PlayerMock: Player = {
    locationId: "forest", // стартовая локация
    inventory: [],
    hp: 10,
    maxHp: 10,
    level: 1,
    experience: 0,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    class: "Adventurer",
    race: "Human",
    armorClass: 10,
    initiative: 0,
    speed: 30
}
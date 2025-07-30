export interface Player {
  id: string;
  name: string;
  locationId: string;
  inventory: string[]; // список id предметов
  hp: number;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
}

export interface GameState {
  players: Player[];
  locations: Location[];
  lastAction?: any; // можно детальнее, если захочешь
}
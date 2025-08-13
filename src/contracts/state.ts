export interface Player {
  id: string;
  name?: string;
  locationId?: string;
  inventory?: string[]; // список id предметов
  hp?: number;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  locations?: Location[];
}

export interface Trap {
  id: string;
  name: string;
  description?: string;
}

export interface PublicState {
  players: Player[];
  locations?: Location[];
  logs?: string[];
}

export interface MasterState {
  hiddenLocations?: Location[];
  traps?: Trap[];
  npcPlans?: Record<string, any>;
  logs?: string[];
}

export interface GameState {
  public: PublicState;
  master: MasterState;
}

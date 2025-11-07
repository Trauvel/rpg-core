/**
 * Типы для D&D 5e SRD данных
 * Подготовлены для будущей интеграции справочных данных
 */

/**
 * Класс персонажа из SRD
 */
export interface DndClass {
  id?: string;
  name: string;
  hitDie: number; // Количество костей хитов (d6, d8, d10, d12)
  description?: string;
  subclasses?: string[]; // Список подклассов
  features?: ClassFeatures; // Черты класса
  spellcasting?: boolean; // Может ли класс использовать заклинания
}

/**
 * Черты класса
 */
export interface ClassFeatures {
  [level: number]: string[]; // Черты по уровням
  // Например: { 1: ["Fighting Style"], 2: ["Action Surge"] }
}

/**
 * Раса персонажа из SRD
 */
export interface DndRace {
  id?: string;
  name: string;
  description?: string;
  subraces?: string[]; // Список подрас
  traits?: RaceTrait[]; // Черты расы
  abilityScoreBonuses?: AbilityScoreBonuses; // Бонусы к характеристикам
  speed?: number; // Базовая скорость
  size?: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';
}

/**
 * Черта расы
 */
export interface RaceTrait {
  name: string;
  description: string;
}

/**
 * Бонусы к характеристикам
 */
export interface AbilityScoreBonuses {
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
}

/**
 * Заклинание из SRD
 */
export interface DndSpell {
  id?: string;
  name: string;
  level: number; // Уровень заклинания (0-9)
  school: string; // Школа магии (Evocation, Abjuration, etc.)
  castingTime: string; // Время накладывания
  range: string; // Дальность
  components?: {
    verbal?: boolean;
    somatic?: boolean;
    material?: boolean;
    materialDescription?: string;
  };
  duration: string; // Длительность
  description: string; // Описание заклинания
  higherLevels?: string; // Эффект при накладывании на более высоком уровне
  ritual?: boolean; // Можно ли накладывать как ритуал
  concentration?: boolean; // Требует ли концентрации
}

/**
 * Предмет из SRD
 */
export interface DndItem {
  id?: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'tool' | 'wondrous' | 'other';
  rarity?: 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary' | 'artifact';
  properties?: ItemProperties; // Свойства предмета
  description?: string;
  weight?: number; // Вес в фунтах
  value?: number; // Стоимость в золотых монетах
}

/**
 * Свойства предмета
 */
export interface ItemProperties {
  [key: string]: any; // Гибкая структура для разных типов предметов
  // Для оружия: damage, damageType, properties
  // Для брони: armorClass, stealthDisadvantage
  // И т.д.
}

/**
 * Данные персонажа, расширяющие базовую информацию
 * Хранится в characterData JSON поле
 */
export interface CharacterData {
  // Заклинания персонажа
  spells?: {
    known?: string[]; // ID известных заклинаний
    prepared?: string[]; // ID подготовленных заклинаний
    slots?: {
      [level: number]: number; // Количество ячеек по уровням
    };
  };
  
  // Черты персонажа (features)
  features?: {
    [featureName: string]: {
      source: string; // Откуда получена (class, race, feat)
      description?: string;
      uses?: number; // Количество использований
      usesRemaining?: number; // Осталось использований
    };
  };
  
  // Умения (skills) и их модификаторы
  skills?: {
    [skillName: string]: {
      proficient: boolean; // Владение умением
      expertise?: boolean; // Мастерство (удвоенный бонус)
      modifier?: number; // Модификатор (вычисляется автоматически)
    };
  };
  
  // Экипировка
  equipment?: {
    armor?: string; // ID надетой брони
    weapons?: string[]; // ID экипированного оружия
    shield?: string; // ID щита
    other?: string[]; // Другая экипировка
  };
  
  // Произвольные дополнительные данные
  custom?: {
    [key: string]: any;
  };
}


import { GameState } from "../contracts/state";

/**
 * Класс StateManager управляет состоянием приложения
 * Реализует шаблон проектирования "Хранилище состояния"
 */
export class StateManager {
    /**
     * Приватное хранилище состояния приложения
     */
    private state: GameState;

    /**
     * Конструктор
     * @param initialState Начальное состояние (по умолчанию - пустой объект)
     * @description Инициализирует хранилище начальным состоянием
     */
    constructor(initialState: GameState) {
        this.state = initialState;
    }

    /**
     * Получить текущее состояние
     * @returns Текущее состояние приложения
     * @description Возвращает копию текущего состояния
     */
    getState(): GameState {
        return this.state;
    }

    /**
     * Обновить состояние
     * @param patch Объект с частичным обновлением состояния
     * @description Объединяет текущее состояние с новым,
     * сохраняя неизменными не затронутые свойства
     * (поверхностное слияние объектов)
     */
    updateState(patch: Partial<GameState>) {
        this.state = { ...this.state, ...patch };
    }
}

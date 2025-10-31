import { EventBus } from "./eventBus";
import { GameEvent, EventPayloadMap } from '@rpg-platform/shared';

/**
 * Класс ActionProcessor обрабатывает пользовательские действия
 * и преобразует их в события для EventBus
 */
export class ActionProcessor {
    /**
     * Конструктор
     * @param eventBus Экземпляр EventBus для работы с событиями
     * @description Инициализирует процессор с подключением к шине событий
     */
    constructor(private eventBus: EventBus) { }

    /**
     * Обработка действия
     * @param action Название выполняемого действия
     * @param data Данные, связанные с действием
     * @description Выполняет валидацию входных данных,
     * преобразует действие в событие и передаёт его на обработку через EventBus.
     * После валидации вызывает метод emit() шины событий,
     * который активирует все подписчики на это событие.
     */
    process<K extends GameEvent>(action: K, data: EventPayloadMap[K]) {
        this.eventBus.emit(action, data);
    }
}
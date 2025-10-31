import { GameEvent, EventPayloadMap } from '@rpg-platform/shared';

/**
 * Тип функции-обработчика события
 * @template K - Тип события (должен быть из перечисления GameEvent)
 * @param {EventPayloadMap[K]} data - Данные события соответствующего типа
 * @param {EventContext} ctx - Контекст события для управления состоянием
 */
type EventHandler<K extends string> = (data: any, ctx: EventContext, event: K) => void;

/**
 * Интерфейс описывает структуру подписчика (обработчика) события
 * @template K - Тип события (должен быть из перечисления GameEvent)
 */
interface Listener<K extends string> {
    /**
     * Функция-обработчик события
     * @param data Данные события соответствующего типа
     * @param ctx Контекст события для управления состоянием
     * @description Определяет логику, которая будет выполнена при срабатывании события
     */
    handler: EventHandler<K>;
    /**
     * Приоритет обработчика
     * @description Чем меньше значение, тем раньше будет выполнен обработчик
     * при срабатывании события. Используется для сортировки подписчиков
     */
    priority: number;
}

/**
 * Класс EventContext управляет состоянием события
 * Позволяет отслеживать и управлять флагом отмены события
 */
export class EventContext {
    /**
     * Приватный флаг отмены события
     * @default false
     */
    private canceled = false;

    /**
     * Отменяет событие
     * @description Устанавливает внутренний флаг canceled в true,
     * что может использоваться для досрочного прекращения обработки события
     */
    cancel() {
        this.canceled = true;
    }

    /**
     * Проверяет статус отмены события
     * @returns {boolean} true, если событие было отменено, иначе false
     * @description Используется для проверки необходимости продолжения
     * обработки события другими обработчиками
     */
    isCanceled(): boolean {
        return this.canceled;
    }
}

/**
 * Класс EventBus реализует шаблон проектирования "Наблюдатель"
 * для управления событиями в приложении с типизацией
 */
export class EventBus {
    /**
     * Приватное хранилище обработчиков событий
     * Использует маппинг GameEvent → массив обработчиков
     */
    private listeners: Record<string, Listener<any>[]> = {};

    /**
     * Получает текущий список слушателей событий
     * @returns {Object} Объект со слушателями или пустой объект
     * @description Метод возвращает внутреннее хранилище слушателей,
     * если оно существует, иначе возвращает пустой объект.
     * Используется для безопасного доступа к данным слушателей,
     * предотвращая работу с undefined.
     */
    getListeners() {
        if (this.listeners) {
            return this.listeners;
        } else {
            return {};
        }
    }

    /**
     * Регистрация обработчика события
     * @param event Тип события (должен быть из перечисления GameEvent)
     * @param handler Функция-обработчик, принимающая данные соответствующего типа
     * @param priority Приоритет события (целое число)
     * @description Если для события ещё нет обработчиков, создаёт новую запись в хранилище
     * Добавляет переданный обработчик в список подписчиков
     */
    on<K extends string>(event: K, handler: EventHandler<K>, priority: number = 0) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event]!.push({ handler, priority });
        // Сортируем по приоритету (меньшее число = раньше)
        this.listeners[event]!.sort((a, b) => a.priority - b.priority);
    }
    /**
      * Вызов события со связанными данными
      * @param event Тип события (должен быть из перечисления GameEvent)
      * @param data Данные события, тип которых определяется через EventPayloadMap
      * @description Выполняет все зарегистрированные обработчики события,
      * передавая им соответствующие данные
      */
    emit<K extends string>(event: K, data: any) {
        const ctx = new EventContext();

        for (const key of Object.keys(this.listeners)) {
            if (this.matches(key, event)) {
                // "before"
                if (key === `before:${event}` as GameEvent) {
                    this.runHooks(key, data, ctx, event);
                    if (ctx.isCanceled()) return;
                    continue;
                }

                // Основные слушатели
                for (const listener of this.listeners[key]!) {
                    listener.handler(data, ctx, event);
                    if (ctx.isCanceled()) return;
                }

                // "after"
                if (key === `after:${event}` as GameEvent) {
                    this.runHooks(key, data, ctx, event);
                }
            }
        }
    }

    /**
     * Проверяет соответствие события заданному шаблону
     * @param pattern Шаблон для сопоставления (может содержать символы *)
     * @param event Событие для проверки
     * @returns {boolean} true, если событие соответствует шаблону, иначе false
     * @description Реализует гибкий механизм сопоставления событий:
     * - "*" - совпадает со всеми событиями
     * - "player:*" - совпадает со всеми событиями в пространстве имен player
     * - "inventory:add" - точное совпадение
     */
    private matches(pattern: string, event: string): boolean {
        // Поддержка "*", "player:*", "inventory:add"
        if (pattern === "*") return true;
        if (pattern.endsWith("*")) {
            const ns = pattern.slice(0, -1);
            return event.startsWith(ns);
        }
        return pattern === event;
    }

    /**
     * Выполняет все зарегистрированные хуки (обработчики) для указанного события
     * @param hookEvent Строка с названием события (может быть приведена к типу GameEvent)
     * @param data Данные, передаваемые обработчикам события
     * @param ctx Контекст события, содержащий информацию о состоянии и флаг отмены
     * @description Метод последовательно вызывает все обработчики события.
     * Если в процессе выполнения контекст события был отмечен как отменённый,
     * выполнение прекращается досрочно.
     *
     * Примечание: Используется оператор не-null (!) после проверки наличия обработчиков,
     * так как мы явно уверены в их существовании после проверки условия.
     * Это позволяет избежать дублирования проверки в цикле.
     */
    private runHooks<K extends string>(hookEvent: string, data: any, ctx: EventContext, event: K) {
        if (this.listeners[hookEvent as GameEvent]) {
            for (const listener of this.listeners[hookEvent as GameEvent]!) {
                listener.handler(data, ctx, event);
                if (ctx.isCanceled()) return;
            }
        }
    }
}

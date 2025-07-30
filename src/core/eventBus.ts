import { GameEvent, EventPayloadMap } from "../contracts/events";

/**
 * Тип функции-обработчика события
 * @template K - Тип события (должен быть из перечисления GameEvent)
 * @param {EventPayloadMap[K]} data - Данные события соответствующего типа
 * @param {EventContext} ctx - Контекст события для управления состоянием
 */
type EventHandler<K extends GameEvent> = (data: EventPayloadMap[K], ctx: EventContext) => void;

/**
 * Интерфейс описывает структуру подписчика (обработчика) события
 * @template K - Тип события (должен быть из перечисления GameEvent)
 */
interface Listener<K extends GameEvent> {
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
    isCanceled() {
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
    private listeners: {
        [K in GameEvent]?: Listener<K>[];
    } = {};

    /**
     * Регистрация обработчика события
     * @param event Тип события (должен быть из перечисления GameEvent)
     * @param handler Функция-обработчик, принимающая данные соответствующего типа
     * @param priority Приоритет события (целое число)
     * @description Если для события ещё нет обработчиков, создаёт новую запись в хранилище
     * Добавляет переданный обработчик в список подписчиков
     */
    on<K extends GameEvent>(event: K, handler: EventHandler<K>, priority: number = 0) {
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
    emit<K extends GameEvent>(event: K, data: EventPayloadMap[K]) {
        const ctx = new EventContext();

        // Хук "before"
        this.runHooks(`before:${event}`, data, ctx);
        if (ctx.isCanceled()) return;

        // Основные слушатели
        if (this.listeners[event]) {
            for (const listener of this.listeners[event]!) {
                listener.handler(data, ctx);
                if (ctx.isCanceled()) return; // событие отменено
            }
        }

        // Хук "after"
        this.runHooks(`after:${event}`, data, ctx);
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
    private runHooks(hookEvent: string, data: any, ctx: EventContext) {
        if (this.listeners[hookEvent as GameEvent]) {
            for (const listener of this.listeners[hookEvent as GameEvent]!) {
                listener.handler(data, ctx);
                if (ctx.isCanceled()) return;
            }
        }
    }
}

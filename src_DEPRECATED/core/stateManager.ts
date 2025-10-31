import { GameEvent } from "../contracts/events";
import { GameState, PublicState, MasterState } from "../contracts/state";
import { Server } from "socket.io";

type ListenerFn = (obj: setObject) => void;

interface setObject {
    target: any,
    prop: string | symbol,
    value: any,
    receiver: any
}

export class StateManager {
    private _state: GameState;
    private publicChangeListeners: ListenerFn[] = [];

    constructor(initialState: GameState, private io: Server) {
        this._state = {
            public: StateManager.makeReactive(initialState.public, (obj: setObject) => this.notifyPublicChange(obj)),
            master: initialState.master // пока не делаем реактивным
        };

        this.onPublicChange(() => {
            io.emit(GameEvent.STATE_CHANGED, this.getState());
        });
    }

    private static makeReactive<T extends object>(obj: T, onChange: (obj: setObject) => void): T {
        const handler: ProxyHandler<any> = {
            get(target, prop, receiver) {
                const value = Reflect.get(target, prop, receiver);
                // if (typeof value === "object" && value !== null) {
                //     return StateManager.makeReactive(value, onChange); // рекурсивный прокси
                // }
                return value;
            },
            set(target, prop, value, receiver) {
                const result = Reflect.set(target, prop, value, receiver);
                onChange({ target, prop, value, receiver } as setObject);
                return result;
            }
        };

        return new Proxy(obj, handler);
    }


    private notifyPublicChange(obj: setObject): any {
        for (const fn of this.publicChangeListeners) {
            fn(obj);
        }
    }

    onPublicChange(fn: ListenerFn) {
        this.publicChangeListeners.push(fn);
    }

    getState(): GameState {
        return this._state;
    }

    getPublicState(): PublicState {
        return this._state.public;
    }

    getMasterState(): MasterState {
        return this._state.master;
    }

    /**
     * Обновить состояние
     * @param patch Объект с частичным обновлением состояния
     * @description Объединяет текущее состояние с новым,
     * сохраняя неизменными не затронутые свойства
     * (поверхностное слияние объектов)
     */
    updateState(patch: Partial<GameState>) {
        this._state = { ...this._state, ...patch };
    }
}
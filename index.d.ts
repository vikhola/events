declare module "@vikhola/events" {

    type Listener = (this: EventEmitter, ...args: any[]) => any
    type RawListener = { priority: number; listener: Listener; (emitter: EventEmitter, args: any[]): any } 
    type ListenerOptions = { once?: boolean, signal?: AbortSignal, priority?: number }
    type EventEmitterOptions = { origin?: EventEmitter, priority?: { min?: number, max?: number } }

    interface EventEmitterListenersCollection {
        readonly size: number
        add(listener: RawListener): this
        has(listener: Listener): boolean
        delete(listener: Listener): boolean
        clear(): this
        entries(listeners?: Array<RawListener>): Array<RawListener>
    }

    interface EventEmitter {
        /**
         * The `on()` method adds the listener for the event. 
         * 
         * Any given listener could be added only once per event.
         * Method emit `newListener` event with an event name, listener and options. 
         * 
         * @param eventName The name of the event.
         * @param listener The listener function.
         * @param options.once When set to true, indicates that listener will be executed only once after what it will be removed for the event.
         * @param options.signal An AbortSignal that removes the event listener after signal abortion.
         * @param options.priority The priority is a integer that controls the order in which listeners are executed (the higher the number, the earlier a listener is executed).
         */
        on(eventName: string | symbol, listener: Listener, options?: ListenerOptions): this
        /**
         * The `off()` method removes the listener for the event. 
         * 
         * Method emit `removeListener` event with an event name and its listener.
         * 
         * @param listener The listener function.
         * @param eventName The name of the event.
         */
        off(eventName: string | symbol, listener: Listener): this 
        /**
         * The `eventNames()` method returns an array of the events with registered listeners. 
         */
        eventNames(): Array<string | symbol>;
        /**
         * The `listeners()` method returns an array of listeners for the event.
         * 
         * @param eventName The name of the event.
         */
        listeners(eventName: string | symbol): Array<Listener> 
        /**
         * The `rawListeners()` method returns an array of raw listeners for the event sorted by their priorities. 
         * 
         * The returned collection same as its elements are frozen and any attempt to change them will fail, either silently or by throwing a error.
         */
        rawListeners(eventName: string | symbol): Array<RawListener>
        /**
         * The `listenerCount()` method returns the number of listeners currently listening the event.
         * 
         * @param eventName The name of the event.
         */
        listenerCount(eventName: string | symbol): number;
        /**
         * The `removeAllListeners()` removes all listeners from the emitter, or those of the specified event. 
         */
        removeAllListeners(eventName?: string | symbol): this 
        /**
         * The `emit()` method notify each of registered for the event listener in the order of their priority.
         */
        emit(event: string | symbol, ...args: Array<any>): boolean | Promise<boolean>
    }

    export class EventEmitter implements EventEmitter {
        /**
         * The `_events()` field contains the current emitter events and their listeners.
         */
        protected _events: Map<string | symbol, EventEmitterListenersCollection>
        /**
         * @param options.origin Event emitter whose events and their listeners will be shared with this instance.
         * @param options.priority Set the minimum and the maximum emitter listener priority.
         * @param options.captureRejections Forces EventEmitter handle all promise rejection from `emit()` and `emitSerial()` methods as `error` event. 
         */
        constructor(options?: EventEmitterOptions)
        on(eventName: string | symbol, listener: Listener, options?: ListenerOptions): this
        on(eventName: "newListener", listener: (eventName: string | symbol, listener: Listener, options: ListenerOptions) => void, options?: ListenerOptions ): this;
        on(eventName: "removeListener", listener: (eventName: string | symbol, listener: Listener) => void, options?: ListenerOptions): this;
        off(eventName: string | symbol, listener: Listener): this 
        eventNames(): Array<string | symbol>;
        listeners(eventName: string | symbol): Array<Listener> 
        rawListeners(eventName: string | symbol): Array<RawListener>
        listenerCount(eventName: string | symbol): number;
        removeAllListeners(eventName?: string | symbol): this 
        emit(event: string | symbol, ...args: Array<any>): boolean | Promise<boolean>
        /**
         * The `_emit()` method is used to notify listeners about an event.
         * 
         * By default method synchronously calls and concurrently executes each listener registered for the event.
         */
        protected _emit(event: string | symbol, listeners: Array<RawListener>, args: Array<any>): any
    }
 
}
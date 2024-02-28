declare module "@vikhola/events" {

    type TListener = (this: IEventEmitter, ...args: any[]) => any
    type TListenerEntry = { listener: TListener, priority: number }
    type TNewEventListener = (eventName: string | symbol, listener: TListener, options: IListenerOptions) => any
    type TRemoveEventListener = (eventName: string | symbol, listener: TListener) => any

    interface IEventEmitterOptions {
        origin?: IEventEmitter
        priority?: { min?: number, max?: number }
        captureRejections?: boolean
    }

    interface IListenerOptions {
        once?: boolean
        signal?: AbortSignal
        priority?: number
    }

    interface IEventEmitterListener {
        readonly callback: TListener
        notify(emitter: EventEmitter, args: Array<any>, callback: (error?: Error) => any): any
    }

    interface IEventEmitterListenerBucket extends Array<IEventEmitterListener> {
        readonly priority: number
    }

    interface IEventEmitterListenersCollection {
        readonly size: number
        add(listener: IEventEmitterListener, priority?: number): this
        has(callback: TListener): boolean
        delete(callback: TListener): null | IEventEmitterListener 
        clear(): this
        entries(): Array<IEventEmitterListenerBucket>
    }

    interface IEventEmitter {
        /**
         * The `on()` method adds the listener for the event named `eventName`. Any given listener could be added only once per event.
         * 
         * Method emit `newListener` event with an event name, listener and options. 
         * 
         * @param eventName The name of the event.
         * @param listener The callback function.
         * @param options.once When set to true, indicates that listener will be executed only once after what it will be removed from the `eventName`.
         * @param options.signal An AbortSignal that removes the event listener after signal is abortion.
         * @param options.priority The priority is a integer that defaults to `0` and it controls the order in which listeners are executed (the higher the number, the earlier a listener is executed).
         * 
         * @return The reference to the emitter, so that calls can be chained.
         */
        on(eventName: string | symbol, listener: TListener, options?: IListenerOptions): this

        /**
         * The `off()` method removes the listener for the event named `eventName`. 
         * 
         * The `removeListener` event with event name and listener.
         * 
         * @param listener The callback function.
         * @param eventName The name of the event.
         * 
         * @return The reference to the emitter, so that calls can be chained.
         */
        off(eventName: string | symbol, listener: TListener): this 
        /**
         * The `eventNames()` method returns an array of the events with registered listeners. 
         */
        eventNames(): Array<string | symbol>;
        /**
         * The `listeners()` method returns an array of listeners and their priorities for the event named `eventName`.
         * 
         * @param eventName The name of the event.
         */
        listeners(eventName: string | symbol): Array<TListenerEntry> 
        /**
         * The `rawListeners()` method returns a collection containing the raw listeners buckets, sorted by their priority, for the event named `eventName`.  
         * 
         * Buckets of raw listeners for an event named `eventName` from a origin and target with the same priority will not be merged, but will be presented as separate items.
         */
        rawListeners(eventName: string | symbol): Array<IEventEmitterListenerBucket>
        /**
         * The `listenerCount()` method returns the number of listeners listening for the event named `eventName`.
         * 
         * @param eventName The name of the event.
         */
        listenerCount(eventName: string | symbol): number;
        /**
         * The `removeAllListeners()` removes all listeners from the emitter, or those of the specified `eventName`. 
         * 
         * @returns The reference to the emitter, so that calls can be chained.
         */
        removeAllListeners(eventName?: string | symbol): this 
        /**
         * The `emit()` method notify each of registered for the event listener in the order of their priority.
         * 
         * @returns Method return promise that resolves `true` if the event had listeners, `false` otherwise.
         */
        emit(event: string | symbol, ...args: Array<any>): Promise<boolean>
    }

    export class EventEmitter implements IEventEmitter {
        /**
         * The `_events()` field contains the current emitter events and their listeners.
         */
        protected _events: Map<string | symbol, IEventEmitterListenersCollection>
        /**
         * @param options.origin Event emitter whose events and their listeners will be shared with this instance.
         * @param options.priority Set the minimum and the maximum emitter listener priority.
         * @param options.captureRejections Forces EventEmitter handle all promise rejection from `emit()` and `emitSerial()` methods as `error` event. 
         */
        constructor(options?: IEventEmitterOptions)
        on(eventName: string | symbol, listener: TListener, options?: IListenerOptions): this
        on(eventName: "newListener", listener: TNewEventListener, options?: IListenerOptions | undefined): this;
        on(eventName: "removeListener", listener: TRemoveEventListener, options?: IListenerOptions | undefined): this;
        off(eventName: string | symbol, listener: TListener): this 
        eventNames(): Array<string | symbol>;
        listeners(eventName: string | symbol): Array<TListenerEntry> 
        rawListeners(eventName: string | symbol): IEventEmitterListenerBucket[]
        listenerCount(eventName: string | symbol): number;
        removeAllListeners(eventName?: string | symbol): this 
        emit(event: string | symbol, ...args: Array<any>): Promise<boolean>
        /**
         * The `_emit()` method is used to notify listeners about an event.
         * 
         * By default method synchronously calls and concurrently executes each listener registered for the event.
         */
        protected _emit(event: string | symbol, listeners: Array<IEventEmitterListener>, args: Array<any>, callback: (error?: Error) => any): void
    }
 
}
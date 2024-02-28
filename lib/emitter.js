'use strict'

const { Collection } = require('./collection.js') 
const { Listener, OnceListener } = require('./listeners.js')

const kEmitterCaptureRejections = Symbol('kEmitterCaptureRejections')

const kRejectionEvent = 'error'
const kNewListenerEvent = 'newListener'
const kRemoveListenerEvent = 'removeListener'

const RESTRICTED_EVENTS = [ kNewListenerEvent, kRemoveListenerEvent ]

class EventEmitterPriorityRangeError extends Error {
    constructor(min, max) { 
        super(`EventEmitter the "min" priority cannot be larger than the "max".`) 
    }
}

class EventEmitterPriorityTypeError extends Error {
    constructor(min, max) { 
        super(`EventEmitter the "min" and "max" priorities shoud be type of number.`) 
    }
}

class EventEmitterArgumentsError extends Error {
    constructor(key) { 
        super(`EventEmitter "event" and "listener" arguments must be specified.`) 
    }
}

class EventEmitterEventError extends Error {
    constructor(key) { 
        super(`EventEmitter "event" name must be type of string or Symbol.`) 
    }
}

class EventEmitterListenerTypeError extends Error {
    constructor(key) { 
        super('EventEmitter "listener" must be type of function.') 
    }
}

class EventEmitterListenerSignalTypeError extends Error {
    constructor(key) { 
        super('EventEmitter "signal" listener option must implement AbortSignal interface.') 
    }
}

class EventEmitterListenerPriorityTypeError extends Error {
    constructor(min, max) { 
        super(`EventEmitter "priority" listener option must must be integer in range from ${min} to ${max}.`) 
    }
}

class EmitterEventEmitError extends Error {
    constructor(key) { 
        super(`EventEmitter "event" to emit is not specified.`) 
    }
}

class EventEmitter {

    constructor({ origin, captureRejections = false, priority = {} } = {}) {
        this._events = new Map();
        this._origin = origin

        this._min = priority.min != null ? priority.min : 0
        this._max = priority.max != null ? priority.max : 10

        if(typeof this._min !== 'number')
            throw new EventEmitterPriorityTypeError

        if(typeof this._max !== 'number')
            throw new EventEmitterPriorityTypeError

        if(this._min > this._max)
            throw new EventEmitterPriorityRangeError

        this[kEmitterCaptureRejections] = Boolean(captureRejections)
    }

    _validateSignal(signal) {
        return (typeof signal === 'object' && ('aborted' in signal))
    }

    _validatePriority(priority) {
        return (typeof priority === 'number' && Number.isInteger(priority) && priority >= this._min && priority <= this._max)
    }

    _validateListener(listener) {
        return (typeof listener === 'function')
    }

    _validateEventName(eventName) {
        return ((typeof eventName === 'string' && eventName.length !== 0) || typeof eventName === 'symbol')
    }

    on(eventName, listener, options = {}) {
        const aEvents = this._events
        const { signal, priority = 0 } = options

        if (arguments.length < 2)
            throw new EventEmitterArgumentsError;

        if(this._validateEventName(eventName) === false)
            throw new EventEmitterEventError

        if(this._validateListener(listener) === false)
            throw new EventEmitterListenerTypeError;

        if(this._validatePriority(priority) === false)
            throw new EventEmitterListenerPriorityTypeError(this._min, this._max)

        if(signal != null) {

            if(this._validateSignal(signal) === false) 
                throw new EventEmitterListenerSignalTypeError;

            if(signal.aborted === true)
                return this;

            signal.addEventListener('abort', _ => this.off(eventName, listener), { once: true });
        }

        if(aEvents.has(eventName) === false)
            aEvents.set(eventName, new Collection);

        const aCollection = aEvents.get(eventName)

        if(aCollection.has(listener) === true)
            return this

        if(options.once === true)
            aCollection.add(new OnceListener(aCollection, listener, this), priority)
        else 
            aCollection.add(new Listener(aCollection, listener), priority) 

        if(RESTRICTED_EVENTS.includes(eventName) === false && this.listenerCount(kNewListenerEvent) > 0)
            this.emit(kNewListenerEvent, eventName, listener, options).catch(error => this.emit(kRejectionEvent, error))

        return this
    }

    off(eventName, listener) {
        const aEvents = this._events

        if(arguments.length < 2)
            throw new EventEmitterArgumentsError;

        if(this._validateEventName(eventName) === false)
            throw new EventEmitterEventError

        if(this._validateListener(listener) === false)
            throw new EventEmitterListenerTypeError;

        if(aEvents.has(eventName) === false)
            return this

        const aCollection = aEvents.get(eventName)

        if(aCollection.has(listener) === false)
            return this

        aCollection.delete(listener)

        if(RESTRICTED_EVENTS.includes(eventName) === false && this.listenerCount(kRemoveListenerEvent) > 0)
            this.emit(kRemoveListenerEvent, eventName, listener).catch(error => this.emit(kRejectionEvent, error))

        if(aCollection.size === 0)
            aEvents.delete(eventName)

        return this
    }

    eventNames() {

        if(this._origin == null)
            return Array.from(this._events.keys())

        const anOutput = this._origin.eventNames()

        for(const eventName of this._events.keys())
            if(anOutput.includes(eventName) === false)
                anOutput.push(eventName)

        return anOutput
    }

    listeners(eventName) {
        const anOutput = []

        if(this.listenerCount(eventName) === 0)
            return anOutput

        for(const bucket of this.rawListeners(eventName))
            for(const listeners of bucket)
                anOutput.push({ listener: listeners.callback, priority: bucket.priority })

        return anOutput
    }

    rawListeners(eventName) {

        if(this.listenerCount(eventName) === 0)
            return []

        if(this._events.has(eventName) === false)
            return this._origin.rawListeners(eventName)

        if(this._origin == null || this._origin.listenerCount(eventName) === 0)
            return this._events.get(eventName).entries()
        
        const anOutput = []
        const lListeners = this._origin.rawListeners(eventName)
        const rListeners = this._events.get(eventName).entries()

        const lLength = lListeners.length
        const rLength = rListeners.length

        for(var l = 0, r = 0; l !== lLength || r !== rLength; ) {
            const lEntry = lListeners[l]
            const rEntry = rListeners[r]

            if(l === lLength) {
                anOutput.push(rEntry); r++
            }
            else if(r === rLength) {
                anOutput.push(lEntry); l++
            }
            else if(lEntry.priority >= rEntry.priority) {
                anOutput.push(lEntry); l++
            }
            else {
                anOutput.push(rEntry); r++
            }

        }

        return anOutput
    }

    listenerCount(eventName) {

        const aCount = this._events.has(eventName) ? this._events.get(eventName).size : 0

        if(this._origin != null)
            return this._origin.listenerCount(eventName) + aCount
        else 
            return aCount
    }

    removeAllListeners(eventName) {
        if(eventName) {

            if(this._events.has(eventName) === false)
                return this

            this._events.get(eventName).clear()
            this._events.delete(eventName)
        } else {
            for(const eventName of this._events.keys())
                this.removeAllListeners(eventName)
        }

        return this
    }

    emit(event, ...args) {

        if(event == null)
            return Promise.reject(new EmitterEventEmitError)

        const aListeners = this.rawListeners(event).flat()

        if(aListeners.length === 0)
            return Promise.resolve(false)

        return new Promise((resolve, reject) => {

            this._emit(event, aListeners, args, error => error != null ? reject(error) : resolve(this))

        }).catch(error => {

            if(this[kEmitterCaptureRejections] === false || event === kRejectionEvent) 
                throw error

            return this.emit(kRejectionEvent, error)
        }).then(_ => true)

    }

    _emit(event, listeners, args, callback) {
        const aTarget = this

        for(var i = 0, c = 0; i < listeners.length; i++) {

            if(event.stopped !== true)
                listeners[i].notify(aTarget, args, error => error || ++c === listeners.length ? callback(error) : null)

            else if(++c === listeners.length)
                callback()

        }
              
    }

}

module.exports = { EventEmitter }
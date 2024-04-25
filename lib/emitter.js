'use strict'

const { Wrap } = require('./listeners.js')
const { Collection } = require('./collection.js') 

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

    constructor({ origin, priority = {} } = {}) {
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

        if(!aEvents.has(eventName))
            aEvents.set(eventName, new Collection);

        const aCollection = aEvents.get(eventName)

        if(aCollection.has(listener))
            return this
        
        aCollection.add(Wrap(this, eventName, listener, priority, options.once))

        if(!RESTRICTED_EVENTS.includes(eventName))
            this.emit(kNewListenerEvent, eventName, listener, options)

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

        if(RESTRICTED_EVENTS.includes(eventName) === false)
            this.emit(kRemoveListenerEvent, eventName, listener)

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
        return this.rawListeners(eventName).map(wrap => wrap.listener)
    }

    rawListeners(eventName) {

        if(this.listenerCount(eventName) === 0)
            return []

        if(!this._events.has(eventName))
            return this._origin.rawListeners(eventName)

        if(this._origin == null || this._origin.listenerCount(eventName) === 0)
            return this._events.get(eventName).entries()

        return this._events.get(eventName).entries(this._origin.rawListeners(eventName))
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
            throw new EmitterEventEmitError

        if(!this.listenerCount(event))
            return false

        const result = this._emit(event, this.rawListeners(event), args)

        if(result != null && typeof result.then === 'function')
            return result.then(_ => true)

        return true
    }

    _emit(event, listeners, args) {
        let result;
        const aPromises = []

        try {
            
            for(let i = 0; i < listeners.length; i++) {

                result = listeners[i](this, args)

                if(result != null && typeof result.then === 'function')
                    aPromises.push(result)

            }
    
        } catch (error) {
            
            if(!aPromises.length)
                throw error
  
            aPromises.push(Promise.reject(error))
        }

        if(aPromises.length > 0)
            return Promise.all(aPromises)
              
    }

}

module.exports = { EventEmitter }
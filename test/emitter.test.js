const assert = require('node:assert');
const { describe, it } = require('node:test');
const { EventEmitter } = require('../lib/emitter.js');

const slice = (arr, skip = 0, max = 3) => {
    const result = []
    const step = Math.round(arr.length / max)
    for (i = skip; i < arr.length; i=i+step) 
        result.push(arr[i]);
    return result
}
const listeners = (t, count) => new Array(count).fill(undefined).map((v, i) => t.mock.fn() )
const asyncWrapper = fn => (...args) => new Promise(resolve => setImmediate(_ => { resolve(fn(...args)) }))

describe('EventEmitter test', function(t) {

    describe('"priority" option', function() {

        it('should throw an Error when the emitter listener\'s minimum priority is not type of number', function() {
            assert.throws(_ => new EventEmitter({ priority: { min: 'foo' } }), { message: 'EventEmitter the "min" and "max" priorities shoud be type of number.' })
        })

        it('should throw an Error when the emitter listener\'s maximal priority is not type of number', function() {
            assert.throws(_ => new EventEmitter({ priority: { max: 'foo' } }), { message: 'EventEmitter the "min" and "max" priorities shoud be type of number.' })
        })

        it('should throw an Error when the emitter listener\'s minimum priority is larger than maximal', function(t) {
            assert.throws(_ => new EventEmitter({ priority: { min: 20 } }), { message: 'EventEmitter the "min" priority cannot be larger than the "max".' })
        })

    })

    describe('"on()" method', function() {

        it('should attach a listener to the emitter event', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', aListener)

            assert.strictEqual(aEventEmitter.listenerCount('event'), 1)
        })

        it('should attach new event the emitter with an listener on if it doesn\'t exist', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', aListener)

            assert.strictEqual(aEventEmitter.listenerCount('event'), 1)
            assert.deepStrictEqual(aEventEmitter.eventNames(), [ 'event' ])
        })

        it('should ignore a listener if he is already attached to the emitter event', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', aListener)
            aEventEmitter.on('event', aListener)

            assert.strictEqual(aEventEmitter.listenerCount('event'), 1)
        })

        it('should remove a listener from the emitter event after abort controller "abortion" event', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()
            const aController = new AbortController()

            aEventEmitter.on('event', aListener, { signal: aController.signal })

            aController.abort()

            assert.strictEqual(aEventEmitter.listenerCount('event'), 0)
        })

        it('should emit "newListener" event after adding a new listener to the event', function(t) {
            const aEventEmitter = new EventEmitter({ captureRejections: true })
            const aCommonListener = t.mock.fn()
            const aEventListener = t.mock.fn((name, listener, options) => {
                assert.strictEqual(name, 'event')
                assert.strictEqual(listener, aCommonListener)
                assert.deepStrictEqual(options, { priority: 7, once: true })
            })

            aEventEmitter.on('newListener', aEventListener)
            aEventEmitter.on('event', aCommonListener, { priority: 7, once: true })

            assert.strictEqual(aEventListener.mock.callCount(), 1)
        })

        it('should not emit "newListener" event when adding listener of it', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter({ captureRejections: true })

            aEventEmitter.on('newListener', aListener)

            assert.strictEqual(aListener.mock.callCount(), 0)
        })

        it('should throw an Error when some arguments is not provided', function(t) {
            const aEventEmitter = new EventEmitter()
            assert.throws(_ => aEventEmitter.on(), { message: 'EventEmitter "event" and "listener" arguments must be specified.' })
        })

        it('should throw an Error when a event is not type of "string" or "symbol"', function(t) {
            const aEventEmitter = new EventEmitter()
            assert.throws(_ => aEventEmitter.on({}, undefined ), { message: 'EventEmitter "event" name must be type of string or Symbol.' })
        })

        it('should throw an Error when a listener is not type of "function"', function(t) {
            const aEventEmitter = new EventEmitter()
            assert.throws(_ => aEventEmitter.on('event', undefined), { message: 'EventEmitter "listener" must be type of function.' })
        })

        it('should throw an Error when a event listener "signal" option is not implement abort controller signal interface', function(t) {
            const aEventEmitter = new EventEmitter()
            assert.throws(_ => aEventEmitter.on('event', _ => {}, { signal: {} } ), { message: 'EventEmitter "signal" listener option must implement AbortSignal interface.' })
        })

        it('should throw an Error when a event listener "priority" option is not type of "number"', function(t) {
            const aEventEmitter = new EventEmitter()
            assert.throws(_ => aEventEmitter.on('event', _ => {}, { priority: 'foo' } ), { message: 'EventEmitter "priority" listener option must must be integer in range from 0 to 10.' })
        })

        it('should throw an Error when a event listener "priority" option is not integer', function(t) {
            const aEventEmitter = new EventEmitter()
            assert.throws(_ => aEventEmitter.on('event', _ => {}, { priority: 3.14 } ), { message: 'EventEmitter "priority" listener option must must be integer in range from 0 to 10.' })
        })

        it('should throw an Error when a event listener "priority" option exceeds the emitter\'s maximum priority', function(t) {
            const aEventEmitter = new EventEmitter()
            assert.throws(_ => aEventEmitter.on('event', _ => {}, { priority: 12 } ), { message: 'EventEmitter "priority" listener option must must be integer in range from 0 to 10.' })
        })

        it('should throw an Error when a event listener "priority" option is lower than the emitter minimum priority', function(t) {
            const aEventEmitter = new EventEmitter()
            assert.throws(_ => aEventEmitter.on('event', _ => {}, { priority: 12 } ), { message: 'EventEmitter "priority" listener option must must be integer in range from 0 to 10.' })
        })

    })

    describe('"off()" method', function() {

        it('should remove a listener from the emitter event', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', aListener)

            assert.strictEqual(aEventEmitter.off('event', aListener), aEventEmitter)
            assert.strictEqual(aEventEmitter.listenerCount('event'), 0)
        })

        it('should remove an event from the emitter if its last listener was removed', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', aListener)
            aEventEmitter.off('event', aListener)

            assert.deepStrictEqual(aEventEmitter.eventNames(), [])
        })

        it('should remove a listener only from the emitter event', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', aListener)
            aEventEmitter.on('event.foo', aListener)

            assert.strictEqual(aEventEmitter.off('event', aListener), aEventEmitter)
            assert.strictEqual(aEventEmitter.listenerCount('event'), 0)
            assert.strictEqual(aEventEmitter.listenerCount('event.foo'), 1)
        })

        it('should emit "removeListener" event before listener removing', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            const aRemoveEventListener = t.mock.fn((name, listener) => {
                assert.strictEqual(name, 'event')
                assert.strictEqual(listener, aListener)
            })

            aEventEmitter.on('removeListener', aRemoveEventListener)
            aEventEmitter.on('event', aListener, { priority: 7, once: true })
            aEventEmitter.off('event', aListener)

            assert.strictEqual(aRemoveEventListener.mock.callCount(), 1)
        })

        it('should throw an Error when some arguments is not provided', function(t) {
            const aEventEmitter = new EventEmitter()
            assert.throws(_ => aEventEmitter.off(), { message: 'EventEmitter "event" and "listener" arguments must be specified.' })
        })

        it('should throw an Error when a event is not type of "string" or "symbol"', function(t) {
            const aEventEmitter = new EventEmitter()
            assert.throws(_ => aEventEmitter.off({}, undefined ), { message: 'EventEmitter "event" name must be type of string or Symbol.' })
        })

        it('should throw an Error when a listener is not type of "function"', function(t) {
            const aEventEmitter = new EventEmitter()
            assert.throws(_ => aEventEmitter.off('event', undefined ), { message: 'EventEmitter "listener" must be type of function.' })
        })

    })

    describe('"eventNames()" method',  function() {

        it('should return empty array if no events is attached to the emitter', function(t) {
            const aEventEmitter = new EventEmitter
            assert.deepStrictEqual(aEventEmitter.eventNames(), [])
        })

        it('should return empty array if no events is attached to the emitter and its origin', function(t) {
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })
            assert.deepStrictEqual(aEventEmitterThree.eventNames(), [])
        })

        it('should return events attached to the emitter', function(t) {
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('foo', _ => {})
            assert.deepStrictEqual(aEventEmitter.eventNames(), [ 'foo' ])

            aEventEmitter.on('bar', _ => {})
            assert.deepStrictEqual(aEventEmitter.eventNames(), [ 'foo', 'bar' ])
        })

        it('should return events attached to the emitter and its origin', function() {
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })

            aEventEmitterOne.on('foo', _ => {})
            assert.deepStrictEqual(aEventEmitterThree.eventNames(), [ 'foo' ])

            aEventEmitterTwo.on('bar', _ => {})
            assert.deepStrictEqual(aEventEmitterThree.eventNames(), [ 'foo', 'bar' ])

            aEventEmitterThree.on('baz', _ => {})
            assert.deepStrictEqual(aEventEmitterThree.eventNames(), [ 'foo', 'bar', 'baz' ])
        })

    })

    describe('"listeners()" method', function() {

        it('should return empty array if there are no listeners attached to the emitter event', function(t) {
            const aEventEmitter = new EventEmitter
            assert.deepStrictEqual(aEventEmitter.listeners('foo'), [])
        })

        it('should return empty array if there are no listeners attached to the event at the emitter and its origin', function(t) {
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            assert.deepStrictEqual(aEventEmitterTwo.listeners('foo'), [])
        })

        it('should return listeners attached to the emitter event', function(t) {
            const aListeners = listeners(t, 9)
            const aEventEmitter = new EventEmitter

            aListeners.forEach(listener => aEventEmitter.on('foo', listener))
            assert.deepEqual(aEventEmitter.listeners('foo'), aListeners)
        })

        it('should return listeners attached to the event at the emitter and its origin', function(t) {
            const aListeners = listeners(t, 9)
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })

            aListeners.slice(0, 3).forEach(listener => aEventEmitterOne.on('foo', listener))
            aListeners.slice(3, 6).forEach(listener => aEventEmitterTwo.on('foo', listener))
            aListeners.slice(6, 9).forEach(listener => aEventEmitterThree.on('foo', listener))

            assert.deepEqual(aEventEmitterThree.listeners('foo'), aListeners)
        })

        it('should return listeners attached to the emitter event sorted by their priority', function(t) {
            const aListeners = listeners(t, 9)
            const aEventEmitter = new EventEmitter

            aListeners.forEach((listener, i) => aEventEmitter.on('foo', listener, { priority: i }))
            assert.deepEqual(aEventEmitter.listeners('foo'), aListeners.reverse())
        })

        it('should return listeners attached to the event at the emitter and its origin sorted by their priority', function(t) {
            const aListeners = listeners(t, 9)
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })

            slice(aListeners, 2).forEach((listener, i) => aEventEmitterOne.on('foo', listener, { priority: i }))
            slice(aListeners, 1).forEach((listener, i) => aEventEmitterTwo.on('foo', listener, { priority: i }))
            slice(aListeners, ).forEach((listener, i) => aEventEmitterThree.on('foo', listener, { priority: i }))

            assert.deepEqual(aEventEmitterThree.listeners('foo'), aListeners.reverse())
        })

    })

    describe('"listenersCount()" method', function() {

        it('should return 0 if no listeners attached to the emitter event', function(t) {
            const aEventEmitter = new EventEmitter
            assert.deepStrictEqual(aEventEmitter.listenerCount('foo'), 0)
        })

        it('should return 0 if there are no listeners attached to the event at the emitter and its origin', function(t) {
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })
            assert.deepStrictEqual(aEventEmitterThree.listenerCount('foo'), 0)
        })

        it('should return count of listeners attached to the emitter event', function(t) {
            const aListeners = listeners(t, 9)
            const aEventEmitter = new EventEmitter

            aListeners.forEach(listener => aEventEmitter.on('foo', listener))

            assert.strictEqual(aEventEmitter.listenerCount('foo'), 9)
        })

        it('should return count of listeners attached to the event at the emitter and its origin', function(t) {
            const aListeners = listeners(t, 9)
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })

            aListeners.slice(0, 3).forEach(listener => aEventEmitterOne.on('foo', listener))
            aListeners.slice(3, 6).forEach(listener => aEventEmitterTwo.on('foo', listener))
            aListeners.slice(6, 9).forEach(listener => aEventEmitterThree.on('foo', listener))

            assert.strictEqual(aEventEmitterThree.listenerCount('foo'), 9)
        })

    })

    describe('"rawListeners()" method', function() {

        it('should return empty array if no listeners attached to the emitter event', function(t) {
            const aEventEmitter = new EventEmitter
            assert.deepEqual(aEventEmitter.rawListeners('foo'), [])
        })

        it('should return empty array if no listeners attached to the event at the emitter and its origin', function(t) {
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })
            assert.deepEqual(aEventEmitterThree.rawListeners('foo'), [])
        })

        it('should return raw listeners attached to the emitter event', function(t) {
            const aListeners = listeners(t, 9)
            const aEventEmitter = new EventEmitter

            aListeners.forEach(listener => aEventEmitter.on('foo', listener))
            
            assert.deepEqual(aEventEmitter.rawListeners('foo').map(listener => listener.listener), aListeners)
        })

        it('should return raw listeners attached to the event at the emitter and its origin', function(t) {
            const aListeners = listeners(t, 9)
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })

            aListeners.slice(0, 3).forEach(listener => aEventEmitterOne.on('foo', listener))
            aListeners.slice(3, 6).forEach(listener => aEventEmitterTwo.on('foo', listener))
            aListeners.slice(6, 9).forEach(listener => aEventEmitterThree.on('foo', listener))

            assert.deepEqual(aEventEmitterThree.rawListeners('foo').map(listener => listener.listener), aListeners)
        })

        it('should return raw listeners attached to the emitter event sorted by their priority', function(t) {
            const aListeners = listeners(t, 9)
            const aEventEmitter = new EventEmitter

            aListeners.forEach((listener, i) => aEventEmitter.on('foo', listener, { priority: i }))

            assert.deepEqual(aEventEmitter.rawListeners('foo').map(listener => listener.listener), aListeners.reverse())
            assert.deepEqual(aEventEmitter.rawListeners('foo').map(listener => listener.priority), [ 8, 7, 6, 5, 4, 3, 2, 1, 0 ])
        })

        it('should return listeners attached to the event at the emitter and its origin sorted by their priority', function(t) {
            const aListeners = listeners(t, 9)
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })

            slice(aListeners, 2).forEach((listener, i) => aEventEmitterOne.on('foo', listener, { priority: i }))
            slice(aListeners, 1).forEach((listener, i) => aEventEmitterTwo.on('foo', listener, { priority: i }))
            slice(aListeners, ).forEach((listener, i) => aEventEmitterThree.on('foo', listener, { priority: i }))

            assert.deepEqual(aEventEmitterThree.rawListeners('foo').map(listener => listener.listener), aListeners.reverse())
            assert.deepEqual(aEventEmitterThree.rawListeners('foo').map(listener => listener.priority), [ 2, 2, 2, 1, 1, 1, 0, 0, 0 ])
        })

    })

    describe('"removeAllListeners()" method',  function() {

        it('should remove all listeners and attached events from the emitter', function(t) {
            const aListeners = listeners(t, 9)
            const aEventEmitter = new EventEmitter()

            aListeners.forEach(listener => aEventEmitter.on('foo', listener))
            aListeners.forEach(listener => aEventEmitter.on('bar', listener))

            aEventEmitter.removeAllListeners()

            assert.strictEqual(aEventEmitter.listenerCount('foo'), 0)
            assert.strictEqual(aEventEmitter.listenerCount('bar'), 0)
            assert.deepStrictEqual(aEventEmitter.eventNames(), [])
        })

        it('should remove all listeners attached to the emitter event', function(t) {
            const aListeners = listeners(t, 9)
            const aEventEmitter = new EventEmitter()

            aListeners.forEach(listener => aEventEmitter.on('foo', listener))
            aListeners.forEach(listener => aEventEmitter.on('bar', listener))

            aEventEmitter.removeAllListeners('foo')

            assert.strictEqual(aEventEmitter.listenerCount('foo'), 0)
            assert.strictEqual(aEventEmitter.listenerCount('bar'), 9)
            assert.deepStrictEqual(aEventEmitter.eventNames(), [ 'bar' ])
        })
        
    })

    describe('"emit()" method', function() {

        const listeners = t => {

            const first = t.mock.fn(function first() {
                assert.strictEqual(second.mock.callCount(), 0)
                assert.strictEqual(third.mock.callCount(), 0)
            })
        
            const second = t.mock.fn(function second()  {
                assert.strictEqual(first.mock.callCount(), 1)
                assert.strictEqual(third.mock.callCount(), 0)
            })
            const third = t.mock.fn(function third()  {
                assert.strictEqual(first.mock.callCount(), 1)
                assert.strictEqual(second.mock.callCount(), 1)
            })
        
            return [ first, second, third ]
        } 
        
        it('should return "false" when no listeners is listening the event', function(t) {
            const payload = Symbol('args')
            const aEventEmitter = new EventEmitter()

            assert.strictEqual(aEventEmitter.emit('event', payload), false)
        })

        it('should call listeners with provided arguments and with emitter as this', function(t) {
            const payload = Symbol('args')
            const aEventEmitter = new EventEmitter()
            const aListener = t.mock.fn(function (arg) {
                assert.strictEqual(arg, payload)
                assert.strictEqual(this, aEventEmitter)
            })

            aEventEmitter.on('event', aListener).emit('event', payload)

            assert.strictEqual(aListener.mock.callCount(), 1)
        })

        it('should call once listener and remove it from the emitter event after first call', function(t) {
            const payload = Symbol('args')
            const aEventEmitter = new EventEmitter()
            const aListener = t.mock.fn(function (arg) {
                assert.strictEqual(arg, payload)
                assert.strictEqual(this, aEventEmitter)
            })

            aEventEmitter.on('event', aListener, { once: true })

            aEventEmitter.emit('event', payload)
            aEventEmitter.emit('event', payload)
            aEventEmitter.emit('event', payload)

            assert.strictEqual(aListener.mock.callCount(), 1)
            assert.strictEqual(aEventEmitter.listenerCount('event'), 0)
        })

        it('should call listeners and return "true" if event listening only synchronous listeners', function(t) {
            const payload = Symbol('args')
            const aListenerOne = t.mock.fn(arg => assert.strictEqual(arg, payload))
            const aListenerTwo = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', aListenerOne)
            aEventEmitter.on('event', aListenerTwo)

            assert.strictEqual(aEventEmitter.emit('event', payload), true)
            assert.strictEqual(aListenerOne.mock.callCount(), 1)
            assert.strictEqual(aListenerTwo.mock.callCount(), 1)
        })

        it('should call listeners and return promise which resolves "true" if event listening some async listeners', async function(t) {
            const aListenerOne = t.mock.fn()
            const aListenerTwo = t.mock.fn()
            const aListenerThree = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', aListenerOne)
            aEventEmitter.on('event', asyncWrapper(aListenerTwo))
            aEventEmitter.on('event', aListenerThree)

            const result = aEventEmitter.emit('event')

            assert.strictEqual(result instanceof Promise, true)
            assert.strictEqual(await result, true)
            assert.strictEqual(aListenerOne.mock.callCount(), 1)
            assert.strictEqual(aListenerTwo.mock.callCount(), 1)
            assert.strictEqual(aListenerThree.mock.callCount(), 1)
        })

        it('should call listeners in the order of their priority', function(t) {
            const aEventEmitter = new EventEmitter()
            const [ aListenerOne, aListenerTwo, aListenerThree ] = listeners(t)

            aEventEmitter.on('event', aListenerTwo, { priority: 2 })
            aEventEmitter.on('event', aListenerOne, { priority: 3 })
            aEventEmitter.on('event', aListenerThree, { priority: 1 })

            aEventEmitter.emit('event')

            assert.strictEqual(aListenerOne.mock.callCount(), 1)
            assert.strictEqual(aListenerTwo.mock.callCount(), 1)
            assert.strictEqual(aListenerThree.mock.callCount(), 1)
        })

        it('should call listeners in the order they were added if the priority between listeners is the same',  async function(t) {
            const aEventEmitter = new EventEmitter()
            const [ aListenerOne, aListenerTwo, aListenerThree ] = listeners(t)

            aEventEmitter.on('event', aListenerOne)
            aEventEmitter.on('event', asyncWrapper(aListenerTwo))
            aEventEmitter.on('event', asyncWrapper(aListenerThree))

            await aEventEmitter.emit('event')

            assert.strictEqual(aListenerOne.mock.callCount(), 1)
            assert.strictEqual(aListenerTwo.mock.callCount(), 1)
            assert.strictEqual(aListenerThree.mock.callCount(), 1)
        })

        it('should call listeners from the emitter origin in the order of their priority', function(t) {
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })
            const [ aListenerOne, aListenerTwo, aListenerThree ] = listeners(t)
    
            aEventEmitterThree.on('foo', aListenerOne, { priority: 10 })
            aEventEmitterTwo.on('foo', aListenerThree)
            aEventEmitterOne.on('foo', aListenerTwo, { priority: 5 })
    
            aEventEmitterThree.emit('foo')
    
            assert.strictEqual(aListenerOne.mock.callCount(), 1)
            assert.strictEqual(aListenerTwo.mock.callCount(), 1)
            assert.strictEqual(aListenerThree.mock.callCount(), 1)
        })

        it('should call listeners in the order of their emitters if the priority between listeners is the same', function(t) {
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })
            const [ aListenerOne, aListenerTwo, aListenerThree ] = listeners(t)
    
            aEventEmitterThree.on('foo', aListenerThree)
            aEventEmitterTwo.on('foo', aListenerTwo)
            aEventEmitterOne.on('foo', aListenerOne)
    
            aEventEmitterThree.emit('foo')
    
            assert.strictEqual(aListenerOne.mock.callCount(), 1)
            assert.strictEqual(aListenerTwo.mock.callCount(), 1)
            assert.strictEqual(aListenerThree.mock.callCount(), 1)
        })

        it('should throw an error when eventName is not provided', function(t) {
            const aEventEmitter = new EventEmitter()
            assert.throws(_ => aEventEmitter.emit(), { message: 'EventEmitter "event" to emit is not specified.' })
        })

        it('should throw an error occurred during synchronous listeners execution', function(t) {
            const aError = new Error('oops')
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', _ => { throw aError })

            assert.throws(_ => aEventEmitter.emit('event'), aError)
        })

        it('should reject an error occurred during asynchronous listeners execution', async function(t) {
            const aError = new Error('oops')
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', _ => new Promise((resolve, reject) => setImmediate(_ => reject(aError))))

            assert.rejects(_ => aEventEmitter.emit('event'), aError)
        })

        it('should reject an error occurred during a synchronous listener among asynchronous listeners', async function(t) {
            const aSyncError = new Error('sync oops')
            const aAsyncError = new Error('async oops')
            const aEventEmitter = new EventEmitter()
            const aErrorListener = t.mock.fn(error => { throw error })

            process.once('unhandledRejection', aErrorListener)

            aEventEmitter.on('event', _ => new Promise((resolve, reject) => setImmediate(_ => reject(aAsyncError))))
            aEventEmitter.on('event', _ => { throw aSyncError })

            await assert.rejects(_ => aEventEmitter.emit('event'), aSyncError)
            await new Promise((resolve, reject) => setImmediate(resolve))

            process.removeListener('unhandledRejection', aErrorListener)
            assert.strictEqual(aErrorListener.mock.callCount(), 0)
        })

    })

})
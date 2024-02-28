const assert = require('node:assert');
const { describe, it } = require('node:test');
const { EventEmitter } = require('../lib/emitter.js');

const kRejectionEvent = 'error'

const createOrderedListeners = t => {

    const fistListener = t.mock.fn(function first() {
        assert.strictEqual(secondListener.mock.callCount(), 0)
        assert.strictEqual(thirdListener.mock.callCount(), 0)
    })

    const secondListener = t.mock.fn(function second()  {
        assert.strictEqual(fistListener.mock.callCount(), 1)
        assert.strictEqual(thirdListener.mock.callCount(), 0)
    })
    const thirdListener = t.mock.fn(function third()  {
        assert.strictEqual(fistListener.mock.callCount(), 1)
        assert.strictEqual(secondListener.mock.callCount(), 1)
    })

    return { fistListener, secondListener, thirdListener }
} 

const createErrorListeners = (t, aError) => {
    const errorListenerSync = t.mock.fn(_ => { throw aError })
    const errorListenerAsync = t.mock.fn(_ => new Promise((resolve, reject) => setImmediate(_ => reject(aError))))

    return { errorListenerSync, errorListenerAsync }
}

const createChunkedListeners = (t, count, interval) => 
    new Array(count).fill(undefined).map((v, i) => ({ listener: t.mock.fn(), priority: i >= interval ? (i % interval === 0 && i !== interval ? (interval += interval) : interval) : 0 })).reverse()

const sleep = (callback, ms) => new Promise(resolve => setTimeout(_ => resolve(callback()), ms))
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

        it('should add a listener to the emitter', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', aListener)

            assert.strictEqual(aEventEmitter.listenerCount('event'), 1)
        })

        it('should create an event with a listener on the emitter if it doesn\'t exist', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', aListener)

            assert.strictEqual(aEventEmitter.listenerCount('event'), 1)
            assert.deepStrictEqual(aEventEmitter.eventNames(), [ 'event' ])
        })

        it('should not add a listener to the emitter if it\'s already there', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', aListener)
            aEventEmitter.on('event', aListener)

            assert.strictEqual(aEventEmitter.listenerCount('event'), 1)
        })

        it('should remove a listener from the emitter after abort controller "abortion" event', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()
            const aController = new AbortController()

            aEventEmitter.on('event', aListener, { signal: aController.signal })

            aController.abort()

            assert.strictEqual(aEventEmitter.listenerCount('event'), 0)
        })

        it('should emit "newListener" event after adding a new listener to the emitter', function(t) {
            const aEventEmitter = new EventEmitter({ captureRejections: true })

            const aNewEventListener = t.mock.fn((name, listener, options) => {
                assert.strictEqual(name, 'event')
                assert.strictEqual(listener, aListener)
                assert.deepStrictEqual(options, { priority: 7, once: true })
            })
            const aListener = t.mock.fn()

            aEventEmitter.on('newListener', aNewEventListener)
            aEventEmitter.on('event', aListener, { priority: 7, once: true })

            assert.strictEqual(aNewEventListener.mock.callCount(), 1)
        })

        it('should not emit "newListener" event when adding listener of it', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter({ captureRejections: true })

            aEventEmitter.on('newListener', aListener)

            assert.strictEqual(aListener.mock.callCount(), 0)
        })

        it(`should emit "error" event when a "newListener" event listener rejects an Error`, async function(t) {
            const aError = new Error('test')
            const aEventEmitter = new EventEmitter()

            const aListener = t.mock.fn(error => assert.strictEqual(error, aError))
            const aNewEventListener = t.mock.fn(_ => { throw aError })

            aEventEmitter.on(kRejectionEvent, aListener)
            aEventEmitter.on('newListener', aNewEventListener)
            aEventEmitter.on('event', _ => {})

            await new Promise(resolve => setImmediate(resolve))

            assert.strictEqual(aListener.mock.callCount(), 1)
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

    describe('"off()" method',  async function() {

        it('should remove a listener from the emitter', function(t) {
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

        it('should remove a listener only from specified event', function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', aListener)
            aEventEmitter.on('event.foo', aListener)

            assert.strictEqual(aEventEmitter.off('event', aListener), aEventEmitter)
            assert.strictEqual(aEventEmitter.listenerCount('event'), 0)
            assert.strictEqual(aEventEmitter.listenerCount('event.foo'), 1)
        })

        it('should prevent the event listeners from executing if they have been removed', async function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            const aRemoveListener = t.mock.fn(_ => aEventEmitter.off('foo', aListener))

            aEventEmitter.on('foo', aRemoveListener)
            aEventEmitter.on('foo', aListener)

            await aEventEmitter.emit('foo')

            assert.strictEqual(aListener.mock.callCount(), 0)
            assert.strictEqual(aRemoveListener.mock.callCount(), 1)
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

        it(`should emit "error" event when a "removeListener" event listener rejects an Error`, async function(t) {
            const aError = new Error('test')
            const aEventEmitter = new EventEmitter()

            const aListener = t.mock.fn(error => assert.strictEqual(error, aError))
            const aRemovedListener = t.mock.fn()
            const aRemoveEventListener = t.mock.fn(_ => { throw aError })

            aEventEmitter.on(kRejectionEvent, aListener)
            aEventEmitter.on('removeListener', aRemoveEventListener)
            aEventEmitter.on('event', aRemovedListener).off('event', aRemovedListener)

            await new Promise(resolve => setImmediate(resolve))

            assert.strictEqual(aListener.mock.callCount(), 1)
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

        it('should return empty array if no events is bound to the emitter', function(t) {
            const aEventEmitter = new EventEmitter
            assert.deepStrictEqual(aEventEmitter.eventNames(), [])
        })

        it('should return events bound to the emitter', function(t) {
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('foo', _ => {})

            assert.deepStrictEqual(aEventEmitter.eventNames(), [ 'foo' ])

            aEventEmitter.on('bar', _ => {})

            assert.deepStrictEqual(aEventEmitter.eventNames(), [ 'foo', 'bar' ])
        })

        it('should return empty array if no events is bound to the emitter origin', function(t) {
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })
            assert.deepStrictEqual(aEventEmitterThree.eventNames(), [])
        })

        it('should return events bound to the emitter origin', function() {
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

        it('should return empty array if no listeners is bound to the emitter event', function(t) {
            const aEventEmitter = new EventEmitter
            assert.deepStrictEqual(aEventEmitter.listeners('foo'), [])
        })

        it('should return listeners bound to the emitter event', async function(t) {
            const aListeners = createChunkedListeners(t, 9, 3)
            const aEventEmitter = new EventEmitter

            for(const listener of aListeners)
                aEventEmitter.on('foo', listener.listener, { priority: listener.priority })

            assert.deepEqual(aEventEmitter.listeners('foo'), aListeners)
        })

        it('should return empty array if there are no listeners attached to the event in the emitter origin', function(t) {
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })
            assert.deepStrictEqual(aEventEmitterThree.listeners('foo'), [])
        })

        it('should return event listeners attached to the event from the emitter origin', function(t) {
            const aListeners = createChunkedListeners(t, 9, 3)
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })

            for(const listener of aListeners.slice(0, 3))
                aEventEmitterOne.on('foo', listener.listener, { priority: listener.priority })

            assert.deepEqual(aEventEmitterThree.listeners('foo'), aListeners.slice(0, 3))

            for(const listener of aListeners.slice(3, 6))
                aEventEmitterTwo.on('foo', listener.listener, { priority: listener.priority })

            assert.deepEqual(aEventEmitterThree.listeners('foo'), aListeners.slice(0, 6))

            for(const listener of aListeners.slice(6, 9))
                aEventEmitterThree.on('foo', listener.listener, { priority: listener.priority })

            assert.deepEqual(aEventEmitterThree.listeners('foo'), aListeners)
        })

    })

    describe('"listenersCount()" method', function() {

        it('should return 0 if no listeners is bound to the emitter event', function(t) {
            const aEventEmitter = new EventEmitter
            assert.deepStrictEqual(aEventEmitter.listenerCount('foo'), 0)
        })

        it('should return listeners count bound to the emitter event', function(t) {
            const aListeners = createChunkedListeners(t, 9, 3)
            const aEventEmitter = new EventEmitter

            for(const listener of aListeners)
                aEventEmitter.on('foo', listener.listener, { priority: listener.priority })

            assert.strictEqual(aEventEmitter.listenerCount('foo'), 9)
        })

        it('should return 0 if there are no listeners attached to the event in the emitter origin', function(t) {
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })
            assert.deepStrictEqual(aEventEmitterThree.listenerCount('foo'), 0)
        })

        it('should return event listeners count attached to the event in the emitter origin', function(t) {
            const aListeners = createChunkedListeners(t, 9, 3)
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })

            for(const listener of aListeners.slice(0, 3))
                aEventEmitterOne.on('foo', listener.listener, { priority: listener.priority })

            assert.strictEqual(aEventEmitterThree.listenerCount('foo'), 3)

            for(const listener of aListeners.slice(3, 6))
                aEventEmitterTwo.on('foo', listener.listener, { priority: listener.priority })

            assert.strictEqual(aEventEmitterThree.listenerCount('foo'), 6)

            for(const listener of aListeners.slice(6, 9))
                aEventEmitterThree.on('foo', listener.listener, { priority: listener.priority })

            assert.strictEqual(aEventEmitterThree.listenerCount('foo'), 9)
        })

    })

    describe('"rawListeners()" method', function() {

        it('should return empty array if no event listeners is bound to the emitter event', function(t) {
            const aEventEmitter = new EventEmitter
            assert.deepEqual(aEventEmitter.rawListeners('foo'), [])
        })

        it('should return listner buckets bound to the emitter event', function(t) {
            const aListeners = createChunkedListeners(t, 6, 3)
            const aEventEmitter = new EventEmitter

            assert.deepEqual(aEventEmitter.rawListeners('foo'), [])

            for(const listener of aListeners)
                aEventEmitter.on('foo', listener.listener, { priority: listener.priority })
            
            assert.deepEqual(
                aEventEmitter.rawListeners('foo').flat().map(listener => listener.callback), 
                aListeners.map(listener => listener.listener)
            )
        })

        it('should return empty array if no event listeners attached to the event in the emitter origin', function(t) {
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })
            assert.deepEqual(aEventEmitterThree.rawListeners('foo'), [])
        })

        it('should return event listeners attached to the event in the emitter origin', function(t) {
            const aListeners = createChunkedListeners(t, 9, 3)
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })

            for(const listener of aListeners.slice(0, 3))
                aEventEmitterOne.on('foo', listener.listener, { priority: listener.priority })

            assert.deepEqual(
                aEventEmitterThree.rawListeners('foo').flat().map(listener => listener.callback), 
                aListeners.slice(0, 3).map(listener => listener.listener)
            )

            for(const listener of aListeners.slice(3, 6))
                aEventEmitterTwo.on('foo', listener.listener, { priority: listener.priority })

            assert.deepEqual(
                aEventEmitterThree.rawListeners('foo').flat().map(listener => listener.callback), 
                aListeners.slice(0, 6).map(listener => listener.listener)
            )

            for(const listener of aListeners.slice(6, 9))
                aEventEmitterThree.on('foo', listener.listener, { priority: listener.priority })

            assert.deepEqual(
                aEventEmitterThree.rawListeners('foo').flat().map(listener => listener.callback), 
                aListeners.slice(0, 9).map(listener => listener.listener)
            )
        })

    })

    describe('"removeAllListeners()" method',  function() {

        it('should remove all listeners and their events from the emitter', function(t) {
            const aListeners = createChunkedListeners(t, 9, 3)
            const aEventEmitter = new EventEmitter()

            for(const listener of aListeners.slice(0, 9))
                aEventEmitter.on('foo', listener.listener, { priority: listener.priority })

            for(const listener of aListeners.slice(0, 9))
                aEventEmitter.on('bar', listener.listener, { priority: listener.priority })

            aEventEmitter.removeAllListeners()

            assert.strictEqual(aEventEmitter.listenerCount('foo'), 0)
            assert.strictEqual(aEventEmitter.listenerCount('bar'), 0)
            assert.deepStrictEqual(aEventEmitter.eventNames(), [])
        })

        it('should remove all listeners from the emitter by event', function(t) {
            const aListeners = createChunkedListeners(t, 9, 3)
            const aEventEmitter = new EventEmitter()

            for(const listener of aListeners.slice(0, 9))
                aEventEmitter.on('foo', listener.listener, { priority: listener.priority })

            for(const listener of aListeners.slice(0, 9))
                aEventEmitter.on('bar', listener.listener, { priority: listener.priority })

            aEventEmitter.removeAllListeners('foo')

            assert.strictEqual(aEventEmitter.listenerCount('foo'), 0)
            assert.strictEqual(aEventEmitter.listenerCount('bar'), 9)
            assert.deepStrictEqual(aEventEmitter.eventNames(), [ 'bar' ])
        })

        it('should prevent the event listeners from executing if they have been removed', async function(t) {
            const aListener = t.mock.fn()
            const aEventEmitter = new EventEmitter()

            const aRemoveListener = t.mock.fn(_ => aEventEmitter.removeAllListeners('foo'))

            aEventEmitter.on('foo', aRemoveListener)
            aEventEmitter.on('foo', aListener)

            await aEventEmitter.emit('foo')

            assert.strictEqual(aListener.mock.callCount(), 0)
            assert.strictEqual(aRemoveListener.mock.callCount(), 1)
        })
        
    })

    describe('"emit()" method', async function() {

        it('should return promise that imidiatly resolves `false` value if no listeners bound to the event',  async function(t) {
            const payload = Symbol('args')
            const aEventEmitter = new EventEmitter()

            assert.strictEqual(await aEventEmitter.emit('event', payload), false)
        })

        it('should return promise that resolves `true` value after calling event listeners event with provided arguments',  async function(t) {
            const payload = Symbol('args')
            const aListener = t.mock.fn(arg => assert.strictEqual(arg, payload))
            const aEventEmitter = new EventEmitter()

            aEventEmitter.on('event', asyncWrapper(aListener))

            assert.strictEqual(await aEventEmitter.emit('event', payload), true)
            assert.strictEqual(aListener.mock.callCount(), 1)
        })

        it('should call listeners from the emitter origin', async function(t) {
            const payload = { count: 0 }
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })
    
            aEventEmitterThree
                .on('foo', payload => assert.strictEqual(payload.count++, 2))
    
            aEventEmitterTwo 
                .on('foo', payload => assert.strictEqual(payload.count++, 1))
                .on('foo', payload => sleep(_ => assert.strictEqual(payload.count++, 3), 5))
    
            aEventEmitterOne
                .on('foo', payload => assert.strictEqual(payload.count++, 0))
                .on('foo', payload => sleep(_ => assert.strictEqual(payload.count++, 4), 10))
    
            await aEventEmitterThree.emit('foo', payload)
    
            assert.strictEqual(payload.count, 5)
        })

        it('should call listeners in the order of their priority',  async function(t) {
            const aEventEmitter = new EventEmitter()

            const { fistListener, secondListener, thirdListener } = createOrderedListeners(t)

            aEventEmitter.on('event', secondListener, { priority: 2 })
            aEventEmitter.on('event', fistListener, { priority: 3 })
            aEventEmitter.on('event', thirdListener, { priority: 1 })

            await aEventEmitter.emit('event')

            assert.strictEqual(fistListener.mock.callCount(), 1)
            assert.strictEqual(secondListener.mock.callCount(), 1)
            assert.strictEqual(thirdListener.mock.callCount(), 1)
        })

        it('should call listeners from the emitter origin in the order of their priority', async function(t) {
            const payload = { count: 0 }
    
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })
    
            aEventEmitterThree
                .on('foo', payload => assert.strictEqual(payload.count++, 0), { priority: 3 })
                .on('foo', payload => sleep(_ => assert.strictEqual(payload.count++, 4), 10))
    
            aEventEmitterTwo 
                .on('foo', payload => assert.strictEqual(payload.count++, 1), { priority: 2 })
    
            aEventEmitterOne
                .on('foo', payload => sleep(_ => assert.strictEqual(payload.count++, 2), 5), { priority: 1 })
                .on('foo', payload => sleep(_ => assert.strictEqual(payload.count++, 3), 10))
    
            await aEventEmitterThree.emit('foo', payload)
    
            assert.strictEqual(payload.count, 5)
        })

        it('should call listeners in the order of time when they were added if priority is same between listeners',  async function(t) {
            const aEventEmitter = new EventEmitter()
            const { fistListener, secondListener, thirdListener } = createOrderedListeners(t)

            aEventEmitter.on('event', fistListener)
            aEventEmitter.on('event', asyncWrapper(secondListener))
            aEventEmitter.on('event', asyncWrapper(thirdListener))

            await aEventEmitter.emit('event')

            assert.strictEqual(fistListener.mock.callCount(), 1)
            assert.strictEqual(secondListener.mock.callCount(), 1)
            assert.strictEqual(thirdListener.mock.callCount(), 1)
        })

        it('should not call listeners from the emitter origin if it has been removed', async function(t) {
            const aListener = t.mock.fn()
            const aEventEmitterOne = new EventEmitter
            const aEventEmitterTwo = new EventEmitter({ origin: aEventEmitterOne })
            const aEventEmitterThree = new EventEmitter({ origin: aEventEmitterTwo })
    
            aEventEmitterOne
                .on('foo', aListener, { priority: 3 })
                .on('foo', _ => aEventEmitterTwo.off('foo', aListener), { priority: 1 } )
                
            aEventEmitterTwo
                .on('foo', aListener)
                .on('foo', _ => new Promise(resolve => setImmediate(resolve)), { priority: 2 })
    
            await aEventEmitterThree.emit('foo')
    
            assert.strictEqual(aListener.mock.callCount(), 1)
        })

        it('should reject Error if that occur during listener execution',  async function(t) {
            const aError = new Error('test')
            const { errorListenerSync, errorListenerAsync } = createErrorListeners(t, aError)

            {
                const aEventEmitter = new EventEmitter()
                aEventEmitter.on('event', errorListenerSync)
                await assert.rejects(_ => aEventEmitter.emit('event'), aError)
            }

            {
                const aEventEmitter = new EventEmitter()
                aEventEmitter.on('event', errorListenerAsync)
                await assert.rejects(_ => aEventEmitter.emit('event'), aError)
            }

        })

        it(`should not reject listener Error if "captureRejection" is set to true and emit "error" instead`,  async function(t) {
            const aError = new Error('test')
            const errorListener = t.mock.fn(error => assert.strictEqual(error, aError))
            const { errorListenerSync, errorListenerAsync } = createErrorListeners(t, aError)

            {   
                const aEventEmitter = new EventEmitter({ captureRejections: true })
                aEventEmitter.on(kRejectionEvent, errorListener)
                aEventEmitter.on('event', errorListenerSync);
                await aEventEmitter.emit('event')
            }

            {
                const aEventEmitter = new EventEmitter({ captureRejections: true })
                aEventEmitter.on(kRejectionEvent, errorListener)
                aEventEmitter.on('event', errorListenerAsync);
                await aEventEmitter.emit('event')
            }

            await new Promise(resolve => setImmediate(resolve))

            assert.strictEqual(errorListener.mock.callCount(), 2)    
        })

        it(`should reject Error if that occur during "error" execution`, async function(t) {
            const aError = new Error('test')

            const { errorListenerSync, errorListenerAsync } = createErrorListeners(t, aError)

            {
                const aEventEmitter = new EventEmitter({ captureRejections: true })
                aEventEmitter.on(kRejectionEvent, errorListenerSync);
                aEventEmitter.on('event', errorListenerSync);
                await assert.rejects(_ => aEventEmitter.emit('event'), aError)
            }

            {
                const aEventEmitter = new EventEmitter({ captureRejections: true })
                aEventEmitter.on(kRejectionEvent, errorListenerAsync);
                aEventEmitter.on('event', errorListenerAsync);
                await assert.rejects(_ => aEventEmitter.emit('event'), aError)
            }

        })

        it('should reject an Error when eventName is not provided',  async function(t) {
            const aEventEmitter = new EventEmitter()
            assert.rejects(_ => aEventEmitter.emit(), { message: 'EventEmitter "event" to emit is not specified.' })
        })

    })

})
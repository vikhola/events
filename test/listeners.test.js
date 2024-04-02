const assert = require('node:assert');
const { describe, it } = require('node:test');
const { Wrap, Listener, OnceListener } = require('../lib/listeners.js')

class EventEmitterMock {

    off() {}

}

describe('Wrap test', function() {

    it('should return Listener with frozen priority and listener', function(t) {
        const listener = t.mock.fn()
        const aListener = Wrap(new EventEmitterMock, 'foo', listener, 5) 

        assert.strictEqual(typeof aListener, 'function')
        assert.strictEqual(aListener.listener, listener)
        assert.strictEqual(aListener.priority, 5)
        assert.strictEqual(Object.isFrozen(aListener), true)
    })

    it('should return OnceListener with frozen priority and listener when once is set to true', function(t) {
        const listener = t.mock.fn()
        const aListener = Wrap(new EventEmitterMock, 'foo', listener, 5, true) 

        assert.strictEqual(typeof aListener, 'function')

        aListener(null, null)
        aListener(null, null)
        aListener(null, null)

        assert.strictEqual(aListener.listener, listener)
        assert.strictEqual(aListener.priority, 5)
        assert.strictEqual(Object.isFrozen(aListener), true)
        assert.strictEqual(listener.mock.callCount(), 1)
    })

})

describe('Listener test', function() {

    it('should call listener function with arguments and return its result', function(t) {
        const result = Symbol()
        const listener = t.mock.fn(arg => arg)
        const aListener = Listener.bind({ emitter: new EventEmitterMock(), listener: listener } )

        assert.strictEqual(aListener(null, [ result ]), result)
        assert.strictEqual(listener.mock.callCount(), 1)
    })

    it('should call listener with "this" bounded to the emitter', function(t) {
        const aEmitter = { foo: 'bar' }
        const listener = t.mock.fn(function() { assert.strictEqual(this, aEmitter) })
        const aListener = Listener.bind({ emitter: new EventEmitterMock(), listener: listener } )

        aListener(aEmitter, null)

        assert.strictEqual(listener.mock.callCount(), 1)
    })

})

describe('OnceListener test', function() {

    it('should call listener function', function(t) {
        const result = Symbol()
        const listener = t.mock.fn(arg => arg)
        const aListener = OnceListener.bind({ emitter: new EventEmitterMock(), listener: listener } )

        assert.strictEqual(aListener(null, [ result ]), result)
        assert.strictEqual(listener.mock.callCount(), 1)
    })

    it('should call listener with "this" bounded to the emitter', function(t) {
        const aEmitter = { foo: 'bar' }
        const listener = t.mock.fn(function() { assert.strictEqual(this, aEmitter) })
        const aListener = OnceListener.bind({ emitter: new EventEmitterMock(), listener: listener } )

        aListener(aEmitter, null)

        assert.strictEqual(listener.mock.callCount(), 1)
    })

    it('should call listener function only once', async function(t) {
        const listener = t.mock.fn()
        const aEventEmitterMock = new EventEmitterMock(false)
        const aListener = OnceListener.bind({ emitter: aEventEmitterMock,  event: "foo", listener: listener } )
    
        aListener(null, null)
        aListener(null, null)
        aListener(null, null)
    
        assert.strictEqual(listener.mock.callCount(), 1)
    })

    it('should remove listener from the emitter by event after first call', function(t) {
        const event = 'foo'
        const listener = t.mock.fn()
        const aEventEmitterMock = new EventEmitterMock()
        const aListener = OnceListener.bind({ emitter: aEventEmitterMock, event: "foo", listener: listener } )
    
        const remove = t.mock.method(aEventEmitterMock, "off", (name, callback) => {
            assert.strictEqual(name, event)
            assert.strictEqual(callback, listener)
        })

        aListener(null, null)
    
        assert.strictEqual(remove.mock.callCount(), 1)
    })

})
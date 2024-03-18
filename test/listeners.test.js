const assert = require('node:assert');
const { describe, it } = require('node:test');
const { Listener, OnceListener } = require('../lib/listeners.js')

class Collection {

    constructor(has = true) {
        this._has = Boolean(has)
    }

    has() {
        return this._has
    }

    delete() {

    }

}

describe('Listener test', function() {


    describe('"callback" field', function() {

        it('should return listener callback', function(t) {
            const aCallback = t.mock.fn()
            const aListener = new Listener(new Collection(), aCallback)

            assert.deepStrictEqual(aListener.callback, aCallback)
        })

    })

    describe('"notify()" method', function() {

        it('should call listener function and call passed callback', function(t) {
            const listener = t.mock.fn()
            const callback = t.mock.fn()
            const aListener = new Listener(new Collection(), listener)

            aListener.notify(null, null, callback)

            assert.strictEqual(listener.mock.callCount(), 1)
            assert.strictEqual(callback.mock.callCount(), 1)
        })

        it('should call async listener function and call callback when it resolves', async function(t) {
            const listener = t.mock.fn(_ => new Promise(resolve => setImmediate(resolve)))
            const callback = t.mock.fn()
            const aListener = new Listener(new Collection(), listener)

            aListener.notify(null, null, callback)

            await new Promise(resolve => setImmediate(resolve))

            assert.strictEqual(listener.mock.callCount(), 1)
            assert.strictEqual(callback.mock.callCount(), 1)
        })

        it('should call listener with "this" bounded to the emitter',  async function(t) {
            const listener = t.mock.fn(function() { assert.strictEqual(this, aEmitter) })

            const aEmitter = { foo: 'bar' }
            const aListener = new Listener(new Collection(), listener)

            aListener.notify(aEmitter, null, t.mock.fn())
        })

        it('should not call listener function if collection does not have it', async function(t) {
            const listener = t.mock.fn()
            const aCollection = new Collection(false)
            const aListener = new Listener(aCollection, listener)
        
            aListener.notify(null, null, t.mock.fn())
        
            await new Promise(resolve => setImmediate(resolve))
        
            assert.strictEqual(listener.mock.callCount(), 0)
        })

        it('should handle synchronous error rejection', async function(t) {
            const aError = new Error
            const listener = t.mock.fn(_ => { throw aError })
            const callback = t.mock.fn(error => assert.strictEqual(error, aError))
            const aListener = new Listener(new Collection(), listener)

            await aListener.notify(null, null, callback)

            assert.strictEqual(listener.mock.callCount(), 1)
            assert.strictEqual(callback.mock.callCount(), 1)
        })

        it('should handle asynchronous error rejection', async function(t) {
            const aError = new Error
            const listener = t.mock.fn(_ => { return Promise.reject(aError) })
            const callback = t.mock.fn(error => assert.strictEqual(error, aError))
            const aListener = new Listener(new Collection(), listener)

            await aListener.notify(null, null, callback)

            assert.strictEqual(listener.mock.callCount(), 1)
            assert.strictEqual(callback.mock.callCount(), 1)
        })

    })

})

describe('OnceListener test', function() {

    describe('"notify()" method', function() {

        it('should remove once listener from collection after first call', async function(t) {
            const listener = t.mock.fn()
            const aCollection = new Collection()
            const aListener = new OnceListener(aCollection, listener)
        
            const remove = t.mock.method(aCollection, "delete", callback => assert.strictEqual(callback, listener))

            aListener.notify(null, null, t.mock.fn())
        
            assert.strictEqual(remove.mock.callCount(), 1)
        })

        it('should handle synchronous error rejection', async function(t) {
            const aError = new Error
            const listener = t.mock.fn(_ => { throw aError })
            const callback = t.mock.fn(error => assert.strictEqual(error, aError))
            const aListener = new OnceListener(new Collection(), listener)

            await aListener.notify(null, null, callback)

            assert.strictEqual(listener.mock.callCount(), 1)
            assert.strictEqual(callback.mock.callCount(), 1)
        })

        it('should handle asynchronous error rejection', async function(t) {
            const aError = new Error
            const listener = t.mock.fn(_ => { return Promise.reject(aError) })
            const callback = t.mock.fn(error => assert.strictEqual(error, aError))
            const aListener = new OnceListener(new Collection(), listener)

            await aListener.notify(null, null, callback)

            assert.strictEqual(listener.mock.callCount(), 1)
            assert.strictEqual(callback.mock.callCount(), 1)
        })

    })


})



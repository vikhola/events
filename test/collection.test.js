const assert = require('node:assert');
const { describe, it } = require('node:test');
const { Collection, Bucket } = require('../lib/collection.js')

class Listener {

    constructor(callback) {
        this.callback = callback
    }

}

describe('Collection test', function() {

    describe('"size" property', function() {

        it('should return current size of the collection', function(t) { 
            const aListener = new Listener(t.mock.fn())
            const aCollection = new Collection()

            aCollection.add(aListener)

            assert.strictEqual(aCollection.size, 1)
        })

    })

    describe('"add()" method test', function() {

        it('should add a Listener to collection', function(t) {
            const aListener = new Listener(t.mock.fn())
            const aCollection = new Collection()

            aCollection.add(aListener)

            assert.deepEqual(aCollection.entries(), [ new Bucket(0, [ aListener ]) ])
        })

        it('should insert a Listener by priority', function(t) {
            const aListenerOne = new Listener(t.mock.fn())
            const aListenerTwo = new Listener(t.mock.fn())
            const aCollection = new Collection()

            aCollection.add(aListenerOne, 5)
            aCollection.add(aListenerTwo, 10)

            assert.deepEqual(aCollection.entries(), [ new Bucket(10, [ aListenerTwo ]), new Bucket(5, [ aListenerOne ]) ])
        })

        it('should ignore a Listener if Listener with the same callback is already present in the collection', function(t) {
            const callback = t.mock.fn()
            const aListenerOne = new Listener(callback)
            const aListenerTwo = new Listener(callback)
            const aCollection = new Collection()

            aCollection.add(aListenerOne, 5)
            aCollection.add(aListenerTwo, 10)

            assert.deepEqual(aCollection.entries(), [ new Bucket(5, [ aListenerOne ]) ])
        })

    })

    describe('"has()" method test', function() {

        it('should check if a callback is present in the collection', function(t) {
            const callback = t.mock.fn()
            const aListener = new Listener(callback)
            const aCollection = new Collection()

            assert.strictEqual(aCollection.has(callback), false)
            aCollection.add(aListener)
            assert.strictEqual(aCollection.has(callback), true)
        })
        
    })

    describe('"delete()" method test', function() {

        it('should delete a callback from the collection', function(t) {
            const callback = t.mock.fn()
            const aListener = new Listener(callback)
            const aCollection = new Collection()

            aCollection.add(aListener)

            aCollection.delete(callback)

            assert.strictEqual(aCollection.has(callback), false)
        })

        it('should return Listener after successful delete', function(t) {
            const callback = t.mock.fn()
            const aListener = new Listener(callback)
            const aCollection = new Collection()

            aCollection.add(aListener)

            assert.strictEqual(aCollection.delete(callback), aListener)
        })
        
        it('should delete a callback from the filled collection', function(t) {
            const callback = t.mock.fn()
            const aListenerOne = new Listener(t.mock.fn())
            const aListenerTwo = new Listener(callback)
            const aListenerThree = new Listener(t.mock.fn())
            const aCollection = new Collection()

            aCollection.add(aListenerOne, 3)
            aCollection.add(aListenerTwo, 5)
            aCollection.add(aListenerThree, 10)

            aCollection.delete(callback)

            assert.deepEqual(aCollection.entries(), [ new Bucket(10, [ aListenerThree ]), new Bucket(5),  new Bucket(3, [ aListenerOne ]) ])
        })

    })

    describe('"clear()" method test', function() {

        it('should clear the collection', function(t) {
            const aCallbacks = new Array(10).fill(undefined).map(_ => t.mock.fn())
            const aCollection = new Collection()

            for(let i = 0; i < 10; i++)
                aCollection.add(new Listener(aCallbacks[i]), i)

            aCollection.clear()

            for(let i = 0; i < 10; i++) 
                assert.strictEqual(aCollection.has(aCallbacks[i]), false)
            
            const aBuckets = aCollection.entries()

            aBuckets.forEach(bucket => 
                assert.strictEqual(bucket.length, 0)
            )

        })
        
    })

    describe('"entries()" method test', function() {

        it('should return a collection buckets', function(t) {
            const aCallbacks = new Array(10).fill(undefined).map(_ => t.mock.fn())
            const aCollection = new Collection()

            for(let i = 0; i < aCallbacks.length; i++)
                aCollection.add(new Listener(aCallbacks[i]), i)

            assert.deepEqual(aCollection.entries(), aCallbacks.map((callback, i) => new Bucket(i, [ new Listener(callback) ])).reverse())
        })

        it('should return bucket copies', function(t) {
            const aCallbacks = new Array(10).fill(undefined).map(_ => t.mock.fn())
            const aCollection = new Collection()

            for(let i = 0; i < aCallbacks.length; i++)
                aCollection.add(new Listener(aCallbacks[i]), i)

            assert.deepEqual(aCollection.entries(), aCallbacks.map((callback, i) => new Bucket(i, [ new Listener(callback) ])).reverse())

            aCollection.entries()[0].push(new Listener(_ => {}))

            assert.deepEqual(aCollection.entries(), aCallbacks.map((callback, i) => new Bucket(i, [ new Listener(callback) ])).reverse())
        })
        
    })

})



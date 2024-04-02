const assert = require('node:assert');
const { describe, it } = require('node:test');
const { Collection } = require('../lib/collection.js')

function sort(a, b) {
    return a.priority > b.priority ? -1 : a.priority === b.priority ? 0 : 1
}

class Listener {

    constructor(listener, priority = 0) {
        this.listener = listener
        this.priority = priority
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

        it('should add a listener to the collection', function(t) {
            const aListener = new Listener(t.mock.fn())
            const aCollection = new Collection()

            aCollection.add(aListener)

            assert.deepEqual(aCollection.entries(), [ aListener ])
        })

        it('should add a listener to the collection based on its priority', function(t) {
            const aListenerOne = new Listener(t.mock.fn(), 5)
            const aListenerTwo = new Listener(t.mock.fn(), 10)
            const aCollection = new Collection()

            aCollection.add(aListenerOne, 5)
            aCollection.add(aListenerTwo, 10)

            assert.deepEqual(aCollection.entries(), [ aListenerTwo, aListenerOne ])
        })

        it('should ignore a listener if he is already present in the collection', function(t) {
            const listener = t.mock.fn()
            const aListenerOne = new Listener(listener)
            const aListenerTwo = new Listener(listener)
            const aCollection = new Collection()

            aCollection.add(aListenerOne, 5)
            aCollection.add(aListenerTwo, 10)

            assert.deepEqual(aCollection.entries(), [ aListenerOne ])
        })

    })

    describe('"has()" method test', function() {

        it('should check if a listener is present in the collection', function(t) {
            const listener = t.mock.fn()
            const aListener = new Listener(listener)
            const aCollection = new Collection()

            assert.strictEqual(aCollection.has(listener), false)
            aCollection.add(aListener)
            assert.strictEqual(aCollection.has(listener), true)
        })
        
    })

    describe('"delete()" method test', function() {

        it('should delete a listener from the collection', function(t) {
            const listener = t.mock.fn()
            const aListener = new Listener(listener)
            const aCollection = new Collection()

            aCollection.add(aListener)

            aCollection.delete(listener)

            assert.strictEqual(aCollection.has(listener), false)
        })

        it('should return true after successful delete', function(t) {
            const listener = t.mock.fn()
            const aListener = new Listener(listener)
            const aCollection = new Collection()

            aCollection.add(aListener)

            assert.strictEqual(aCollection.delete(listener), true)
        })

        it('should return false when listener is not present', function(t) {
            const listener = t.mock.fn()
            const aListener = new Listener(listener)
            const aCollection = new Collection()

            assert.strictEqual(aCollection.delete(listener), false)
        })
        
        it('should delete a listener from the filled collection', function(t) {
            const listener = t.mock.fn()
            const aListenerOne = new Listener(t.mock.fn(), 3)
            const aListenerTwo = new Listener(listener, 5)
            const aListenerThree = new Listener(t.mock.fn(), 10)
            const aCollection = new Collection()

            aCollection.add(aListenerOne)
            aCollection.add(aListenerTwo)
            aCollection.add(aListenerThree)

            aCollection.delete(listener)

            assert.deepEqual(aCollection.entries(), [ aListenerThree, aListenerOne ])
        })

    })

    describe('"clear()" method test', function() {

        it('should clear the collection', function(t) {
            const aListeners = new Array(10).fill(undefined).map(_ => t.mock.fn())
            const aCollection = new Collection()

            for(let i = 0; i < 10; i++)
                aCollection.add(new Listener(aListeners[i]), i)

            aCollection.clear()

            for(let i = 0; i < 10; i++) 
                assert.strictEqual(aCollection.has(aListeners[i]), false)
            
            const aBuckets = aCollection.entries()

            aBuckets.forEach(bucket => 
                assert.strictEqual(bucket.length, 0)
            )

        })
        
    })

    describe('"entries()" method test', function() {

        it('should return the collection entries', function(t) {
            const aListeners = new Array(10).fill(undefined).map((el, i) => new Listener(t.mock.fn()))
            const aCollection = new Collection()

            for(let i = 0; i < aListeners.length; i++)
                aCollection.add(aListeners[i])

            assert.deepEqual(aCollection.entries(), aListeners)
        })

        it('should return the collection entries sorted by their priority', function(t) {
            const aListeners = new Array(10).fill(undefined).map((el, i) => new Listener(t.mock.fn(), i))
            const aCollection = new Collection()

            for(let i = 0; i < aListeners.length; i++)
                aCollection.add(aListeners[i])

            assert.deepEqual(aCollection.entries(), aListeners.reverse())
        })

        it('should cache and return same entries of listeners', function(t) {
            const aListeners = new Array(10).fill(undefined).map((el, i) => new Listener(t.mock.fn()))
            const aCollection = new Collection()

            for(let i = 0; i < aListeners.length; i++)
                aCollection.add(aListeners[i])

            assert.strictEqual(aCollection.entries(), aCollection.entries())
        })

        it('should return new entries if the colletion was changed', function(t) {
            const aCollection = new Collection()
            const aListenersOne = new Array(10).fill(undefined).map((el, i) => new Listener(function listener() {}, i))

            for(let i = 0; i < aListenersOne.length; i++)
                aCollection.add(aListenersOne[i])

            const entries = aCollection.entries()

            aCollection.add(new Listener(t.mock.fn, 10))

            assert.notStrictEqual(entries, aCollection.entries())
        })

        it('should freeze returned entries', function(t) {
            const aCollection = new Collection()
            const aListenersOne = new Array(10).fill(undefined).map((el, i) => new Listener(function listener() {}, i))

            for(let i = 0; i < aListenersOne.length; i++)
                aCollection.add(aListenersOne[i])

            assert.strictEqual(Object.isFrozen(aCollection.entries()), true)
        })

        it('should return the collection entries with merged and sorted additional listeners', function(t) {
            const aCollection = new Collection()
            const aListenersOne = new Array(10).fill(undefined).map((el, i) => new Listener(function listener() {}, i))
            const aListenersTwo = new Array(10).fill(undefined).map((el, i) => new Listener(t.mock.fn(), i)).sort(sort)
            const aMergedListeners = [ ...aListenersTwo, ...aListenersOne  ].sort(sort)

            for(let i = 0; i < aListenersOne.length; i++)
                aCollection.add(aListenersOne[i])

            assert.deepEqual(aCollection.entries(aListenersTwo), aMergedListeners)
            assert.strictEqual(aCollection.entries(aListenersTwo)[0], aListenersTwo[0])
        })

        it('should cache and return same collection entries if provided additional collection was already used', function(t) {
            const aCollection = new Collection()
            const aListenersOne = new Array(10).fill(undefined).map((el, i) => new Listener(function listener() {}, i))
            const aListenersTwo = new Array(10).fill(undefined).map((el, i) => new Listener(t.mock.fn(), i)).sort(sort)

            for(let i = 0; i < aListenersOne.length; i++)
                aCollection.add(aListenersOne[i])

            assert.strictEqual(aCollection.entries(aListenersTwo), aCollection.entries(aListenersTwo))
        })

        it('should return new merged entries if the colletion was changed', function(t) {
            const aCollection = new Collection()
            const aListenersOne = new Array(10).fill(undefined).map((el, i) => new Listener(function listener() {}, i))
            const aListenersTwo = new Array(10).fill(undefined).map((el, i) => new Listener(t.mock.fn(), i)).sort(sort)

            for(let i = 0; i < aListenersOne.length; i++)
                aCollection.add(aListenersOne[i])

            const entries = aCollection.entries(aListenersTwo)

            aCollection.add(new Listener(t.mock.fn, 10))

            assert.notStrictEqual(entries, aCollection.entries(aListenersTwo))
        })

        it('should return new merged entries if the additional listeners was changed', function(t) {
            const aCollection = new Collection()
            const aListenersOne = new Array(10).fill(undefined).map((el, i) => new Listener(function listener() {}, i))
            const aListenersTwo = new Array(10).fill(undefined).map((el, i) => new Listener(t.mock.fn(), i)).sort(sort)
            const aListenersThree = new Array(10).fill(undefined).map((el, i) => new Listener(t.mock.fn(), i)).sort(sort)

            for(let i = 0; i < aListenersOne.length; i++)
                aCollection.add(aListenersOne[i])

            const entries = aCollection.entries(aListenersTwo)

            aCollection.add(new Listener(t.mock.fn, 10))

            assert.notStrictEqual(entries, aCollection.entries(aListenersThree))
        })

        it('should freeze returned entries with additional listeners', function(t) {
            const aCollection = new Collection()
            const aListenersOne = new Array(10).fill(undefined).map((el, i) => new Listener(function listener() {}, i))
            const aListenersTwo = new Array(10).fill(undefined).map((el, i) => new Listener(t.mock.fn(), i)).sort(sort)

            for(let i = 0; i < aListenersOne.length; i++)
                aCollection.add(aListenersOne[i])

            assert.strictEqual(Object.isFrozen(aCollection.entries(aListenersTwo)), true)
        })
        
    })

})
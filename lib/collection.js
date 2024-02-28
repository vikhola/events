'use strict'

const kCollectionListeners = Symbol('kCollectionListeners')
const kCollectionCallbacks = Symbol('kCollectionCallbacks')

class Bucket extends Array {

    constructor(priority, source = []) {
        super(...source)
        this.priority = priority

    }

}

class Collection {

    constructor() {
        this[kCollectionListeners] = []
        this[kCollectionCallbacks] = new Map()
    }

    get size() {
        return this[kCollectionCallbacks].size
    }

    add(aListener, priority = 0) {
        let aBucket
        const aCallback = aListener.callback
        const aListeners = this[kCollectionListeners]
        const aCallbacks = this[kCollectionCallbacks]

        if(aCallbacks.has(aCallback))
            return this

        if((aBucket = aListeners.find(bucket => bucket.priority === priority)) === undefined) {
            aBucket = new Bucket(priority)
            const index = aListeners.findIndex(bucket => bucket.priority < priority)

            aListeners.splice(index === -1 ? aListeners.length : index, 0, aBucket)
        }

        aBucket.push(aListener)
        aCallbacks.set(aListener.callback, priority)

        return this  
    }

    has(callback) {
        return this[kCollectionCallbacks].has(callback)
    }

    clear() {
        this[kCollectionCallbacks].clear()

        for(const bucket of this[kCollectionListeners]) 
            bucket.splice(0, bucket.length)

    }

    delete(callback) {
        let aBucket = null
        let aPriority = 0
        let aListener = null

        const aListeners = this[kCollectionListeners]
        const aCallbacks = this[kCollectionCallbacks]

        if(aCallbacks.has(callback)) {
            aPriority = aCallbacks.get(callback)
            aBucket = aListeners.find(bucket => bucket.priority === aPriority)

            aCallbacks.delete(callback)
            aListener = (aBucket.splice(aBucket.findIndex(listener => callback === listener.callback), 1))[0]
        }

        return aListener
    } 

    entries() {
        const anOutput = []

        for(const bucket of this[kCollectionListeners]) 
            anOutput.push(new Bucket(bucket.priority, bucket))

        return anOutput      
    }

}

module.exports = { Collection, Bucket }
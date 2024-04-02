'use strict'

const kCollectionCache = Symbol('kCollectionCache')
const kCollectionListeners = Symbol('kCollectionListeners')
const kCollectionRawListeners = Symbol('kCollectionRawListeners')

class Bucket extends Set {

    constructor(priority, source = []) {
        super(source)
        this.priority = priority
    }

}

class Collection {

    constructor() {
        this[kCollectionCache] = new WeakMap()
        this[kCollectionListeners] = new Map()
        this[kCollectionRawListeners] = [] 
    }

    get size() {
        return this[kCollectionListeners].size
    }

    add(listener) {
        let aBucket
        const aCache = this[kCollectionCache]
        const aListener = listener.listener
        const aPriority = listener.priority
        const aListeners = this[kCollectionListeners]
        const aRawListeners = this[kCollectionRawListeners]

        if(aListeners.has(aListener))
            return this

        if((aBucket = aRawListeners.find(bucket => bucket.priority === aPriority)) === undefined) {
            aBucket = new Bucket(aPriority)
            const index = aRawListeners.findIndex(bucket => bucket.priority < aPriority)

            aRawListeners.splice(index === -1 ? aRawListeners.length : index, 0, aBucket)
        }

        aBucket.add(listener)
        aCache.delete(this)
        aListeners.set(aListener, listener)

        return this  
    }

    has(listener) {
        return this[kCollectionListeners].has(listener)
    }

    clear() {
        this[kCollectionCache].delete(this)
        this[kCollectionListeners].clear()

        for(const bucket of this[kCollectionRawListeners]) 
            bucket.clear()

    }

    delete(listener) {
        let aListener
        const aCache = this[kCollectionCache]
        const aListeners = this[kCollectionListeners]
        const aRawListeners = this[kCollectionRawListeners]

        if((aListener = aListeners.get(listener)) != null) {
            aCache.delete(this)
            aListeners.delete(listener)

            for(const bucket of aRawListeners) {

                if(bucket.delete(aListener))
                    return true

            }

        }

        return false
    } 

    entries(listeners) {
        const aCache = this[kCollectionCache]
        const aRawListeners = this[kCollectionRawListeners]

        function cache(key, listeners) {
            aCache.set(key, listeners)
            return listeners
        }

        function getEntries() {
            return Object.freeze(aRawListeners.reduce((acc, bucket) => { acc.push(...bucket); return acc }, []))
        }

        if(listeners == null) {

            if(aCache.has(this)) 
                return aCache.get(this)
            
            return cache(this, getEntries())

        }

        if(aCache.has(this) && aCache.has(listeners)) 
            return aCache.get(listeners)
        
        else if(aCache.has(this)) 
            return cache(listeners, Object.freeze(this._merge(listeners, aCache.get(this))))
    
        return cache(listeners, Object.freeze(this._merge(listeners, cache(this, getEntries())))) 

    }

    _merge(lListeners, rListeners) {

        const anOutput = []
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

}

module.exports = { Collection, Bucket }
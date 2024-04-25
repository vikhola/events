'use strict'

const kCollectionOptimized = Symbol('kCollectionOptimized')
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
        this[kCollectionOptimized] = []
        this[kCollectionListeners] = new Map()
        this[kCollectionRawListeners] = [] 
    }

    get size() {
        return this[kCollectionListeners].size
    }

    add(listener) {
        let aBucket
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
        aListeners.set(aListener, listener)
        this[kCollectionOptimized] = aRawListeners.reduce((acc, bucket) => { acc.push(...bucket); return acc }, [])

        return this  
    }

    has(listener) {
        return this[kCollectionListeners].has(listener)
    }

    clear() {
        this[kCollectionListeners].clear()
        this[kCollectionOptimized] = []

        for(const bucket of this[kCollectionRawListeners]) 
            bucket.clear()

    }

    delete(listener) {
        let aListener
        const aListeners = this[kCollectionListeners]
        const aRawListeners = this[kCollectionRawListeners]

        if((aListener = aListeners.get(listener)) != null) {
            aListeners.delete(listener)

            for(const bucket of aRawListeners) {
                if(bucket.delete(aListener)) {
                    break;
                }
            }

            this[kCollectionOptimized] = aRawListeners.reduce((acc, bucket) => { acc.push(...bucket); return acc }, [])
            return true
        }

        return false
    } 

    entries(listeners) {

        if(listeners == null)
            return [ ...this[kCollectionOptimized] ]
        else 
            return this._merge(listeners, this[kCollectionOptimized])

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
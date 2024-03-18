'use strict'

const kListenerCallback = Symbol('kListenerCallback')
const kListenerCollection = Symbol('kListenerCollection')

class Listener {

    constructor(collection, callback) {
        this[kListenerCallback] = callback
        this[kListenerCollection] = collection
    }

    get callback() {
        return this[kListenerCallback]
    }

    notify(emitter, args, callback) {

        if(this[kListenerCollection].has(this[kListenerCallback]) === false)
            return callback()

        try {
            const result = this.callback.apply(emitter, args)

            if(result != null && typeof result.then === 'function')
                return result.then(_ => callback(), callback)
            else 
                return callback()

        } catch(error) {
            return callback(error)
        }

    }

}

class OnceListener extends Listener {

    constructor(target, callback) {
        super(target, callback)
    }

    notify(emitter, args, callback) {

        if(this[kListenerCollection].has(this[kListenerCallback]) === false)
            return callback()

        this[kListenerCollection].delete(this[kListenerCallback])

        try {
            const result = this.callback.apply(emitter, args)

            if(result != null && typeof result.then === 'function')
                return result.then(_ => callback(), callback)
            else 
                return callback()

        } catch(error) {
            return callback(error)
        }

    }

}

module.exports = { Listener, OnceListener }
'use strict'

function Wrap(emitter, event, listener, priority, once) {
    const context = { fired: false, event, emitter, listener }
    const wrap = !once ? Listener.bind(context) : OnceListener.bind(context)

    wrap.listener = listener
    wrap.priority = priority

    return Object.freeze(wrap)
}

function Listener(emitter, args) {
    return this.listener.apply(emitter, args)
}

function OnceListener(emitter, args) {

    if(this.fired)
        return 

    this.fired = true
    this.emitter.off(this.event, this.listener)

    return this.listener.apply(emitter, args)
}

module.exports = { Wrap, Listener, OnceListener }
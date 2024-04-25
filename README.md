# @vikhola/events

# About

Provides simple and modern asynchronous event emitter

# Installation

```sh
$ npm i @vikhola/events
```

# Usage

Package could be required as ES6 module 

```js
import { EventEmitter } from '@vikhola/events'
```

Or as commonJS module.

```js
const { EventEmitter } = require('@vikhola/events');
```

## Class: `EventEmitter`

### Event: `newListener`

The emitter instance will emit its own `newListener` event during execution of the emitter `on()` method .

Listeners registered for the `newListener` event are passed with a name, options and a reference to the listener being added.

```js
emitter.on('newListener', (name, listener, options) => console.log(name, listener, options));

// print: foo [Function (anonymous)] { prioirty: 1 }
emitter.on('foo', data => console.log(data), { prioirty: 1 });
```

But there is few exceptions: event will not be emitted if the event name is `newListener` or `removeListener`.

```js
emitter.on('newListener', (name, listener, options) => console.log(name, listener, options));

// doesn't print anything
emitter.on('newListener', name => console.log(name));
```

### Event: `removeListener`

The emitter instance will emit its own `removeListener` event during execution of the emitter `off()` method .

```js
const listener = data => console.log(data);

emitter.on('removeListener', (event, listener) => console.log(event, listener));
emitter.on('foo', listener, { priority: 1 });

// print: foo [Function listener]
emitter.off('foo', listener);
```

As with `newListener` event case, event will not be triggered if listener event name was `newListener` or `removeListener`.

### emitter.on(eventName, listener [, options])

The `on()` method adds the listener function to the listeners collection for the event. Any given listener could be added only once per event.

```js
emitter.on('foo', data => console.log(data));

// print: bar
emitter.emit('foo', 'bar');
```

Returns a reference to the emitter, so that calls can be chained.

Additionally to `eventName` and `listener` arguments, method also accept the third one `options`. It is object with optional parameters as `once`, `priority` and `signal`.

The `once` option indicate that listener will be executed only once after what it will be removed from the `eventName`.

```js
emitter.on('foo', data => console.log(data), { once: true });

// print: bar x1
emitter.emit('foo', 'bar');
emitter.emit('foo', 'bar');
```

The `priority` is a integer by default in the range between `0` and `10` that controls the order in which listeners are executed (the higher the number, the earlier a listener is executed). By default equal to `0`.

```js
emitter.on('foo', () => console.log('I am second'));
emitter.on('foo', () => console.log('I am first'), { priority: 1 });

// print: I am first
// print: I am second
emitter.emit('foo');
```

The `signal` option accepts an `AbortSignal` which removes the event listener after the `abort` event.

```js
const controller = new AbortController();

emitter.on('foo', data => {
	console.log(data)
	controller.abort()
}, { signal: controller.signal });

// print: foo x1
emitter.emit('foo', 'bar');
emitter.emit('foo', 'bar');
```

### emitter.off(eventName, listener)

The `off()` method removes the listener function from the listeners collection for the event. 

```js
const listener = data => console.log(data);

emitter.on('foo', listener);
emitter.off('foo', listener); 

// doesn't print anything
emitter.emit('foo', 'bar');
```

Returns a reference to the emitter, so that calls can be chained.

### emitter.eventNames() 

The `eventNames()` method returns an array of the events with registered listeners. The values in the array are strings or `Symbol`s.

```js
emitter.on('foo', data => console.log(data));

// print: [ "foo" ]
console.log(emitter.eventNames());
```

As is in the case when an emitter creates a new `eventName` for a listener whose event does not exist, if the last event listener event is removed from the `eventName` collection, it will be removed.

```js
const listener = data => console.log(data);

emitter.on('foo', listener);

// print: [ "foo" ]
console.log(emitter.eventNames());

emitter.off('foo', listener);
// print: []
console.log(emitter.eventNames());
```

### emitter.listeners(eventName) 

The `listeners()` method returns a copy of the collection of listeners for the event named `eventName`.

```js
emitter.on('foo', data => console.log(data));

// print: [ [Function (anonymous)] ]
console.log(emitter.listeners('foo'));
```

### emitter.rawListeners(eventName) 

The `rawListeners()` method returns an array of raw listeners for the event sorted by their priorities. 

```js
emitter.on('foo', data => console.log(data), { priority: 1 });
emitter.on('foo', data => console.log(data), { priority: 2 });

// print: [
//  [Function: bound Listener] {
//    listener: [Function (anonymous)],
//    priority: 2
//  },
//  [Function: bound Listener] {
//    listener: [Function (anonymous)],
//    priority: 1
//  }
// ]

console.log(emitter.rawListeners('foo'));
```

The returned collection contain frozen elements and any attempt to change them will fail, either silently or by throwing a error.

### emitter.listenerCount(eventName) 

The `listenerCount()` method returns the number of listeners currently listening the event.

```js
emitter.on('foo', data => console.log(data));

// print: 1
console.log(emitter.listenerCount('foo'));
```

### emitter.removeAllListeners([eventName])
 
The `removeAllListeners()` removes all listeners from the emitter, or those of the specified event. 

```js
emitter.on('foo', data => console.log(data));
emitter.on('bar', data => console.log(data));

emitter.removeAllListeners('foo');
// print: 0
console.log(emitter.listenerCount('foo'));
// print: 1
console.log(emitter.listenerCount('bar'));

emitter.removeAllListeners();
// print: 0
console.log(emitter.listenerCount('bar'));
```

### emitter.emit(event)
 
The `emit()` method notify each of registered for the `eventName` listeners in the order of their priority and optionally awaits for their resolution.

```js
emitter.on('foo', data => console.log(data));

// print: bar
emitter.emit('foo', 'bar');
```

Method return `true` if event has at least one listener or promise which resolves `true` if some of those listeners are asynchronous, `false` otherwise.

```js
// print: false
console.log(emitter.emit('foo'));

emitter.on('foo', data => {});

// print: true
console.log(emitter.emit('foo'));

emitter.on('foo', async data => {});

// print: true
emitter.emit('foo').then(console.log);
```

If there is no guarantee which listeners will listen provided event it is recommended to use `async`/`await` in this case you can be sure that all listeners will be executed.

```js
emitter.on('foo', data => console.log(data));
emitter.on('foo', async data => console.log(data));

// print: bar x2
await emitter.emit('foo', 'bar');
```

But also it makes error handling is much easier because the `emit()` method can throw both synchronous and asynchronous exceptions, and in the case of `async`/`await`, they can be handled as the same error.

```js
emitter.on('foo', async data => {});
emitter.on('foo', () => new Promise((resolve, reject) => setImmediate(resolve)));
emitter.on('foo', data => {
    throw new Error('Oops')
});

try {
    await emitter.emit('foo');
} catch(error) {
    // print: 'Error message is "Oops".'
    console.log(`Error message is "${error.message}".`);
}
```

## Origins

Each event and its listener are owned by some emitter, but they can be shared between multiple instances. To achieve this behavior enough to provide in the target as the `origin` option another instance of event emitter, whose events and listeners will be shared with the target.

```js
const emitter = new EventEmitter();
const emitter_two = new EventEmitter({ origin: emitter });
function listener(data) { console.log(data) }

emitter.on('foo', listener);

// print: [ 'foo' ]
console.log(emitter_two.eventNames());

// print: [ { listener: [Function: listener], priority: 0 } ]
console.log(emitter_two.listeners('foo'));

// print: hello!
emitter.emit('hello!');
```

The event emitters with origins also can form chains or trees with shared events and listeners that can be reached from any low-level emitter.

```js
const emitter = new EventEmitter();
const emitter_two = new EventEmitter({ origin: emitter });
const emitter_three = new EventEmitter({ origin: emitter_two });

emitter.on('foo', console.log);
emitter_two.on('foo', console.log);

// print: hello! x2
emitter_three.emit('foo', 'hello!')
```

## Priorities

The emitter constructor accepts a `priority` option, where can be defined the minimum and/or maximum values for the priority range of the emitter listeners. By default these values are "0" and "10".

```js
const emitter = new EventEmitter({ priority: { min: -20 } });

emitter.on('foo', () => console.log('I am second'), { priority: -20 });
emitter.on('foo', () => console.log('I am first'));

// print: I am first
// print: I am second
emitter.emit('foo');
```

## License

[MIT](https://github.com/vikhola/events/blob/main/LICENSE)
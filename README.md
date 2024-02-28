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
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter();

emitter.on('newListener', (name, listener, options) => console.log(name, listener, options));

// print: foo [Function (anonymous)] { prioirty: 1 }
emitter.on('foo', data => console.log(data), { prioirty: 1 });
```

But there is few exceptions: event will not be emitted if the event name is `newListener` or `removeListener`.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter();

emitter.on('newListener', (name, listener, options) => console.log(name, listener, options));

// doesn't print anything
emitter.on('newListener', name => console.log(name));
```

### Event: `removeListener`

The emitter instance will emit its own `removeListener` event during execution of the emitter `off()` method .

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter ();
const listener = data => console.log(data);

emitter.on('removeListener', (event, listener) => console.log(event, listener));
emitter.on('foo', listener, { priority: 1 });

// print: foo [Function listener]
emitter.off('foo', listener);
```

As with `newListener` event case, event will not be triggered if listener event name was `newListener` or `removeListener`.

### Event: `error`

The `error` event is emitted after the listener throw an error and `captureRejections` option set to true. To more detail follow to [Error Handling](#error-handling) section.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter ({ captureRejections: true });

emitter.on('error', error => console.log(error));

emitter.on('foo', () => Promise.reject(new Error('Oops')));

// print: Error: Oops
emitter.emit('foo');
```


### emitter.on(eventName, listener [, options])

The `on()` method adds the listener function to the listeners collection for the event named `eventName`. Any given listener could be added only once per event.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter ();

emitter.on('foo', data => console.log(data));

// print: bar
emitter.emit('foo', 'bar');
```

Returns a reference to the emitter, so that calls can be chained.

Additionally to `eventName` and `listener` arguments, method also accept the third one `options`. It is object with optional parameters as `once`, `priority` and `signal`.

The `once` option indicate that listener will be executed only once after what it will be removed from the `eventName`.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter ();

emitter.on('foo', data => console.log(data), { once: true });

// print: bar x1
emitter.emit('foo', 'bar');
emitter.emit('foo', 'bar');
```

The `priority` is a integer by default in the range between `0` and `10` that controls the order in which listeners are executed (the higher the number, the earlier a listener is executed). By default equal to `0`.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter ();

emitter.on('foo', () => console.log('I am second'));
emitter.on('foo', () => console.log('I am first'), { priority: 1 });

// print: I am first
// print: I am second
emitter.emit('foo');
```

The `signal` option accepts an `AbortSignal` which removes the event listener after the `abort` event.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter ();
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

The `off()` method removes the listener function from the listeners collection for the event named `eventName`. 

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter ();
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
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter();

emitter.on('foo', data => console.log(data));

// print: [ "foo" ]
console.log(emitter.eventNames());
```

As is in the case when an emitter creates a new `eventName` for a listener whose event does not exist, if the last event listener event is removed from the `eventName` collection, it will be removed.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter ();
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
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter ();

emitter.on('foo', data => console.log(data));

// print: [
//  {
//    listener: [Function (anonymous)],
//    priority: 0
//  }
// ]
console.log(emitter.listeners('foo'));
```

### emitter.rawListeners(eventName) 

The `rawListeners()` method returns a collection containing the raw listeners buckets, sorted by their priority, for the event named `eventName`. 

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter ();

emitter.on('foo', data => console.log(data), { priority: 1 });
emitter.on('foo', data => console.log(data), { priority: 2 });

// print: [
//  Bucket(1) [
//    Listener {
//      [Symbol(kListenerCallback)]: [Function (anonymous)],
//      [Symbol(kListenerCollection)]: [Collection]
//    },
//    priority: 2
//  ],
//  Bucket(1) [
//    Listener {
//      [Symbol(kListenerCallback)]: [Function (anonymous)],
//      [Symbol(kListenerCollection)]: [Collection]
//    },
//    priority: 1
//  ]
// ]

console.log(emitter.rawListeners('foo'));
```

### emitter.listenerCount(eventName) 

The `listenerCount()` method returns the number of listeners listening for the event named `eventName`.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter ();

emitter.on('foo', data => console.log(data));

// print: 1
console.log(emitter.listenerCount('foo'));
```

### emitter.removeAllListeners([eventName])
 
The `removeAllListeners()` removes all listeners, or those of the specified `eventName`. 

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter ();

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
 
The `emit()` method notify each of registered for the `eventName` listeners in the order of their priority and awaits for their resolution.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter();

emitter.on('foo', data => console.log(data));

// print: bar
emitter.emit('foo', 'bar');
```

Method return promise that resolves `true` if the event had listeners, `false` otherwise

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter();

// print: false
emitter.emit('foo').then(console.log);

emitter.on('foo', data => {});

// print: true
emitter.emit('foo').then(console.log);
```

## Origins

Each event and its listener are owned by some emitter, but they can be shared between multiple instances. To achieve this behavior enough to provide in the target as the `origin` option another instance of event emitter, whose events and listeners will be shared with the target.

```js
import { EventEmitter } from '@vikhola/events'

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

Event emitters with origins also can form chains or trees with shared events and listeners that can be reached from any low-level emitter.

```js
import { EventEmitter } from '@vikhola/events'

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
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter({ priority: { min: -20 } });

emitter.on('foo', () => console.log('I am second'), { priority: -20 });
emitter.on('foo', () => console.log('I am first'));

// print: I am first
// print: I am second
emitter.emit('foo');
```

## Error Handling

When an error occurs within an the emitter instance, the typical action is for an error is to reject a promise that was returned from the `emit()` method that caused an exception.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter();
const emitter_two = new EventEmitter({ origin: emitter });

emitter.on('foo', async function() {
	await new Promise(resolve => setImmediate(resolve));
	throw new Error('Oops');
});

// print: 'Error message is "Oops".'
emitter.emit('foo').catch(error => console.log(`Error message is "${error.message}".`));

// or with `origin` option

// print: Error message is "Oops".
emitter_two.emit('foo').catch(error => console.log(`Error message is "${error.message}".`));

```

But the emitter could instead of promise rejection, handle all exceptions by itself. In this case, event listeners errors will be emitted as part of `error` event. To acquire this behavior the emitter constructor `captureRejections` option should be set to `true`.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter({ captureRejections: true });

emitter.on('foo', async function() {
    await new Promise(resolve => setImmediate(resolve));
    throw new Error('Oops');
});

emitter.on('error', error => console.log(`Error message is "${error.message}".`));

// print: 'Error message is "Oops".'
emitter.emit('foo')
```

However in the case of an emitter with defined `origin` option, `error` event will be handled by listeners from the origin and target.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter();
const emitter_two = new EventEmitter({ origin: emitter, captureRejections: true });

emitter.on('error', console.log);
emitter_two.on('foo', async function() {
    await new Promise(resolve => setImmediate(resolve));
    throw new Error('Oops');
});

// print: Error message is "Oops".
emitter_two.emit('foo');
```

But if `error` event listener will throw an error, it will not be handled and will reject a promise that was returned from the `emit()` method that caused an exception.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter({ captureRejections: true });

emitter.on('foo', async function() {
    await new Promise(resolve => setImmediate(resolve));
    throw new Error('Oops');
});

emitter.on('error', function(error) {
    throw error
})

// print: 'Error message is "Oops".'
emitter.emit('foo').catch(error => console.log(`Error message is "${error.message}".`));
```

Also `error` event will be emitted if `newListener` or `removeListener` listeners will throw an error.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter({ captureRejections: true });

emitter.on('error', error => console.log(`Error message is "${error.message}".`));

emitter.on('newListener', async function() {
    await new Promise(resolve => setImmediate(resolve));
    throw new Error('Oops');
});

// print: 'Error message is "Oops".'
emitter.on('event', () => {})
```

But if in this case `error` event listener will throw an error, it will not be handled and will raise the process `unhandledRejection` event.

```js
import { EventEmitter } from '@vikhola/events'

const emitter = new EventEmitter({ captureRejections: true });

process.on('unhandledRejection', error => console.log(`Error message is "${error.message}".`));

emitter.on('newListener', async function() {
    await new Promise(resolve => setImmediate(resolve));
    throw new Error('Oops');
});

// print: 'Error message is "Oops".'
emitter.on('error', function(error) {
    throw error
})

```

## License

[MIT](https://github.com/vikhola/events/blob/main/LICENSE)
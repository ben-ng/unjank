# Unjank

`unjank` is an asynchronous `Array.prototype.map` that doesn't lock up the browser's UI.

It learns how expensive it is to perform each task, and figures out the optimal batch size to reach your target FPS.

## Quick Example
```js
// Simulate an expensive function that takes 4ms to execute
function expensiveFunction (t, cb) {
  setTimeout(function () {
    cb(null, t * 10)
  }, 4)
}

// Will only run expensiveFunction five times per frame to acheive 30 FPS
unjank([1,2,3,4,5,6,7,8,9,10], expensiveFunction, {targetFPS: 30}, function (err, results) {
  // results => [10, 20, 30, ...]
})
```

[![Build Status](https://travis-ci.org/ben-ng/unjank.svg?branch=master)](https://travis-ci.org/ben-ng/unjank)

[![browser support](https://ci.testling.com/ben-ng/unjank.png)
](https://ci.testling.com/ben-ng/unjank)

## API

`unjank(data, map, [opts], cb)`

* **data** must be an array
* **map** can either be:
  * `function sync (item) { return transform(item) }`
  * `function batchSync (batch) { return batch.map(transform) }`
  * `function async (item, cb) { cb(null, transform(item)) }`
  * `function batchAsync (batch, cb) { cb(null, batch.map(transform) }`
* **opts** is an optional object
  * `opts.targetFPS` defaults to 30
  * `opts.batchMap` defaults to false
* **cb** should have the signature `function cb(err, results, metadata) {}`
  * `err` if an async map function returns an error, this is where it goes
  * `results` an array, just what you would expect from `array.map`
  * `metadata` information learned by `unjank` during execution
    * `metadata.intervalPerItem` The average number of milliseconds each `map(item)` took
    * `metadata.batchSize` The optimal number of items mapped per frame

### Aborting

You can abort the task at any time by calling `abort()` on the returned object.

```js
var instance = unjank(data, map, cb)
instance.abort()
```

This will cause the callback function to be called with `new Error('Aborted')`.

You cannot abort a task more than once, or once it has completed.

### Async Example

```js
var unjank = require('unjank')
  , data = [1, 2, 3, 4, 5, 6]
  , asyncMap = function (item, cb) {
      setTimeout(function () {
        cb(null, item * 10)
      }, 4)
    }

// Ensure that each batch takes no longer than 32 ms to execute
// in order to achieve 30FPS
unjank(data, asyncMap, function (err, results, metadata) {
  // metadata -> {intervalPerItem: 4, batchSize: 4}
})
```

### Sync Example

```js
var unjank = require('unjank')
  , data = [1, 2, 3, 4, 5, 6]
  , syncMap = function (item) {
      return item * 10
    }

// Ensure that each batch takes no longer than 16.6 ms to execute
// in order to achieve 60FPS
unjank(data, syncMap, {targetFPS: 60}, function (err, results, metadata) {
  // your code here
})
```

### Batch Mapping Example

Sometimes your task is best handled as a batch, instead of individually.

For example, you might want to render many Backbone views at the same time, but only append them to the DOM as a single `DocumentFragment`. This is a very fast way to render a large collection.

With the `batchMap` option set to true, `unjank` will call your map function once per batch instead of once per item.

```js
var unjank = require('unjank')
  , async = require('async')
  , data = [1, 2, 3, 4, 5, 6]
  , mapf = function (t, cb) { cb(null, t * 10)}
  , batchMap = function (batch, cb) {
      async.map(batch, mapf, function (err, results) {
        cb(null, results.reduce(function sum (a, b) { return a + b}))
      })
    }

unjank(data, syncMap, {batchMap: true}, function (err, results, metadata) {
  // your code here
})
```

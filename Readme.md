# Unjank

`unjank` is an asynchronous `Array.prototype.map` that runs as quickly as possible without locking up the browser's UI.

It adapts to how expensive the task is, regardless of whether its sync or async.

## Usage

`unjank(data, map, [opts], cb)`

* **data** must be an array
* **map** can either be:
  * `function sync (item) { return transform(item) }`
  * `function async (item, cb) { cb(null, transform(item)) }`
* **opts** is an optional object
  * `opts.targetFPS` defaults to 30
* **cb** should have the signature `function cb(err, results, metadata) {}`
  * `err` if an async map function returns an error, this is where it goes
  * `results` an array, just what you would expect from `array.map`
  * `metadata` information learned by `unjank` during execution
    * `metadata.intervalPerItem` The average number of milliseconds each `map(item)` took
    * `metadata.batchSize` The optimal number of items mapped per frame

## Async Example

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

## Sync Example

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

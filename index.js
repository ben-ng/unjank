var raf = require('raf')

function makeAsync (func) {
  if(func.length === 1) {
    return function asyncMap (batch, cb) {
      cb(null, func(batch))
    }
  }
  else {
    return func
  }
}

function unjank (items, mapFunction, opts, cb) {
  if(typeof opts == 'function') {
    cb = opts
    opts = {}
  }

  opts = opts || {}

  if(!items.length) {
    return cb()
  }

  var targetFPS = opts.targetFPS || 40
      // Underpromise and overdeliver!
      // I'm promising 30fps in the readme, so aim for 40 (:
    , targetInterval = 1000 / targetFPS
    , intervalPerItem = 10 // A guess that is dynamically updated
    , totalItems = items.length
    , lastItem = 0
    , mapresults = []

  // Convert to async if needed
  mapFunction = makeAsync(mapFunction)

  function _nextBatch () {
    if(lastItem === totalItems) {
      return false
    }
    else {
      // Given the current interval per item, how many can we map in targetInterval?
      var itemsPossible = Math.floor(targetInterval / intervalPerItem)
        , batchEnd

      // Make sure there is always forward progress
      if(itemsPossible < 1) {
        itemsPossible = 1
      }

      batchEnd = lastItem + itemsPossible

      if(batchEnd > totalItems) {
        batchEnd = totalItems
      }

      return batchEnd
    }
  }

  function _mapBatch () {
    var timeNow = new Date().getTime()
      , batchEnd = _nextBatch()
      , optimalBatchSize
      , intervalThisBatch

    mapFunction(items.slice(lastItem, batchEnd), function (err, mapped) {
      if(err) {
        return cb(err)
      }

      intervalThisBatch = new Date().getTime() - timeNow

      mapresults.push.apply(mapresults, mapped)

      // calculate the new mean
      intervalPerItem = (intervalPerItem * lastItem + intervalThisBatch) / batchEnd

      // console.log('Mean interval per item: ' + intervalPerItem)

      lastItem = batchEnd

      if(batchEnd === totalItems) {
        // We're done here! No point waiting for another raf
        optimalBatchSize = Math.floor(targetInterval / intervalPerItem)

        if(optimalBatchSize < 1) {
          optimalBatchSize = 1
        }

        cb(null, mapresults, {intervalPerItem: intervalPerItem, batchSize: optimalBatchSize})
      }
      else {
        raf(_mapBatch)
      }
    })
  }

  _mapBatch()
}

module.exports = unjank

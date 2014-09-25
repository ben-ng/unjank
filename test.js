var unjank = require('./')
  , test = require('tape')
  , intArray = [0, 1, 2, 3, 4]

test('works on empty array', function (t) {
  t.plan(2)

  function throwop () {
    throw new Error('if i ran, this test failed ):')
  }

  unjank([], throwop, function (err, results) {
    t.ok(err == null, 'There should be no error')
    t.equal(results.length, 0, 'There should be no')
  })
})

test('works on array (sync)', function (t) {
  t.plan(2)

  function syncMap (t) {
    return t * 10
  }

  unjank(intArray, syncMap, function (err, results) {
    t.ok(err == null, 'There should be no error')
    t.deepEqual(results, [0, 10, 20, 30, 40], 'There should be 5 mapped results')
  })
})

test('works on array (sync, batchMap)', function (t) {
  t.plan(2)

  function mapf (t) {
    return t * 10
  }

  function syncBatchMap (batch) {
    return batch.map(mapf)
  }

  unjank(intArray, syncBatchMap, {batchMap: true}, function (err, results) {
    t.ok(err == null, 'There should be no error')
    t.deepEqual(results, [0, 10, 20, 30, 40], 'There should be 5 mapped results')
  })
})

test('works on array (async)', function (t) {
  t.plan(2)

  function asyncMap (t, cb) {
    setTimeout(function () {
      cb(null, t * 10)
    }, 1)
  }

  unjank(intArray, asyncMap, function (err, results) {
    t.ok(err == null, 'There should be no error')
    t.deepEqual(results, [0, 10, 20, 30, 40], 'There should be 5 mapped results')
  })
})

test('works on array (async, batchMap)', function (t) {
  t.plan(2)

  function mapf (t) {
    return t * 10
  }

  function asyncBatchMap (batch, cb) {
    setTimeout(function () {
      cb(null, batch.map(mapf))
    }, 1)
  }

  unjank(intArray, asyncBatchMap, {batchMap: true}, function (err, results) {
    t.ok(err == null, 'There should be no error')
    t.deepEqual(results, [0, 10, 20, 30, 40], 'There should be 5 mapped results')
  })
})

test('fails correctly on array (async)', function (t) {
  t.plan(3)

  var calledTimes = 0

  function asyncMap (t, cb) {
    setTimeout(function () {
      calledTimes++
      cb(new Error('fail me baby one more time'))
    }, 1)
  }

  unjank(intArray, asyncMap, function (err, results) {
    t.equal(err.toString(), 'Error: fail me baby one more time', 'There should be an error')
    t.ok(results == null, 'There should be no results')
    t.equal(calledTimes, 1, 'Async map should only have been called once')
  })
})

test('learns cost', function (t) {
  t.plan(2)

  function asyncMap (t, cb) {
    setTimeout(function () {
      cb(null, t * 10)
    }, 4)
  }

  unjank(intArray, asyncMap, function (err, results, metaData) {
    t.ok(Math.abs(metaData.intervalPerItem - 4) < 2, 'Interval should be around 4 (got ' + metaData.intervalPerItem + ')')
    t.ok(Math.abs(metaData.batchSize - 5) < 2, 'Batch size should be around 5 (got ' + metaData.batchSize + ')')
  })
})

test('aborts when possible', function (t) {
  t.plan(1)

  function slowMap (t, cb) {
    setTimeout(function () {
      cb(null, t * 10)
    }, 4)
  }

  var instance = unjank(intArray, slowMap, function (err) {
    t.equal(err.toString(), 'Error: Aborted', 'There should be an Aborted error')
  })

  instance.abort()
})

test('does not abort when completed', function (t) {
  t.plan(2)

  var instance = unjank([], function () {}, function (err) {
    t.ok(err == null, 'There should be no error')
  })

  t.throws(function () {
    instance.abort()
  }, /Error: Already completed/, 'There should be an Already completed error')
})

test('does not abort when already aborted', function (t) {
  t.plan(2)

  function slowMap (t, cb) {
    setTimeout(function () {
      cb(null, t * 10)
    }, 4)
  }

  var instance = unjank(intArray, slowMap, function (err) {
    t.equal(err.toString(), 'Error: Aborted', 'There should be an Aborted error')
  })

  instance.abort()

  t.throws(function () {
    instance.abort()
  }, /Error: Already aborted/, 'There should be an Already aborted error')
})

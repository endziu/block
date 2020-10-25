const { getDatabaseCollection } = require('./db.js')
const { WeiToGwei, bucket } = require('./utils.js')

const R = require('ramda')
const { pipe, map, reduce, prop, concat, sort, mean, median } = R

const diff = (a, b) => a - b
const peek = _ => {console.log(_);return _;}

const main = async () => {
  const collection = await getDatabaseCollection()
  const blocks = await collection.find().limit(100).toArray()

  const getTxs = pipe(
    map(prop("transactions")),
    reduce(concat,[])
  ) 

  const getGasPriceFromTx = map(
    pipe(
      prop("gasPrice"),
      WeiToGwei,
      Number
    )
  )

  const gwei = pipe(getTxs, getGasPriceFromTx, sort(diff))(blocks)
  const minGas = gwei[0]
  const maxGas = gwei[gwei.length - 1]
  const meanGas = mean(gwei)
  const medianGas = median(gwei)

  const txsToBuckets = map(
    pipe(
      prop("transactions"),
      getGasPriceFromTx,
      txs => {
        const numList = new Array(20).fill(1).map((_,i) => i * 10 + 10)
        const objList = map((n) => ({ [n]: bucket([n - 10, n])(txs) }), numList)
        const buckets = reduce((prev,curr) => Object.assign(prev,curr),{},objList)
        return buckets 
      }
    )
  )
  console.log("Blocks: ", blocks.length)
  console.log("Txs: ", getTxs(blocks).length)
  console.log("min: ", minGas)
  console.log("mean: ", meanGas)
  console.log("median: ", medianGas)
  console.log("max: ", maxGas)
  console.log("random block", txsToBuckets(blocks)[Math.round(Math.random()*blocks.length)+1])
}

main()

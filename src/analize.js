const { getDatabaseCollection } = require('./db.js')
const { WeiToGwei, bucket, diff } = require('./utils.js')

const R = require('ramda')
const { pipe, map, reduce, prop, concat, sort, mean, median } = R
const { range } = require('range-of-numbers')

const main = async () => {
  const [ collection, client ] = await getDatabaseCollection()
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

  const txsToBuckets = pipe(
    prop("transactions"),
    getGasPriceFromTx,
    txs => {
      const numList = concat(range(1, 9, 1), range(10, 200, 10))
      const objList = map((n) => ({ [n]: bucket([n <= 10 ? n - 1 : n - 10, n])(txs) }), numList)
      const buckets = reduce((prev,curr) => Object.assign(prev,curr),{},objList)
      return buckets 
    }
  )


  const buckets = map(txsToBuckets)

  console.log("Blocks: ", blocks.length)
  console.log("Txs: ", getTxs(blocks).length)
  console.log("min: ", minGas)
  console.log("mean: ", meanGas)
  console.log("median: ", medianGas)
  console.log("max: ", maxGas)
  console.log("buckets", buckets(blocks))

  client.close()
}

main()

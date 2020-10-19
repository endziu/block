const { getDatabaseCollection, WeiToGwei } = require('./utils.js')

const R = require('ramda')
const { head, pipe, compose, map, reduce, juxt, prop, concat, sort, reverse, add, length, mean, median } = R

const diff = (a,b) => a - b

const main = async () => {
  const collection = await getDatabaseCollection()
  const blocks = await collection.find().limit(2).toArray()

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

 
  console.clear()
  console.log(`blocks: ${blocks.length}`)
  console.log(`   txs: ${getTxs(blocks).length}`)
  console.log(`
    min:    ${minGas}
    mean:   ${meanGas}
    median: ${medianGas}
    max:    ${maxGas}
  `)
  console.log(getTxs(blocks)[0])
}

main()


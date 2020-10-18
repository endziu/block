const fetch = require('node-fetch')
const { ETHERSCAN_APIKEY, MONGO_CONNECTION_STRING } = require('./config.js')
const R = require('ramda')
const { pipe, map, filter, prop, mean, median, sort, reverse } = R
const utils = require('./utils.js')
const { blockNumUrl, blockUrl, fetchJson, inRange, wrap, WeiToGwei, saveGasData, getDatabaseCollection } = utils

let lastBlockNumber

const main = async () => {
  // const dbCollection = await getDatabaseCollection()
  // const items = await dbCollection.find().toArray()
  // console.log(items.length)
  
  const blockNumber = await fetchJson(blockNumUrl(ETHERSCAN_APIKEY))

  if (blockNumber - lastBlockNumber > 1) {
    const range = blockNumber - lastBlockNumber
    const missedNumber = Number(lastBlockNumber) + (range -1)
    const missedBlock = await fetchJson(blockUrl(missedNumber.toString(16),ETHERSCAN_APIKEY))
    await saveGasData(missedBlock)
    console.log('missed block saved to db.') 
  }

  if (lastBlockNumber && lastBlockNumber === blockNumber) {
    console.log('waiting for a block...')
    return
  }
  
  lastBlockNumber = blockNumber

  const block = await fetchJson(blockUrl(blockNumber, ETHERSCAN_APIKEY))
  const { transactions } = block
  const getGasPriceGwei = map(pipe(prop('gasPrice'), WeiToGwei))
  const prices = getGasPriceGwei(transactions).sort((a, b) => a - b)
  
  const payload = {
    blockNumber: [blockNumber, Number(blockNumber)],
    min: prices[0],
    mean: mean(prices),
    median: median(prices),
    max: prices[prices.length - 1],
    gasUsed: Number(block.gasUsed),
    gasLimit: Number(block.gasLimit),
    txsCount: block.transactions.length,
    buckets: {
      "0-20": filter(inRange(0, 20), prices).length,
      "20-40": filter(inRange(20, 40), prices).length,
      "40-60": filter(inRange(40, 60), prices).length,
      "60-80": filter(inRange(60, 80), prices).length,
      "80-100": filter(inRange(80, 100), prices).length,
      "100-#":  filter(inRange(100), prices).length
    }
  }

  await saveGasData(payload)
  console.clear()
  console.log(payload)
  console.log('block saved to db.')
}

setInterval(main, 2000)


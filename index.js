const fetch = require('node-fetch')
const { ETHERSCAN_APIKEY, MONGO_CONNECTION_STRING } = require('./config.js')
const R = require('ramda')
const { pipe, map, filter, prop, mean, median, sort, reverse } = R
const utils = require('./utils.js')
const { blockNumUrl, blockUrl, fetchJson, inRange, wrap, WeiToGwei, saveGasData, getDatabaseCollection } = utils

let lastBlockNumber

const main = async () => {
  const blockNumber = await fetchJson(blockNumUrl(ETHERSCAN_APIKEY))

  if (blockNumber - lastBlockNumber > 1) {
    const missedNumber = Number(lastBlockNumber) + 1
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
  await saveGasData(block)

  console.clear()
  console.log('block saved to db.')
}

//main()
setInterval(main, 2000)


const fetch = require('node-fetch')
const { ETHERSCAN_APIKEY, MONGO_CONNECTION_STRING } = require('./config.js')
const R = require('ramda')
const { pipe, map, filter, prop, mean, median, sort, reverse } = R
const utils = require('./utils.js')
const { blockNumUrl, blockUrl, fetchJson, inRange, wrap, WeiToGwei, saveToDb, getDatabaseCollection } = utils

let lastBlockNumber
let indexMissed = 0
let indexSaved = 0

const main = async () => {
  const blockNumber = await fetchJson(blockNumUrl(ETHERSCAN_APIKEY))

  if (blockNumber - lastBlockNumber > 1) {
    const missedNumber = Number(lastBlockNumber) + 1
    const missedBlock = await fetchJson(blockUrl(missedNumber.toString(16),ETHERSCAN_APIKEY))
    await saveToDb(missedBlock)
    console.log('missed block saved to db.') 
    indexMissed++
  }

  if (lastBlockNumber && lastBlockNumber === blockNumber) {
    console.log('waiting for a block...')
    return
  }
  
  const block = await fetchJson(blockUrl(blockNumber, ETHERSCAN_APIKEY))
  await saveToDb(block)

  indexSaved++
  lastBlockNumber = blockNumber

  console.clear()
  console.log('block saved to db.', indexSaved, indexMissed)
}

main()
setInterval(main, 2000)


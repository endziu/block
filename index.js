const MongoClient = require('mongodb').MongoClient
const fetch = require('node-fetch')
// const express = require('express')
// const server = express()

const { ETHERSCAN_APIKEY, MONGO_CONNECTION_STRING } = require('./config.js')

const R = require('ramda')
const { pipe, map, filter, prop, mean, median, sort, reverse } = R

const utils = require('./utils.js')
const { blockNumUrl, blockUrl, fetchJson, inRange, wrap, WeiToGwei } = utils

let lastBlockNumber

const main = async () => {
  //const dbCollection = await getDatabaseCollection()
  //const items = await dbCollection.find().toArray()
  //console.log(items.length)

  const blockNumber = await fetchJson(blockNumUrl(ETHERSCAN_APIKEY))

  if (blockNumber - lastBlockNumber > 1) {
    const range = blockNumber - lastBlockNumber
    await saveGasData({message: "skipped block", blockNumbers: Number(lastBlockNumber) + (range - 1)})
    console.log('saved skipped blocks!!')
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
  console.log('saved to db')
}

// main()
setInterval(main, 2000)

/*
server.get('/api', wrap(async (req,res) => {
  const blocks = reverse(data)
  res.json(blocks)
}))

server.listen(3000, () => console.log('serving...'))
*/

async function getDatabaseCollection() {
  const client = await new MongoClient(
    MONGO_CONNECTION_STRING,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  await client.connect()
  const db = client.db("gas")
  return db.collection("gas")
}

async function saveGasData(item) {
  try{
    const dbCollection = await getDatabaseCollection()
    await dbCollection.insertOne(item)
  } catch(err) {
    console.error(err)
  }
}

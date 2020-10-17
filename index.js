const fetch = require('node-fetch')
const express = require('express')
const server = express()

const { 
  map,
  filter,
  pipe,
  prop,
  median,
  mean,
  sort,
  reverse
} = require('ramda')

const { 
  WeiToGwei,
  GweiToEther,
  WeiToEther,
  wrap,
  fetchJson,
  blockNumUrl,
  blockUrl,
  inRange
} = require('./utils.js')

const { ETHERSCAN_APIKEY } = require('./config.js')

let data = []

const main = async () => {
  const blockNumber = await fetchJson(blockNumUrl(ETHERSCAN_APIKEY))
  const block = await fetchJson(blockUrl(blockNumber, ETHERSCAN_APIKEY))
  const { transactions } = block

  const gwei = map( pipe(prop('gasPrice'), WeiToGwei), transactions )
  const sorted = sort((a,b) => a - b, gwei)
  
  const blockMin = sorted[0]
  const blockMean = mean(gwei)
  const blockMedian = median(gwei)
  const blockMax = sorted[sorted.length - 1]

  const buckets = {
    "0-20": filter(inRange(0, 20), sorted).length,
    "20-40": filter(inRange(20, 40), sorted).length,
    "40-60": filter(inRange(40, 60), sorted).length,
    "60-80": filter(inRange(60, 80), sorted).length,
    "80-100": filter(inRange(80, 100), sorted).length,
    "100-#":  filter(inRange(100), sorted).length
  }

  if (data.length > 127) {
    data = data.slice(1)
  }

  if (data.length > 0 && data[data.length -1].blockNumber[0] === blockNumber) {
    console.log('waiting for a block...')
    return
  }

  data.push({
    blockNumber: [blockNumber, Number(blockNumber)],
    min: blockMin,
    mean: blockMean,
    median: blockMedian,
    max: blockMax,
    buckets
  })

  console.clear()
  console.log(data && data[data.length -1])
}

main()
setInterval(main, 2000)

server.get('/api', wrap(async (req,res) => {
  const blockInfo = reverse(data)
  res.json(blockInfo)
}))

server.listen(3000, () => console.log('serving...'))

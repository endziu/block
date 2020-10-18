const fetch = require('node-fetch')
const express = require('express')
const server = express()

const { ETHERSCAN_APIKEY } = require('./config.js')

const R = require('ramda')
const { pipe, map, filter, prop, mean, median, sort, reverse } = R

const utils = require('./utils.js')
const { blockNumUrl, blockUrl, fetchJson, inRange, wrap, WeiToGwei } = utils

let data = []

const main = async () => {
  const blockNumber = await fetchJson(blockNumUrl(ETHERSCAN_APIKEY))

  if (data.length > 0 && data[data.length - 1].blockNumber[0] === blockNumber) {
    console.log('waiting for a block...')
    return
  }

  if (data.length > 128) {
    data = data.slice(1)
  }

  const block = await fetchJson(blockUrl(blockNumber, ETHERSCAN_APIKEY))

  const { transactions } = block
  const getGasPriceGwei = map(pipe(prop('gasPrice'), WeiToGwei))
  const prices = getGasPriceGwei(transactions).sort((a, b) => a - b)
  
  data.push({
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
  })

  console.clear()
  console.log(data && data[data.length -1])
}

main()
setInterval(main, 1000)

server.get('/api', wrap(async (req,res) => {
  const blocks = reverse(data)
  res.json(blocks)
}))

server.listen(3000, () => console.log('serving...'))


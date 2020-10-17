const fetch = require('node-fetch')
const { __, map, reduce, filter, pipe, prop, juxt, head, median, mean, min, max, sort, divide } = require('ramda')

const { ETHERSCAN_APIKEY } = require('./config.js')

const WeiToGwei = divide(__, 1e9)
const GweiToEther = WeiToGwei
const WeiToEther = pipe(WeiToGwei, GweiToEther)
const wrap = fn => (...args) => fn(...args).catch(args[2])

const getTxs = wrap(async () => {
  const eth_block_num = `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${ETHERSCAN_APIKEY}`
  const blockNumRes = await fetch(eth_block_num)
  const blockNumBody = await blockNumRes.json()
  const blockNum = blockNumBody.result

  const eth_block = `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${blockNum}&boolean=true&apikey=${ETHERSCAN_APIKEY}`
  const blockRes = await fetch(eth_block)
  const blockBody = await blockRes.json()
  const { transactions } = blockBody.result

  return transactions || []
})

let data = []

const main = async () => {
  const txs = await getTxs()
  const gwei = map( pipe(prop('gasPrice'), WeiToGwei), txs )
  const sorted = sort((a,b) => a - b, gwei)
  
  const blockNumber = Number(txs[0].blockNumber)
  const blockMin = sorted[0]
  const blockMean = mean(gwei)
  const blockMedian = median(gwei)
  const blockMax = sorted[sorted.length - 1]

  const buckets = {
    "0-20": filter((n) => n > 0 && n < 20, sorted).length,
    "20-40": filter((n) => n > 20 && n < 40, sorted).length,
    "40-60": filter((n) => n > 40 && n < 60, sorted).length,
    "60-80": filter((n) => n > 60 && n < 80, sorted).length,
    "80-100": filter((n) => n > 80 && n < 100, sorted).length,
    "100-#": filter((n) => n > 100, sorted).length
  }

  if (data.length > 239) {
    data = data.slice(1)
  }
  if (data.length > 0 && data[data.length -1].blockNumber === blockNumber) {
    return
  }

  data.push({ blockNumber, min: blockMin, mean: blockMean, median: blockMedian, max: blockMax, buckets })
  console.clear()
  console.log(data && data[data.length - 1])
}

main()
setInterval(main, 5000)

module.exports = (req,res) => {
  res.json(data)
}


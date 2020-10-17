const fetch = require('node-fetch')
const { __, map, reduce, filter, pipe, prop, juxt, head, median, mean, min, max, sort, divide } = require('ramda')

const { ETHERSCAN_APIKEY } = require('./config.js')

const WeiToGwei = divide(__, 1e9)
const GweiToEther = WeiToGwei
const WeiToEther = pipe(WeiToGwei, GweiToEther)

const getTxs = async () => {
  const eth_block_num = `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${ETHERSCAN_APIKEY}`
  const blockNumRes = await fetch(eth_block_num)
  const blockNumBody = await blockNumRes.json()
  const blockNum = blockNumBody.result
  const eth_block = `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${blockNum}&boolean=true&apikey=${ETHERSCAN_APIKEY}`
  const blockRes = await fetch(eth_block)
  const blockBody = await blockRes.json()
  const { transactions } = blockBody.result
  return transactions || []
}

const main = async () => {
  const txs = await getTxs()
  const gwei = map( pipe(prop('gasPrice'), WeiToGwei), txs )
  const sorted = sort((a,b) => a - b, gwei)

  const blockMin = sorted[0]
  const blockMean = mean(gwei)
  const blockMedian = median(gwei)
  const blockMax = sorted[sorted.length - 1]

  const b1 = (n) => n > 0 && n < 20
  const b2 = (n) => n > 20 && n < 40
  const b3 = (n) => n > 40 && n < 60
  const b4 = (n) => n > 60 && n < 80
  const b5 = (n) => n > 80 && n < 100
  const b6 = (n) => n > 100

  const buckets = {
    "0-20": filter(b1, sorted).length,
    "20-40": filter(b2, sorted).length,
    "40-60": filter(b3, sorted).length,
    "60-80": filter(b4, sorted).length,
    "80-100": filter(b5, sorted).length,
    "100-#": filter(b6, sorted).length
  }

  console.clear()
  console.log("min: ", blockMin)
  console.log("mean: ", blockMean)
  console.log("median: ", blockMedian)
  console.log("max: ", blockMax)
  console.log("# txs: ", sorted.length)
  console.log(buckets)
}

main()

setInterval(main, 20000)

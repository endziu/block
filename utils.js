const fetch = require('node-fetch')

const fetchJson = async (url) => {
  try {
    const response = await fetch(url)
    const json = await response.json()
    const { result } = json
    return result
  } catch(e) {
    console.error(e)
  }
}

const blockNumUrl = (key) =>
  `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${key}`

const blockUrl = (num, key) =>
  `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${num}&boolean=true&apikey=${key}`

const { __, pipe, divide, length, filter } = require('ramda')
const WeiToGwei = divide(__, 1e9)
const GweiToEther = WeiToGwei
const WeiToEther = pipe(WeiToGwei, GweiToEther)
const wrap = fn => (...args) => fn(...args).catch(args[2])
const inRange = (n1, n2 = Infinity) => (p) => p >= n1 && p < n2
const bucket = ([min, max = Infinity]) => txs => length(filter(inRange(min,max), txs))


module.exports = {
  WeiToGwei,
  GweiToEther,
  WeiToEther,
  wrap,
  fetchJson,
  blockNumUrl,
  blockUrl,
  inRange,
  bucket
}

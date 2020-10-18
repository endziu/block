const MongoClient = require('mongodb').MongoClient
const { MONGO_CONNECTION_STRING } = require('./config.js')
const { __, pipe, divide } = require('ramda')
const fetch = require('node-fetch')

const WeiToGwei = divide(__, 1e9)
const GweiToEther = WeiToGwei
const WeiToEther = pipe(WeiToGwei, GweiToEther)
const wrap = fn => (...args) => fn(...args).catch(args[2])

const fetchJson = async (url) => {
  const response = await fetch(url)
  const json = await response.json()
  const { result } = json
  return result
}

const blockNumUrl = (key) =>
  `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${key}`

const blockUrl = (num, key) =>
  `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${num}&boolean=true&apikey=${key}`

const inRange = (n1, n2 = Infinity) => (p) => p >= n1 && p < n2

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

module.exports = {
  WeiToGwei,
  GweiToEther,
  WeiToEther,
  wrap,
  fetchJson,
  blockNumUrl,
  blockUrl,
  inRange,
  getDatabaseCollection,
  saveGasData
}

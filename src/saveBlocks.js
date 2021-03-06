const { blockNumUrl, blockUrl, fetchJson } = require('./utils.js')
const { ETHERSCAN_APIKEY, MONGO_CONNECTION_STRING } = require('./config.js')
const { saveToDb, dropCollection } = require('./db.js')

let b;

(async function() {
  await dropCollection("blocks")
  console.log("collection clear")
})();

const main = async () => {
  const blockNumber = await fetchJson(blockNumUrl(ETHERSCAN_APIKEY))
  const difference = blockNumber - b

  if (difference === 0 || difference < 0) {
    console.log(blockNumber - b, 'waiting...')
    return
  }

  if(difference === 1) {
    const nextHex = "0x" + Number(blockNumber).toString(16)
    const block = await fetchJson(blockUrl(nextHex, ETHERSCAN_APIKEY))
    await saveToDb(block)
    console.log(difference, "saving current block: ", Number(nextHex))
  }

  if (difference > 1) {
    const list = new Array(difference).fill("0")
    list.forEach(async (s, i) => {
      const n = "0x" + (Number(blockNumber) + i - 1).toString(16)
      const block = await fetchJson(blockUrl(n, ETHERSCAN_APIKEY))
      await saveToDb(block)
      console.log(difference, "saving missing block: ", Number(n))
    })
  }

  b = blockNumber
}

main()
setInterval(main, 3000)


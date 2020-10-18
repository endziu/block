const { getDatabaseCollection, WeiToGwei } = require('./utils.js')

const main = async () => {
  const collection = await getDatabaseCollection()
  const blocks = await collection.find().toArray()
  const sumTxsGas =
    blocks
      .map(b => b.transactions)
      .reduce((a,b) => a.concat(b),[])
      .map(t => t.gasPrice)
      .map(gp => WeiToGwei(gp))
      .reduce((a,b) => a + b, 0)

  console.clear()    
  console.log(sumTxsGas)
}

main()

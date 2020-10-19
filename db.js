const R = require('ramda')
const { head, pipe, compose, map, filter, reduce, juxt, prop, concat, sort, reverse, add, length, mean, median } = R
const { getDatabaseCollection, WeiToGwei, inRange } = require('./utils.js')

const diff = (a,b) => a - b
const peek = _ => {console.log(_);return _;}

const main = async () => {
  const collection = await getDatabaseCollection()
  const blocks = await collection.find().limit(3).toArray()

  const getTxs = pipe(
    map(prop("transactions")),
    reduce(concat,[])
  ) 

  const getGasPriceFromTx = map(
    pipe(
      prop("gasPrice"),
      WeiToGwei,
      Number
    )
  )

  const gwei = pipe(getTxs, getGasPriceFromTx, sort(diff))([head(blocks)])
  const minGas = gwei[0]
  const maxGas = gwei[gwei.length - 1]
  const meanGas = mean(gwei)
  const medianGas = median(gwei)

  const txsToBuckets = map(
    pipe(
      prop("transactions"),
      map(prop("gasPrice")),
      map(Number),
      map(WeiToGwei),
      txs => ({
        "0-10": filter(inRange(0,10),txs).length,
        "10-20": filter(inRange(10,20),txs).length,
        "20-30": filter(inRange(20,30),txs).length,
        "40-50": filter(inRange(30,40),txs).length,
        "50-60": filter(inRange(50,60),txs).length,
        "70-80": filter(inRange(70,80),txs).length,
        "90-100": filter(inRange(90,100),txs).length,
        "100-110": filter(inRange(100,110),txs).length,
        "110-120": filter(inRange(110,120),txs).length,
        "120-130": filter(inRange(120,130),txs).length,
        "130-140": filter(inRange(130,140),txs).length,
        "140-150": filter(inRange(140,150),txs).length,
        "150-160": filter(inRange(150,160),txs).length,
        "160-170": filter(inRange(160,170),txs).length,
        "170-180": filter(inRange(170,180),txs).length,
        "180-190": filter(inRange(180,190),txs).length,
        "190-200": filter(inRange(190,200),txs).length,
        "200-#": filter(inRange(200),txs).length
      })
    )
  )

  console.log(txsToBuckets(blocks)[0])
  console.log("min: ", minGas)
  console.log("mean: ", meanGas)
  console.log("median: ", medianGas)
  console.log("max: ", maxGas)
  console.log("Txs: ", getTxs(blocks).length)

}

main()


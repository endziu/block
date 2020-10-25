const MongoClient = require('mongodb').MongoClient
const { MONGO_CONNECTION_STRING } = require('./config.js')

async function getDatabaseCollection() {
  try {
    const client = await new MongoClient(
      MONGO_CONNECTION_STRING,
      { useNewUrlParser: true, useUnifiedTopology: true }
    )
    await client.connect()
    const db = client.db("gas")
    return [ db.collection("blocks"), client ]
  } catch(e) {
    console.error("could not get collection", e)
  }
}

async function saveToDb(item) {
  try{
    const [ dbCollection, client ] = await getDatabaseCollection()
    await dbCollection.insertOne(item)
    client.close()
  } catch(err) {
    console.error("error saving to db", err)
  } 
}

async function dropCollection(name) {
  try {
    const [ dbCollection, client ] = await getDatabaseCollection()
    await dbCollection.drop()
    client.close()
  } catch(err) {
    console.log("error dropping collection", err)
  }
}

module.exports = {
  getDatabaseCollection,
  saveToDb,
  dropCollection
}

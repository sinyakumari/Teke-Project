import mongoose from 'mongoose'
const MONGO_URI = 'mongodb://127.0.0.1:27017/teke'
async function test() {
  console.log('Connecting...')
  await mongoose.connect(MONGO_URI)
  console.log('Connected!')
  const collections = await mongoose.connection.db.listCollections().toArray()
  console.log('Collections:', collections.map(c => c.name))
  await mongoose.disconnect()
  console.log('Disconnected!')
}
test().catch(console.error)

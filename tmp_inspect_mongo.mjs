import mongoose from 'mongoose'

const MONGO_URI = 'mongodb://127.0.0.1:27017/teke'

async function inspect() {
  await mongoose.connect(MONGO_URI)
  
  const User = mongoose.model('User', new mongoose.Schema({ email: String }))
  const Training = mongoose.model('Training', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, title: String }))
  const Task = mongoose.model('Task', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, trainingId: mongoose.Schema.Types.ObjectId, name: String }))

  const users = await User.find({})
  const trainings = await Training.find({})
  const tasks = await Task.find({})

  console.log('--- USERS ---')
  users.forEach(u => console.log(`ID: ${u._id}, Email: ${u.email}`))

  console.log('\n--- TRAININGS ---')
  trainings.forEach(t => console.log(`ID: ${t._id}, Title: ${t.title}, userId: ${t.userId}`))

  console.log('\n--- TASKS ---')
  tasks.forEach(tk => console.log(`ID: ${tk._id}, Name: ${tk.name}, userId: ${tk.userId}, trainingId: ${tk.trainingId}`))

  await mongoose.disconnect()
}

inspect().catch(console.error)

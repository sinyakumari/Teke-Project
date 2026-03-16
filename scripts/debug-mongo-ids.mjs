import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://127.0.0.1:27017/teke';

const UserSchema = new mongoose.Schema({ email: String });
const TrainingSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, title: String });
const TaskSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, trainingId: mongoose.Schema.Types.ObjectId, name: String });

async function debugData() {
  await mongoose.connect(MONGO_URI);
  const User = mongoose.model('User', UserSchema);
  const Training = mongoose.model('Training', TrainingSchema);
  const Task = mongoose.model('Task', TaskSchema);

  const users = await User.find({});
  console.log('--- USERS ---');
  users.forEach(u => console.log(`ID: ${u._id}, Email: ${u.email}`));

  const trainings = await Training.find({});
  console.log('\n--- TRAININGS ---');
  trainings.forEach(t => console.log(`ID: ${t._id}, Title: ${t.title}, userId: ${t.userId}`));

  const tasks = await Task.find({});
  console.log('\n--- TASKS ---');
  tasks.forEach(tk => console.log(`ID: ${tk._id}, Name: ${tk.name}, userId: ${tk.userId}, trainingId: ${tk.trainingId}`));

  await mongoose.disconnect();
}

debugData();

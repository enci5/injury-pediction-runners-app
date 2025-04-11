const express = require('express')
const app = express()
const authRouter = require('./routes/authRoutes')
const mongoose = require('mongoose')

const DB = "mongodb://localhost:27017/runnersapp"
mongoose.connect(DB).then(()=>console.log('connected to db'))
.catch((err) => console.error("MongoDB connection error:", err))


app.use('/api/auth', authRouter);
app.use(express.json())

app.listen(3000, ()=>console.log('listening on port 3000'))
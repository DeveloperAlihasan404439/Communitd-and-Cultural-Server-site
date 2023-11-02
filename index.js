const express = require('express');
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookie = require('cookie-parser')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config()

app.use(cors({
  origin:['http://localhost:5173'],
  credentials: true
}))
app.use(express.json())
app.use(cookie())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wjgws1x.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifaketionToken = (req, res, next)=>{
  const token = req.cookies?.token;
  if(!token){
    return res.status(401).send({message: 'unauthorizeds'})
  }
  jwt.verify(token, process.env.JWT_TOKEN, (error, decoded)=>{
    if(error){
      return res.status(401).send({message: 'unauthorizeds access'})
    }
    req.user = decoded;
  
    next()
  })
}
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const communitdCollection = client.db('Communitd-and-Cultural-Events').collection('Events')
    const userInfoCollection = client.db('Communitd-and-Cultural-Events').collection('userInfo')
    const coursesCollection = client.db('Communitd-and-Cultural-Events').collection('course')

    app.post('/jwt', async(req, res)=>{
      const user = req.body;

      const token = jwt.sign(user, process.env.JWT_TOKEN, {expiresIn: '1h'})
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        // sameSite: 'none'
      }).send({message: 'success'})
    })

    app.get('/events', async(req, res)=>{
        const events = communitdCollection.find()
        const result = await events.toArray()
        res.send(result)
    })
    app.get('/events/:id', async(req, res) =>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await communitdCollection.findOne(query)
        res.send(result)
    })
    app.post('/events', async(req, res)=>{
        const eventsData = req.body;
        const result =await communitdCollection.insertOne(eventsData)
        res.send(result)
    })
    app.get("/courses",verifaketionToken,  async(req, res)=>{
      if(req.query.email !==req.user.crrentUsers){
        return res.status(403).send('invalide user')
      }

      let query = {};
      if (req.query.email) {
        query = { email: req.query.email };
      }
      const coures = coursesCollection.find(query)
      const result = await coures.toArray()
      res.send(result)
    })
    app.post('/courses', async(req, res)=>{
      const courses = req.body;
      const result = await coursesCollection.insertOne(courses)
      res.send(result)

    })
    app.post('/loger',async(req, res)=>{
      const user = req.body;
      // console.log(user)
      res.clearCookie('token', {maxAge: 0}).send({message: true})
    })
    // user contact application s
    app.get('/users', async(req, res)=>{
      const users = userInfoCollection.find()
      const result = await users.toArray()
      res.send(result)
    })
    app.post('/users', async(req, res)=>{
      const user = req.body;
      const result = await userInfoCollection.insertOne(user)
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('Communitd and cultural events')
})

app.listen(port, ()=>{
    console.log(`server run the port ${port}`);
})

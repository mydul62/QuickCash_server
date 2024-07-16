const express = require("express");
const app = express();

const bcrypt = require('bcryptjs');
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();
app.use(
  cors({
    origin: ["http://localhost:5173",]
  })
);
app.use(express.json());
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("QuickCash");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xm07hcd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    const database = client.db("quickcash");
    const usersCollection = database.collection("user");
    app.post("/users/register", async (req, res) => {
      const { email, phone, pin } = req.body;                                                          
      console.log(email, phone, pin);
    
      // Check if a user with the provided email or phone number already exists
      const existingUser = await usersCollection.findOne({
        $or: [{ email: email }, { phone: phone }]
      });
    
      if (existingUser) {
        return res.status(400).send({ message: "User already exists with this email or phone number" });
      }
    
      // If user does not exist, proceed with registration
      const hashedPin = await bcrypt.hash(pin, 10);
      const result = await usersCollection.insertOne({
        pin: hashedPin,
        phone,
        email,
        status: 'pending',
        balance: 0,
      });
      res.send(result);
    });
    
    
    app.post("/users/login", async (req, res) => {
      const { email, phone, pin } = req.body;                                                          
      console.log(email, phone, pin);
    
      // Check if a user with the provided email or phone number already exists
      const existingUser = await usersCollection.findOne({
        $or: [{ email: email }, { phone: phone }]
      });
      console.log(existingUser);
      if (!existingUser) {
        return res.status(401).send({ message: "Invalid credentials" });
      }
    
      // Check if the provided pin matches the hashed pin stored in the database
      const isMatch = await bcrypt.compare(pin, existingUser.pin);
      console.log(isMatch);
      if (!isMatch) {
        return res.status(401).send({ message: "Invalid credentials" });
      }
    
      return res.send({ message: "Login successful", user: {email:existingUser.email,phone:existingUser.phone,status:existingUser.status,id:existingUser._id} });
    });
    
    
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
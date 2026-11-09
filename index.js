import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

const port = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function checkMongo() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB is Connected and working!");
  } catch (err) {
    console.error("MongoDB is not working:", err.message);
  }
}
const db = client.db("HireLoopDB");
const usersCollection = db.collection("user");
const jobsCollection = db.collection("job");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/users", async (req, res) => {
  try {
    const users = await usersCollection.find().toArray();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/jobs", async (req, res) => {
  try {
    const job = req.body;
    const result = await jobsCollection.insertOne(job);
    res
      .status(201)
      .json({ message: "Job created successfully", jobId: result.insertedId });
  } catch (err) {
    console.error("Error creating job:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/view-jobs", async (req, res) => {
  try {
    const jobs = await jobsCollection.find().toArray();
    res.json(jobs);
  } catch (err) {
    console.error("Error fetching jobs:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/view-jobs/:_id", async (req, res) => {
  try {
    const jobId = req.params._id;
    const job = await jobsCollection.findOne({
      _id: new ObjectId(jobId),
    });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  } catch (err) {
    console.error("Error fetching job:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, async () => {
  console.log(`Example app listening on port ${port}`);
  await checkMongo();
});

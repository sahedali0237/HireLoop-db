﻿import dotenv from "dotenv";
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

// Only these fields can be created or edited on a job.
const JOB_FIELDS = [
  "title",
  "company",
  "description",
  "location",
  "employmentType",
  "category",
  "salaryMin",
  "salaryMax",
  "applicationEmail",
];

function pickJobFields(body = {}) {
  const data = {};
  for (const key of JOB_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

function invalidId(res) {
  return res.status(400).json({ error: "Invalid job id" });
}

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

// Create a job
app.post("/jobs", async (req, res) => {
  try {
    const job = pickJobFields(req.body);

    if (!job.title || !job.company || !job.description || !job.employmentType) {
      return res.status(400).json({
        error: "title, company, description and employmentType are required",
      });
    }

    job.createdAt = new Date();

    const result = await jobsCollection.insertOne(job);
    res
      .status(201)
      .json({ message: "Job created successfully", jobId: result.insertedId });
  } catch (err) {
    console.error("Error creating job:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all jobs (newest first)
app.get("/view-jobs", async (req, res) => {
  try {
    const { search, jobType } = req.query;
    let query = {};
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    if (jobType) {
      const jobTypesArray = Array.isArray(jobType)
        ? jobType
        : jobType.split(",");
      query.jobType = { $in: jobTypesArray };
    }

    const jobs = await jobsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(jobs);
  } catch (err) {
    console.error("Error fetching jobs:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get one job
app.get("/view-jobs/:_id", async (req, res) => {
  try {
    const jobId = req.params._id;
    if (!ObjectId.isValid(jobId)) return invalidId(res);

    const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  } catch (err) {
    console.error("Error fetching job:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update a job (used by the Edit dialog) - returns the updated job
app.patch("/jobs/:_id", async (req, res) => {
  try {
    const jobId = req.params._id;
    if (!ObjectId.isValid(jobId)) return invalidId(res);

    const updateData = pickJobFields(req.body);
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    updateData.updatedAt = new Date();

    const result = await jobsCollection.findOneAndUpdate(
      { _id: new ObjectId(jobId) },
      { $set: updateData },
      { returnDocument: "after" },
    );

    // mongodb driver v6 returns the document; v5 returns { value }
    const updated = result && "value" in result ? result.value : result;

    if (!updated) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Error updating job:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a job
app.delete("/jobs/:_id", async (req, res) => {
  try {
    const jobId = req.params._id;
    if (!ObjectId.isValid(jobId)) return invalidId(res);

    const result = await jobsCollection.deleteOne({
      _id: new ObjectId(jobId),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error("Error deleting job:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, async () => {
  console.log(`Example app listening on port ${port}`);
  await checkMongo();
});

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
   ' https://my-port-folio-nine-inky.vercel.app', 'http://localhost:3000'
  ],
  credentials: true
}));

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("authentication");
    const collection = db.collection("users");
    const BlogsCollection = db.collection("blogs");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { username, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exist!!!",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({
        username,
        email,
        password: hashedPassword,
        role: "user",
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully!",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, role: user.role },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.EXPIRES_IN,
        }
      );

      res.json({
        success: true,
        message: "User successfully logged in!",
        accessToken: token,
      });
    });

    // blogs section


    app.post("/api/v1/blogs", async (req, res) => {
      try {
        const { title, description,blog_image, author_name,publish_date, total_likes} = req.body;
    
        // Validate required fields
        if (!title || !description|| !author_name) {
          return res.status(400).json({ message: "Title, Content, and Author are required!" });
        }
    
        // Create a new blog post object
        const newBlog = {
          title,
          blog_image,
          description,
          author_name,
          publish_date,
          total_likes,
          createdAt: new Date(),  
        };
    
        // Insert the new blog into the 'blogs' collection
        const result = await BlogsCollection.insertOne(newBlog);
    
        // Check if the insertion was successful
        if (result) {
          res.status(201).json({
            message: "Blog created successfully!",
            blog: newBlog,
          });
        } else {
          res.status(500).json({ message: "Failed to create blog" });
        }
      } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error" });
      }
    });
    

    // Fetch all blog posts
app.get("/api/v1/blogs", async (req, res) => {
  try {
    const blogs = await BlogsCollection.find({}).toArray();
    res.status(200).json(blogs);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});


    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});

const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const passport = require("passport")
const session = require("express-session")
const MongoStore = require("connect-mongo")
require("dotenv").config()

// Import passport config
require("./config/passport")

// Import routes
const authRoutes = require("./routes/auth")
const letterRoutes = require("./routes/letters")
const driveRoutes = require("./routes/drive")

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(express.json())

// CORS Setup
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000"
]

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
  })
)

// Session Configuration
app.set("trust proxy", 1) // Important for production (e.g. Render)

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only over HTTPS in prod
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
)

// Initialize Passport
app.use(passport.initialize())
app.use(passport.session())

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/letters", letterRoutes)
app.use("/api/drive", driveRoutes)

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Something went wrong!" })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})

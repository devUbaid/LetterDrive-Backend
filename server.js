const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const passport = require("passport")
const session = require("express-session")
const MongoStore = require("connect-mongo")
require("dotenv").config()

// Passport config
require("./config/passport")

const authRoutes = require("./routes/auth")
const letterRoutes = require("./routes/letters")
const driveRoutes = require("./routes/drive")

const app = express()
const PORT = process.env.PORT || 5000

// Trust proxy (important for secure cookies on Render)
app.set("trust proxy", 1)

// Body parser
app.use(express.json())

// CORS Configuration
const CLIENT_URL = process.env.CLIENT_URL || "https://letterdrive.vercel.app"
app.use(
  cors({
    origin: CLIENT_URL, // use exact origin string (not function or array)
    credentials: true, //  required to send cookies
  })
)

// Session Setup
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
      secure: process.env.NODE_ENV === "production", // only send cookie over HTTPS
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site support
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
)

// Passport Middleware
app.use(passport.initialize())
app.use(passport.session())

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log(" Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/letters", letterRoutes)
app.use("/api/drive", driveRoutes)

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" })
})

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Something went wrong!" })
})

// Start Server
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`)
})

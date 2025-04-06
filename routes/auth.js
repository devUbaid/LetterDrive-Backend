const express = require("express")
const passport = require("passport")
const router = express.Router()
require("dotenv").config()

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000"

// Google OAuth login/signup route
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/drive.file"],
  }),
)

// Google OAuth callback route
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL}/login-failed`,
    session: true,
  }),
  (req, res) => {
    const isNewUser = req.user.createdAt === req.user.updatedAt

    if (isNewUser) {
      res.redirect(`${CLIENT_URL}/dashboard?newUser=true`)
    } else {
      res.redirect(`${CLIENT_URL}/dashboard`)
    }
  },
)

// Check if user is authenticated
router.get("/status", (req, res) => {
  if (req.isAuthenticated()) {
    return res.status(200).json({
      isAuthenticated: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture,
      },
    })
  }
  return res.status(401).json({ isAuthenticated: false })
})

// Logout route
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err)
    res.status(200).json({ message: "Logged out successfully" })
  })
})

module.exports = router

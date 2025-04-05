const express = require("express")
const passport = require("passport")
const router = express.Router()

// Google OAuth login/signup route - this handles both login and signup
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
    failureRedirect: "http://localhost:3000/login-failed",
    session: true,
  }),
  (req, res) => {
    // Successful authentication, redirect to client
    // You can check if this was a new user (signup) or existing user (login)
    const isNewUser = req.user.createdAt === req.user.updatedAt

    if (isNewUser) {
      // This was a signup
      res.redirect("http://localhost:3000/dashboard?newUser=true")
    } else {
      // This was a login
      res.redirect("http://localhost:3000/dashboard")
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
    if (err) {
      return next(err)
    }
    res.status(200).json({ message: "Logged out successfully" })
  })
})

module.exports = router


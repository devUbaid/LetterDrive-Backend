const express = require("express")
const router = express.Router()
const Letter = require("../models/Letter")
const { isAuthenticated } = require("../middleware/auth")

// Get all letters for the authenticated user
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const letters = await Letter.find({ user: req.user._id }).sort({ updatedAt: -1 })

    res.status(200).json(letters)
  } catch (error) {
    console.error("Error fetching letters:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get a specific letter
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const letter = await Letter.findOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!letter) {
      return res.status(404).json({ message: "Letter not found" })
    }

    res.status(200).json(letter)
  } catch (error) {
    console.error("Error fetching letter:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create a new letter
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body

    const letter = new Letter({
      user: req.user._id,
      title: title || "Untitled Letter",
      content: content || "",
    })

    await letter.save()
    res.status(201).json(letter)
  } catch (error) {
    console.error("Error creating letter:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update a letter
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body

    const letter = await Letter.findOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!letter) {
      return res.status(404).json({ message: "Letter not found" })
    }

    letter.title = title || letter.title
    letter.content = content !== undefined ? content : letter.content
    letter.updatedAt = Date.now()

    await letter.save()
    res.status(200).json(letter)
  } catch (error) {
    console.error("Error updating letter:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete a letter
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const result = await Letter.deleteOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Letter not found" })
    }

    res.status(200).json({ message: "Letter deleted successfully" })
  } catch (error) {
    console.error("Error deleting letter:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router


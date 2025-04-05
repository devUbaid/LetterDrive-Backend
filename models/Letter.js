const mongoose = require("mongoose")

const letterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    default: "Untitled Letter",
  },
  content: {
    type: String,
    default: "",
  },
  savedToDrive: {
    type: Boolean,
    default: false,
  },
  driveFileId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt timestamp before saving
letterSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model("Letter", letterSchema)


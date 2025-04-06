const express = require("express")
const router = express.Router()
const { google } = require("googleapis")
const Letter = require("../models/Letter")
const { isAuthenticated } = require("../middleware/auth")
require("dotenv").config()

const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000"

// Helper function to get Google Drive client
const getDriveClient = (user) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${SERVER_URL}/api/auth/google/callback`
  )

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  })

  return google.drive({ version: "v3", auth: oauth2Client })
}

// Save letter to Google Drive
router.post("/save/:id", isAuthenticated, async (req, res) => {
  try {
    const letter = await Letter.findOne({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!letter) {
      return res.status(404).json({ message: "Letter not found" })
    }

    const drive = getDriveClient(req.user)

    let folderId
    const folderResponse = await drive.files.list({
      q: "name='Letters' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id, name)",
    })

    if (folderResponse.data.files.length > 0) {
      folderId = folderResponse.data.files[0].id
    } else {
      const folderMetadata = {
        name: "Letters",
        mimeType: "application/vnd.google-apps.folder",
      }

      const folder = await drive.files.create({
        resource: folderMetadata,
        fields: "id",
      })

      folderId = folder.data.id
    }

    const fileMetadata = {
      name: letter.title || "Untitled Letter",
      mimeType: "application/vnd.google-apps.document",
      parents: [folderId],
    }

    const media = {
      mimeType: "text/html",
      body: letter.content,
    }

    let fileId

    if (letter.driveFileId) {
      await drive.files.update({
        fileId: letter.driveFileId,
        resource: fileMetadata,
        media: media,
      })
      fileId = letter.driveFileId
    } else {
      const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id",
      })
      fileId = file.data.id
    }

    letter.savedToDrive = true
    letter.driveFileId = fileId
    await letter.save()

    res.status(200).json({
      message: "Letter saved to Google Drive successfully",
      fileId,
    })
  } catch (error) {
    console.error("Error saving to Google Drive:", error)
    res.status(500).json({ message: "Failed to save to Google Drive" })
  }
})

// Get letters from Google Drive
router.get("/letters", isAuthenticated, async (req, res) => {
  try {
    const drive = getDriveClient(req.user)

    const folderResponse = await drive.files.list({
      q: "name='Letters' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id, name)",
    })

    if (folderResponse.data.files.length === 0) {
      return res.status(200).json([])
    }

    const folderId = folderResponse.data.files[0].id

    const filesResponse = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`,
      fields: "files(id, name, createdTime, modifiedTime)",
    })

    res.status(200).json(filesResponse.data.files)
  } catch (error) {
    console.error("Error fetching from Google Drive:", error)
    res.status(500).json({ message: "Failed to fetch from Google Drive" })
  }
})

// Delete a letter from Google Drive
router.delete("/delete/:fileId", isAuthenticated, async (req, res) => {
  try {
    const { fileId } = req.params
    const drive = getDriveClient(req.user)

    await drive.files.delete({
      fileId: fileId,
    })

    // Optionally unset driveFileId in DB if needed
    await Letter.updateOne(
      { driveFileId: fileId, user: req.user._id },
      { $unset: { driveFileId: "", savedToDrive: "" } }
    )

    res.status(200).json({ message: "File deleted from Google Drive" })
  } catch (error) {
    console.error("Error deleting file from Drive:", error.message)
    res.status(500).json({ message: "Failed to delete file from Google Drive" })
  }
})

module.exports = router

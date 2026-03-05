const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { Pool } = require("pg")
const cors = require("cors")
const crypto = require("crypto")

// Temporary in-memory storage for QR login sessions
const qrSessions = {}

const app = express()
app.use(cors())
app.use(express.json())
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

app.post("/signup", async (req, res) => {
  const { name, email, phone, password } = req.body

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    await pool.query(
      "INSERT INTO users (name,email,phone,password) VALUES ($1,$2,$3,$4)",
      [name, email, phone, hashedPassword]
    )

    res.json({ message: "User created successfully" })
  } catch (err) {
    res.status(400).json({ error: "User already exists" })
  }
})

app.post("/login", async (req, res) => {
  const { email, password } = req.body

  const user = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  )

  if (user.rows.length === 0) {
    return res.status(400).json({ error: "Invalid credentials" })
  }

  const valid = await bcrypt.compare(password, user.rows[0].password)

  if (!valid) {
    return res.status(400).json({ error: "Invalid credentials" })
  }

  const token = jwt.sign({ id: user.rows[0].id }, "svashasan_secret")

  res.json({ token })
})

// Create QR login session
app.post("/qr-session", (req, res) => {

  const session_id = crypto.randomUUID()

  qrSessions[session_id] = {
    authenticated: false,
    token: null
  }

  res.json({ session_id })

})

// Check QR session status
app.get("/qr-status/:session_id", (req, res) => {

  const session = qrSessions[req.params.session_id]

  if (!session) {
    return res.status(404).json({ error: "session not found" })
  }

  res.json(session)

})

// Confirm QR login from mobile
app.post("/qr-confirm", (req, res) => {

  const { session_id, token } = req.body

  const session = qrSessions[session_id]

  if (!session) {
    return res.status(404).json({ error: "session not found" })
  }

  session.authenticated = true
  session.token = token

  res.json({ success: true })

})

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

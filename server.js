const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})
const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { Pool } = require("pg")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({
  user: "vanshsvashasanlabs",
  host: "localhost",
  database: "svashasan",
  password: "",
  port: 5432
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

app.listen(5000, () => {
  console.log("Server running on port 5000")
})


import express from 'express'
import { pool } from '../db.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM fruits WHERE status = 1 ORDER BY id DESC')
  res.json({ success: true, data: rows })
})

export default router

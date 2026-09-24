import express from 'express'
import { pool } from '../db.js'
import { userAuth } from '../middleware/auth.js'

const router = express.Router()
router.use(userAuth)

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, nickname, phone, address FROM users WHERE id = ?',
    [req.user.id]
  )
  res.json({ success: true, data: rows[0] || {} })
})
router.put('/', async (req, res) => {
  const { phone, nickname, address } = req.body
  await pool.query(
    `UPDATE users SET
      phone = COALESCE(?, phone),
      nickname = COALESCE(?, nickname),
      address = COALESCE(?, address)
     WHERE id = ?`,
    [phone || null, nickname || null, address || null, req.user.id]
  )
  res.json({ success: true })
})

export default router

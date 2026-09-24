import express from 'express'
import { pool } from '../db.js'
import { adminAuth } from '../middleware/auth.js'
import { hashPassword, verifyPassword } from '../utils/password.js'

const router = express.Router()
router.use(adminAuth)

router.post('/change-password', async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, msg: '请填写完整' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, msg: '新密码至少 6 位' })
  }

  const [rows] = await pool.query('SELECT * FROM admins WHERE id = ?', [req.admin.id])
  if (!rows.length) return res.status(404).json({ success: false, msg: '用户不存在' })

  const admin = rows[0]
  const ok = await verifyPassword(oldPassword, admin.password)
  if (!ok) {
    return res.status(400).json({ success: false, msg: '原密码错误' })
  }

  const hashed = await hashPassword(newPassword)
  await pool.query('UPDATE admins SET password = ? WHERE id = ?', [hashed, req.admin.id])
  res.json({ success: true })
})

export default router

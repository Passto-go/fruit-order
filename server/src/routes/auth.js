import express from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
import { verifyPassword, hashPassword, isHashed } from '../utils/password.js'
import dotenv from 'dotenv'
dotenv.config()

const router = express.Router()

// 小程序登录
router.post('/wx-login', async (req, res) => {
  const { code } = req.body
  const openid = 'mock_' + code

  let [rows] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid])
  let user
  if (rows.length === 0) {
    const [r] = await pool.query(
      'INSERT INTO users (openid, nickname) VALUES (?, ?)',
      [openid, '微信用户']
    )
    user = { id: r.insertId, openid }
  } else {
    user = rows[0]
  }

  const token = jwt.sign({ id: user.id, openid }, process.env.JWT_SECRET, { expiresIn: '30d' })
  res.json({ success: true, token, userId: user.id })
})

// 管理员登录
router.post('/admin-login', async (req, res) => {
  const { username, password } = req.body

  const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username])
  if (rows.length === 0) {
    return res.status(400).json({ success: false, msg: '账号或密码错误' })
  }

  const admin = rows[0]
  const ok = await verifyPassword(password, admin.password)

  if (!ok) {
    return res.status(400).json({ success: false, msg: '账号或密码错误' })
  }

  // 兼容升级：如果数据库里还是明文，登录成功后自动升级为哈希
  if (!isHashed(admin.password)) {
    const hashed = await hashPassword(password)
    await pool.query('UPDATE admins SET password = ? WHERE id = ?', [hashed, admin.id])
    console.log(`[安全升级] 管理员 ${username} 的密码已从明文升级为 bcrypt 哈希`)
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
  res.json({ success: true, token, name: admin.name })
})

export default router

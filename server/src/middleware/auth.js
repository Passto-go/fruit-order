import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

export function userAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ success: false, msg: '未登录' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ success: false, msg: 'token 无效' })
  }
}

export function adminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ success: false, msg: '未登录' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (payload.role !== 'admin') throw new Error('非管理员')
    req.admin = payload
    next()
  } catch {
    res.status(401).json({ success: false, msg: 'token 无效' })
  }
}

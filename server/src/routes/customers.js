import express from 'express'
import { pool } from '../db.js'
import { adminAuth } from '../middleware/auth.js'

const router = express.Router()
router.use(adminAuth)

// 客户列表（带统计）
router.get('/', async (req, res) => {
  const { keyword } = req.query
  let sql = `SELECT u.*,
    (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
    (SELECT IFNULL(SUM(total_amount),0) FROM orders o
      WHERE o.user_id = u.id AND o.status != 'cancelled') AS total_amount,
    (SELECT IFNULL(SUM(total_amount),0) FROM orders o
      WHERE o.user_id = u.id AND o.settle_status != 'settled'
        AND o.status != 'cancelled') AS unsettled_amount
    FROM users u WHERE 1=1`
  const params = []
  if (keyword) {
    sql += ' AND (u.nickname LIKE ? OR u.phone LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`)
  }
  sql += ' ORDER BY u.id DESC LIMIT 200'
  const [rows] = await pool.query(sql, params)
  res.json({ success: true, data: rows })
})

// 更新客户
router.put('/:id', async (req, res) => {
  const { nickname, phone, address, customer_level, credit_limit, remark } = req.body
  await pool.query(
    `UPDATE users SET nickname=?, phone=?, address=?, customer_level=?, credit_limit=?, remark=?
     WHERE id=?`,
    [nickname, phone, address, customer_level, credit_limit, remark, req.params.id]
  )
  res.json({ success: true })
})

// 客户历史成交价（用于报价默认值）
router.get('/:id/last-prices', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT oi.fruit_id, oi.fruit_name, oi.confirmed_price, o.created_at
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = ? AND oi.confirmed_price > 0
     ORDER BY o.created_at DESC`,
    [req.params.id]
  )
  const map = {}
  for (const r of rows) {
    if (!map[r.fruit_id]) map[r.fruit_id] = r
  }
  res.json({ success: true, data: map })
})

export default router

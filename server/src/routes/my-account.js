import express from 'express'
import { pool } from '../db.js'
import { userAuth } from '../middleware/auth.js'

const router = express.Router()
router.use(userAuth)

// 账单总览
router.get('/summary', async (req, res) => {
  const [[unsettled]] = await pool.query(`
    SELECT IFNULL(SUM(total_amount),0) AS amount, COUNT(*) AS cnt
    FROM orders
    WHERE user_id = ? AND settle_status != 'settled' AND status != 'cancelled'
  `, [req.user.id])

  const [[settled]] = await pool.query(`
    SELECT IFNULL(SUM(total_amount),0) AS amount, COUNT(*) AS cnt
    FROM orders
    WHERE user_id = ? AND settle_status = 'settled' AND status != 'cancelled'
  `, [req.user.id])

  const [[total]] = await pool.query(`
    SELECT IFNULL(SUM(total_amount),0) AS amount, COUNT(*) AS cnt
    FROM orders
    WHERE user_id = ? AND status != 'cancelled'
  `, [req.user.id])

  res.json({
    success: true,
    data: {
      unsettled: { amount: Number(unsettled.amount), cnt: Number(unsettled.cnt) },
      settled: { amount: Number(settled.amount), cnt: Number(settled.cnt) },
      total: { amount: Number(total.amount), cnt: Number(total.cnt) }
    }
  })
})

// 我的账单列表（带筛选）
router.get('/orders', async (req, res) => {
  const { settleStatus } = req.query
  let sql = `SELECT * FROM orders WHERE user_id = ? AND status != 'cancelled'`
  const params = [req.user.id]

  if (settleStatus === 'settled') {
    sql += ' AND settle_status = ?'
    params.push('settled')
  } else if (settleStatus === 'unsettled') {
    sql += ' AND settle_status != ?'
    params.push('settled')
  }

  sql += ' ORDER BY id DESC LIMIT 100'

  const [orders] = await pool.query(sql, params)
  for (const o of orders) {
    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [o.id]
    )
    o.items = items
  }
  res.json({ success: true, data: orders })
})

export default router

import express from 'express'
import { pool } from '../db.js'
import { adminAuth } from '../middleware/auth.js'

const router = express.Router()
router.use(adminAuth)

router.get('/orders', async (req, res) => {
  const { status, keyword } = req.query
  let sql = 'SELECT * FROM orders WHERE 1=1'
  const params = []
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (keyword) { sql += ' AND (order_no LIKE ? OR user_phone LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
  sql += ' ORDER BY id DESC LIMIT 200'

  const [orders] = await pool.query(sql, params)
  for (const o of orders) {
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [o.id])
    o.items = items
  }
  res.json({ success: true, data: orders })
})

router.put('/orders/:id/quote', async (req, res) => {
  const { items, merchantRemark } = req.body
  const orderId = req.params.id

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    let total = 0
    for (const item of items) {
      const subtotal = Number((item.confirmedQuantity * item.confirmedPrice).toFixed(2))
      total += subtotal
      await conn.query(
        `UPDATE order_items
         SET confirmed_quantity = ?, confirmed_price = ?, confirmed_unit = ?, subtotal = ?
         WHERE id = ? AND order_id = ?`,
        [item.confirmedQuantity, item.confirmedPrice, item.confirmedUnit || null, subtotal, item.id, orderId]
      )
    }

    await conn.query(
      `UPDATE orders SET status = 'quoted', total_amount = ?, merchant_remark = ?, quoted_at = NOW()
       WHERE id = ?`,
      [total, merchantRemark || '', orderId]
    )

    await conn.query(
      `INSERT INTO order_logs (order_id, status, status_text, remark)
       VALUES (?, 'quoted', '商家已报价', ?)`,
      [orderId, `总金额 ¥${total}`]
    )

    await conn.commit()
    res.json({ success: true, total })
  } catch (e) {
    await conn.rollback()
    res.status(500).json({ success: false, msg: e.message })
  } finally {
    conn.release()
  }
})

router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body
  const field = status === 'completed' ? ', completed_at = NOW()' : ''
  await pool.query(`UPDATE orders SET status = ? ${field} WHERE id = ?`, [status, req.params.id])

  const textMap = {
    delivering: '商家已发货，配送中',
    completed: '订单已完成',
    cancelled: '订单已取消'
  }
  if (textMap[status]) {
    await pool.query(
      `INSERT INTO order_logs (order_id, status, status_text, remark)
       VALUES (?, ?, ?, '')`,
      [req.params.id, status, textMap[status]]
    )
  }
  res.json({ success: true })
})

router.put('/orders/:id/settle', async (req, res) => {
  const { settleStatus } = req.body
  await pool.query('UPDATE orders SET settle_status = ? WHERE id = ?', [settleStatus, req.params.id])
  res.json({ success: true })
})

router.get('/orders/:id/logs', async (req, res) => {
  const [logs] = await pool.query(
    'SELECT * FROM order_logs WHERE order_id = ? ORDER BY id ASC',
    [req.params.id]
  )
  res.json({ success: true, data: logs })
})

export default router

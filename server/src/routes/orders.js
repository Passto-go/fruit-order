import express from 'express'
import { pool } from '../db.js'
import { userAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/', userAuth, async (req, res) => {
  const { items, remark, phone, address, receiverName, purchaseMode } = req.body
  if (!items?.length) return res.status(400).json({ success: false, msg: '请选择水果' })

  const orderNo = 'ORD' + Date.now() + Math.floor(Math.random() * 1000)
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [r] = await conn.query(
      `INSERT INTO orders (order_no, user_id, status, user_phone, address, remark, receiver_name)
       VALUES (?, ?, 'pending', ?, ?, ?, ?)`,
      [orderNo, req.user.id, phone, address, remark || '', receiverName || '']
    )
    const orderId = r.insertId

    for (const item of items) {
      const [fs] = await conn.query('SELECT * FROM fruits WHERE id = ?', [item.fruitId])
      const fruit = fs[0]
      if (!fruit) continue

      const mode = item.purchaseMode || purchaseMode || 'retail'
      let unit, price

      if (mode === 'wholesale' && fruit.wholesale_price > 0) {
        unit = fruit.wholesale_unit || '箱'
        price = fruit.wholesale_price
      } else {
        unit = fruit.unit
        price = fruit.ref_price
      }

      await conn.query(
        `INSERT INTO order_items (order_id, fruit_id, fruit_name, unit, quantity, ref_price, purchase_mode)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, fruit.id, fruit.name, unit, item.quantity, price, mode]
      )
    }

    await conn.query(
      `INSERT INTO order_logs (order_id, status, status_text, remark)
       VALUES (?, 'pending', '用户已提交订单', ?)`,
      [orderId, '等待商家确认']
    )

    await conn.commit()
    res.json({ success: true, orderId, orderNo })
  } catch (e) {
    await conn.rollback()
    res.status(500).json({ success: false, msg: e.message })
  } finally {
    conn.release()
  }
})

router.get('/', userAuth, async (req, res) => {
  const [orders] = await pool.query(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC',
    [req.user.id]
  )
  for (const o of orders) {
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [o.id])
    o.items = items
  }
  res.json({ success: true, data: orders })
})

router.get('/:id', userAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  )
  if (!rows.length) return res.status(404).json({ success: false })
  const order = rows[0]
  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id])
  order.items = items
  res.json({ success: true, data: order })
})

router.post('/:id/confirm', userAuth, async (req, res) => {
  await pool.query(
    `UPDATE orders SET status = 'confirmed', confirmed_at = NOW()
     WHERE id = ? AND user_id = ? AND status = 'quoted'`,
    [req.params.id, req.user.id]
  )
  await pool.query(
    `INSERT INTO order_logs (order_id, status, status_text, remark)
     VALUES (?, 'confirmed', '用户已确认报价', '')`,
    [req.params.id]
  )
  res.json({ success: true })
})

// 获取订单轨迹（用户端）
router.get('/:id/logs', userAuth, async (req, res) => {
  const [logs] = await pool.query(
    'SELECT * FROM order_logs WHERE order_id = ? ORDER BY id ASC',
    [req.params.id]
  )
  res.json({ success: true, data: logs })
})

router.post('/:id/cancel', userAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  )
  if (!rows.length) return res.status(404).json({ success: false, msg: '订单不存在' })

  const order = rows[0]
  if (!['pending', 'quoted'].includes(order.status)) {
    return res.status(400).json({ success: false, msg: '订单当前状态无法取消' })
  }

  await pool.query(
    `UPDATE orders SET status = 'cancelled' WHERE id = ?`,
    [req.params.id]
  )
  await pool.query(
    `INSERT INTO order_logs (order_id, status, status_text, remark)
     VALUES (?, 'cancelled', '用户已取消订单', '')`,
    [req.params.id]
  )
  res.json({ success: true })
})

export default router

import express from 'express'
import { pool } from '../db.js'
import { adminAuth } from '../middleware/auth.js'

const router = express.Router()
router.use(adminAuth)

router.get('/overview', async (req, res) => {
  const [[today]] = await pool.query(`
    SELECT COUNT(*) AS cnt, IFNULL(SUM(total_amount),0) AS amount
    FROM orders WHERE DATE(created_at)=CURDATE() AND status!='cancelled'`)
  const [[yesterday]] = await pool.query(`
    SELECT COUNT(*) AS cnt, IFNULL(SUM(total_amount),0) AS amount
    FROM orders WHERE DATE(created_at)=DATE_SUB(CURDATE(),INTERVAL 1 DAY) AND status!='cancelled'`)
  const [[month]] = await pool.query(`
    SELECT COUNT(*) AS cnt, IFNULL(SUM(total_amount),0) AS amount
    FROM orders WHERE YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW()) AND status!='cancelled'`)
  const [[total]] = await pool.query(`
    SELECT COUNT(*) AS cnt, IFNULL(SUM(total_amount),0) AS amount
    FROM orders WHERE status!='cancelled'`)
  const [[unsettled]] = await pool.query(`
    SELECT IFNULL(SUM(total_amount),0) AS amount
    FROM orders WHERE settle_status!='settled' AND status!='cancelled'`)
  const [[pending]] = await pool.query(`
    SELECT COUNT(*) AS cnt FROM orders WHERE status IN ('pending','quoted')`)

  const rate = (cur, prev) => {
    if (!prev) return cur > 0 ? 100 : 0
    return Number((((cur - prev) / prev) * 100).toFixed(1))
  }

  res.json({ success: true, data: {
    today: { ...today, growth: rate(today.amount, yesterday.amount) },
    month, total,
    unsettled: unsettled.amount,
    pendingCount: pending.cnt
  }})
})

router.get('/trend', async (req, res) => {
  const days = Number(req.query.days || 30)
  const [rows] = await pool.query(`
    SELECT DATE(created_at) AS date, COUNT(*) AS cnt, IFNULL(SUM(total_amount),0) AS amount
    FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND status!='cancelled'
    GROUP BY DATE(created_at) ORDER BY date ASC`, [days])

  const map = {}
  rows.forEach(r => {
    const key = new Date(r.date).toISOString().slice(0, 10)
    map[key] = r
  })

  const list = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const row = map[key]
    list.push({
      date: key,
      cnt: row ? Number(row.cnt) : 0,
      amount: row ? Number(row.amount) : 0
    })
  }
  res.json({ success: true, data: list })
})

router.get('/fruit-rank', async (req, res) => {
  const days = Number(req.query.days || 30)
  const [rows] = await pool.query(`
    SELECT oi.fruit_name,
      IFNULL(SUM(oi.confirmed_quantity), SUM(oi.quantity)) AS qty,
      IFNULL(SUM(oi.subtotal),0) AS amount,
      COUNT(DISTINCT oi.order_id) AS order_count
    FROM order_items oi JOIN orders o ON o.id=oi.order_id
    WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND o.status!='cancelled'
    GROUP BY oi.fruit_name ORDER BY qty DESC LIMIT 15`, [days])
  res.json({ success: true, data: rows })
})

router.get('/customer-rank', async (req, res) => {
  const days = Number(req.query.days || 30)
  const [rows] = await pool.query(`
    SELECT u.id, u.nickname, u.phone, u.customer_level,
      COUNT(o.id) AS order_count,
      IFNULL(SUM(o.total_amount),0) AS total_amount,
      IFNULL(SUM(CASE WHEN o.settle_status!='settled' THEN o.total_amount ELSE 0 END),0) AS unsettled
    FROM users u JOIN orders o ON o.user_id=u.id
    WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND o.status!='cancelled'
    GROUP BY u.id ORDER BY total_amount DESC LIMIT 15`, [days])
  res.json({ success: true, data: rows })
})

router.get('/status-dist', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT status, COUNT(*) AS cnt FROM orders
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY status`)
  const map = {}
  rows.forEach(r => { map[r.status] = Number(r.cnt) })
  res.json({ success: true, data: [
    { name: '待确认', value: map.pending || 0 },
    { name: '已报价', value: map.quoted || 0 },
    { name: '已确认', value: map.confirmed || 0 },
    { name: '配送中', value: map.delivering || 0 },
    { name: '已完成', value: map.completed || 0 },
    { name: '已取消', value: map.cancelled || 0 }
  ]})
})

router.get('/settle-overview', async (req, res) => {
  const [[settled]] = await pool.query(`
    SELECT IFNULL(SUM(total_amount),0) AS amount, COUNT(*) AS cnt
    FROM orders WHERE settle_status='settled' AND status!='cancelled'`)
  const [[unsettled]] = await pool.query(`
    SELECT IFNULL(SUM(total_amount),0) AS amount, COUNT(*) AS cnt
    FROM orders WHERE settle_status!='settled' AND status!='cancelled'`)
  res.json({ success: true, data: {
    settled: { amount: Number(settled.amount), cnt: Number(settled.cnt) },
    unsettled: { amount: Number(unsettled.amount), cnt: Number(unsettled.cnt) }
  }})
})

export default router

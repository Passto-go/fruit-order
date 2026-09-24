import express from 'express'
import { pool } from '../db.js'
import { userAuth } from '../middleware/auth.js'

const router = express.Router()
router.use(userAuth)

// 我的收藏列表
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT f.id, f.fruit_id, fr.name, fr.ref_price, fr.unit, fr.wholesale_price,
            fr.wholesale_unit, fr.wholesale_spec, fr.category, fr.origin
     FROM favorites f
     JOIN fruits fr ON fr.id = f.fruit_id
     WHERE f.user_id = ?
     ORDER BY f.id DESC`,
    [req.user.id]
  )
  res.json({ success: true, data: rows })
})

// 检查某个水果是否已收藏
router.get('/check/:fruitId', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id FROM favorites WHERE user_id = ? AND fruit_id = ?',
    [req.user.id, req.params.fruitId]
  )
  res.json({ success: true, favorited: rows.length > 0 })
})

// 收藏
router.post('/:fruitId', async (req, res) => {
  await pool.query(
    'INSERT IGNORE INTO favorites (user_id, fruit_id) VALUES (?, ?)',
    [req.user.id, req.params.fruitId]
  )
  res.json({ success: true })
})

// 取消收藏
router.delete('/:fruitId', async (req, res) => {
  await pool.query(
    'DELETE FROM favorites WHERE user_id = ? AND fruit_id = ?',
    [req.user.id, req.params.fruitId]
  )
  res.json({ success: true })
})

export default router

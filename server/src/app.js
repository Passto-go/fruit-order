import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRouter from './routes/auth.js'
import fruitsRouter from './routes/fruits.js'
import ordersRouter from './routes/orders.js'
import adminRouter from './routes/admin.js'
import customersRouter from './routes/customers.js'
import dashboardRouter from './routes/dashboard.js'
import statementsRouter from './routes/statements.js'
import goodsRouter from './routes/goods.js'
import myAccountRouter from './routes/my-account.js'
import adminAccountRouter from './routes/admin-account.js'
import userProfileRouter from './routes/user-profile.js'
import favoritesRouter from './routes/favorites.js'

dotenv.config()
const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/fruits', fruitsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/admin', adminRouter)
app.use('/api/admin/customers', customersRouter)
app.use('/api/admin/dashboard', dashboardRouter)
app.use('/api/admin/statements', statementsRouter)
app.use('/api/admin/goods', goodsRouter)
app.use('/api/my-account', myAccountRouter)
app.use('/api/admin/account', adminAccountRouter)
app.use('/api/user-profile', userProfileRouter)
app.use('/api/favorites', favoritesRouter)

app.get('/', (req, res) => res.json({ ok: true, msg: 'fruit-order server running' }))

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server: http://localhost:${process.env.PORT || 3000}`)
})

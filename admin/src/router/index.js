import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../views/Login.vue'
import OrderList from '../views/OrderList.vue'
import Dashboard from '../views/Dashboard.vue'
import CustomerList from '../views/CustomerList.vue'
import Statement from '../views/Statement.vue'
import GoodsList from '../views/GoodsList.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', component: Login },
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: Dashboard },
    { path: '/orders', component: OrderList },
    { path: '/customers', component: CustomerList },
    { path: '/statements', component: Statement },
    { path: '/goods', component: GoodsList }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.path !== '/login' && !token) return next('/login')
  next()
})

export default router

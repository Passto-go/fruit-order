<template>
  <div class="login-wrap">
    <el-card class="login-card">
      <h2 style="text-align:center">商家后台登录</h2>
      <el-form @submit.prevent>
        <el-form-item>
          <el-input v-model="username" placeholder="账号" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="password" type="password" placeholder="密码" show-password />
        </el-form-item>
        <el-button type="primary" style="width:100%" @click="login">登录</el-button>
      </el-form>
      <p style="color:#999;font-size:12px;text-align:center;margin-top:10px">
        默认账号：admin / ******
      </p>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { ElMessage } from 'element-plus'

const username = ref('admin')
const password = ref('123456')
const router = useRouter()

async function login() {
  const res = await api.post('/auth/admin-login', {
    username: username.value,
    password: password.value
  })
  if (res.success) {
    localStorage.setItem('admin_token', res.token)
    ElMessage.success('登录成功')
    router.push('/orders')
  } else {
    ElMessage.error(res.msg || '登录失败')
  }
}
</script>

<style scoped>
.login-wrap { display:flex; height:100vh; align-items:center; justify-content:center; background:#f0f2f5; }
.login-card { width:360px; }
</style>

<template>
  <div v-if="$route.path === '/login'">
    <router-view />
  </div>
  <el-container v-else style="height:100vh">
    <el-aside width="200px" style="background:#001529">
      <div style="color:#fff;padding:20px;font-size:16px;font-weight:bold">水果批发后台</div>
      <el-menu :default-active="$route.path" router background-color="#001529"
               text-color="#ccc" active-text-color="#fff">
        <el-menu-item index="/dashboard">数据看板</el-menu-item>
        <el-menu-item index="/orders">订单管理</el-menu-item>
        <el-menu-item index="/customers">客户管理</el-menu-item>
        <el-menu-item index="/statements">对账导出</el-menu-item>
        <el-menu-item index="/goods">商品管理</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background:#fff;display:flex;align-items:center;justify-content:flex-end;gap:10px">
        <el-button link @click="pwdVisible = true">修改密码</el-button>
        <el-button link @click="logout">退出登录</el-button>
      </el-header>

      <el-dialog v-model="pwdVisible" title="修改密码" width="400px">
        <el-form label-width="80px">
          <el-form-item label="原密码">
            <el-input v-model="pwdForm.oldPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="新密码">
            <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="至少 6 位" />
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="pwdVisible = false">取消</el-button>
          <el-button type="primary" @click="changePassword">保存</el-button>
        </template>
      </el-dialog>
      <el-main><router-view /></el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from './api'

const router = useRouter()
const pwdVisible = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

function logout() {
  localStorage.removeItem('admin_token')
  router.push('/login')
}

async function changePassword() {
  if (!pwdForm.value.oldPassword) return ElMessage.warning('请输入原密码')
  if (!pwdForm.value.newPassword) return ElMessage.warning('请输入新密码')
  if (pwdForm.value.newPassword.length < 6) return ElMessage.warning('新密码至少 6 位')
  if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
    return ElMessage.warning('两次输入的新密码不一致')
  }

  const res = await api.post('/admin/account/change-password', {
    oldPassword: pwdForm.value.oldPassword,
    newPassword: pwdForm.value.newPassword
  })
  if (res.success) {
    ElMessage.success('密码已修改，请重新登录')
    pwdVisible.value = false
    pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    setTimeout(() => {
      localStorage.removeItem('admin_token')
      router.push('/login')
    }, 800)
  } else {
    ElMessage.error(res.msg || '修改失败')
  }
}
</script>

<template>
  <div>
    <el-card>
      <el-form inline>
        <el-form-item label="客户">
          <el-select v-model="userId" filterable placeholder="选择客户" style="width:260px">
            <el-option v-for="c in customers" :key="c.id"
              :label="`${c.nickname || '微信用户'} (${c.phone || '无电话'})`"
              :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="startDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="endDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="exportExcel" :disabled="!userId">导出对账单</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const customers = ref([])
const userId = ref(null)
const startDate = ref('')
const endDate = ref('')

onMounted(async () => {
  const res = await api.get('/admin/customers')
  if (res.success) customers.value = res.data
})

function exportExcel() {
  const token = localStorage.getItem('admin_token')
  const params = new URLSearchParams({
    userId: userId.value,
    startDate: startDate.value || '',
    endDate: endDate.value || ''
  })
  fetch(`/api/admin/statements/export?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `对账单_${Date.now()}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    })
}
</script>

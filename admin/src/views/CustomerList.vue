<template>
  <div>
    <el-card>
      <div style="display:flex;gap:10px;margin-bottom:15px">
        <el-input v-model="keyword" placeholder="昵称/手机号" style="width:220px" @keyup.enter="load" />
        <el-button type="primary" @click="load">查询</el-button>
      </div>

      <el-table :data="customers" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="customer_level" label="等级" width="90">
          <template #default="{ row }">
            <el-tag :type="row.customer_level === 'vip' ? 'danger' : 'info'" size="small">
              {{ row.customer_level === 'vip' ? 'VIP' : '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_count" label="订单数" width="90" />
        <el-table-column prop="total_amount" label="累计成交" width="120">
          <template #default="{ row }">¥{{ row.total_amount }}</template>
        </el-table-column>
        <el-table-column prop="unsettled_amount" label="未结算" width="120">
          <template #default="{ row }">
            <span :style="{ color: row.unsettled_amount > 0 ? '#e64340' : '#999' }">
              ¥{{ row.unsettled_amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="credit_limit" label="赊账额度" width="110">
          <template #default="{ row }">¥{{ row.credit_limit }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="visible" title="编辑客户" width="500px">
      <el-form label-width="90px">
        <el-form-item label="昵称"><el-input v-model="form.nickname" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="等级">
          <el-select v-model="form.customer_level">
            <el-option label="普通" value="normal" />
            <el-option label="VIP" value="vip" />
          </el-select>
        </el-form-item>
        <el-form-item label="赊账额度">
          <el-input-number v-model="form.credit_limit" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
import { ElMessage } from 'element-plus'

const customers = ref([])
const keyword = ref('')
const visible = ref(false)
const form = ref({})

async function load() {
  const res = await api.get('/admin/customers', { params: { keyword: keyword.value } })
  if (res.success) customers.value = res.data
}
function openEdit(row) { form.value = { ...row }; visible.value = true }
async function save() {
  await api.put(`/admin/customers/${form.value.id}`, form.value)
  ElMessage.success('已保存')
  visible.value = false
  load()
}
onMounted(load)
</script>

<template>
  <div>
    <el-card>
      <div style="display:flex;gap:10px;margin-bottom:15px">
        <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width:160px" @change="load">
          <el-option label="待确认" value="pending" />
          <el-option label="已报价" value="quoted" />
          <el-option label="已确认" value="confirmed" />
          <el-option label="配送中" value="delivering" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-input v-model="keyword" placeholder="订单号/手机号" style="width:220px" @keyup.enter="load" />
        <el-button type="primary" @click="load">查询</el-button>
        <el-button @click="load">刷新</el-button>
      </div>

      <el-table :data="orders" border>
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="user_phone" label="电话" width="130" />
        <el-table-column prop="address" label="地址" show-overflow-tooltip />
        <el-table-column label="水果明细" width="260">
          <template #default="{ row }">
            <div v-for="it in row.items" :key="it.id" style="font-size:13px">
              {{ it.fruit_name }} ×
              <span v-if="it.confirmed_quantity">{{ it.confirmed_quantity }}{{ it.unit }}</span>
              <span v-else style="color:#999">意向 {{ it.quantity }}{{ it.unit }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="{ row }">
            <span v-if="row.total_amount > 0">¥{{ row.total_amount }}</span>
            <span v-else style="color:#999">待报价</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结算" width="100">
          <template #default="{ row }">
            <el-tag :type="row.settle_status === 'settled' ? 'success' : 'warning'" size="small">
              {{ row.settle_status === 'settled' ? '已结清' : '未结算' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'pending'" size="small" type="primary"
                       @click="openQuote(row)">报价</el-button>
        <el-button v-if="row.status === 'quoted' || row.status === 'confirmed'" size="small" type="warning"
           @click="changeStatus(row, 'delivering')">开始配送</el-button>
            <el-button v-if="row.status === 'delivering'" size="small" type="success"
                       @click="changeStatus(row, 'completed')">完成</el-button>
            <el-button v-if="row.status !== 'completed' && row.status !== 'cancelled'"
                       size="small" @click="changeStatus(row, 'cancelled')">取消</el-button>
            <el-button size="small" @click="toggleSettle(row)">
              {{ row.settle_status === 'settled' ? '标记未结' : '标记结清' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="quoteVisible" title="录入批发报价" width="960px">
      <el-table :data="editingItems" border>
        <el-table-column prop="fruit_name" label="水果" width="120" />
        <el-table-column label="购买方式" width="100">
          <template #default="{ row }">
            <el-tag :type="row.purchase_mode === 'wholesale' ? 'warning' : 'info'" size="small">
              {{ row.purchase_mode === 'wholesale' ? '批发' : '零售' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用户意向" width="110">
          <template #default="{ row }">{{ row.quantity }}{{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="实际数量" width="160">
          <template #default="{ row }">
            <el-input-number v-model="row.confirmed_quantity" :min="0" :precision="1" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="确认单位" width="140">
          <template #default="{ row }">
            <el-select v-model="row.confirmed_unit" size="small" allow-create filterable
                       :placeholder="row.unit || '单位'">
              <el-option label="斤" value="斤" />
              <el-option label="kg" value="kg" />
              <el-option label="箱" value="箱" />
              <el-option label="件" value="件" />
              <el-option label="个" value="个" />
              <el-option label="盒" value="盒" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="确认单价(元)">
          <template #default="{ row }">
            <el-input-number v-model="row.confirmed_price" :min="0" :precision="2" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="小计" width="100">
          <template #default="{ row }">
            ¥{{ ((row.confirmed_quantity || 0) * (row.confirmed_price || 0)).toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>

      <el-input v-model="merchantRemark" type="textarea" :rows="2"
                placeholder="给用户的备注，如到货时间、品质说明" style="margin-top:12px" />

      <div style="text-align:right;margin-top:12px;font-size:16px;font-weight:bold">
        总金额：¥{{ quoteTotal }}
      </div>

      <template #footer>
        <el-button @click="quoteVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuote">提交报价并通知用户</el-button>
      </template>
    </el-dialog>

    <!-- 订单轨迹抽屉 -->
    <el-drawer v-model="detailVisible" title="订单进度" size="420px">
      <div v-if="currentOrder">
        <div style="padding:16px;background:#f5f7fa;border-radius:8px;margin-bottom:16px">
          <div style="font-size:13px;color:#666">订单号</div>
          <div style="font-size:15px;font-weight:600">{{ currentOrder.order_no }}</div>
          <div style="margin-top:8px">
            <el-tag :type="statusType(currentOrder.status)">
              {{ statusText(currentOrder.status) }}
            </el-tag>
          </div>
        </div>

        <el-steps direction="vertical" :active="logs.length" finish-status="success" style="padding-left:10px">
          <el-step
            v-for="log in logs"
            :key="log.id"
            :title="log.status_text"
            :description="formatTime(log.created_at) + (log.remark ? ' · ' + log.remark : '')"
          />
        </el-steps>

        <el-empty v-if="logs.length === 0" description="暂无进度记录" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

const orders = ref([])
const filterStatus = ref('')
const keyword = ref('')

const quoteVisible = ref(false)
const detailVisible = ref(false)
const currentOrder = ref(null)
const logs = ref([])
const editingItems = ref([])
const editingOrderId = ref(null)
const merchantRemark = ref('')

const quoteTotal = computed(() =>
  editingItems.value.reduce((s, i) =>
    s + (i.confirmed_quantity || 0) * (i.confirmed_price || 0), 0).toFixed(2)
)

const statusMap = {
  pending: ['待确认', 'info'],
  quoted: ['已报价', 'warning'],
  confirmed: ['已确认', 'primary'],
  delivering: ['配送中', 'primary'],
  completed: ['已完成', 'success'],
  cancelled: ['已取消', 'danger']
}
const statusText = s => statusMap[s]?.[0] || s
const statusType = s => statusMap[s]?.[1] || ''

async function load() {
  const res = await api.get('/admin/orders', {
    params: { status: filterStatus.value, keyword: keyword.value }
  })
  if (res.success) orders.value = res.data
}

function openQuote(row) {
  editingOrderId.value = row.id
  editingItems.value = row.items.map(i => ({
    ...i,
    confirmed_quantity: i.confirmed_quantity ?? i.quantity,
    confirmed_price: i.confirmed_price ?? i.ref_price,
    confirmed_unit: i.confirmed_unit || i.unit
  }))
  merchantRemark.value = row.merchant_remark || ''
  quoteVisible.value = true
}

async function submitQuote() {
  const res = await api.put(`/admin/orders/${editingOrderId.value}/quote`, {
    items: editingItems.value.map(i => ({
      id: i.id,
      confirmedQuantity: i.confirmed_quantity,
      confirmedPrice: i.confirmed_price,
      confirmedUnit: i.confirmed_unit || i.unit
    })),
    merchantRemark: merchantRemark.value
  })
  if (res.success) {
    ElMessage.success('报价已提交，等待用户确认')
    quoteVisible.value = false
    load()
  }
}

async function changeStatus(row, status) {
  if (status === 'cancelled') {
    try {
      await ElMessageBox.confirm('确定取消该订单？', '提示', { type: 'warning' })
    } catch { return }
  }
  await api.put(`/admin/orders/${row.id}/status`, { status })
  ElMessage.success('操作成功')
  load()
}

async function toggleSettle(row) {
  const newStatus = row.settle_status === 'settled' ? 'unsettled' : 'settled'
  await api.put(`/admin/orders/${row.id}/settle`, { settleStatus: newStatus })
  ElMessage.success('已更新')
  load()
}

async function openDetail(row) {
  currentOrder.value = row
  detailVisible.value = true
  logs.value = []
  const res = await api.get(`/admin/orders/${row.id}/logs`)
  if (res.success) logs.value = res.data
}

function formatTime(s) {
  if (!s) return ''
  const d = new Date(s)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(load)
</script>


<style scoped>
/* 让报价弹窗里的数字输入框铺满列宽 */
.el-dialog .el-input-number {
  width: 100%;
}
.el-dialog .el-input-number .el-input__wrapper {
  padding-left: 6px;
  padding-right: 6px;
}
.el-dialog .el-input-number .el-input__inner {
  text-align: center;
  font-size: 14px;
}
/* 让下拉框也铺满 */
.el-dialog .el-select {
  width: 100%;
}
</style>

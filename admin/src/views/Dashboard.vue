<template>
  <div>
    <div style="margin-bottom:16px">
      <el-radio-group v-model="days" @change="loadAll">
        <el-radio-button :value="7">近 7 天</el-radio-button>
        <el-radio-button :value="30">近 30 天</el-radio-button>
        <el-radio-button :value="90">近 90 天</el-radio-button>
      </el-radio-group>
    </div>

    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="6">
        <div class="stat-card green">
          <div class="label">今日订单</div>
          <div class="value">{{ overview.today?.cnt || 0 }} <span class="unit">单</span></div>
          <div class="sub">金额 ¥{{ overview.today?.amount || 0 }}
            <span v-if="overview.today?.growth">（{{ overview.today.growth > 0 ? '↑' : '↓' }}{{ Math.abs(overview.today.growth) }}%）</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card blue">
          <div class="label">本月订单</div>
          <div class="value">{{ overview.month?.cnt || 0 }} <span class="unit">单</span></div>
          <div class="sub">金额 ¥{{ overview.month?.amount || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card orange">
          <div class="label">待处理</div>
          <div class="value">{{ overview.pendingCount || 0 }} <span class="unit">单</span></div>
          <div class="sub">待确认 / 待用户确认</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card red">
          <div class="label">未结算金额</div>
          <div class="value">¥{{ overview.unsettled || 0 }}</div>
          <div class="sub">累计成交 ¥{{ overview.total?.amount || 0 }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="16">
        <el-card>
          <template #header>订单 & 金额趋势</template>
          <div ref="trendRef" style="height:320px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>订单状态分布</template>
          <div ref="statusRef" style="height:320px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="12">
        <el-card>
          <template #header>水果销量排行</template>
          <div ref="fruitRef" style="height:360px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>客户成交排行</template>
          <div ref="customerRef" style="height:360px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import api from '../api'

const days = ref(30)
const overview = ref({})

const trendRef = ref(null)
const statusRef = ref(null)
const fruitRef = ref(null)
const customerRef = ref(null)

let charts = {}

function init(el, key) {
  if (!el) return null
  if (!charts[key]) charts[key] = echarts.init(el)
  return charts[key]
}

async function loadOverview() {
  const res = await api.get('/admin/dashboard/overview')
  if (res.success) overview.value = res.data
}

async function loadTrend() {
  const res = await api.get('/admin/dashboard/trend', { params: { days: days.value } })
  if (!res.success) return
  const list = res.data
  init(trendRef.value, 'trend').setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单数', '金额'] },
    grid: { left: 50, right: 60, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: list.map(i => i.date.slice(5)) },
    yAxis: [{ type: 'value', name: '订单' }, { type: 'value', name: '金额' }],
    series: [
      { name: '订单数', type: 'bar', barWidth: '40%', data: list.map(i => i.cnt),
        itemStyle: { color: '#07c160', borderRadius: [4,4,0,0] } },
      { name: '金额', type: 'line', yAxisIndex: 1, smooth: true,
        data: list.map(i => i.amount), itemStyle: { color: '#f5a623' }, lineStyle: { width: 3 } }
    ]
  })
}

async function loadStatus() {
  const res = await api.get('/admin/dashboard/status-dist')
  if (!res.success) return
  init(statusRef.value, 'status').setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{ type: 'pie', radius: ['45%','70%'], center: ['50%','45%'],
      data: res.data, label: { formatter: '{b}\n{c}' },
      itemStyle: { borderColor: '#fff', borderWidth: 2 } }]
  })
}

async function loadFruit() {
  const res = await api.get('/admin/dashboard/fruit-rank', { params: { days: days.value } })
  if (!res.success) return
  const list = res.data.slice(0, 10).reverse()
  init(fruitRef.value, 'fruit').setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 100, right: 40, top: 20, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: list.map(i => i.fruit_name) },
    series: [{ type: 'bar', data: list.map(i => Number(i.qty)),
      itemStyle: { color: '#409eff', borderRadius: [0,4,4,0] },
      label: { show: true, position: 'right' } }]
  })
}

async function loadCustomer() {
  const res = await api.get('/admin/dashboard/customer-rank', { params: { days: days.value } })
  if (!res.success) return
  const list = res.data.slice(0, 10)
  init(customerRef.value, 'customer').setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 100, right: 50, top: 20, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: list.map(i => i.nickname || ('客户' + i.id)) },
    series: [{ type: 'bar', data: list.map(i => Number(i.total_amount)),
      itemStyle: { color: '#f5a623', borderRadius: [0,4,4,0] },
      label: { show: true, position: 'right', formatter: '¥{c}' } }]
  })
}

async function loadAll() {
  await Promise.all([loadOverview(), loadTrend(), loadStatus(), loadFruit(), loadCustomer()])
  await nextTick()
  Object.values(charts).forEach(c => c && c.resize())
}

function resizeAll() { Object.values(charts).forEach(c => c && c.resize()) }

onMounted(() => {
  loadAll()
  window.addEventListener('resize', resizeAll)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeAll)
  Object.values(charts).forEach(c => c && c.dispose())
})
</script>

<style scoped>
.stat-card { padding: 18px; border-radius: 12px; color: #fff; height: 108px; display: flex; flex-direction: column; justify-content: center; }
.stat-card.green { background: linear-gradient(135deg,#07c160,#06ad56); }
.stat-card.blue { background: linear-gradient(135deg,#409eff,#337ecc); }
.stat-card.orange { background: linear-gradient(135deg,#f5a623,#e08b13); }
.stat-card.red { background: linear-gradient(135deg,#f56c6c,#d94848); }
.stat-card .label { font-size: 13px; opacity: .9; }
.stat-card .value { font-size: 26px; font-weight: 700; margin: 6px 0; }
.stat-card .value .unit { font-size: 14px; font-weight: 400; }
.stat-card .sub { font-size: 12px; opacity: .9; }
</style>

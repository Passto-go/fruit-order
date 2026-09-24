<template>
  <div>
    <el-card>
      <div style="display:flex;justify-content:space-between;margin-bottom:15px">
        <el-input v-model="keyword" placeholder="水果名称" style="width:220px" @keyup.enter="load" />
        <el-button type="primary" @click="openCreate">新增商品</el-button>
      </div>

      <el-table :data="filteredList" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="水果名称" width="140" />
        <el-table-column label="零售价" width="110">
          <template #default="{ row }">
            ¥{{ row.ref_price }}/{{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column label="批发价" width="150">
          <template #default="{ row }">
            <span v-if="row.wholesale_price > 0">
              ¥{{ row.wholesale_price }}/{{ row.wholesale_unit || '箱' }}
              <div style="font-size:12px;color:#999">{{ row.wholesale_spec }}</div>
            </span>
            <span v-else style="color:#ccc">未设</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="90" />
        <el-table-column prop="origin" label="产地" width="110" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '在售' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="visible"
      :title="form.id ? '编辑商品' : '新增商品'"
      width="720px"
    >
      <el-form label-width="110px">
        <el-divider content-position="left">基础信息</el-divider>

        <el-form-item label="水果名称">
          <el-input v-model="form.name" placeholder="如：红富士苹果" />
        </el-form-item>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="分类">
              <el-input v-model="form.category" placeholder="如：苹果" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产地">
              <el-input v-model="form.origin" placeholder="如：山东烟台" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">零售价（按斤/个/件零售）</el-divider>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="零售单位">
              <el-select v-model="form.unit" allow-create filterable placeholder="选或输入">
                <el-option label="斤" value="斤" />
                <el-option label="kg" value="kg" />
                <el-option label="个" value="个" />
                <el-option label="盒" value="盒" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="零售价">
              <el-input-number v-model="form.ref_price" :min="0" :precision="2" />
              <span style="margin-left:8px;color:#999">元 / {{ form.unit || '单位' }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">批发价（按箱批发）</el-divider>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="批发单位">
              <el-select v-model="form.wholesale_unit" allow-create filterable placeholder="箱/件">
                <el-option label="箱" value="箱" />
                <el-option label="件" value="件" />
                <el-option label="筐" value="筐" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="批发价">
              <el-input-number v-model="form.wholesale_price" :min="0" :precision="2" />
              <span style="margin-left:8px;color:#999">元 / {{ form.wholesale_unit || '箱' }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="批发规格">
          <el-input v-model="form.wholesale_spec" placeholder="如：10斤/箱、20斤/筐" />
          <div style="color:#999;font-size:12px;margin-top:4px">
            告诉客户"一箱是多少"，比如"10斤/箱"
          </div>
        </el-form-item>

        <el-divider content-position="left">商品详情</el-divider>

        <el-form-item label="商品描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="商品介绍、口感、储存方式、规格说明等"
          />
        </el-form-item>

        <el-form-item label="图片URL">
          <el-input v-model="form.image" placeholder="暂可留空" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api'
import { ElMessage } from 'element-plus'

const list = ref([])
const keyword = ref('')
const visible = ref(false)
const form = ref({})

const filteredList = computed(() => {
  if (!keyword.value) return list.value
  return list.value.filter(f => f.name.includes(keyword.value))
})

async function load() {
  const res = await api.get('/admin/goods')
  if (res.success) list.value = res.data
}

function openCreate() {
  form.value = {
    name: '',
    category: '',
    origin: '',
    unit: '斤',
    ref_price: 0,
    wholesale_unit: '箱',
    wholesale_price: 0,
    wholesale_spec: '',
    description: '',
    image: ''
  }
  visible.value = true
}

function openEdit(row) {
  form.value = { ...row }
  visible.value = true
}

async function save() {
  if (!form.value.name) return ElMessage.warning('请填写水果名称')
  if (form.value.id) {
    await api.put(`/admin/goods/${form.value.id}`, form.value)
  } else {
    await api.post('/admin/goods', form.value)
  }
  ElMessage.success('已保存')
  visible.value = false
  load()
}

async function toggleStatus(row) {
  const newStatus = row.status === 1 ? 0 : 1
  await api.put(`/admin/goods/${row.id}`, { ...row, status: newStatus })
  ElMessage.success(newStatus === 1 ? '已上架' : '已下架')
  load()
}

onMounted(load)
</script>

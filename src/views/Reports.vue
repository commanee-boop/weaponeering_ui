<template>
  <div class="reports-page">
    <Header />
    
    <div class="reports-container">
      <div class="container mt-5">
        <h2 class="mb-4">
          <i class="bi bi-file-text"></i> รายงาน บันทึกข้อมูล
        </h2>

        <div class="row">
          <div class="col-md-8">
            <div class="card">
              <div class="card-header bg-primary text-white">
                <h5 class="card-title mb-0">
                  <i class="bi bi-list-ul"></i> รายการบันทึกข้อมูล
                </h5>
              </div>
              <div class="card-body">
                <div v-if="reports.length === 0" class="alert alert-info">
                  ไม่มีข้อมูลบันทึกในขณะนี้
                </div>
                <div v-else class="table-responsive">
                  <table class="table table-hover">
                    <thead class="table-light">
                      <tr>
                        <th>ลำดับ</th>
                        <th>วันที่</th>
                        <th>เป้าหมาย</th>
                        <th>ประเภท</th>
                        <th>สถานะ</th>
                        <th>การกระทำ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(report, idx) in reports" :key="report.id">
                        <td class="fw-bold">{{ idx + 1 }}</td>
                        <td>{{ report.date }}</td>
                        <td>{{ report.target }}</td>
                        <td>{{ report.type }}</td>
                        <td>
                          <span class="badge" :class="report.status === 'สมบูรณ์' ? 'bg-success' : 'bg-warning'">
                            {{ report.status }}
                          </span>
                        </td>
                        <td>
                          <button class="btn btn-sm btn-outline-primary" @click="viewReport(report.id)">
                            <i class="bi bi-eye"></i> ดู
                          </button>
                          <button class="btn btn-sm btn-outline-danger" @click="deleteReport(report.id)">
                            <i class="bi bi-trash"></i> ลบ
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-4">
            <div class="card">
              <div class="card-header bg-success text-white">
                <h5 class="card-title mb-0">
                  <i class="bi bi-download"></i> ส่งออกข้อมูล
                </h5>
              </div>
              <div class="card-body">
                <div class="btn-group-vertical w-100" role="group">
                  <button type="button" class="btn btn-outline-primary" @click="exportReports('pdf')">
                    <i class="bi bi-file-pdf"></i> ส่งออก PDF
                  </button>
                  <button type="button" class="btn btn-outline-info" @click="exportReports('word')">
                    <i class="bi bi-file-word"></i> ส่งออก Word
                  </button>
                  <button type="button" class="btn btn-outline-success" @click="exportReports('excel')">
                    <i class="bi bi-file-earmark-spreadsheet"></i> ส่งออก Excel
                  </button>
                </div>
              </div>
            </div>

            <div class="card mt-3">
              <div class="card-header bg-info text-white">
                <h5 class="card-title mb-0">
                  <i class="bi bi-graph-up"></i> สถิติ
                </h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <small class="text-muted">จำนวนบันทึกทั้งหมด</small>
                  <div class="fs-4 fw-bold text-primary">{{ reports.length }}</div>
                </div>
                <div class="mb-3">
                  <small class="text-muted">สมบูรณ์</small>
                  <div class="fs-4 fw-bold text-success">{{ completedReports }}</div>
                </div>
                <div>
                  <small class="text-muted">กำลังดำเนินการ</small>
                  <div class="fs-4 fw-bold text-warning">{{ pendingReports }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import Header from '../components/Header.vue'

export default {
  name: 'ReportsView',
  components: {
    Header
  },
  setup() {
    const reports = ref([
      { id: 1, date: '2567-07-02 10:30', target: 'เป้าหมาย A', type: 'อาคาร', status: 'สมบูรณ์' },
      { id: 2, date: '2567-07-01 14:15', target: 'เป้าหมาย B', type: 'สะพาน', status: 'สมบูรณ์' },
      { id: 3, date: '2567-06-30 09:45', target: 'เป้าหมาย C', type: 'บังเกอร์', status: 'กำลังดำเนินการ' }
    ])

    const completedReports = computed(() => 
      reports.value.filter(r => r.status === 'สมบูรณ์').length
    )

    const pendingReports = computed(() => 
      reports.value.filter(r => r.status === 'กำลังดำเนินการ').length
    )

    const viewReport = (id) => {
      const report = reports.value.find(r => r.id === id)
      alert(`ดูรายงาน: ${report.target}`)
    }

    const deleteReport = (id) => {
      if (confirm('คุณแน่ใจว่าต้องการลบรายงานนี้?')) {
        reports.value = reports.value.filter(r => r.id !== id)
      }
    }

    const exportReports = (format) => {
      const filename = `reports_${new Date().toISOString().split('T')[0]}`
      let ext = ''
      
      switch(format) {
        case 'pdf':
          ext = '.pdf'
          break
        case 'word':
          ext = '.docx'
          break
        case 'excel':
          ext = '.xlsx'
          break
      }
      
      alert(`ส่งออกไฟล์: ${filename}${ext}`)
    }

    const refreshData = () => {
      alert('ข้อมูลได้รับการรีเฟรช')
    }

    return {
      reports,
      completedReports,
      pendingReports,
      viewReport,
      deleteReport,
      exportReports,
      refreshData
    }
  }
}
</script>

<style scoped>
.reports-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #000000;
}

.reports-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
}

.card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  border: 2px solid #444444;
  border-radius: 8px;
  background: #111111;
}

.card-header {
  border-color: #444444;
}

.card-body {
  color: #ffffff;
}

.card-title {
  color: #ffffff;
}

.btn-group-vertical .btn {
  border-radius: 4px;
  margin-bottom: 8px;
  border: 2px solid #444444;
}

.btn-group-vertical .btn:last-child {
  margin-bottom: 0;
}

table {
  font-size: 0.95rem;
  border: 2px solid #444444;
}

table thead {
  background: #1a1a1a;
  border-bottom: 2px solid #444444;
}

table tbody tr {
  border-bottom: 1px solid #333333;
  color: #ffffff;
}

table tbody tr:hover {
  background: #1a1a1a;
}

.badge {
  font-size: 0.85rem;
}

.alert {
  background: #111111;
  border: 2px solid #444444;
  color: #ffffff;
}

.text-muted {
  color: #aaaaaa;
}

h2 {
  color: #ffffff;
}

.fs-4 {
  color: #ffffff;
}
</style>

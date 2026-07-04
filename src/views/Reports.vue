<template>
  <div class="reports-page">
    <Header />
    
    <div class="reports-container">
      <div class="container-fluid report-shell">
        <div class="report-heading">
          <div>
            <span class="report-kicker">REPORTING CENTER</span>
            <h2><i class="bi bi-database-check"></i> Report Data Log</h2>
            <p>รายการเป้าหมายและประวัติการวิเคราะห์ข้อมูล</p>
          </div>
          <span class="report-live"><i></i> DATA ONLINE</span>
        </div>

        <section class="summary-bar" aria-label="สรุปข้อมูลเป้าหมาย">
          <article class="summary-item total">
            <span class="summary-icon"><i class="bi bi-bullseye"></i></span>
            <div><small>All Targets</small><strong>{{ reports.length }}</strong></div>
          </article>
          <article class="summary-item list">
            <span class="summary-icon"><i class="bi bi-list-check"></i></span>
            <div><small>List</small><strong>{{ filteredReports.length }}</strong></div>
          </article>
          <article class="summary-item key-target">
            <span class="summary-icon"><i class="bi bi-exclamation-diamond"></i></span>
            <div><small>Key Targets</small><strong>{{ importanceCounts.key }}</strong></div>
          </article>
          <article class="summary-item medium-target">
            <span class="summary-icon"><i class="bi bi-dash-circle"></i></span>
            <div><small>Medium Targets</small><strong>{{ importanceCounts.medium }}</strong></div>
          </article>
          <article class="summary-item general-target">
            <span class="summary-icon"><i class="bi bi-check-circle"></i></span>
            <div><small>General Targets</small><strong>{{ importanceCounts.general }}</strong></div>
          </article>
          <article class="summary-item updated">
            <span class="summary-icon"><i class="bi bi-clock-history"></i></span>
            <div><small>Last Updated</small><strong class="updated-date">{{ lastUpdated }}</strong></div>
          </article>
        </section>

        <section class="filter-bar" aria-label="ค้นหาและกรองเป้าหมาย">
          <div class="filter-field">
            <label for="source-filter"><i class="bi bi-broadcast-pin"></i> Target Source</label>
            <select id="source-filter" v-model="filters.source">
              <option value="">All</option>
              <option v-for="source in sourceOptions" :key="source" :value="source">{{ source }}</option>
            </select>
          </div>
          <div class="filter-field">
            <label for="type-filter"><i class="bi bi-buildings"></i> Target Type</label>
            <select id="type-filter" v-model="filters.type">
              <option value="">All</option>
              <option v-for="type in typeOptions" :key="type" :value="type">{{ type }}</option>
            </select>
          </div>
          <div class="filter-field">
            <label for="importance-filter"><i class="bi bi-flag"></i> Target Importance</label>
            <select id="importance-filter" v-model="filters.importance">
              <option value="">All</option>
              <option value="key">Key Target</option>
              <option value="medium">Medium Target</option>
              <option value="general">General Target</option>
            </select>
          </div>
          <div class="filter-field date-filter">
            <label><i class="bi bi-calendar-range"></i> Time Range</label>
            <div class="date-range">
              <input v-model="filters.startDate" type="date" aria-label="วันที่เริ่มต้น" />
              <span>–</span>
              <input v-model="filters.endDate" type="date" aria-label="วันที่สิ้นสุด" />
            </div>
          </div>
          <div class="filter-field search-filter">
            <label for="text-search"><i class="bi bi-search"></i> Text Search</label>
            <div class="search-input-wrap">
              <i class="bi bi-search"></i>
              <input id="text-search" v-model.trim="filters.query" type="search" placeholder="ค้นหาชื่อเป้าหมาย..." />
            </div>
          </div>
          <button type="button" class="clear-filter-button" :disabled="!hasActiveFilters" @click="clearFilters">
            <i class="bi bi-arrow-counterclockwise"></i><span>Clear Filters</span>
          </button>
        </section>

        <div class="row">
          <div class="col-md-8">
            <div class="card">
              <div class="card-header bg-primary text-white">
                <h5 class="card-title mb-0">
                  <i class="bi bi-list-ul"></i> รายการบันทึกข้อมูล
                </h5>
              </div>
              <div class="card-body">
                <div v-if="filteredReports.length === 0" class="alert alert-info">
                  ไม่พบข้อมูลที่ตรงกับตัวกรอง
                </div>
                <div v-else class="table-responsive">
                  <table class="table table-hover">
                    <thead class="table-light">
                      <tr>
                        <th>ลำดับ</th>
                        <th>วันที่</th>
                        <th>เป้าหมาย</th>
                        <th>แหล่งที่มา</th>
                        <th>ประเภท</th>
                        <th>ความสำคัญ</th>
                        <th>สถานะ</th>
                        <th>การกระทำ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(report, idx) in filteredReports" :key="report.id">
                        <td class="fw-bold">{{ idx + 1 }}</td>
                        <td>{{ report.date }}</td>
                        <td>{{ report.target }}</td>
                        <td>{{ report.source }}</td>
                        <td>{{ report.type }}</td>
                        <td><span class="importance-badge" :class="report.importance">{{ importanceLabels[report.importance] }}</span></td>
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
      { id: 1, date: '04/07/2569 10:30', dateValue: '2026-07-04', target: 'อาคารบัญชาการ A-01', source: 'เป้าหมายร่วม', type: 'อาคาร', importance: 'key', status: 'สมบูรณ์' },
      { id: 2, date: '04/07/2569 09:15', dateValue: '2026-07-04', target: 'สะพานยุทธศาสตร์ B-12', source: 'เป้าหมาย ทอ.', type: 'สะพาน', importance: 'key', status: 'สมบูรณ์' },
      { id: 3, date: '03/07/2569 16:45', dateValue: '2026-07-03', target: 'บังเกอร์ C-07', source: 'เป้าหมาย กกล.สุรนารี', type: 'บังเกอร์', importance: 'medium', status: 'กำลังดำเนินการ' },
      { id: 4, date: '03/07/2569 13:20', dateValue: '2026-07-03', target: 'คูเลน D-03', source: 'เป้าหมายทางลึก', type: 'คูเลน', importance: 'general', status: 'สมบูรณ์' },
      { id: 5, date: '02/07/2569 11:05', dateValue: '2026-07-02', target: 'รันเวย์ E-09', source: 'เป้าหมายร่วม', type: 'รันเวย์', importance: 'medium', status: 'สมบูรณ์' },
      { id: 6, date: '01/07/2569 15:40', dateValue: '2026-07-01', target: 'คลังเชื้อเพลิง F-02', source: 'เป้าหมาย ทอ.', type: 'คลังเชื้อเพลิง', importance: 'key', status: 'กำลังดำเนินการ' },
      { id: 7, date: '30/06/2569 08:55', dateValue: '2026-06-30', target: 'เรดาร์ G-14', source: 'เป้าหมายทางลึก', type: 'เรดาร์', importance: 'medium', status: 'สมบูรณ์' },
      { id: 8, date: '29/06/2569 17:10', dateValue: '2026-06-29', target: 'โรงเก็บเครื่องบิน H-06', source: 'อื่นๆ', type: 'โรงเก็บเครื่องบิน', importance: 'general', status: 'สมบูรณ์' }
    ])

    const filters = ref({
      source: '',
      type: '',
      importance: '',
      startDate: '',
      endDate: '',
      query: ''
    })

    const importanceLabels = {
      key: 'Key',
      medium: 'Medium',
      general: 'General'
    }

    const sourceOptions = computed(() => [...new Set(reports.value.map(report => report.source))])
    const typeOptions = computed(() => [...new Set(reports.value.map(report => report.type))])

    const filteredReports = computed(() => {
      const query = filters.value.query.toLocaleLowerCase('th-TH')
      return reports.value.filter(report => {
        const matchesQuery = !query || [report.target, report.source, report.type, report.status]
          .some(value => value.toLocaleLowerCase('th-TH').includes(query))
        return (!filters.value.source || report.source === filters.value.source)
          && (!filters.value.type || report.type === filters.value.type)
          && (!filters.value.importance || report.importance === filters.value.importance)
          && (!filters.value.startDate || report.dateValue >= filters.value.startDate)
          && (!filters.value.endDate || report.dateValue <= filters.value.endDate)
          && matchesQuery
      })
    })

    const importanceCounts = computed(() => ({
      key: reports.value.filter(report => report.importance === 'key').length,
      medium: reports.value.filter(report => report.importance === 'medium').length,
      general: reports.value.filter(report => report.importance === 'general').length
    }))

    const lastUpdated = computed(() => reports.value[0]?.date.split(' ')[0] || '-')
    const hasActiveFilters = computed(() => Object.values(filters.value).some(Boolean))

    const clearFilters = () => {
      filters.value = { source: '', type: '', importance: '', startDate: '', endDate: '', query: '' }
    }

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
      filters,
      filteredReports,
      sourceOptions,
      typeOptions,
      importanceCounts,
      importanceLabels,
      lastUpdated,
      hasActiveFilters,
      completedReports,
      pendingReports,
      clearFilters,
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

.report-shell {
  max-width: 1800px;
  padding-right: 22px;
  padding-left: 22px;
}

.report-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.report-kicker {
  color: #5e9bea;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.report-heading h2 {
  margin: 2px 0 1px;
  color: #f4f8ff;
  font-size: 1.45rem;
  font-weight: 700;
}

.report-heading h2 i {
  margin-right: 7px;
  color: #6ea8fe;
}

.report-heading p {
  margin: 0;
  color: #8495a9;
  font-size: 0.76rem;
}

.report-live {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 9px;
  border: 1px solid rgba(54, 210, 139, 0.34);
  border-radius: 999px;
  background: rgba(54, 210, 139, 0.08);
  color: #72dca9;
  font-size: 0.62rem;
  font-weight: 700;
  white-space: nowrap;
}

.report-live i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #36d28b;
  box-shadow: 0 0 8px rgba(54, 210, 139, 0.8);
}

.summary-bar {
  display: grid;
  grid-template-columns: repeat(6, minmax(145px, 1fr));
  margin-bottom: 12px;
  overflow-x: auto;
  border: 1px solid #2d4056;
  border-radius: 12px;
  background: linear-gradient(90deg, #0c1726, #101e30);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.summary-item {
  display: flex;
  min-width: 145px;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-right: 1px solid #2a3b50;
}

.summary-item:last-child {
  border-right: 0;
}

.summary-icon {
  display: inline-flex;
  flex: 0 0 34px;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: rgba(13, 110, 253, 0.16);
  color: #68a5f4;
  font-size: 1rem;
}

.summary-item > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.summary-item small {
  color: #8495a9;
  font-size: 0.63rem;
  white-space: nowrap;
}

.summary-item strong {
  color: #edf5ff;
  font-size: 1.15rem;
  line-height: 1.2;
}

.summary-item.key-target .summary-icon { background: rgba(220, 53, 69, 0.16); color: #ff6b79; }
.summary-item.medium-target .summary-icon { background: rgba(255, 193, 7, 0.15); color: #ffd04c; }
.summary-item.general-target .summary-icon { background: rgba(25, 135, 84, 0.16); color: #54d395; }
.summary-item.updated .summary-icon { background: rgba(111, 66, 193, 0.17); color: #ae8bf2; }
.summary-item .updated-date { font-size: 0.84rem; white-space: nowrap; }

.filter-bar {
  display: grid;
  grid-template-columns: minmax(145px, 1fr) minmax(145px, 1fr) minmax(160px, 1fr) minmax(260px, 1.6fr) minmax(190px, 1.25fr) auto;
  align-items: end;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px;
  overflow-x: auto;
  border: 1px solid #293d54;
  border-radius: 12px;
  background: #0d1826;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.24);
}

.filter-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.filter-field label {
  overflow: hidden;
  margin: 0;
  color: #9aabc0;
  font-size: 0.68rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-field label i {
  margin-right: 4px;
  color: #6ea8fe;
}

.filter-field select,
.filter-field input {
  width: 100%;
  height: 38px;
  padding: 7px 10px;
  border: 1px solid #344a61;
  border-radius: 8px;
  outline: 0;
  background: #101f30;
  color: #e9f2fc;
  font-family: inherit;
  font-size: 0.76rem;
}

.filter-field select:focus,
.filter-field input:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
}

.date-range {
  display: grid;
  grid-template-columns: minmax(115px, 1fr) auto minmax(115px, 1fr);
  align-items: center;
  gap: 6px;
}

.date-range span {
  color: #6e8298;
}

.search-input-wrap {
  position: relative;
}

.search-input-wrap > i {
  position: absolute;
  top: 50%;
  left: 11px;
  color: #668099;
  transform: translateY(-50%);
}

.search-input-wrap input {
  padding-left: 32px;
}

.clear-filter-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 124px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #49627c;
  border-radius: 8px;
  background: #162639;
  color: #c8d6e5;
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: 600;
}

.clear-filter-button:hover:not(:disabled) {
  border-color: #dc3545;
  background: #dc3545;
  color: #ffffff;
}

.clear-filter-button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.importance-badge {
  display: inline-flex;
  min-width: 58px;
  justify-content: center;
  padding: 4px 7px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
}

.importance-badge.key { background: rgba(220, 53, 69, 0.17); color: #ff7380; }
.importance-badge.medium { background: rgba(255, 193, 7, 0.16); color: #ffd14f; }
.importance-badge.general { background: rgba(25, 135, 84, 0.18); color: #55d497; }

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

@media (max-width: 767.98px) {
  .reports-page { height: auto; min-height: 100dvh; }
  .reports-container { overflow: visible; padding: 10px 0 18px; }
  .report-shell { max-width: 100%; padding-right: 8px; padding-left: 8px; }
  .report-heading { align-items: center; margin-bottom: 10px; }
  .report-heading h2 { font-size: 1.12rem; }
  .report-heading p, .report-kicker { display: none; }
  .summary-bar { grid-template-columns: repeat(6, 150px); scroll-snap-type: x proximity; }
  .summary-item { scroll-snap-align: start; }
  .filter-bar { grid-template-columns: 160px 160px 175px 290px 220px 130px; scroll-snap-type: x proximity; }
  .filter-field, .clear-filter-button { scroll-snap-align: start; }
  h2 { margin-bottom: 12px !important; font-size: 1.15rem; }
  .row { --bs-gutter-y: 12px; }
  .card-body { padding: 10px; }
  table { min-width: 720px; font-size: 0.82rem; }
  table td:last-child { white-space: nowrap; }
}
</style>

<template>
  <div class="right-panel" :class="{ collapsed }">
    <div class="right-panel-header">
      <div class="right-panel-actions">
        <button
          type="button"
          class="right-panel-toggle"
          :title="collapsed ? 'เปิดแถบบาร์' : 'ปิดแถบบาร์'"
          :aria-label="collapsed ? 'เปิดแถบบาร์' : 'ปิดแถบบาร์'"
          @click="$emit('toggle-panel')"
        >
          <i class="bi" :class="collapsed ? 'bi-chevron-left' : 'bi-chevron-right'"></i>
        </button>
      </div>
      <div class="right-panel-brand">
        <span class="right-panel-brand-icon"><i class="bi bi-layout-sidebar-reverse"></i></span>
        <div v-show="!collapsed" class="right-panel-brand-copy">
          <strong>ผลการวิเคราะห์</strong>
          <small>Analysis Workspace</small>
        </div>
      </div>
    </div>

    <div v-show="!collapsed" class="right-panel-scroll">
      <!-- Tab Navigation -->
      <ul class="nav nav-tabs nav-fill mb-3" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="tab-recommend" data-bs-toggle="tab" data-bs-target="#content-recommend" type="button">
            <i class="bi bi-award"></i> Recommendation
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="tab-analysis" data-bs-toggle="tab" data-bs-target="#content-analysis" type="button">
            <i class="bi bi-graph-up"></i> Analysis
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="tab-chat" data-bs-toggle="tab" data-bs-target="#content-chat" type="button">
            <i class="bi bi-chat-dots"></i> Chat Bot
          </button>
        </li>
      </ul>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Top 5 Recommendations -->
        <div class="tab-pane fade show active" id="content-recommend" role="tabpanel">
          <div class="section-title recommendation-title mb-3">
            <span class="title-icon"><i class="bi bi-stars"></i></span>
            <span>Recommendation</span>
            <span class="top-five-badge">TOP 5</span>
          </div>
          <div class="table-responsive recommendation-card">
            <table class="table table-sm recommendation-table">
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>รายการ</th>
                  <th>ขนาด</th>
                  <th>จำนวน</th>
                  <th>Pd</th>
                  <th>Pk</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(rec, idx) in recommendations" :key="rec.id" @click="selectRecommendation(rec)" class="cursor-pointer">
                  <td class="rank-number">
                    <span
                      class="target-rank"
                      :class="idx === 0 ? 'rank-red' : idx === 1 ? 'rank-yellow' : idx === 2 ? 'rank-green' : 'rank-default'"
                    >{{ idx + 1 }}</span>
                  </td>
                  <td>
                    <span class="recommendation-name">{{ rec.item }}</span>
                  </td>
                  <td><span class="size-chip">{{ rec.size }}</span></td>
                  <td class="text-center"><span class="qty-badge">{{ rec.qty }}</span></td>
                  <td><span class="score-pill pd-score">{{ rec.pd.toFixed(2) }}</span></td>
                  <td><span class="score-pill pk-score">{{ rec.pk.toFixed(2) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <button type="button" class="view-all-button" @click="showAllDetails">
            <span>ดูรายละเอียดทั้งหมด</span>
            <i class="bi bi-arrow-right"></i>
          </button>
        </div>

        <!-- AI Analysis Results -->
        <div class="tab-pane fade" id="content-analysis" role="tabpanel">
          <div class="section-title mb-3">
            <i class="bi bi-cpu"></i> AI Analysis Result (ข้อมูล Analyst วิเคราะห์ข้อมูล)
          </div>
          <div class="analysis-result">
            <pre>{{ aiAnalysisText }}</pre>
          </div>
          <div
            class="confidence-card mt-3"
            role="meter"
            aria-label="AI Confidence"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="85"
          >
            <div class="confidence-heading">
              <i class="bi bi-shield-check"></i>
              <span>ความครบถ้วนของข้อมูล (AI Confidence)</span>
            </div>
            <div class="confidence-content">
              <div class="confidence-gauge">
                <svg viewBox="0 0 140 88" aria-hidden="true">
                  <defs>
                    <linearGradient id="confidenceGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stop-color="#2187e5" />
                      <stop offset="48%" stop-color="#20bf8a" />
                      <stop offset="72%" stop-color="#f0d044" />
                      <stop offset="100%" stop-color="#ff6c32" />
                    </linearGradient>
                  </defs>
                  <path class="gauge-track" pathLength="100" d="M15 73 A55 55 0 0 1 125 73" />
                  <path class="gauge-value" pathLength="100" d="M15 73 A55 55 0 0 1 125 73" />
                </svg>
                <div class="confidence-number">85<small>%</small></div>
              </div>
              <div class="confidence-copy">
                <span class="confidence-status"><i></i> High Confidence</span>
                <strong>ข้อมูลมีความน่าเชื่อถือสูง</strong>
                <small>พร้อมสำหรับการวิเคราะห์</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Chatbot -->
        <div class="tab-pane fade" id="content-chat" role="tabpanel">
          <div class="section-title mb-3">
            <i class="bi bi-robot"></i> AI Assistant (Chatbot ถามตอบ)
          </div>
          <div class="chatbot-messages mb-3">
            <div v-for="msg in chatMessages" :key="msg.id" class="message" :class="msg.type">
              <div class="message-content">{{ msg.text }}</div>
            </div>
          </div>
          <div class="chat-input">
            <div class="input-group input-group-sm">
              <input
                type="text"
                class="form-control"
                placeholder="พิมพ์คำถามของคุณ..."
                v-model="chatInput"
                @keyup.enter="sendChatMessage"
              />
              <button class="btn btn-primary btn-sm" type="button" @click="sendChatMessage">
                <i class="bi bi-send"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Simulator Section -->
      <div class="mt-4 pt-4 border-top">
        <div class="section-title mb-3">
          <i class="bi bi-play-circle"></i> Simulator Demo
        </div>
        <SimulatorDemo />
      </div>

      <!-- Save / Export Section -->
      <div class="mt-4 pt-4 border-top">
        <div class="section-title save-export-title mb-3">
          <i class="bi bi-download"></i>
          <span>บันทึกข้อมูลและส่งออก</span>
        </div>
        <div ref="exportMenuRef" class="action-buttons">
          <button class="btn btn-success btn-sm w-100 mb-2" @click="openSaveModal">
            <i class="bi bi-save"></i>
            <span>บันทึกข้อมูล</span>
          </button>
          <div class="export-control">
            <button class="btn btn-outline-primary btn-sm w-100 export-toggle" type="button" :aria-expanded="showExportMenu" @click.stop="showExportMenu = !showExportMenu">
              <i class="bi bi-download"></i>
              <span>ส่งออก</span>
              <i class="bi bi-chevron-down export-chevron" :class="{ open: showExportMenu }"></i>
            </button>
            <div v-if="showExportMenu" class="export-format-menu" role="menu">
              <div class="export-format-heading">
                <strong>รูปแบบเอกสาร</strong>
                <small>เลือกไฟล์สำหรับจัดเก็บหรือเสนอรายงาน</small>
              </div>
              <button type="button" role="menuitem" @click="exportData('pdf')">
                <span class="export-format-icon pdf"><i class="bi bi-file-earmark-pdf"></i></span>
                <span><strong>PDF</strong><small>เอกสารพร้อมพิมพ์และจัดเก็บ</small></span>
              </button>
              <button type="button" role="menuitem" @click="exportData('word')">
                <span class="export-format-icon word"><i class="bi bi-file-earmark-word"></i></span>
                <span><strong>Word</strong><small>เอกสารสำหรับแก้ไขและนำเสนอ</small></span>
              </button>
            </div>
          </div>
        </div>
        <div class="small text-muted mt-2">
          บันทึกในระบบแล้ว: {{ savedRecordsCount }} รายการ
        </div>
      </div>

      <div v-if="showRecommendationModal" class="modal-backdrop" @click.self="closeRecommendationModal">
        <div class="modal-card recommendation-modal-card" role="dialog" aria-modal="true" aria-labelledby="recommendation-modal-title">
          <div class="modal-header recommendation-modal-header">
            <div>
              <h6 id="recommendation-modal-title" class="mb-1">
                <i class="bi bi-stars me-2"></i>Recommendation ทั้งหมด
              </h6>
              <small>รายการที่ระบบวิเคราะห์และแนะนำ</small>
            </div>
            <button type="button" class="btn-close" aria-label="ปิด" @click="closeRecommendationModal"></button>
          </div>
          <div class="modal-body recommendation-modal-body">
            <div class="table-responsive recommendation-card modal-table-card">
              <table class="table table-sm recommendation-table">
                <thead>
                  <tr>
                    <th>ลำดับ</th>
                    <th>รายการ</th>
                    <th>ขนาด</th>
                    <th>จำนวน</th>
                    <th>Pd</th>
                    <th>Pk</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(rec, idx) in recommendations" :key="`modal-${rec.id}`">
                    <td class="rank-number">
                      <span
                        class="target-rank"
                        :class="idx === 0 ? 'rank-red' : idx === 1 ? 'rank-yellow' : idx === 2 ? 'rank-green' : 'rank-default'"
                      >{{ idx + 1 }}</span>
                    </td>
                    <td><span class="recommendation-name">{{ rec.item }}</span></td>
                    <td><span class="size-chip">{{ rec.size }}</span></td>
                    <td class="text-center"><span class="qty-badge">{{ rec.qty }}</span></td>
                    <td><span class="score-pill pd-score">{{ rec.pd.toFixed(2) }}</span></td>
                    <td><span class="score-pill pk-score">{{ rec.pk.toFixed(2) }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <span class="recommendation-count">ทั้งหมด {{ recommendations.length }} รายการ</span>
            <button type="button" class="recommendation-close-button" @click="closeRecommendationModal">
              <i class="bi bi-check-lg"></i> ปิด
            </button>
          </div>
        </div>
      </div>

      <div v-if="showSaveModal" class="modal-backdrop">
        <div class="modal-card save-modal-card">
          <div class="modal-header">
            <h6 class="mb-0"><i class="bi bi-save me-2"></i>บันทึกข้อมูล</h6>
            <button type="button" class="btn-close" @click="closeSaveModal"></button>
          </div>
          <div class="modal-body save-modal-body">
            <div class="save-field-group">
              <label class="save-field-label">
                <i class="bi bi-person"></i>
                <span>ชื่อผู้บันทึก</span>
              </label>
              <input v-model="recorderName" class="form-control form-control-sm" placeholder="กรอกชื่อผู้บันทึก" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary btn-sm" @click="closeSaveModal">ยกเลิก</button>
            <button class="btn btn-success btn-sm" :disabled="!recorderName.trim()" @click="requestSaveConfirmation">บันทึก</button>
          </div>
        </div>
      </div>

      <div v-if="showSaveConfirmation" class="modal-backdrop confirmation-backdrop" @click.self="cancelSaveConfirmation">
        <div class="modal-card confirmation-card" role="alertdialog" aria-modal="true" aria-labelledby="save-confirmation-title">
          <div class="confirmation-icon" aria-hidden="true">
            <i class="bi bi-question-lg"></i>
          </div>
          <h5 id="save-confirmation-title">ต้องการบันทึกข้อมูลหรือไม่?</h5>
          <p>โปรดตรวจสอบข้อมูลก่อนยืนยันการบันทึก</p>
          <div class="confirmation-actions">
            <button type="button" class="confirmation-cancel" @click="cancelSaveConfirmation">ยกเลิก</button>
            <button type="button" class="confirmation-accept" :disabled="isSaving" @click="saveRecordToDatabase">
              <i :class="isSaving ? 'spinner-border spinner-border-sm' : 'bi bi-check-lg'"></i>
              {{ isSaving ? 'กำลังบันทึก...' : 'ต้องการ' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import mockAPI from '../services/mockAPI'
import { exportService } from '../services/exportService'
import { analysisRecordsAPI } from '../services/analysisRecordsAPI'
import SimulatorDemo from './SimulatorDemo.vue'

export default {
  name: 'RightPanel',
  components: { SimulatorDemo },
  props: {
    collapsed: {
      type: Boolean,
      default: false
    },
    targetPriority: {
      type: String,
      default: ''
    },
    formData: {
      type: Object,
      default: () => ({})
    },
    captureCoordinateImage: {
      type: Function,
      default: null
    }
  },
  emits: ['save-data', 'toggle-panel'],
  setup(props, { emit }) {
    const recommendations = ref(mockAPI.recommendations)
    const aiAnalysisText = ref(mockAPI.aiAnalysisText)
    const chatMessages = ref([
      { id: 1, type: 'assistant', text: 'สวัสดีครับ ฉันเป็น AI Assistant ของระบบ weaponeering พร้อมที่จะช่วยวิเคราะห์ข้อมูลของคุณ' }
    ])
    const chatInput = ref('')
    const showSaveModal = ref(false)
    const showSaveConfirmation = ref(false)
    const showRecommendationModal = ref(false)
    const showExportMenu = ref(false)
    const exportMenuRef = ref(null)
    const recorderName = ref('')
    const savedRecordsCount = ref(0)
    const isSaving = ref(false)

    const selectRecommendation = () => {
      showRecommendationModal.value = true
    }

    const showAllDetails = () => {
      showRecommendationModal.value = true
    }

    const closeRecommendationModal = () => {
      showRecommendationModal.value = false
    }

    const sendChatMessage = () => {
      if (chatInput.value.trim()) {
        chatMessages.value.push({
          id: chatMessages.value.length + 1,
          type: 'user',
          text: chatInput.value
        })
        
        // Simulate bot response
        setTimeout(() => {
          chatMessages.value.push({
            id: chatMessages.value.length + 1,
            type: 'assistant',
            text: mockAPI.getChatbotResponse(chatInput.value)
          })
          
          // Auto scroll to bottom
          const container = document.querySelector('.chatbot-messages')
          if (container) {
            container.scrollTop = container.scrollHeight
          }
        }, 500)
        
        chatInput.value = ''
      }
    }

    const loadSavedRecords = async () => {
      try {
        savedRecordsCount.value = await analysisRecordsAPI.count()
      } catch (error) {
        console.error('Unable to load saved record count from PostgreSQL', error)
        savedRecordsCount.value = 0
      }
    }

    const openSaveModal = () => {
      showSaveModal.value = true
      recorderName.value = ''
    }

    const closeSaveModal = () => {
      showSaveModal.value = false
      showSaveConfirmation.value = false
      recorderName.value = ''
    }

    const requestSaveConfirmation = () => {
      if (!recorderName.value.trim()) {
        alert('กรุณากรอกชื่อผู้บันทึก')
        return
      }
      showSaveConfirmation.value = true
    }

    const cancelSaveConfirmation = () => {
      showSaveConfirmation.value = false
    }

    const saveRecordToDatabase = async () => {
      const name = recorderName.value.trim()
      if (isSaving.value) return
      if (!name) {
        alert('กรุณากรอกชื่อผู้บันทึก')
        return
      }

      try {
        isSaving.value = true
        showSaveConfirmation.value = false
        const latitude = Number(props.formData?.latitude)
        const longitude = Number(props.formData?.longitude)
        const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
        const coordinateImagePreview = hasCoordinates && props.captureCoordinateImage
          ? await props.captureCoordinateImage()
          : ''
        const record = {
          ...props.formData,
          coordinateImagePreview,
          coordinateImageName: coordinateImagePreview
            ? `coordinates_${latitude.toFixed(5)}_${longitude.toFixed(5)}.jpg`
            : '',
          recorderName: name,
          targetPriority: props.targetPriority || props.formData?.targetPriority || 'unassigned',
          summary: {
            recommendations: recommendations.value.slice(0, 5),
            analysis: aiAnalysisText.value
          }
        }

        const savedRecord = await analysisRecordsAPI.create(record)
        savedRecordsCount.value += 1
        emit('save-data', savedRecord)
        showSaveModal.value = false
        recorderName.value = ''
      } catch (error) {
        console.error('Unable to save record to PostgreSQL', error)
        const apiMessage = error.response?.data?.details?.join('\n')
          || error.response?.data?.error
          || 'กรุณาตรวจสอบว่า API และ PostgreSQL กำลังทำงาน'
        alert(`ไม่สามารถบันทึกข้อมูลได้ในขณะนี้\n${apiMessage}`)
      } finally {
        isSaving.value = false
      }
    }

    const buildExportData = (coordinateImagePreview = '') => {
      const date = new Date().toISOString().split('T')[0]
      
      return {
        targetInfo: {
          id: props.formData?.tgt || `TGT-${date}-${Math.floor(Math.random() * 1000)}`,
          name: props.formData?.targetName || props.formData?.selectedTargetSource || 'ไม่ระบุ',
          type: props.formData?.targetType || 'ไม่ระบุ',
          structure: props.formData?.structureType || 'ไม่ระบุ',
          targetImportance: props.formData?.targetImportance || '',
          strength: props.formData?.strengthLevel || 'ไม่ระบุ',
          area: props.formData?.selectedTargetSource || 'ไม่ระบุ',
          desiredResult: props.formData?.desiredEffect || 'ไม่ระบุ',
          heightMslFt: props.formData?.heightMslFt ?? '',
          weaponUsed: props.formData?.weaponUsed || '',
          details: props.formData?.targetDetails || 'ไม่ระบุ',
          imageName: props.formData?.imageName || 'ไม่ระบุ',
          imagePreview: props.formData?.imagePreview || '',
          coordinateImageName: coordinateImagePreview ? 'coordinate_map.jpg' : 'ไม่ระบุ',
          coordinateImagePreview,
          coordinates: props.formData?.dmpiCoordinates || '',
          latitude: props.formData?.latitude || 'ไม่ระบุ',
          longitude: props.formData?.longitude || 'ไม่ระบุ'
        },
        metrics: {
          confidence: 85,
          pk: (props.formData?.pk || 0.76).toFixed(2),
          cep: props.formData?.cep ?? 10,
          recommendation: '2,000'
        },
        recommendations: recommendations.value,
        analysisText: aiAnalysisText.value,
        priority: props.targetPriority || props.formData?.targetPriority || 'ทั่วไป',
        generatedDate: new Date().toLocaleString('th-TH')
      }
    }

    const exportData = async (format) => {
      showExportMenu.value = false
      const date = new Date().toISOString().split('T')[0]

      try {
        const coordinateImagePreview = props.captureCoordinateImage
          ? await props.captureCoordinateImage()
          : ''
        const reportData = buildExportData(coordinateImagePreview)
        if (format === 'pdf') {
          await exportService.exportToPDF(reportData, `weaponeering_analysis_${date}.pdf`)
          alert('ส่งออก PDF สำเร็จ')
          return
        }

        if (format === 'word') {
          await exportService.exportToWord(reportData, `weaponeering_analysis_${date}.docx`)
          alert('ส่งออก Word สำเร็จ')
          return
        }

        alert('ไม่พบรูปแบบไฟล์ที่รองรับ')
      } catch (error) {
        console.error('Export Error:', error)
        alert(`เกิดข้อผิดพลาดในการส่งออก: ${error.message}`)
      }
    }

    const closeExportMenuOnOutsideClick = (event) => {
      if (exportMenuRef.value && !exportMenuRef.value.contains(event.target)) {
        showExportMenu.value = false
      }
    }

    onMounted(() => {
      loadSavedRecords()
      document.addEventListener('click', closeExportMenuOnOutsideClick)
    })

    onBeforeUnmount(() => document.removeEventListener('click', closeExportMenuOnOutsideClick))

    return {
      recommendations,
      aiAnalysisText,
      chatMessages,
      chatInput,
      showSaveModal,
      showSaveConfirmation,
      showRecommendationModal,
      showExportMenu,
      exportMenuRef,
      recorderName,
      savedRecordsCount,
      isSaving,
      selectRecommendation,
      showAllDetails,
      closeRecommendationModal,
      sendChatMessage,
      openSaveModal,
      closeSaveModal,
      requestSaveConfirmation,
      cancelSaveConfirmation,
      saveRecordToDatabase,
      exportData
    }
  }
}
</script>

<style scoped>
.right-panel {
  background: var(--panel-bg);
  border-left: 2px solid var(--border);
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
}

.right-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 62px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(225deg, rgba(13, 110, 253, 0.16), rgba(96, 70, 200, 0.08));
}

.right-panel-brand {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 9px;
}

.right-panel-brand-icon {
  display: inline-flex;
  flex: 0 0 36px;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #5b92e8;
  border-radius: 9px;
  background: #0d6efd;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.28);
  color: #ffffff;
  font-size: 1.05rem;
}

.right-panel-brand-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.right-panel-brand-copy strong {
  overflow: hidden;
  color: var(--text);
  font-size: 0.9rem;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.right-panel-brand-copy small {
  color: var(--muted);
  font-size: 0.66rem;
  white-space: nowrap;
}

.right-panel-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.right-panel-toggle {
  display: inline-flex;
  flex: 0 0 30px;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--control-bg);
  color: #6ea8fe;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.right-panel-toggle:hover {
  border-color: #0d6efd;
  background: #0d6efd;
  color: #ffffff;
  transform: scale(1.04);
}

.right-panel.collapsed .right-panel-header {
  flex-direction: column;
  justify-content: flex-start;
  padding: 10px 7px;
}

.right-panel.collapsed .right-panel-brand {
  order: 1;
  justify-content: center;
}

.right-panel.collapsed .right-panel-actions {
  order: 2;
  flex-direction: column;
}

.right-panel-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.section-title {
  font-weight: 600;
  color: #0d6efd;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-tabs {
  gap: 5px;
  padding: 5px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.18);
}

.nav-tabs .nav-link {
  width: 100%;
  min-height: 38px;
  padding: 7px 8px;
  border: 0 !important;
  border-radius: 7px;
  color: var(--text);
  font-size: 0.78rem;
  font-weight: 500;
  background: transparent;
  transition: background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.nav-tabs .nav-link:hover:not(.active) {
  border: 0;
  background: rgba(13, 110, 253, 0.1);
  color: #6ea8fe;
}

.nav-tabs .nav-link.active {
  border: 0 !important;
  background: #0d6efd;
  box-shadow: 0 4px 10px rgba(13, 110, 253, 0.3);
  color: #ffffff;
  transform: translateY(-1px);
}

.nav-tabs .nav-link.active i {
  color: #ffffff;
}

:global(body.dark-theme .nav-tabs .nav-link.active),
:global(body.light-theme .nav-tabs .nav-link.active) {
  border-color: transparent !important;
  background-color: #0d6efd !important;
  background-image: none !important;
  color: #ffffff !important;
}

:global(body.dark-theme .nav-tabs .nav-link.active i),
:global(body.light-theme .nav-tabs .nav-link.active i) {
  color: #ffffff !important;
}

.recommendation-title {
  padding: 2px 3px;
}

.title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(145deg, #2f73d9, #173f8d);
  box-shadow: 0 3px 8px rgba(13, 110, 253, 0.3);
  color: #ffffff;
}

.top-five-badge {
  margin-left: auto;
  padding: 3px 8px;
  border: 1px solid rgba(255, 193, 7, 0.45);
  border-radius: 999px;
  background: rgba(255, 193, 7, 0.12);
  color: #e4ad08;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.recommendation-card {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
}

.recommendation-table {
  --bs-table-bg: transparent;
  --bs-table-color: var(--text);
  width: 100%;
  min-width: 100%;
  table-layout: fixed;
  margin-bottom: 0;
  border: 0;
  color: var(--text);
  font-size: 0.7rem;
}

.recommendation-table thead {
  --bs-table-bg: #12376f;
  --bs-table-color: #ffffff;
  background: linear-gradient(90deg, #12376f, #16529b);
  color: #ffffff;
}

.recommendation-table thead th {
  padding: 8px 3px;
  border: 0;
  color: #dbe9ff;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-align: center;
  white-space: nowrap;
}

.recommendation-table th:nth-child(1),
.recommendation-table td:nth-child(1) { width: 12%; }
.recommendation-table th:nth-child(2),
.recommendation-table td:nth-child(2) { width: 20%; }
.recommendation-table th:nth-child(3),
.recommendation-table td:nth-child(3) { width: 26%; }
.recommendation-table th:nth-child(4),
.recommendation-table td:nth-child(4) { width: 14%; }
.recommendation-table th:nth-child(5),
.recommendation-table td:nth-child(5),
.recommendation-table th:nth-child(6),
.recommendation-table td:nth-child(6) { width: 14%; }

.recommendation-table thead th:nth-child(2) {
  text-align: left;
}

.recommendation-table tbody tr {
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background-color 0.18s ease, box-shadow 0.18s ease;
}

.recommendation-table tbody tr:last-child {
  border-bottom: 0;
}

.recommendation-table tbody tr:nth-child(even) {
  background: rgba(13, 110, 253, 0.035);
}

.recommendation-table tbody tr:hover {
  background: rgba(13, 110, 253, 0.13);
  box-shadow: inset 3px 0 #0d6efd;
}

.recommendation-table tbody td {
  padding: 7px 3px;
  border: 0;
  color: var(--text);
  vertical-align: middle;
  white-space: nowrap;
}

.rank-number {
  text-align: center;
}

.target-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 50%;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.34), 0 3px 7px rgba(0, 0, 0, 0.24);
  font-size: 0.72rem;
  font-weight: 700;
}

.rank-red {
  background: linear-gradient(145deg, #ff646d, #bd2531);
  color: #ffffff;
}

.rank-yellow {
  border-color: #ffe78b;
  background: linear-gradient(145deg, #ffe26b, #d5a911);
  color: #2a2100;
}

.rank-green {
  background: linear-gradient(145deg, #4bd790, #168451);
  color: #ffffff;
}

.rank-default {
  border-color: #58728d;
  background: #263b50;
  color: #c9d8e8;
}

.recommendation-name {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.size-chip {
  padding: 2px 4px;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: rgba(108, 117, 125, 0.1);
  color: var(--text);
  font-size: 0.61rem;
  white-space: nowrap;
}

.qty-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  border-radius: 6px;
  background: rgba(111, 66, 193, 0.16);
  color: #9b7fe4;
  font-weight: 700;
}

.score-pill {
  display: inline-block;
  min-width: 33px;
  padding: 3px 4px;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  text-align: center;
}

.pd-score {
  background: rgba(13, 110, 253, 0.14);
  color: #6ea8fe;
}

.pk-score {
  background: rgba(25, 135, 84, 0.16);
  color: #42ca82;
}

.recommendation-card::-webkit-scrollbar {
  height: 6px;
}

.recommendation-card::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #3869a7;
}

.view-all-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 38px;
  margin-top: 10px;
  border: 1px solid rgba(13, 110, 253, 0.5);
  border-radius: 8px;
  background: rgba(13, 110, 253, 0.08);
  color: #4b91f7;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.view-all-button:hover {
  background: #0d6efd;
  color: #ffffff;
  transform: translateY(-1px);
}

.view-all-button i {
  transition: transform 0.18s ease;
}

.view-all-button:hover i {
  transform: translateX(3px);
}

.analysis-result {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 4px;
  padding: 12px;
  font-size: 0.85rem;
  max-height: 250px;
  overflow-y: auto;
  color: var(--text);
}

.analysis-result pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--text);
}

.confidence-card {
  overflow: hidden;
  border: 1px solid #294968;
  border-radius: 10px;
  background: radial-gradient(circle at 22% 85%, rgba(13, 110, 253, 0.12), transparent 44%), #07131f;
  box-shadow: 0 7px 20px rgba(0, 0, 0, 0.26);
}

.confidence-heading {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 11px;
  border-bottom: 1px solid #213a52;
  color: #c8d9e9;
  font-size: 0.72rem;
  font-weight: 500;
}

.confidence-heading i {
  color: #63a6ed;
}

.confidence-content {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 120px;
  padding: 10px 12px 12px;
}

:global(body.light-theme .confidence-card) { border-color: #bfd0df; background: radial-gradient(circle at 22% 85%, rgba(13, 110, 253, 0.08), transparent 44%), #ffffff; box-shadow: 0 7px 18px rgba(31, 65, 98, 0.12); }
:global(body.light-theme .confidence-heading) { border-bottom-color: #d2dee9; color: #28465f; }

.confidence-gauge {
  position: relative;
  flex: 0 0 132px;
  width: 132px;
  height: 84px;
}

.confidence-gauge svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.gauge-track,
.gauge-value {
  fill: none;
  stroke-width: 10;
  stroke-linecap: round;
}

.gauge-track {
  stroke: #172c3f;
}

.gauge-value {
  stroke: url(#confidenceGradient);
  stroke-dasharray: 85 100;
  filter: drop-shadow(0 0 4px rgba(59, 188, 188, 0.45));
  animation: confidenceFill 0.8s ease-out both;
}

.confidence-number {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  color: #ffffff;
  font: 500 1.9rem/1 'Segoe UI', sans-serif;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
}

.confidence-number small {
  margin-left: 2px;
  color: #b9c9d7;
  font-size: 0.72rem;
}

.confidence-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.confidence-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #ff9c4c;
  font-size: 0.74rem;
  font-weight: 600;
  white-space: nowrap;
}

.confidence-status i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ff8b39;
  box-shadow: 0 0 7px rgba(255, 139, 57, 0.8);
}

.confidence-copy strong {
  color: #d9e6f2;
  font-size: 0.7rem;
  font-weight: 500;
}

.confidence-copy small {
  color: #778da3;
  font-size: 0.62rem;
}

@keyframes confidenceFill {
  from { stroke-dasharray: 0 100; }
  to { stroke-dasharray: 85 100; }
}

@media (max-width: 340px) {
  .confidence-content { gap: 6px; padding-right: 7px; padding-left: 7px; }
  .confidence-gauge { flex-basis: 118px; width: 118px; }
  .confidence-status { font-size: 0.68rem; }
}

.chatbot-messages {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 4px;
  padding: 12px;
  height: 200px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.message {
  margin-bottom: 10px;
  display: flex;
  animation: slideIn 0.3s ease-in-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  word-wrap: break-word;
}

.message.user .message-content {
  background: #0d6efd;
  color: white;
}

.message.assistant .message-content {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text);
}

.chat-input {
  display: flex;
  gap: 8px;
}

.ratio ratio-16x9 {
  margin-bottom: 15px;
  border: 2px solid #444444;
  border-radius: 4px;
  overflow: hidden;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-control {
  position: relative;
}

.save-export-title,
.action-buttons .btn {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.action-buttons .btn {
  display: inline-flex;
  gap: 7px;
}

.export-toggle {
  position: relative;
  padding-right: 34px;
}

.export-chevron {
  position: absolute;
  right: 12px;
  font-size: 0.68rem;
  transition: transform 0.2s ease;
}

.export-chevron.open {
  transform: rotate(180deg);
}

.export-format-menu {
  position: absolute;
  right: 0;
  bottom: calc(100% + 7px);
  left: 0;
  z-index: 30;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel-bg);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.48);
}

.export-format-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 8px 8px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--border);
}

.export-format-heading strong {
  color: var(--text);
  font-size: 0.82rem;
}

.export-format-heading small {
  color: var(--muted);
  font-size: 0.65rem;
  line-height: 1.2;
}

.export-format-menu button {
  display: flex;
  min-height: 50px;
  width: 100%;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  text-align: left;
  transition: background 0.16s ease, transform 0.16s ease;
}

.export-format-menu button:hover {
  background: rgba(13, 110, 253, 0.12);
  transform: translateX(2px);
}

.export-format-menu button > span:last-child {
  display: flex;
  flex-direction: column;
  line-height: 1.18;
}

.export-format-menu strong {
  font-size: 0.8rem;
}

.export-format-menu small {
  margin-top: 3px;
  color: var(--muted);
  font-size: 0.64rem;
}

.export-format-icon {
  display: inline-flex;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 1rem;
}

.export-format-icon.word {
  background: rgba(47, 109, 179, 0.18);
  color: #5aa4f2;
}

.export-format-icon.pdf {
  background: rgba(220, 53, 69, 0.18);
  color: #ff6575;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-card {
  width: min(90vw, 360px);
  background: #111111;
  border: 2px solid #444444;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
}

.save-modal-card {
  width: min(92vw, 430px);
  border-color: #315f9d;
  border-radius: 12px;
  background: var(--panel-bg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.62);
}

.save-modal-card .modal-header {
  background: linear-gradient(90deg, rgba(13, 110, 253, 0.2), rgba(111, 66, 193, 0.1));
}

.save-modal-card .modal-header h6 {
  color: #8bb9ff;
  font-weight: 600;
}

.save-modal-card .btn-close {
  filter: invert(1) grayscale(1);
}

.save-modal-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 17px !important;
}

.save-field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.save-field-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #d6e3ef;
  font-size: 0.8rem;
  font-weight: 600;
}

.save-step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 23px;
  height: 23px;
  border: 1px solid #6da4f5;
  border-radius: 50%;
  background: #174f9d;
  color: #ffffff;
  font-size: 0.68rem;
}

.priority-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.priority-option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
  min-height: 86px;
  padding: 9px 6px;
  border: 1px solid #34495e;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.025);
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
}

.priority-option:hover,
.priority-option.selected {
  transform: translateY(-1px);
}

.priority-option input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.priority-option > .bi {
  position: absolute;
  top: 6px;
  right: 7px;
  font-size: 0.72rem;
}

.priority-color {
  width: 23px;
  height: 23px;
  border: 2px solid rgba(255, 255, 255, 0.46);
  border-radius: 50%;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
}

.priority-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.priority-copy strong {
  color: #e1ebf4;
  font-size: 0.7rem;
}

.priority-copy small {
  color: #7f94a8;
  font-size: 0.6rem;
}

.priority-red .priority-color { background: #e33c49; }
.priority-orange .priority-color { background: #f28b2c; }
.priority-green .priority-color { background: #29a968; }
.priority-red.selected { border-color: #e33c49; background: rgba(227, 60, 73, 0.12); }
.priority-orange.selected { border-color: #f28b2c; background: rgba(242, 139, 44, 0.12); }
.priority-green.selected { border-color: #29a968; background: rgba(41, 169, 104, 0.12); }
.priority-red.selected > .bi { color: #ff7079; }
.priority-orange.selected > .bi { color: #ffad63; }
.priority-green.selected > .bi { color: #59d799; }

.confirmation-backdrop {
  z-index: 1080;
}

.confirmation-card {
  width: min(90vw, 370px);
  padding: 27px 23px 22px;
  border-color: #315f9d;
  border-radius: 14px;
  background: var(--panel-bg);
  color: var(--text);
  text-align: center;
  box-shadow: 0 22px 65px rgba(0, 0, 0, 0.68);
  animation: confirmationPop 0.2s ease-out;
}

.confirmation-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  margin-bottom: 15px;
  border: 1px solid #63a6ed;
  border-radius: 50%;
  background: rgba(13, 110, 253, 0.14);
  box-shadow: 0 0 0 8px rgba(13, 110, 253, 0.06);
  color: #79b4ff;
  font-size: 1.45rem;
}

.confirmation-card h5 {
  margin: 0 0 7px;
  color: var(--text);
  font-size: 1rem;
  font-weight: 700;
}

.confirmation-card p {
  margin: 0 0 20px;
  color: var(--muted);
  font-size: 0.76rem;
}

.confirmation-actions {
  display: flex;
  justify-content: center;
  gap: 9px;
}

.confirmation-cancel,
.confirmation-accept {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 108px;
  min-height: 38px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.confirmation-cancel {
  border: 1px solid var(--border);
  background: var(--control-bg);
  color: var(--text);
}

.confirmation-cancel:hover {
  border-color: #6c7e90;
  background: #253342;
  color: #ffffff;
}

.confirmation-accept {
  border: 1px solid #4ba97a;
  background: #198754;
  box-shadow: 0 5px 14px rgba(25, 135, 84, 0.3);
  color: #ffffff;
}

.confirmation-accept:hover {
  background: #24a064;
  transform: translateY(-1px);
}

@keyframes confirmationPop {
  from { opacity: 0; transform: translateY(10px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.recommendation-modal-card {
  width: min(92vw, 780px);
  max-height: 88vh;
  border-color: #315f9d;
  border-radius: 12px;
  background: var(--panel-bg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.65);
}

.recommendation-modal-header {
  background: linear-gradient(90deg, rgba(13, 110, 253, 0.2), rgba(111, 66, 193, 0.12));
}

.recommendation-modal-header h6 {
  color: #8bb9ff;
  font-weight: 600;
}

.recommendation-modal-header small {
  color: var(--muted);
}

.recommendation-modal-header .btn-close {
  filter: invert(1) grayscale(1);
}

.recommendation-modal-body {
  overflow-y: auto;
  padding: 16px;
}

.modal-table-card {
  box-shadow: none;
}

.modal-table-card .recommendation-table {
  min-width: 600px;
}

.modal-table-card .recommendation-table tbody tr {
  cursor: default;
}

.recommendation-count {
  margin-right: auto;
  color: var(--muted);
  font-size: 0.78rem;
}

.recommendation-close-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 120px;
  min-height: 38px;
  border: 0;
  border-radius: 8px;
  background: #0d6efd;
  box-shadow: 0 5px 14px rgba(13, 110, 253, 0.3);
  color: #ffffff;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.18s ease, transform 0.18s ease;
}

.recommendation-close-button:hover {
  background: #2b7bf0;
  color: #ffffff;
  transform: translateY(-1px);
}

.modal-header,
.modal-body,
.modal-footer {
  padding: 12px 15px;
  border-color: #444444;
  color: #ffffff;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #444444;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 2px solid #444444;
}

.btn-sm {
  font-size: 0.85rem;
}

/* Scrollbar styling */
.right-panel-scroll::-webkit-scrollbar,
.chatbot-messages::-webkit-scrollbar,
.analysis-result::-webkit-scrollbar {
  width: 6px;
}

.right-panel-scroll::-webkit-scrollbar-track,
.chatbot-messages::-webkit-scrollbar-track,
.analysis-result::-webkit-scrollbar-track {
  background: #111111;
}

.right-panel-scroll::-webkit-scrollbar-thumb,
.chatbot-messages::-webkit-scrollbar-thumb,
.analysis-result::-webkit-scrollbar-thumb {
  background: #555555;
  border-radius: 3px;
}

.right-panel-scroll::-webkit-scrollbar-thumb:hover,
.chatbot-messages::-webkit-scrollbar-thumb:hover,
.analysis-result::-webkit-scrollbar-thumb:hover {
  background: #777777;
}

@media (max-width: 992px) {
  .right-panel { height: 100%; border-left: 0; }
  .right-panel-toggle { flex-basis: 38px; width: 38px; height: 38px; }
  .right-panel-scroll { padding: 12px; }
  .recommendation-table { min-width: 560px; }
}

@media (max-width: 600px) {
  .right-panel-header { min-height: 58px; padding: 8px 10px; }
  .right-panel-brand-icon { flex-basis: 32px; width: 32px; height: 32px; }
  .right-panel-brand-copy small { display: none; }
  .right-panel-scroll { padding: 8px; }
  .nav-tabs { position: sticky; top: 0; z-index: 12; gap: 3px; }
  .nav-tabs .nav-link { min-height: 44px; padding: 7px 4px; font-size: 0.72rem; }
  .modal-backdrop { padding: 8px; }
  .modal-card, .save-modal-card, .recommendation-modal-card, .confirmation-card { width: 100%; max-width: 100%; max-height: calc(100dvh - 16px); }
  .modal-header, .modal-body, .modal-footer, .recommendation-modal-body { padding: 10px; }
  .modal-footer { flex-wrap: wrap; }
  .recommendation-count { width: 100%; }
  .recommendation-close-button { width: 100%; }
  .export-format-menu button { min-height: 48px; }
}
</style>

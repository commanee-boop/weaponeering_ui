<template>
  <div class="analysis-page">
    <Header />
    
    <div
      class="main-container"
      :class="{
        'sidebar-collapsed': sidebarCollapsed,
        'right-panel-collapsed': rightPanelCollapsed
      }"
    >
      <div class="sidebar-col">
        <Sidebar
          :key="`sidebar-${sidebarRefreshKey}`"
          :collapsed="sidebarCollapsed"
          @toggle-sidebar="toggleSidebar"
          @reset-target="resetTargetData"
          @reset-all="refreshData"
          @priority-change="currentTargetPriority = $event"
          @ai-analysis="handleAIAnalysis"
        />
      </div>
      
      <div class="map-col">
        <MapPanel :key="`map-${mapRefreshKey}`" :latitude="currentLatitude" :longitude="currentLongitude" />
      </div>
      
      <div class="right-col">
        <RightPanel
          :key="`right-${rightRefreshKey}`"
          :collapsed="rightPanelCollapsed"
          :target-priority="currentTargetPriority"
          :form-data="currentFormData"
          @toggle-panel="toggleRightPanel"
          @save-data="handleSaveData"
        />
      </div>
    </div>

    <div v-if="showResetNotice" class="reset-notice" role="status">
      <i class="bi bi-check-circle-fill"></i>
      <span>{{ resetNoticeMessage }}</span>
    </div>
  </div>
</template>

<script>
import { onUnmounted, ref } from 'vue'
import Header from '../components/Header.vue'
import Sidebar from '../components/Sidebar.vue'
import MapPanel from '../components/MapPanel.vue'
import RightPanel from '../components/RightPanel.vue'

export default {
  name: 'AnalysisView',
  components: {
    Header,
    Sidebar,
    MapPanel,
    RightPanel
  },
  setup() {
    const currentLatitude = ref(16.8661)
    const currentLongitude = ref(100.9948)
    const sidebarCollapsed = ref(false)
    const rightPanelCollapsed = ref(false)
    const currentTargetPriority = ref('')
    const currentFormData = ref({})
    const sidebarRefreshKey = ref(0)
    const mapRefreshKey = ref(0)
    const rightRefreshKey = ref(0)
    const showResetNotice = ref(false)
    const resetNoticeMessage = ref('')
    let resetNoticeTimer = null

    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }

    const toggleRightPanel = () => {
      rightPanelCollapsed.value = !rightPanelCollapsed.value
    }

    const handleAIAnalysis = (analysisData) => {
      console.log('AI Analysis started with data:', analysisData)
      currentLatitude.value = analysisData.latitude || currentLatitude.value
      currentLongitude.value = analysisData.longitude || currentLongitude.value
      currentTargetPriority.value = analysisData.targetPriority || currentTargetPriority.value
      currentFormData.value = analysisData
      alert('AI Analysis completed: ' + JSON.stringify(analysisData, null, 2))
    }

    const handleSaveData = (formData) => {
      console.log('Saving data:', formData)
    }

    const displayResetNotice = message => {
      resetNoticeMessage.value = message
      showResetNotice.value = true
      if (resetNoticeTimer) window.clearTimeout(resetNoticeTimer)
      resetNoticeTimer = window.setTimeout(() => {
        showResetNotice.value = false
      }, 2200)
    }

    const resetTargetData = () => {
      sidebarCollapsed.value = false
      currentTargetPriority.value = ''
      currentFormData.value = {}
      sidebarRefreshKey.value += 1
      displayResetNotice('ล้างข้อมูลเป้าหมายและกลับสู่ค่าเริ่มต้นแล้ว')
    }

    const refreshData = () => {
      currentLatitude.value = 16.8661
      currentLongitude.value = 100.9948
      sidebarCollapsed.value = false
      rightPanelCollapsed.value = false
      currentTargetPriority.value = ''
      currentFormData.value = {}
      sidebarRefreshKey.value += 1
      mapRefreshKey.value += 1
      rightRefreshKey.value += 1
      displayResetNotice('ล้างข้อมูลทั้งหมดและกลับสู่ค่าเริ่มต้นแล้ว')
    }

    onUnmounted(() => {
      if (resetNoticeTimer) window.clearTimeout(resetNoticeTimer)
    })

    return {
      currentLatitude,
      currentLongitude,
      sidebarCollapsed,
      rightPanelCollapsed,
      currentTargetPriority,
      currentFormData,
      sidebarRefreshKey,
      mapRefreshKey,
      rightRefreshKey,
      showResetNotice,
      resetNoticeMessage,
      toggleSidebar,
      toggleRightPanel,
      handleAIAnalysis,
      handleSaveData,
      resetTargetData,
      refreshData
    }
  }
}
</script>

<style scoped>
.analysis-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.main-container {
  --left-column: 300px;
  --right-column: 350px;
  display: grid;
  grid-template-columns: var(--left-column) minmax(0, 1fr) var(--right-column);
  gap: 15px;
  padding: 15px;
  flex: 1;
  overflow: hidden;
  transition: grid-template-columns 0.24s ease;
}

.main-container.sidebar-collapsed {
  --left-column: 64px;
}

.main-container.right-panel-collapsed {
  --right-column: 64px;
}

.sidebar-col,
.map-col,
.right-col {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sidebar-col {
  background: var(--panel-bg);
}

.map-col {
  background: var(--panel-bg);
}

.right-col {
  background: var(--panel-bg);
}

.reset-notice {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 1250;
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 46px;
  padding: 10px 15px;
  border: 1px solid rgba(25, 135, 84, 0.62);
  border-radius: 10px;
  background: #102c21;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.38);
  color: #81d9aa;
  font-size: 0.82rem;
  font-weight: 500;
  animation: resetNoticeIn 0.22s ease-out;
}

:global(body.light-theme .analysis-page) { background: #edf3f9; }
:global(body.light-theme .main-container) { background: #edf3f9; }
:global(body.light-theme .sidebar-col),
:global(body.light-theme .map-col),
:global(body.light-theme .right-col) {
  border: 1px solid #cad7e4;
  background: #ffffff;
  box-shadow: 0 5px 16px rgba(31, 65, 98, 0.1);
}
:global(body.light-theme .reset-notice) { border-color: #75bd96; background: #ebf8f1; color: #147044; }

@keyframes resetNoticeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive Design */
@media (max-width: 1400px) {
  .main-container {
    --left-column: 250px;
    --right-column: 300px;
  }
}

@media (max-width: 992px) {
  .analysis-page {
    height: 100dvh;
    min-height: 100dvh;
    overflow: hidden;
  }

  .main-container {
    display: grid;
    grid-template-columns: 270px minmax(440px, 1fr) 310px;
    gap: 10px;
    padding: 10px;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
  }

  .main-container.sidebar-collapsed {
    grid-template-columns: 64px minmax(440px, 1fr) 310px;
  }

  .main-container.right-panel-collapsed {
    grid-template-columns: 270px minmax(440px, 1fr) 64px;
  }

  .main-container.sidebar-collapsed.right-panel-collapsed {
    grid-template-columns: 64px minmax(440px, 1fr) 64px;
  }

  .sidebar-col,
  .map-col,
  .right-col {
    min-width: 0;
    min-height: 0;
    max-height: none;
    overflow: hidden;
    scroll-snap-align: start;
  }

  .reset-notice {
    right: 12px;
    bottom: 12px;
    left: 12px;
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .main-container {
    grid-template-columns: 270px minmax(420px, 1fr) 300px;
    gap: 8px;
    padding: 6px;
  }

  .main-container.sidebar-collapsed {
    grid-template-columns: 64px minmax(420px, 1fr) 300px;
  }

  .main-container.right-panel-collapsed {
    grid-template-columns: 270px minmax(420px, 1fr) 64px;
  }

  .main-container.sidebar-collapsed.right-panel-collapsed {
    grid-template-columns: 64px minmax(420px, 1fr) 64px;
  }

  .sidebar-col,
  .map-col,
  .right-col {
    border-radius: 10px;
  }

}
</style>

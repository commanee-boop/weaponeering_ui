<template>
  <nav class="navbar navbar-expand-xl top-header" :class="isDarkMode ? 'navbar-dark' : 'navbar-light'">
    <div class="container-fluid header-container">
      <router-link to="/analysis" class="system-brand">
        <span class="logo-frame">
          <img src="/images/command-logo.png" alt="กองบัญชาการควบคุมการปฏิบัติทางอากาศ" class="system-logo" />
        </span>
        <span class="brand-copy">
          <strong>WEAPONEERING SYSTEM</strong>
          <small>ระบบสนับสนุนการวิเคราะห์เป้าหมาย</small>
        </span>
      </router-link>

      <button class="navbar-toggler header-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-label="เปิดเมนู">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <div class="navbar-nav main-navigation ms-xl-4">
          <router-link to="/analysis" class="nav-link system-nav-link">
            <i class="bi bi-graph-up-arrow"></i><span>วิเคราะห์</span>
          </router-link>
          <router-link to="/reports" class="nav-link system-nav-link">
            <i class="bi bi-file-earmark-text"></i><span>รายงาน บันทึกข้อมูล</span>
          </router-link>
        </div>

        <div class="header-tools ms-auto">
          <button class="header-icon-button" @click="toggleTheme" :title="isDarkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดดำ'">
            <i :class="isDarkMode ? 'bi bi-moon-stars' : 'bi bi-sun'" aria-hidden="true"></i>
          </button>

          <div class="date-time-chip">
            <i class="bi bi-clock"></i><span>{{ currentDateTime }}</span>
          </div>

          <div class="dropdown">
            <button class="user-menu dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown">
              <span class="user-avatar"><i class="bi bi-person"></i></span>
              <span class="user-copy"><small>ผู้ใช้งาน</small><strong>{{ userName }}</strong></span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
              <li><a class="dropdown-item" href="#">โปรไฟล์</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="#" @click="logout">ออกจากระบบ</a></li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'Header',
  setup() {
    const currentDateTime = ref('')
    const userName = ref('Admin01')
    const isDarkMode = ref(true)
    let intervalId = null

    const applyTheme = (theme) => {
      const isDark = theme === 'dark'
      isDarkMode.value = isDark
      document.body.classList.toggle('dark-theme', isDark)
      document.body.classList.toggle('light-theme', !isDark)
      window.localStorage.setItem('app-theme', theme)
    }

    const updateDateTime = () => {
      const now = new Date()
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }
      currentDateTime.value = now.toLocaleString('th-TH', options)
    }

    const toggleTheme = () => {
      const nextTheme = isDarkMode.value ? 'light' : 'dark'
      applyTheme(nextTheme)
    }

    const logout = (e) => {
      e.preventDefault()
      if (confirm('คุณแน่ใจว่าต้องการออกจากระบบ?')) {
        window.location.href = '/login'
      }
    }

    onMounted(() => {
      updateDateTime()
      intervalId = setInterval(updateDateTime, 1000)
      const storedTheme = window.localStorage.getItem('app-theme')
      applyTheme(storedTheme === 'light' ? 'light' : 'dark')
    })

    onUnmounted(() => {
      if (intervalId) clearInterval(intervalId)
    })

    return {
      currentDateTime,
      userName,
      isDarkMode,
      toggleTheme,
      logout
    }
  }
}
</script>

<style scoped>
.top-header {
  position: relative;
  z-index: 100;
  min-height: 74px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(80, 133, 207, 0.38);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.22);
}

:global(body.dark-theme) .top-header {
  background: linear-gradient(90deg, #050d19, #081a31 55%, #071425) !important;
}

:global(body.light-theme) .top-header {
  background: linear-gradient(90deg, #ffffff, #f2f6fc) !important;
}

.header-container {
  gap: 16px;
  padding-right: 18px;
  padding-left: 18px;
}

.system-brand {
  display: inline-flex;
  align-items: center;
  min-width: 265px;
  gap: 11px;
  color: var(--text);
  text-decoration: none;
}

.logo-frame {
  display: inline-flex;
  flex: 0 0 54px;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  padding: 2px;
  border: 1px solid rgba(238, 193, 64, 0.65);
  border-radius: 50%;
  background: #081a3a;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.12), 0 5px 14px rgba(0, 0, 0, 0.3);
}

.system-logo {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: contain;
}

.brand-copy {
  display: flex;
  flex-direction: column;
}

.brand-copy strong {
  color: var(--text);
  font-size: 0.94rem;
  line-height: 1.25;
  letter-spacing: 0.055em;
}

.brand-copy small {
  color: var(--muted);
  font-size: 0.66rem;
}

.main-navigation {
  display: flex;
  flex-direction: row;
  gap: 6px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: rgba(13, 110, 253, 0.045);
}

.system-nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 7px 13px !important;
  border: 0 !important;
  border-radius: 7px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.system-nav-link:hover {
  background: rgba(13, 110, 253, 0.12);
  color: #6ea8fe !important;
}

.system-nav-link.router-link-exact-active {
  background: #0d6efd !important;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.32);
  color: #ffffff !important;
  transform: translateY(-1px);
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 9px;
}

.header-icon-button,
.user-menu {
  border: 1px solid var(--border);
  background: var(--control-bg);
  color: var(--text);
  font-family: inherit;
}

.header-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 9px;
}

.header-icon-button:hover {
  border-color: #0d6efd;
  color: #6ea8fe;
}

.date-time-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--control-bg);
  color: var(--muted);
  font-size: 0.7rem;
  white-space: nowrap;
}

.date-time-chip i {
  color: #6ea8fe;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 40px;
  padding: 4px 10px 4px 5px;
  border-radius: 9px;
}

.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: rgba(13, 110, 253, 0.16);
  color: #6ea8fe;
}

.user-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
}

.user-copy small {
  color: var(--muted);
  font-size: 0.58rem;
}

.user-copy strong {
  font-size: 0.72rem;
}

.header-toggler {
  border-color: var(--border);
}

@media (max-width: 1199.98px) {
  .navbar-collapse {
    padding: 12px 0 5px;
  }

  .main-navigation {
    margin-bottom: 10px;
  }

  .header-tools {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}

@media (max-width: 620px) {
  .system-brand {
    min-width: 0;
  }

  .brand-copy small,
  .date-time-chip {
    display: none;
  }

  .brand-copy strong {
    font-size: 0.75rem;
  }
}
</style>

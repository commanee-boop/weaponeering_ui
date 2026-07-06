<template>
  <div v-if="isExpanded" class="simulator-backdrop" @click="toggleExpanded"></div>

  <section class="simulator-window" :class="{ expanded: isExpanded }">
    <header class="simulator-header">
      <div class="simulator-title">
        <span class="simulator-title-icon"><i class="bi bi-badge-3d"></i></span>
        <div>
          <strong>Mission Simulator</strong>
          <small>ตัวอย่างสถานการณ์จำลอง</small>
        </div>
      </div>
      <div class="simulator-status">
        <span class="status-dot" :class="{ active: isPlaying }"></span>
        {{ isPlaying ? 'RUNNING' : 'PAUSED' }}
      </div>
      <button class="simulator-icon-button" type="button" :title="isExpanded ? 'ย่อหน้าจอ' : 'ขยายหน้าจอ'" @click="toggleExpanded">
        <i class="bi" :class="isExpanded ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'"></i>
      </button>
    </header>

    <div class="simulator-stage">
      <canvas ref="canvas" aria-label="หน้าจอสถานการณ์จำลอง"></canvas>
      <div class="hud-badge hud-top-left">
        <span>MISSION</span><strong>DEMO-01</strong>
      </div>
      <div class="hud-badge hud-bottom-right">
        <span>SIM TIME</span><strong>{{ formattedTime }}</strong>
      </div>
    </div>

    <footer class="simulator-controls">
      <button
        type="button"
        class="control-button primary"
        :class="{ active: isPlaying }"
        title="เล่นการจำลอง"
        aria-label="เล่นการจำลอง"
        :disabled="isPlaying"
        @click="startPlayback"
      >
        <i class="bi bi-play-fill"></i>
      </button>
      <button
        type="button"
        class="control-button pause"
        :class="{ active: isPaused }"
        title="หยุดการจำลองชั่วคราว"
        aria-label="หยุดการจำลองชั่วคราว"
        :disabled="!isPlaying"
        @click="pausePlayback"
      >
        <i class="bi bi-pause-fill"></i>
      </button>
      <button
        type="button"
        class="control-button stop"
        :class="{ active: !isPlaying && !isPaused }"
        title="หยุดการจำลอง"
        aria-label="หยุดการจำลอง"
        @click="stopPlayback"
      >
        <i class="bi bi-stop-fill"></i>
      </button>
      <button type="button" class="control-button" title="เริ่มการจำลองใหม่" aria-label="เริ่มการจำลองใหม่" @click="restart">
        <i class="bi bi-arrow-counterclockwise"></i>
      </button>
      <button type="button" class="control-button capture" title="แคปเจอร์หน้าจอ Simulator" aria-label="แคปเจอร์หน้าจอ Simulator" @click="captureScreen">
        <i class="bi bi-camera-fill"></i>
      </button>
      <span class="control-hint">ESC เพื่อปิดหน้าจอขยาย</span>
    </footer>
  </section>
</template>

<script>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

export default {
  name: 'SimulatorDemo',
  setup() {
    const canvas = ref(null)
    const isPlaying = ref(false)
    const isPaused = ref(false)
    const isExpanded = ref(false)
    const elapsed = ref(0)
    let animationFrame = null
    let previousTime = 0
    let resizeObserver = null
    let canvasWidth = 0
    let canvasHeight = 0

    const formattedTime = computed(() => {
      const totalSeconds = Math.floor(elapsed.value)
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
      const seconds = String(totalSeconds % 60).padStart(2, '0')
      return `${minutes}:${seconds}`
    })

    const drawCrosshair = (ctx, x, y, size, color) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.moveTo(x - size - 8, y)
      ctx.lineTo(x + size + 8, y)
      ctx.moveTo(x, y - size - 8)
      ctx.lineTo(x, y + size + 8)
      ctx.stroke()
    }

    const drawScene = () => {
      const element = canvas.value
      if (!element || !canvasWidth || !canvasHeight) return
      const ctx = element.getContext('2d')
      const width = canvasWidth
      const height = canvasHeight
      const time = elapsed.value

      const background = ctx.createLinearGradient(0, 0, width, height)
      background.addColorStop(0, '#06111f')
      background.addColorStop(0.55, '#0a2036')
      background.addColorStop(1, '#071520')
      ctx.fillStyle = background
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = 'rgba(71, 132, 184, 0.18)'
      ctx.lineWidth = 1
      const gridSize = Math.max(28, width / 18)
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke()
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke()
      }

      const radarX = width * 0.68
      const radarY = height * 0.5
      const radarRadius = Math.min(width, height) * 0.31
      ctx.strokeStyle = 'rgba(58, 188, 148, 0.32)'
      for (let ring = 1; ring <= 4; ring += 1) {
        ctx.beginPath()
        ctx.arc(radarX, radarY, radarRadius * ring / 4, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.beginPath(); ctx.moveTo(radarX - radarRadius, radarY); ctx.lineTo(radarX + radarRadius, radarY); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(radarX, radarY - radarRadius); ctx.lineTo(radarX, radarY + radarRadius); ctx.stroke()

      const sweepAngle = time * 0.85
      const sweep = ctx.createLinearGradient(radarX, radarY, radarX + Math.cos(sweepAngle) * radarRadius, radarY + Math.sin(sweepAngle) * radarRadius)
      sweep.addColorStop(0, 'rgba(65, 220, 165, 0.08)')
      sweep.addColorStop(1, 'rgba(65, 220, 165, 0.72)')
      ctx.strokeStyle = sweep
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(radarX, radarY)
      ctx.lineTo(radarX + Math.cos(sweepAngle) * radarRadius, radarY + Math.sin(sweepAngle) * radarRadius)
      ctx.stroke()

      const startX = width * 0.09
      const startY = height * 0.72
      const targetX = radarX
      const targetY = radarY
      ctx.setLineDash([7, 7])
      ctx.strokeStyle = 'rgba(104, 169, 255, 0.72)'
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.quadraticCurveTo(width * 0.38, height * 0.22, targetX, targetY)
      ctx.stroke()
      ctx.setLineDash([])

      const progress = (time * 0.055) % 1
      const inverse = 1 - progress
      const controlX = width * 0.38
      const controlY = height * 0.22
      const aircraftX = inverse * inverse * startX + 2 * inverse * progress * controlX + progress * progress * targetX
      const aircraftY = inverse * inverse * startY + 2 * inverse * progress * controlY + progress * progress * targetY
      ctx.save()
      ctx.translate(aircraftX, aircraftY)
      ctx.rotate(-0.22)
      ctx.fillStyle = '#79b4ff'
      ctx.beginPath()
      ctx.moveTo(13, 0); ctx.lineTo(-9, -6); ctx.lineTo(-5, 0); ctx.lineTo(-9, 6); ctx.closePath(); ctx.fill()
      ctx.restore()

      drawCrosshair(ctx, targetX, targetY, 13, '#ff5b63')
      ctx.fillStyle = '#ff7077'
      ctx.font = "600 11px 'TH Sarabun New', Sarabun, sans-serif"
      ctx.fillText('TARGET ALPHA', targetX + 20, targetY - 18)

      ctx.fillStyle = 'rgba(210, 232, 255, 0.8)'
      ctx.font = '10px monospace'
      ctx.fillText('LAT 16.86610', 14, 22)
      ctx.fillText('LON 100.99480', 14, 37)
      ctx.fillText(`RANGE ${Math.max(0, Math.round((1 - progress) * 86))} KM`, 14, 52)
    }

    const resizeCanvas = () => {
      const element = canvas.value
      if (!element) return
      const rect = element.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvasWidth = rect.width
      canvasHeight = rect.height
      element.width = Math.max(1, Math.round(rect.width * ratio))
      element.height = Math.max(1, Math.round(rect.height * ratio))
      const ctx = element.getContext('2d')
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      drawScene()
    }

    const animate = (timestamp) => {
      if (!previousTime) previousTime = timestamp
      if (isPlaying.value) elapsed.value += Math.min((timestamp - previousTime) / 1000, 0.1)
      previousTime = timestamp
      drawScene()
      animationFrame = window.requestAnimationFrame(animate)
    }

    const startPlayback = () => {
      isPlaying.value = true
      isPaused.value = false
      previousTime = performance.now()
    }

    const pausePlayback = () => {
      isPlaying.value = false
      isPaused.value = true
    }

    const stopPlayback = () => {
      isPlaying.value = false
      isPaused.value = false
      elapsed.value = 0
      drawScene()
    }

    const restart = () => {
      elapsed.value = 0
      isPlaying.value = true
      isPaused.value = false
      previousTime = performance.now()
      drawScene()
    }

    const captureScreen = () => {
      const element = canvas.value
      if (!element) return
      const link = document.createElement('a')
      link.download = `simulator-capture-${new Date().toISOString().replace(/[:.]/g, '-')}.png`
      link.href = element.toDataURL('image/png')
      link.click()
    }

    const toggleExpanded = async () => {
      isExpanded.value = !isExpanded.value
      document.body.style.overflow = isExpanded.value ? 'hidden' : ''
      await nextTick()
      resizeCanvas()
    }

    const handleKeydown = (event) => {
      if (event.key === 'Escape' && isExpanded.value) toggleExpanded()
    }

    onMounted(() => {
      resizeObserver = new ResizeObserver(resizeCanvas)
      if (canvas.value) resizeObserver.observe(canvas.value)
      window.addEventListener('keydown', handleKeydown)
      animationFrame = window.requestAnimationFrame(animate)
    })

    onUnmounted(() => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      resizeObserver?.disconnect()
      window.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = ''
    })

    return {
      canvas,
      isPlaying,
      isPaused,
      isExpanded,
      formattedTime,
      startPlayback,
      pausePlayback,
      stopPlayback,
      restart,
      captureScreen,
      toggleExpanded
    }
  }
}
</script>

<style scoped>
.simulator-backdrop { position: fixed; inset: 0; z-index: 1390; background: rgba(0, 0, 0, 0.82); backdrop-filter: blur(4px); }
.simulator-window { overflow: hidden; border: 1px solid #345f91; border-radius: 10px; background: #07111d; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.34); }
.simulator-window.expanded { position: fixed; inset: 28px; z-index: 1400; display: flex; flex-direction: column; border-radius: 14px; box-shadow: 0 24px 80px rgba(0, 0, 0, 0.72); }
.simulator-header { display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 8px 10px; border-bottom: 1px solid #294765; background: linear-gradient(90deg, #0b1c30, #102945); }
.simulator-title { display: flex; align-items: center; min-width: 0; gap: 8px; }
.simulator-title-icon { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: rgba(13, 110, 253, 0.2); color: #6ea8fe; }
.simulator-title div { display: flex; min-width: 0; flex-direction: column; }
.simulator-title strong { color: #e7f1ff; font-size: 0.8rem; }
.simulator-title small { color: #849bb5; font-size: 0.62rem; }
.simulator-status { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; color: #8fa6bc; font: 600 0.6rem monospace; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #718090; }
.status-dot.active { background: #36d28b; box-shadow: 0 0 8px rgba(54, 210, 139, 0.8); }
.simulator-icon-button { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid #355574; border-radius: 7px; background: #0c1d2e; color: #a9c9ed; }
.simulator-icon-button:hover { border-color: #0d6efd; background: #0d6efd; color: white; }
.simulator-stage { position: relative; height: 240px; min-height: 180px; background: #06111f; }
.expanded .simulator-stage { flex: 1; height: auto; }
.simulator-stage canvas { display: block; width: 100%; height: 100%; }
.hud-badge { position: absolute; display: flex; flex-direction: column; padding: 5px 7px; border: 1px solid rgba(95, 152, 207, 0.32); border-radius: 5px; background: rgba(4, 14, 25, 0.76); pointer-events: none; }
.hud-badge span { color: #7890a8; font: 0.52rem monospace; }
.hud-badge strong { color: #c6dcf3; font: 600 0.66rem monospace; }
.hud-top-left { top: 10px; left: 10px; }
.hud-bottom-right { right: 10px; bottom: 10px; }
.simulator-controls { display: flex; align-items: center; gap: 7px; padding: 9px 10px; border-top: 1px solid #294765; background: #091725; }

:global(body.light-theme .simulator-window) { border-color: #b7cadc; background: #ffffff; box-shadow: 0 7px 20px rgba(31, 65, 98, 0.13); }
:global(body.light-theme .simulator-header) { border-bottom-color: #c7d6e4; background: linear-gradient(90deg, #ffffff, #eaf2fa); }
:global(body.light-theme .simulator-title strong) { color: #18344d; }
:global(body.light-theme .simulator-title small),
:global(body.light-theme .simulator-status) { color: #637b91; }
:global(body.light-theme .simulator-icon-button) { border-color: #b9cad9; background: #ffffff; color: #315f88; }
:global(body.light-theme .simulator-controls) { border-top-color: #c7d6e4; background: #f3f7fb; }
.control-button { display: inline-flex; flex: 0 0 32px; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; border: 1px solid #355574; border-radius: 7px; background: #102236; color: #c4d7ea; font-family: inherit; font-size: 0.82rem; }
.control-button:hover { border-color: #5e92cc; background: #173451; color: white; }
.control-button.primary { border-color: #0d6efd; background: #0d6efd; color: white; }
.control-button.pause { border-color: #a77c27; color: #f1c75b; }
.control-button.pause:hover:not(:disabled),
.control-button.pause.active { background: #a97918; color: #ffffff; }
.control-button.stop { border-color: #a04a53; color: #ff7e87; }
.control-button.stop:hover:not(:disabled) { background: #b63844; color: #ffffff; }
.control-button:disabled { cursor: default; opacity: 0.42; }
.control-button.active:disabled { opacity: 1; }
.control-button.active { box-shadow: 0 0 0 2px rgba(110, 168, 254, 0.15); }
.control-button.stop.active { background: #b63844; color: #ffffff; }
.control-button.capture { margin-left: auto; border-color: #268d67; color: #6ed7ad; }
.control-hint { color: #617890; font-size: 0.58rem; }
@media (max-width: 600px) { .simulator-window.expanded { inset: 8px; } .control-hint { display: none; } }
</style>

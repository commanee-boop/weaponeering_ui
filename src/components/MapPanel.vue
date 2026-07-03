<template>
  <div v-if="isExpanded" class="map-backdrop" @click="toggleExpanded"></div>

  <section ref="panelElement" class="map-panel" :class="{ expanded: isExpanded }">
    <header class="map-toolbar">
      <div class="map-title">
        <span class="map-title-icon"><i class="bi bi-globe-asia-australia"></i></span>
        <div>
          <strong>Cesium 3D Target Map</strong>
          <small>{{ latitude.toFixed(4) }}, {{ longitude.toFixed(4) }}</small>
        </div>
      </div>
      <span class="map-live"><i></i> OFFLINE</span>
      <button
        type="button"
        class="map-expand-button"
        :title="isExpanded ? 'ย่อแผนที่' : 'ขยายแผนที่'"
        :aria-label="isExpanded ? 'ย่อแผนที่' : 'ขยายแผนที่'"
        @click="toggleExpanded"
      >
        <i class="bi" :class="isExpanded ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'"></i>
      </button>
    </header>

    <div class="map-container">
      <div ref="cesiumContainer" class="cesium-container"></div>
      <div v-if="isLoading" class="map-state">
        <span class="map-loader"></span>
        <strong>กำลังเปิดแผนที่ CesiumJS</strong>
        <small>โหลดข้อมูลจากภายในเครื่อง</small>
      </div>
      <div v-else-if="loadError" class="map-state error">
        <i class="bi bi-exclamation-triangle"></i>
        <strong>ไม่สามารถเปิดแผนที่ได้</strong>
        <small>{{ loadError }}</small>
      </div>

      <div class="coordinate-card">
        <span>TARGET COORDINATES</span>
        <strong>LAT {{ latitude.toFixed(5) }}</strong>
        <strong>LON {{ longitude.toFixed(5) }}</strong>
      </div>
      <div class="map-source-badge">
        <i class="bi bi-hdd"></i>
        <span>{{ sourceLabel }}</span>
      </div>
    </div>

    <footer class="map-info">
      <span><i class="zone-dot zone-red"></i>100m</span>
      <span><i class="zone-dot zone-orange"></i>200m</span>
      <span><i class="zone-dot zone-yellow"></i>300m</span>
      <span><i class="zone-dot zone-green"></i>500m</span>
      <small>{{ terrainLabel }} · ESC เพื่อปิดหน้าจอขยาย</small>
    </footer>
  </section>
</template>

<script>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  buildModuleUrl,
  Cartesian2,
  Cartesian3,
  Cesium3DTileset,
  CesiumTerrainProvider,
  Color,
  EllipsoidTerrainProvider,
  HeightReference,
  ImageryLayer,
  LabelStyle,
  Math as CesiumMath,
  TileMapServiceImageryProvider,
  Viewer
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

export default {
  name: 'MapPanel',
  props: {
    latitude: { type: Number, default: 16.8661 },
    longitude: { type: Number, default: 100.9948 }
  },
  setup(props) {
    const panelElement = ref(null)
    const cesiumContainer = ref(null)
    const isExpanded = ref(false)
    const isLoading = ref(true)
    const loadError = ref('')
    const sourceLabel = ref('NATURAL EARTH · LOCAL')
    const terrainLabel = ref('ELLIPSOID TERRAIN')
    let viewer = null
    let targetEntity = null
    let resizeObserver = null

    const createOfflineImagery = async () => {
      const localImageryUrl = import.meta.env.VITE_CESIUM_IMAGERY_URL
      if (localImageryUrl) {
        sourceLabel.value = 'LOCAL IMAGERY TILES'
        return TileMapServiceImageryProvider.fromUrl(localImageryUrl)
      }
      return TileMapServiceImageryProvider.fromUrl(
        buildModuleUrl('Assets/Textures/NaturalEarthII')
      )
    }

    const createOfflineTerrain = async () => {
      const localTerrainUrl = import.meta.env.VITE_CESIUM_TERRAIN_URL
      if (!localTerrainUrl) return new EllipsoidTerrainProvider()
      try {
        const terrain = await CesiumTerrainProvider.fromUrl(localTerrainUrl, {
          requestVertexNormals: true
        })
        terrainLabel.value = 'LOCAL 3D TERRAIN'
        return terrain
      } catch (error) {
        console.warn('Local terrain unavailable, using ellipsoid terrain.', error)
        terrainLabel.value = 'ELLIPSOID TERRAIN · FALLBACK'
        return new EllipsoidTerrainProvider()
      }
    }

    const addBufferZone = (radius, color) => {
      viewer.entities.add({
        position: Cartesian3.fromDegrees(props.longitude, props.latitude),
        ellipse: {
          semiMajorAxis: radius,
          semiMinorAxis: radius,
          material: color.withAlpha(0.12),
          outline: true,
          outlineColor: color.withAlpha(0.9),
          outlineWidth: 2,
          heightReference: HeightReference.CLAMP_TO_GROUND
        }
      })
    }

    const updateTarget = (flyTo = true) => {
      if (!viewer || !targetEntity) return
      const position = Cartesian3.fromDegrees(props.longitude, props.latitude)
      targetEntity.position = position
      const ellipses = viewer.entities.values.filter(entity => entity.ellipse)
      ellipses.forEach(entity => { entity.position = position })

      if (flyTo) {
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(props.longitude, props.latitude, 1800),
          orientation: {
            heading: 0,
            pitch: CesiumMath.toRadians(-68),
            roll: 0
          },
          duration: 1.25
        })
      }
      viewer.scene.requestRender()
    }

    const addOptional3DTiles = async () => {
      const tilesUrl = import.meta.env.VITE_CESIUM_3D_TILES_URL
      if (!tilesUrl) return
      try {
        const tileset = await Cesium3DTileset.fromUrl(tilesUrl)
        viewer.scene.primitives.add(tileset)
      } catch (error) {
        console.warn('Unable to load local 3D Tiles.', error)
      }
    }

    const initializeCesium = async () => {
      if (!cesiumContainer.value) return
      try {
        const [imageryProvider, terrainProvider] = await Promise.all([
          createOfflineImagery(),
          createOfflineTerrain()
        ])

        viewer = new Viewer(cesiumContainer.value, {
          baseLayer: new ImageryLayer(imageryProvider),
          terrainProvider,
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          navigationHelpButton: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          requestRenderMode: true,
          maximumRenderTimeChange: Infinity
        })

        viewer.scene.globe.depthTestAgainstTerrain = false
        viewer.scene.globe.baseColor = Color.fromCssColorString('#071521')
        viewer.scene.backgroundColor = Color.fromCssColorString('#050b12')

        addBufferZone(500, Color.LIME)
        addBufferZone(300, Color.YELLOW)
        addBufferZone(200, Color.ORANGE)
        addBufferZone(100, Color.RED)

        targetEntity = viewer.entities.add({
          name: 'Target Position',
          position: Cartesian3.fromDegrees(props.longitude, props.latitude),
          point: {
            pixelSize: 13,
            color: Color.RED,
            outlineColor: Color.WHITE,
            outlineWidth: 2,
            heightReference: HeightReference.CLAMP_TO_GROUND
          },
          label: {
            text: 'TARGET',
            font: '600 13px Kanit, sans-serif',
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 3,
            style: LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cartesian2(0, -28),
            heightReference: HeightReference.CLAMP_TO_GROUND
          }
        })

        await addOptional3DTiles()
        updateTarget(true)
        resizeObserver = new ResizeObserver(() => viewer?.resize())
        resizeObserver.observe(panelElement.value)
      } catch (error) {
        console.error('Cesium initialization failed.', error)
        loadError.value = error?.message || 'Cesium initialization failed'
      } finally {
        isLoading.value = false
      }
    }

    const toggleExpanded = async () => {
      isExpanded.value = !isExpanded.value
      document.body.style.overflow = isExpanded.value ? 'hidden' : ''
      await nextTick()
      viewer?.resize()
      viewer?.scene.requestRender()
    }

    const handleKeydown = event => {
      if (event.key === 'Escape' && isExpanded.value) toggleExpanded()
    }

    watch(
      () => [props.latitude, props.longitude],
      () => updateTarget(true)
    )

    onMounted(() => {
      window.addEventListener('keydown', handleKeydown)
      initializeCesium()
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown)
      resizeObserver?.disconnect()
      if (viewer && !viewer.isDestroyed()) viewer.destroy()
      document.body.style.overflow = ''
    })

    return {
      panelElement,
      cesiumContainer,
      isExpanded,
      isLoading,
      loadError,
      sourceLabel,
      terrainLabel,
      toggleExpanded
    }
  }
}
</script>

<style scoped>
.map-backdrop { position: fixed; inset: 0; z-index: 1390; background: rgba(0, 0, 0, 0.82); backdrop-filter: blur(4px); }
.map-panel { height: 100%; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #345f91; border-radius: 8px; background: #07111d; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.26); }
.map-panel.expanded { position: fixed; inset: 28px; z-index: 1400; height: auto; border-radius: 14px; box-shadow: 0 24px 80px rgba(0, 0, 0, 0.72); }
.map-toolbar { display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 8px 12px; border-bottom: 1px solid #294765; background: linear-gradient(90deg, #0b1c30, #102945); }
.map-title { display: flex; align-items: center; min-width: 0; gap: 9px; }
.map-title-icon { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 8px; background: rgba(13, 110, 253, 0.2); color: #6ea8fe; }
.map-title div { display: flex; flex-direction: column; }
.map-title strong { color: #e7f1ff; font-size: 0.82rem; }.map-title small { color: #849bb5; font: 0.62rem monospace; }
.map-live { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; color: #7fb99f; font: 600 0.58rem monospace; }.map-live i { width: 7px; height: 7px; border-radius: 50%; background: #36d28b; box-shadow: 0 0 8px rgba(54, 210, 139, 0.8); }
.map-expand-button { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1px solid #355574; border-radius: 7px; background: #0c1d2e; color: #a9c9ed; }.map-expand-button:hover { border-color: #0d6efd; background: #0d6efd; color: #fff; }
.map-container { position: relative; flex: 1; min-height: 280px; overflow: hidden; background: #06111f; }.cesium-container { position: absolute; inset: 0; }
.map-state { position: absolute; inset: 0; z-index: 8; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 7px; background: #071521; color: #d8e9fb; }.map-state small { color: #7890a8; font-size: 0.68rem; }.map-state.error i { color: #ffbd55; font-size: 1.5rem; }
.map-loader { width: 30px; height: 30px; border: 3px solid rgba(110, 168, 254, 0.2); border-top-color: #6ea8fe; border-radius: 50%; animation: mapSpin 0.8s linear infinite; }@keyframes mapSpin { to { transform: rotate(360deg); } }
.coordinate-card { position: absolute; top: 14px; left: 14px; z-index: 4; display: flex; flex-direction: column; padding: 8px 10px; border: 1px solid rgba(95, 152, 207, 0.4); border-radius: 7px; background: rgba(4, 14, 25, 0.78); pointer-events: none; }.coordinate-card span { color: #7890a8; font: 0.54rem monospace; }.coordinate-card strong { color: #c6dcf3; font: 600 0.68rem monospace; }
.map-source-badge { position: absolute; right: 12px; bottom: 10px; z-index: 4; display: inline-flex; align-items: center; gap: 5px; padding: 5px 7px; border: 1px solid rgba(95, 152, 207, 0.32); border-radius: 5px; background: rgba(4, 14, 25, 0.72); color: #91abc4; font: 0.55rem monospace; pointer-events: none; }
.map-info { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; min-height: 42px; padding: 8px 12px; border-top: 1px solid #294765; background: #091725; color: #9bb1c7; font-size: 0.66rem; }.map-info span { display: inline-flex; align-items: center; gap: 5px; }.map-info small { margin-left: auto; color: #617890; font-size: 0.58rem; }.zone-dot { width: 7px; height: 7px; border-radius: 50%; }.zone-green { background: #42ce8a; }.zone-yellow { background: #d9d74b; }.zone-orange { background: #ff9d3d; }.zone-red { background: #ff555f; }
:deep(.cesium-viewer), :deep(.cesium-viewer-cesiumWidgetContainer), :deep(.cesium-widget), :deep(.cesium-widget canvas) { width: 100%; height: 100%; }
:deep(.cesium-viewer-bottom) { bottom: 2px; }
@media (max-width: 600px) { .map-panel.expanded { inset: 8px; }.map-info small, .map-live { display: none; } }
</style>

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

<div class="map-container" @click="closeAllMenus">
      <div class="map-controls-left">
        <button type="button" class="layer-toggle-btn" @click.stop="toggleLayerMenu" aria-label="Layer control">
          <i class="bi bi-layers"></i>
        </button>

        <div v-if="layerMenuOpen" class="layer-menu-panel" @click.stop>
          <div class="layer-menu-header">
            <strong>Layer Control</strong>
            <small>กดเพื่อเปิด/ปิดชั้นข้อมูล</small>
          </div>
          <div v-for="layer in layers" :key="layer.key" class="layer-row">
            <button type="button" class="layer-row-button" @click.stop="toggleLayer(layer.key)">
              <i class="bi layer-row-icon" :class="layer.icon" aria-hidden="true"></i>
              <span class="layer-indicator" :class="{ active: layer.enabled }"></span>
              <span>{{ layer.label }}</span>
              <i class="bi" :class="layer.enabled ? 'bi-check2-square' : 'bi-square'" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="map-controls-right">
        <div class="right-btn-wrap">
          <button type="button" class="control-btn" @click.stop="handleRightMenuAction('measure', 'none')" title="Measure"><i class="bi bi-rulers"></i></button>
          <span class="control-label">Measure</span>
        </div>

        <div class="right-btn-wrap">
          <button type="button" class="control-btn" @click.stop="toggleRightMenu('annotation')" title="Annotation"><i class="bi bi-pencil"></i></button>
          <span class="control-label">Annotation</span>
          <div v-if="activeRightMenu === 'annotation'" class="right-menu-panel" @click.stop>
            <div class="layer-menu-header"><strong>Annotation</strong></div>
            <div v-for="item in rightMenus.annotation" :key="item.key" class="right-menu-item">
              <button type="button" class="right-menu-btn annotation-color-option" @click.stop="handleRightMenuAction('annotation', item.key)">
                <span class="annotation-color-dot" :style="{ backgroundColor: item.color }"></span>
                <span>{{ item.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="right-btn-wrap">
          <button type="button" class="control-btn" @click.stop="toggleRightMenu('info')" title="Info"><i class="bi bi-info-circle"></i></button>
          <span class="control-label">ข้อมูล</span>
          <div v-if="activeRightMenu === 'info'" class="right-menu-panel" @click.stop>
            <div class="layer-menu-header"><strong>Info</strong></div>
            <div v-for="item in rightMenus.info" :key="item.key" class="right-menu-item">
              <button type="button" class="right-menu-btn" @click.stop="handleRightMenuAction('info', item.key)">{{ item.label }}</button>
            </div>
          </div>
        </div>

        <div class="right-btn-wrap">
          <button type="button" class="control-btn" @click.stop="refreshMap" title="Refresh map"><i class="bi bi-arrow-clockwise"></i></button>
          <span class="control-label">รีเฟรช</span>
        </div>

        <div class="right-btn-wrap">
          <button type="button" class="control-btn" @click.stop="zoomIn" title="Zoom in"><i class="bi bi-plus"></i></button>
          <span class="control-label">ซูมเข้า</span>
        </div>

        <div class="right-btn-wrap">
          <button type="button" class="control-btn" @click.stop="zoomOut" title="Zoom out"><i class="bi bi-dash"></i></button>
          <span class="control-label">ซูมออก</span>
        </div>
      </div>

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
  UrlTemplateImageryProvider,
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
    const layerMenuOpen = ref(false)
    const layers = ref([
      { key: 'bufferZone', label: 'Buffer Zone', icon: 'bi-globe-asia-australia', enabled: true },
      { key: 'structures', label: 'สิ่งปลูกสร้าง', icon: 'bi-building', enabled: true },
      { key: 'roads', label: 'ถนน', icon: 'bi-map', enabled: true },
      { key: 'community', label: 'พื้นที่ชุมชน', icon: 'bi-house-door', enabled: true },
      { key: 'water', label: 'แหล่งน้ำ', icon: 'bi-droplet-fill', enabled: true },
      { key: 'green', label: 'พื้นที่สีเขียว', icon: 'bi-tree', enabled: true },
      { key: 'poi', label: 'จุดสำคัญ', icon: 'bi-pin-map-fill', enabled: true },
      { key: 'satellite', label: 'ภาพดาวเทียม', icon: 'bi-globe', enabled: true }
    ])
    
    
    let viewer = null
    let targetEntity = null
    let resizeObserver = null
    let baseImageryLayer = null
    let bufferZoneEntities = []
    const featureEntities = {}

    const toggleLayerMenu = () => {
      layerMenuOpen.value = !layerMenuOpen.value
    }

    const activeRightMenu = ref(null)
    const rightMenus = ref({
      measure: [
        { key: 'distance', label: 'วัดระยะทาง' },
        { key: 'area', label: 'วัดพื้นที่' },
        { key: 'clear', label: 'ล้างการวัด' }
      ],
      annotation: [
        { key: 'pin-red', label: 'สีแดง', color: '#ef4444' },
        { key: 'pin-yellow', label: 'สีเหลือง', color: '#facc15' },
        { key: 'pin-green', label: 'สีเขียว', color: '#22c55e' },
        { key: 'pin-white', label: 'สีขาว', color: '#ffffff' }
      ],
      info: [
        { key: 'about', label: 'ข้อมูลแผนที่' }
      ]
    })

    const toggleRightMenu = (key) => {
      if (activeRightMenu.value === key) {
        activeRightMenu.value = null
      } else {
        activeRightMenu.value = key
      }
    }

    const closeRightMenu = () => {
      activeRightMenu.value = null
    }

    const closeAllMenus = () => { closeLayerMenu(); closeRightMenu() }

    const addAnnotationPin = (color) => {
      console.log('Add annotation pin color', color)
      // TODO: implement adding pin entity in Cesium
      closeRightMenu()
    }

    const handleRightMenuAction = (menuKey, actionKey) => {
      if (menuKey === 'annotation') {
        if (actionKey.startsWith('pin-')) {
          addAnnotationPin(actionKey.replace('pin-', ''))
          return
        }
      }
      console.log('Right menu action', menuKey, actionKey)
      if (menuKey === 'measure') {
        // Measure button should do nothing for now
        return
      }
      closeRightMenu()
    }

    const closeLayerMenu = () => {
      layerMenuOpen.value = false
    }

    const setBaseImagery = (useSatellite) => {
      if (!viewer) return
      viewer.scene.imageryLayers.removeAll()
      const provider = useSatellite
        ? new UrlTemplateImageryProvider({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maximumLevel: 19
          })
        : TileMapServiceImageryProvider.fromUrl(buildModuleUrl('Assets/Textures/NaturalEarthII'))

      viewer.scene.imageryLayers.addImageryProvider(provider)
      sourceLabel.value = useSatellite ? 'ESRI SATELLITE' : 'NATURAL EARTH'
      baseImageryLayer = provider
      viewer.scene.requestRender()
    }

    const updateFeatureVisibility = () => {
      const visible = key => layers.value.find(layer => layer.key === key)?.enabled

      bufferZoneEntities.forEach(entity => { entity.show = visible('bufferZone') })
      if (featureEntities.structures) featureEntities.structures.show = visible('structures')
      if (featureEntities.roads) featureEntities.roads.show = visible('roads')
      if (featureEntities.community) featureEntities.community.show = visible('community')
      if (featureEntities.water) featureEntities.water.show = visible('water')
      if (featureEntities.green) featureEntities.green.show = visible('green')
      if (featureEntities.poi) featureEntities.poi.show = visible('poi')
      if (visible('satellite')) {
        setBaseImagery(true)
      } else {
        setBaseImagery(false)
      }
      viewer?.scene.requestRender()
    }

    const toggleLayer = (key) => {
      const layer = layers.value.find(layer => layer.key === key)
      if (!layer) return
      layer.enabled = !layer.enabled
      updateFeatureVisibility()
    }

    const activateMeasure = () => {
      console.log('Measure tool activated')
    }

    const activateAnnotation = () => {
      console.log('Annotation tool activated')
    }

    const showMapInfo = () => {
      layerMenuOpen.value = true
    }

    const refreshMap = () => {
      if (!viewer) return
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(props.longitude, props.latitude, 1800),
        orientation: { heading: 0, pitch: CesiumMath.toRadians(-68), roll: 0 },
        duration: 0.8
      })
      viewer.scene.requestRender()
    }

    const zoomIn = () => {
      if (!viewer) return
      viewer.camera.zoomIn(100)
      viewer.scene.requestRender()
    }

    const zoomOut = () => {
      if (!viewer) return
      viewer.camera.zoomOut(100)
      viewer.scene.requestRender()
    }

    const createOfflineImagery = async () => {
      const localImageryUrl = import.meta.env.VITE_CESIUM_IMAGERY_URL
      if (localImageryUrl) {
        sourceLabel.value = 'LOCAL IMAGERY TILES'
        return TileMapServiceImageryProvider.fromUrl(localImageryUrl)
      }

      sourceLabel.value = 'ESRI SATELLITE'
      return new UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 19
      })
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
      const entity = viewer.entities.add({
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
      bufferZoneEntities.push(entity)
    }

    const createFeatureEntities = () => {
      const centerLon = props.longitude
      const centerLat = props.latitude
      featureEntities.structures = viewer.entities.add({
        name: 'Structure Blocks',
        polygon: {
          hierarchy: Cartesian3.fromDegreesArray([
            centerLon + 0.008, centerLat + 0.006,
            centerLon + 0.012, centerLat + 0.006,
            centerLon + 0.012, centerLat + 0.002,
            centerLon + 0.008, centerLat + 0.002
          ]),
          material: Color.fromCssColorString('#ffb366').withAlpha(0.35),
          outline: true,
          outlineColor: Color.fromCssColorString('#ffb366').withAlpha(0.75)
        }
      })
      featureEntities.roads = viewer.entities.add({
        name: 'Road Network',
        polyline: {
          positions: Cartesian3.fromDegreesArray([
            centerLon - 0.015, centerLat + 0.003,
            centerLon + 0.020, centerLat + 0.003,
            centerLon + 0.020, centerLat - 0.007,
            centerLon - 0.015, centerLat - 0.007
          ]),
          width: 4,
          material: Color.fromCssColorString('#ffffff').withAlpha(0.85)
        }
      })
      featureEntities.community = viewer.entities.add({
        name: 'Community Area',
        polygon: {
          hierarchy: Cartesian3.fromDegreesArray([
            centerLon - 0.007, centerLat + 0.010,
            centerLon + 0.004, centerLat + 0.010,
            centerLon + 0.004, centerLat + 0.003,
            centerLon - 0.007, centerLat + 0.003
          ]),
          material: Color.fromCssColorString('#4dbd7a').withAlpha(0.25),
          outline: true,
          outlineColor: Color.fromCssColorString('#4dbd7a').withAlpha(0.9)
        }
      })
      featureEntities.water = viewer.entities.add({
        name: 'Water Area',
        polygon: {
          hierarchy: Cartesian3.fromDegreesArray([
            centerLon - 0.016, centerLat - 0.017,
            centerLon - 0.001, centerLat - 0.017,
            centerLon - 0.001, centerLat - 0.008,
            centerLon - 0.016, centerLat - 0.008
          ]),
          material: Color.fromCssColorString('#4b9cff').withAlpha(0.35),
          outline: true,
          outlineColor: Color.fromCssColorString('#4b9cff').withAlpha(0.85)
        }
      })
      featureEntities.green = viewer.entities.add({
        name: 'Green Area',
        polygon: {
          hierarchy: Cartesian3.fromDegreesArray([
            centerLon + 0.011, centerLat - 0.012,
            centerLon + 0.024, centerLat - 0.012,
            centerLon + 0.024, centerLat - 0.002,
            centerLon + 0.011, centerLat - 0.002
          ]),
          material: Color.fromCssColorString('#3dc281').withAlpha(0.22),
          outline: true,
          outlineColor: Color.fromCssColorString('#3dc281').withAlpha(0.78)
        }
      })
      featureEntities.poi = viewer.entities.add({
        name: 'Important Point',
        position: Cartesian3.fromDegrees(centerLon - 0.010, centerLat + 0.001, 10),
        point: {
          pixelSize: 14,
          color: Color.YELLOW,
          outlineColor: Color.WHITE,
          outlineWidth: 2
        },
        label: {
          text: 'POI',
          font: '600 12px Kanit, sans-serif',
          fillColor: Color.YELLOW,
          outlineColor: Color.BLACK,
          outlineWidth: 3,
          pixelOffset: new Cartesian2(0, -18),
          heightReference: HeightReference.CLAMP_TO_GROUND
        }
      })
      updateFeatureVisibility()
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

        createFeatureEntities()
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
      toggleExpanded,
      closeLayerMenu,
      closeAllMenus,
      layerMenuOpen,
      layers,
      toggleLayerMenu,
      toggleLayer,
      activateMeasure,
      activateAnnotation,
      activeRightMenu,
      rightMenus,
      toggleRightMenu,
      closeRightMenu,
      handleRightMenuAction,
      showMapInfo,
      refreshMap,
      zoomIn,
      zoomOut
    }
  }
}
</script>

<style scoped>
.map-backdrop { position: fixed; inset: 0; z-index: 1390; background: rgba(0, 0, 0, 0.82); backdrop-filter: blur(4px); }
.map-panel { position: relative; height: 100%; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #345f91; border-radius: 8px; background: #07111d; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.26); }
.map-panel.expanded { position: fixed; inset: 28px; z-index: 1400; height: auto; border-radius: 14px; box-shadow: 0 24px 80px rgba(0, 0, 0, 0.72); overflow: hidden; }
.map-toolbar { display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 8px 12px; border-bottom: 1px solid #294765; background: linear-gradient(90deg, #0b1c30, #102945); }
.map-title { display: flex; align-items: center; min-width: 0; gap: 9px; }
.map-title-icon { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 8px; background: rgba(13, 110, 253, 0.2); color: #6ea8fe; }
.map-title div { display: flex; flex-direction: column; }
.map-title strong { color: #e7f1ff; font-size: 0.82rem; }.map-title small { color: #849bb5; font: 0.62rem monospace; }
.map-live { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; color: #7fb99f; font: 600 0.58rem monospace; }.map-live i { width: 7px; height: 7px; border-radius: 50%; background: #36d28b; box-shadow: 0 0 8px rgba(54, 210, 139, 0.8); }
.map-expand-button { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 1px solid #355574; border-radius: 7px; background: #0c1d2e; color: #a9c9ed; }.map-expand-button:hover { border-color: #0d6efd; background: #0d6efd; color: #fff; }
.map-container { position: relative; flex: 1; min-height: 280px; overflow: hidden; background: #06111f; pointer-events: auto; }
.cesium-container { position: absolute; inset: 0; z-index: 0; pointer-events: auto; }
.map-controls-left, .map-controls-right { position: absolute; top: 18px; z-index: 10; display: flex; flex-direction: column; gap: 6px; pointer-events: auto; }
.map-controls-left { left: 12px; align-items: flex-start; overflow: visible; }
.map-controls-right { right: 12px; align-items: flex-end; }
.layer-toggle-btn, .map-controls-right button { position: relative; z-index: 11; width: 36px; height: 36px; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; background: rgba(3, 8, 14, 0.92); color: #e7f1ff; display: inline-flex; align-items: center; justify-content: center; transition: transform 0.12s ease, background 0.18s ease, box-shadow 0.18s ease; pointer-events: auto; box-shadow: 0 6px 16px rgba(2,6,20,0.5); }
.layer-toggle-btn:hover, .map-controls-right button:hover { transform: translateY(-1px); border-color: rgba(114,183,255,0.14); background: rgba(9, 29, 64, 0.96); }
.map-controls-right button { margin-bottom: 2px; }
.map-controls-right button i { font-size: 0.88rem; line-height: 1; }
.right-btn-wrap { position: relative; display: flex; flex-direction: column; align-items: center; gap: 3px; }
.control-btn { width: 36px; height: 36px; border-radius: 10px; }
.control-label { color: #9bb1c7; font-size: 0.54rem; line-height: 1.1; text-align: center; max-width: 56px; }
.layer-menu-panel { position: absolute; top: 0; left: calc(100% + 6px); width: 190px; padding: 6px; border-radius: 12px; background: rgba(5, 14, 28, 0.96); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 14px 24px rgba(0, 0, 0, 0.32); backdrop-filter: blur(14px); pointer-events: auto; }
.layer-menu-header { display: flex; flex-direction: column; gap: 3px; margin-bottom: 6px; color: #d8e9f3; }
.layer-menu-header strong { font-size: 0.88rem; }
.layer-menu-header small { color: #8aa0c4; font-size: 0.66rem; }
.layer-row { margin-bottom: 6px; }
.layer-row-button { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 6px 8px; border-radius: 10px; background: rgba(14, 30, 52, 0.88); border: 1px solid rgba(255, 255, 255, 0.06); color: #eef4ff; font-size: 0.8rem; transition: background 0.18s ease; }
.layer-row-button:hover { background: rgba(17, 41, 74, 0.96); }
.layer-row-icon { display: inline-flex; align-items: center; justify-content: center; width: 16px; min-width: 16px; height: 16px; color: #82caff; font-size: 0.88rem; margin-right: 6px; }
.layer-row-icon.bi-globe-asia-australia { color: #a2d3ff; }
.layer-row-icon.bi-building { color: #ffce73; }
.layer-row-icon.bi-map { color: #9beeeb; }
.layer-row-icon.bi-house-door { color: #ffc07c; }
.layer-row-icon.bi-droplet-fill { color: #57c7ff; }
.layer-row-icon.bi-tree { color: #76d28a; }
.layer-row-icon.bi-pin-map-fill { color: #ff6978; }
.layer-row-icon.bi-globe { color: #9aa7ff; }
.layer-label { flex: 1 1 auto; min-width: 0; }
.map-state { position: absolute; inset: 0; z-index: 8; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 7px; background: #071521; color: #d8e9fb; }.map-state small { color: #7890a8; font-size: 0.68rem; }.map-state.error i { color: #ffbd55; font-size: 1.5rem; }
.map-loader { width: 30px; height: 30px; border: 3px solid rgba(110, 168, 254, 0.2); border-top-color: #6ea8fe; border-radius: 50%; animation: mapSpin 0.8s linear infinite; }@keyframes mapSpin { to { transform: rotate(360deg); } }
.coordinate-card { position: absolute; top: 14px; left: 72px; z-index: 4; display: flex; flex-direction: column; padding: 8px 10px; border: 1px solid rgba(95, 152, 207, 0.4); border-radius: 7px; background: rgba(4, 14, 25, 0.78); pointer-events: none; }.coordinate-card span { color: #7890a8; font: 0.54rem monospace; }.coordinate-card strong { color: #c6dcf3; font: 600 0.68rem monospace; }
.map-source-badge { position: absolute; right: 12px; bottom: 10px; z-index: 4; display: inline-flex; align-items: center; gap: 5px; padding: 5px 7px; border: 1px solid rgba(95, 152, 207, 0.32); border-radius: 5px; background: rgba(4, 14, 25, 0.72); color: #91abc4; font: 0.55rem monospace; pointer-events: none; }
.map-info { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; min-height: 42px; padding: 8px 12px; border-top: 1px solid #294765; background: #091725; color: #9bb1c7; font-size: 0.66rem; }.map-info span { display: inline-flex; align-items: center; gap: 5px; }.map-info small { margin-left: auto; color: #617890; font-size: 0.58rem; }.zone-dot { width: 7px; height: 7px; border-radius: 50%; }.zone-green { background: #42ce8a; }.zone-yellow { background: #d9d74b; }.zone-orange { background: #ff9d3d; }.zone-red { background: #ff555f; }
.right-menu-panel { position: absolute; top: 0; right: calc(100% + 8px); width: 176px; padding: 8px; border-radius: 12px; background: rgba(4,10,18,0.98); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 14px 24px rgba(0,0,0,0.38); backdrop-filter: blur(10px); pointer-events: auto; }
.right-menu-panel .layer-menu-header { margin-bottom: 6px; }
.right-menu-panel .layer-menu-header strong { color: #f3f9ff; font-size: 0.9rem; }
.right-menu-panel .right-menu-item { margin-bottom: 6px; }
.right-menu-panel .right-menu-btn { padding: 8px 10px; border-radius: 10px; font-size: 0.84rem; }
.right-menu-panel .right-menu-btn:last-child { margin-bottom: 0; }
.right-menu-panel.inline-menu { position: static; top: auto; right: auto; width: 100%; padding: 0; border-radius: 0; background: transparent; border: none; box-shadow: none; }
.right-menu-panel.inline-menu .layer-menu-header { margin-bottom: 6px; }
.right-menu-panel.inline-menu .right-menu-item { margin-bottom: 6px; }
.right-menu-panel.inline-menu .right-menu-btn { width: 100%; padding: 8px 10px; border-radius: 12px; background: rgba(18,28,40,0.96); border: 1px solid rgba(255,255,255,0.06); white-space: normal; text-align: center; color: #f6fbff; }
.right-menu-panel.inline-menu .right-menu-btn:hover { background: rgba(26,44,72,0.98); }
.right-menu-panel.inline-menu .right-menu-btn { width: 100%; display: block; align-items: stretch; gap: 0; padding: 8px 10px; border-radius: 12px; background: rgba(18,28,40,0.96); border: 1px solid rgba(255,255,255,0.06); color: #f6fbff; text-align: center; font-size: 0.92rem; box-sizing: border-box; }
.right-menu-panel.inline-menu .right-menu-btn i { display: none; }
.right-menu-item { margin-bottom: 8px; }
.right-menu-btn { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; background: rgba(18,28,40,0.96); border: 1px solid rgba(255,255,255,0.06); color: #f6fbff; text-align: left; font-size: 0.9rem; box-sizing: border-box; white-space: nowrap; }
.right-menu-btn:hover { background: rgba(26,44,72,0.98); }
.annotation-color-option { justify-content: flex-start; }
.annotation-color-dot { width: 14px; height: 14px; flex: 0 0 14px; border: 1px solid rgba(255,255,255,0.58); border-radius: 50%; box-shadow: 0 0 0 2px rgba(255,255,255,0.06); }

:global(body.light-theme .map-panel) { border-color: #b7cadc; background: #ffffff; box-shadow: 0 7px 20px rgba(31, 65, 98, 0.13); }
:global(body.light-theme .map-toolbar) { border-bottom-color: #c7d6e4; background: linear-gradient(90deg, #ffffff, #eaf2fa); }
:global(body.light-theme .map-title strong) { color: #18344d; }
:global(body.light-theme .map-title small) { color: #637b91; }
:global(body.light-theme .map-expand-button) { border-color: #b9cad9; background: #ffffff; color: #315f88; }
:global(body.light-theme .map-info) { border-top-color: #c7d6e4; background: #f3f7fb; color: #46627b; }
:global(body.light-theme .map-info small) { color: #70879c; }

/* Ensure buttons inside the right-menu-panel override the parent toolbar button rules */
.right-menu-panel .right-menu-btn { width: 100% !important; }

/* slightly emphasize the header */
.right-menu-panel .layer-menu-header strong { color: #f3f9ff; font-size: 1rem; }
:deep(.cesium-viewer), :deep(.cesium-viewer-cesiumWidgetContainer), :deep(.cesium-widget), :deep(.cesium-widget canvas) { width: 100%; height: 100%; }
:deep(.cesium-viewer-bottom) { bottom: 2px; }
@media (max-width: 600px) {
  .map-panel.expanded { inset: 6px; }
  .map-toolbar { min-height: 52px; padding: 7px 8px; gap: 7px; }
  .map-title-icon { width: 32px; height: 32px; }
  .map-title small, .map-info small, .map-live { display: none; }
  .map-title strong { font-size: 0.74rem; }
  .map-expand-button { width: 38px; height: 38px; }
  .map-container { min-height: 330px; }
  .map-controls-left, .map-controls-right { top: 10px; gap: 4px; }
  .map-controls-left { left: 7px; }
  .map-controls-right { right: 7px; }
  .layer-toggle-btn, .map-controls-right button, .control-btn { width: 40px; height: 40px; }
  .control-label { display: none; }
  .layer-menu-panel { width: min(205px, calc(100vw - 72px)); max-height: 72dvh; overflow-y: auto; }
  .right-menu-panel { width: min(190px, calc(100vw - 68px)); max-height: 72dvh; overflow-y: auto; }
  .coordinate-card { top: 9px; left: 56px; padding: 6px 8px; }
  .map-source-badge { right: 7px; bottom: 7px; }
  .map-info { flex-wrap: nowrap; gap: 10px; min-height: 38px; overflow-x: auto; padding: 7px 9px; white-space: nowrap; }
}
</style>

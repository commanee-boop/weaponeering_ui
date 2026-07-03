import { createRouter, createWebHashHistory } from 'vue-router'
import Analysis from '../views/Analysis.vue'
import Reports from '../views/Reports.vue'

const routes = [
  {
    path: '/',
    redirect: '/analysis'
  },
  {
    path: '/analysis',
    name: 'Analysis',
    component: Analysis
  },
  {
    path: '/reports',
    name: 'Reports',
    component: Reports
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

export default router

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { VPNApi } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const isAuthenticated = ref(false)
  const serverInfo = ref({
    host: '',
    port: '',
    username: '',
    ignoreHttpsErrors: false
  })
  const loading = ref(false)
  const error = ref(null)
  const hubList = ref([])
  let api = null

  // Getters
  const isLoggedIn = computed(() => isAuthenticated.value)
  const currentServer = computed(() => serverInfo.value)
  const hasError = computed(() => error.value !== null)
  const hubs = computed(() => hubList.value)
  const getApi = () => api // Expose API instance

  // Actions
  const login = async (credentials) => {
    loading.value = true
    error.value = null
    
    try {
      // Remove protocol from the host if it exists
      const host = credentials.host.replace(/^https?:\/\//, '')
      const baseURL = `${host}:${credentials.port}`
      console.log('Base URL:', baseURL)
      
      api = new VPNApi(
        baseURL,
        credentials.password,
        credentials.username,
        credentials.ignoreHttpsErrors
      )

      const result = await api.login()
      
      if (result.success) {
        // Store server information
        serverInfo.value = {
          host: credentials.host,
          port: credentials.port,
          username: credentials.username,
          ignoreHttpsErrors: credentials.ignoreHttpsErrors
        }
        
        // Store hub list
        hubList.value = result.hubs
        
        isAuthenticated.value = true
        return true
      } else {
        error.value = result.error
        return false
      }
    } catch (err) {
      error.value = err.message || 'Failed to connect to the server'
      return false
    } finally {
      loading.value = false
    }
  }

  const refreshHubs = async () => {
    if (!api || !isAuthenticated.value) return false

    loading.value = true
    error.value = null

    try {
      const result = await api.login()
      if (result.success) {
        hubList.value = result.hubs
        error.value = null
        return true
      } else {
        error.value = result.error
        return false
      }
    } catch (err) {
      error.value = err.message || 'Failed to refresh hubs'
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    isAuthenticated.value = false
    serverInfo.value = {
      host: '',
      port: '',
      username: '',
      ignoreHttpsErrors: false
    }
    hubList.value = []
    error.value = null
    api = null
  }

  const clearError = () => {
    error.value = null
  }

  const createHub = async ({ hubName, adminPassword, options }) => {
    const result = await api.createHub(hubName, adminPassword, options)
    if (!result.success) {
      error.value = result.error
    }
    return result
  }

  const deleteHub = async (hubName) => {
    const result = await api.deleteHub(hubName)
    if (!result.success) {
      error.value = result.error
    }
    return result
  }

  return {
    // State
    isAuthenticated,
    serverInfo,
    loading,
    error,
    hubList,
    
    // Getters
    isLoggedIn,
    currentServer,
    hasError,
    hubs,
    getApi,
    
    // Actions
    login,
    logout,
    clearError,
    refreshHubs,
    createHub,
    deleteHub
  }
}) 
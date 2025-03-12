<template>
  <AppLayout>
    <div class="logs">
      <header class="page-header">
        <h1>Server Logs</h1>
        <div class="actions">
          <button class="action-button refresh" @click="refreshData" :disabled="isLoading">
            <i class="fas fa-sync-alt" :class="{ 'rotating': isLoading }"></i>
            {{ isLoading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </header>

      <!-- Error Alert -->
      <div v-if="error" class="error-alert">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ error }}</span>
        <button class="close-button" @click="error = null">&times;</button>
      </div>

      <div class="logs-container">
        <!-- Log Files List -->
        <div class="log-files-panel">
          <div class="panel-header">
            <h2>Log Files</h2>
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Search logs..."
              >
            </div>
          </div>
          
          <div class="log-files-list">
            <div 
              v-for="log in filteredLogs" 
              :key="log.FilePath_str"
              class="log-file-item"
              :class="{ active: selectedLog?.FilePath_str === log.FilePath_str }"
              @click="selectLog(log)"
            >
              <div class="log-file-info">
                <div class="log-file-name">
                  <i class="fas fa-file-alt"></i>
                  <span>{{ log.FilePath_str }}</span>
                </div>
                <div class="log-file-details">
                  <span class="server-name">{{ log.ServerName_str }}</span>
                  <span class="file-size">{{ formatFileSize(log.FileSize_u32) }}</span>
                </div>
                <div class="log-file-time">
                  {{ formatDate(log.UpdatedTime_dt) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Log Content -->
        <div class="log-content-panel">
          <div class="panel-header" v-if="selectedLog">
            <div class="header-content">
              <h2>{{ selectedLog.FilePath_str }}</h2>
              <div class="search-box">
                <i class="fas fa-search"></i>
                <input 
                  type="text" 
                  v-model="contentSearchQuery" 
                  placeholder="Search in log..."
                >
                <span class="match-count" v-if="contentSearchQuery && !isLoadingContent">
                  {{ currentMatchIndex + 1 }} / {{ matchCount }}
                </span>
                <div class="search-actions" v-if="contentSearchQuery && !isLoadingContent">
                  <button 
                    class="icon-button"
                    @click="previousMatch"
                    :disabled="currentMatchIndex <= 0"
                  >
                    <i class="fas fa-chevron-up"></i>
                  </button>
                  <button 
                    class="icon-button"
                    @click="nextMatch"
                    :disabled="currentMatchIndex >= matchCount - 1"
                  >
                    <i class="fas fa-chevron-down"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="content-actions">
              <button 
                class="action-button"
                @click="downloadLog"
                :disabled="!selectedLog || isLoading"
              >
                <i class="fas fa-download"></i>
                Download
              </button>
            </div>
          </div>

          <div v-if="selectedLog" class="log-content">
            <div v-if="isLoadingContent" class="loading-content">
              <i class="fas fa-circle-notch fa-spin"></i>
              Loading log content...
            </div>
            <pre v-else ref="logContentRef" v-html="highlightedContent"></pre>
          </div>

          <div v-else class="no-selection">
            <i class="fas fa-file-alt"></i>
            <p>Select a log file to view its contents</p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const isLoading = ref(false)
const isLoadingContent = ref(false)
const error = ref(null)
const searchQuery = ref('')
const logs = ref([])
const selectedLog = ref(null)
const logContent = ref('')
const contentSearchQuery = ref('')
const currentMatchIndex = ref(0)
const logContentRef = ref(null)
const matchPositions = ref([])

const refreshData = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    const result = await auth.getApi().getLogFiles()
    if (result.success) {
      logs.value = result.logs
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const selectLog = async (log) => {
  selectedLog.value = log
  await loadLogContent(log)
}

const loadLogContent = async (log) => {
  isLoadingContent.value = true
  logContent.value = ''
  
  try {
    const result = await auth.getApi().readLogFile(log.FilePath_str)
    if (result.success) {
      logContent.value = result.content
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoadingContent.value = false
  }
}

const downloadLog = async () => {
  if (!selectedLog.value) return

  try {
    const result = await auth.getApi().readLogFile(selectedLog.value.FilePath_str)
    if (result.success) {
      // Create and trigger download
      const blob = new Blob([result.content], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = selectedLog.value.FilePath_str.replace(/\//g, '_') // Replace slashes with underscores for valid filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  }
}

const filteredLogs = computed(() => {
  if (!searchQuery.value) return logs.value
  
  const query = searchQuery.value.toLowerCase()
  return logs.value.filter(log => 
    log.ServerName_str.toLowerCase().includes(query) ||
    log.FilePath_str.toLowerCase().includes(query)
  )
})

const getFileName = (path) => {
  return path.split('/').pop() || path
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

// Computed property for highlighted content
const highlightedContent = computed(() => {
  if (!contentSearchQuery.value) return logContent.value

  const escapedQuery = contentSearchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escapedQuery, 'gi')
  
  // Find all matches and store their positions
  matchPositions.value = []
  let match
  while ((match = regex.exec(logContent.value)) !== null) {
    matchPositions.value.push(match.index)
  }

  // Highlight the current match differently
  let result = logContent.value
  matchPositions.value.forEach((pos, index) => {
    const highlightClass = index === currentMatchIndex.value ? 'current-match' : 'match'
    const replacement = `<span class="${highlightClass}">${logContent.value.substr(pos, contentSearchQuery.value.length)}</span>`
    result = result.slice(0, pos) + replacement + result.slice(pos + contentSearchQuery.value.length)
  })

  return result
})

const matchCount = computed(() => matchPositions.value.length)

// Navigation methods
const scrollToMatch = (index) => {
  if (!logContentRef.value) return
  
  const matches = logContentRef.value.getElementsByClassName('current-match')
  if (matches.length > 0) {
    matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const nextMatch = () => {
  if (currentMatchIndex.value < matchCount.value - 1) {
    currentMatchIndex.value++
    scrollToMatch(currentMatchIndex.value)
  }
}

const previousMatch = () => {
  if (currentMatchIndex.value > 0) {
    currentMatchIndex.value--
    scrollToMatch(currentMatchIndex.value)
  }
}

// Reset search when changing files
watch(selectedLog, () => {
  contentSearchQuery.value = ''
  currentMatchIndex.value = 0
})

// Reset current match index when search query changes
watch(contentSearchQuery, () => {
  currentMatchIndex.value = 0
  if (contentSearchQuery.value && matchCount.value > 0) {
    scrollToMatch(0)
  }
})

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.logs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logs-container {
  display: flex;
  flex-grow: 1;
  gap: 1rem;
  padding: 0 1rem 1rem;
  height: calc(100vh - 180px);
}

.log-files-panel {
  width: 350px;
  min-width: 350px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.log-content-panel {
  flex-grow: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #2d3748;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-grow: 1;
  margin-right: 1rem;
}

.panel-header .search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: white;
}

.search-box input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.875rem;
}

.search-box i {
  color: #a0aec0;
}

.log-files-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.log-file-item {
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.log-file-item:hover {
  background-color: #f7fafc;
}

.log-file-item.active {
  background-color: #ebf8ff;
}

.log-file-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.log-file-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #2d3748;
  word-break: break-all;
  font-size: 0.85rem;
}

.log-file-name i {
  flex-shrink: 0;
}

.log-file-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #718096;
}

.log-file-time {
  font-size: 0.75rem;
  color: #a0aec0;
}

.log-content {
  flex-grow: 1;
  padding: 1rem;
  overflow-y: auto;
  background: #f8fafc;
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.log-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.no-selection {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  gap: 1rem;
}

.no-selection i {
  font-size: 3rem;
}

.loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #718096;
  padding: 2rem;
}

.content-actions {
  flex-shrink: 0;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background-color: white;
  border: 1px solid #e2e8f0;
  color: #4a5568;
}

.action-button:hover {
  opacity: 0.9;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-alert {
  margin: 0 1rem 1rem;
  background-color: #fff5f5;
  border: 1px solid #feb2b2;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.match-count {
  font-size: 0.75rem;
  color: #718096;
  white-space: nowrap;
}

.search-actions {
  display: flex;
  gap: 0.25rem;
}

.icon-button {
  background: none;
  border: none;
  color: #718096;
  padding: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-button:hover:not(:disabled) {
  color: #2d3748;
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Highlight styles */
:deep(.match) {
  background-color: rgba(246, 224, 94, 0.3);
  border-radius: 2px;
}

:deep(.current-match) {
  background-color: rgba(246, 224, 94, 0.8);
  border-radius: 2px;
}

.header-content h2 {
  word-break: break-all;
  line-height: 1.4;
  font-size: 1.1rem;
}
</style> 
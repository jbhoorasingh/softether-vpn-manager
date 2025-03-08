<template>
  <AppLayout>
    <div class="capabilities">
      <header class="page-header">
        <h1>Server Capabilities</h1>
        <div class="actions">
          <button class="action-button refresh" @click="refreshData" :disabled="isLoading">
            <i class="fas fa-sync-alt" :class="{ 'rotating': isLoading }"></i>
            {{ isLoading ? 'Refreshing...' : 'Refresh' }}
          </button>
          <button 
            class="action-button"
            @click="toggleCapabilitiesView"
          >
            <i class="fas" :class="showAllCapabilities ? 'fa-compress-alt' : 'fa-expand-alt'"></i>
            {{ showAllCapabilities ? 'Show Less' : 'Show All' }}
          </button>
        </div>
      </header>

      <!-- Error Alert -->
      <div v-if="error" class="error-alert">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ error }}</span>
        <button class="close-button" @click="error = null">&times;</button>
      </div>

      <!-- Capabilities Summary -->
      <div class="summary-stats">
        <div class="stat-card">
          <div class="stat-header">
            <i class="fas fa-check-circle"></i>
            <span>Enabled Features</span>
          </div>
          <div class="stat-value">{{ enabledCount }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-header">
            <i class="fas fa-times-circle"></i>
            <span>Disabled Features</span>
          </div>
          <div class="stat-value">{{ disabledCount }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-header">
            <i class="fas fa-list"></i>
            <span>Total Features</span>
          </div>
          <div class="stat-value">{{ totalCount }}</div>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="filter-section">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search capabilities..."
          >
        </div>
        <div class="filter-options">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="showEnabled"
            >
            Show Enabled
          </label>
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="showDisabled"
            >
            Show Disabled
          </label>
        </div>
      </div>

      <!-- Capabilities Grid -->
      <div class="capabilities-grid">
        <div 
          v-for="cap in filteredCapabilities" 
          :key="cap.CapsName_str" 
          class="capability-card"
        >
          <div class="capability-header">
            <h3>{{ formatCapabilityName(cap.CapsName_str) }}</h3>
            <span class="capability-value" :class="{ 'enabled': cap.CapsValue_u32 > 0 }">
              {{ cap.CapsValue_u32 > 0 ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
          <p class="capability-description">{{ cap.CapsDescrption_utf }}</p>
          <div class="capability-details" v-if="cap.CapsValue_u32 > 0">
            <span class="detail-value">Value: {{ cap.CapsValue_u32 }}</span>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const isLoading = ref(false)
const error = ref(null)
const showAllCapabilities = ref(false)
const searchQuery = ref('')
const showEnabled = ref(true)
const showDisabled = ref(true)

const capabilities = ref([])

const formatCapabilityName = (name) => {
  return name
    .replace(/_str$/, '')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const toggleCapabilitiesView = () => {
  showAllCapabilities.value = !showAllCapabilities.value
}

const refreshData = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    const result = await auth.getApi().getServerCapabilities()
    if (result.success) {
      capabilities.value = result.capabilities
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

// Computed properties for statistics
const enabledCount = computed(() => 
  capabilities.value.filter(cap => cap.CapsValue_u32 > 0).length
)

const disabledCount = computed(() => 
  capabilities.value.filter(cap => cap.CapsValue_u32 === 0).length
)

const totalCount = computed(() => capabilities.value.length)

// Filtered capabilities based on search and filters
const filteredCapabilities = computed(() => {
  return capabilities.value.filter(cap => {
    const matchesSearch = searchQuery.value === '' || 
      formatCapabilityName(cap.CapsName_str).toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      cap.CapsDescrption_utf.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = (cap.CapsValue_u32 > 0 && showEnabled.value) ||
      (cap.CapsValue_u32 === 0 && showDisabled.value)

    return matchesSearch && matchesStatus
  })
})

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.capabilities {
  padding: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.actions {
  display: flex;
  gap: 1rem;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4a5568;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: #2d3748;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  max-width: 400px;
}

.search-box input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
}

.search-box i {
  color: #718096;
}

.filter-options {
  display: flex;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4a5568;
  cursor: pointer;
}

.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.capability-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.capability-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.capability-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #2d3748;
  font-weight: 500;
}

.capability-value {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  background-color: #e2e8f0;
  color: #4a5568;
}

.capability-value.enabled {
  background-color: #9ae6b4;
  color: #22543d;
}

.capability-description {
  font-size: 0.875rem;
  color: #718096;
  margin: 0.5rem 0;
}

.capability-details {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e2e8f0;
}

.detail-value {
  font-size: 0.875rem;
  color: #4a5568;
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

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-alert {
  background-color: #fff5f5;
  border: 1px solid #feb2b2;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
</style> 
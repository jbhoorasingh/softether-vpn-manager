<template>
  <AppLayout>
    <div class="hubs">
      <header class="page-header">
        <h1>Virtual Hubs</h1>
        <div class="actions">
          <button class="action-button refresh" @click="refreshData" :disabled="isLoading">
            <i class="fas fa-sync-alt" :class="{ 'rotating': isLoading }"></i>
            {{ isLoading ? 'Refreshing...' : 'Refresh' }}
          </button>
          <button class="action-button primary" @click="showNewHubModal = true">
            <i class="fas fa-plus"></i>
            New Hub
          </button>
        </div>
      </header>

      <!-- Error Alert -->
      <div v-if="auth.error" class="error-alert">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ auth.error }}</span>
        <button class="close-button" @click="auth.clearError">&times;</button>
      </div>

      <!-- Hub List -->
      <div class="hub-list" v-if="auth.hubs.length > 0">
        <div v-for="hub in auth.hubs" :key="hub.HubName_str" class="hub-card" @click="$router.push(`/hubs/${hub.HubName_str}`)">
          <div class="hub-header">
            <div class="hub-title">
              <span class="status-dot" :class="{ 'online': hub.Online_bool }"></span>
              <h3>{{ hub.HubName_str }}</h3>
            </div>
            <div class="hub-actions" @click.stop>
              <button class="icon-button" title="Edit Hub">
                <i class="fas fa-edit"></i>
              </button>
              <button 
                class="icon-button" 
                title="Delete Hub"
                @click="confirmDeleteHub(hub.HubName_str)"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div class="hub-stats">
            <div class="stat-row">
              <div class="stat-item">
                <span class="label">Status</span>
                <span class="value" :class="{ 'text-success': hub.Online_bool }">
                  {{ hub.Online_bool ? 'Online' : 'Offline' }}
                </span>
              </div>
              <div class="stat-item">
                <span class="label">Hub Type</span>
                <span class="value">{{ getHubType(hub.HubType_u32) }}</span>
              </div>
            </div>
            
            <div class="stat-row">
              <div class="stat-item">
                <span class="label">Users</span>
                <span class="value">{{ hub.NumUsers_u32 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">Groups</span>
                <span class="value">{{ hub.NumGroups_u32 }}</span>
              </div>
            </div>

            <div class="stat-row">
              <div class="stat-item">
                <span class="label">Sessions</span>
                <span class="value">{{ hub.NumSessions_u32 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">Active Users</span>
                <span class="value">{{ hub.NumLogin_u32 }}</span>
              </div>
            </div>

            <div class="stat-row">
              <div class="stat-item">
                <span class="label">MAC Table Entries</span>
                <span class="value">{{ hub.NumMacTables_u32 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">IP Table Entries</span>
                <span class="value">{{ hub.NumIpTables_u32 }}</span>
              </div>
            </div>

            <div class="stat-row">
              <div class="stat-item full-width">
                <span class="label">Unicast Traffic</span>
                <div class="traffic-stats">
                  <span class="traffic-item">
                    <i class="fas fa-arrow-down"></i>
                    {{ formatBytes(hub['Ex.Recv.UnicastBytes_u64']) }}
                    ({{ hub['Ex.Recv.UnicastCount_u64'] }} packets)
                  </span>
                  <span class="traffic-item">
                    <i class="fas fa-arrow-up"></i>
                    {{ formatBytes(hub['Ex.Send.UnicastBytes_u64']) }}
                    ({{ hub['Ex.Send.UnicastCount_u64'] }} packets)
                  </span>
                </div>
              </div>
            </div>

            <div class="stat-row">
              <div class="stat-item full-width">
                <span class="label">Broadcast Traffic</span>
                <div class="traffic-stats">
                  <span class="traffic-item">
                    <i class="fas fa-arrow-down"></i>
                    {{ formatBytes(hub['Ex.Recv.BroadcastBytes_u64']) }}
                    ({{ hub['Ex.Recv.BroadcastCount_u64'] }} packets)
                  </span>
                  <span class="traffic-item">
                    <i class="fas fa-arrow-up"></i>
                    {{ formatBytes(hub['Ex.Send.BroadcastBytes_u64']) }}
                    ({{ hub['Ex.Send.BroadcastCount_u64'] }} packets)
                  </span>
                </div>
              </div>
            </div>

            <div class="stat-row timestamps">
              <div class="stat-item full-width">
                <span class="label">Timestamps</span>
                <div class="timestamp-list">
                  <div class="timestamp-item">
                    <span class="timestamp-label">Last Communication:</span>
                    <span class="timestamp-value">{{ formatDate(hub.LastCommTime_dt) }}</span>
                  </div>
                  <div class="timestamp-item">
                    <span class="timestamp-label">Last Login:</span>
                    <span class="timestamp-value">{{ formatDate(hub.LastLoginTime_dt) }}</span>
                  </div>
                  <div class="timestamp-item">
                    <span class="timestamp-label">Created:</span>
                    <span class="timestamp-value">{{ formatDate(hub.CreatedTime_dt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <i class="fas fa-network-wired"></i>
        <p>No virtual hubs found</p>
        <button class="action-button primary">Create your first hub</button>
      </div>
    </div>
  </AppLayout>
  <NewHubModal 
    v-model="showNewHubModal"
    @hub-created="onHubCreated"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import NewHubModal from '../components/NewHubModal.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const isLoading = ref(false)
const showNewHubModal = ref(false)

const refreshData = async () => {
  if (isLoading.value) return // Prevent multiple simultaneous refreshes
  
  isLoading.value = true
  auth.clearError() // Clear any existing errors
  
  try {
    const success = await auth.refreshHubs()
    if (!success) {
      console.error('Failed to refresh hubs')
    }
  } catch (error) {
    console.error('Error refreshing hubs:', error)
  } finally {
    isLoading.value = false
  }
}

const confirmDeleteHub = async (hubName) => {
  if (!confirm(`Are you sure you want to delete the hub "${hubName}"? This action cannot be undone.`)) {
    return
  }

  try {
    const result = await auth.deleteHub(hubName)
    if (result.success) {
      refreshData() // Refresh the hub list after successful deletion
    }
  } catch (error) {
    console.error('Error deleting hub:', error)
  }
}

const onHubCreated = () => {
  refreshData()
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const getHubType = (type) => {
  switch (type) {
    case 0: return 'Stand-alone'
    case 1: return 'Static'
    case 2: return 'Dynamic'
    default: return 'Unknown'
  }
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.hubs {
  height: 100%;
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
}

.action-button.refresh {
  background-color: white;
  border: 1px solid #e2e8f0;
  color: #4a5568;
}

.action-button.primary {
  background-color: #1a202c;
  border: none;
  color: white;
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

.hub-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.hub-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.hub-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.hub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.hub-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hub-title h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #a0aec0;
}

.status-dot.online {
  background-color: #48bb78;
}

.hub-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-button {
  background: none;
  border: none;
  color: #718096;
  padding: 0.25rem;
  cursor: pointer;
  transition: color 0.2s;
}

.icon-button:hover {
  color: #2d3748;
}

.hub-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-row {
  display: flex;
  gap: 1rem;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-item.full-width {
  flex: 0 0 100%;
}

.label {
  font-size: 0.75rem;
  color: #718096;
}

.value {
  font-size: 0.875rem;
  color: #2d3748;
  font-weight: 500;
}

.text-success {
  color: #48bb78;
}

.timestamps {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.timestamp-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.timestamp-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.timestamp-label {
  color: #718096;
}

.timestamp-value {
  color: #2d3748;
}

.traffic-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.traffic-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-state i {
  font-size: 3rem;
  color: #a0aec0;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #718096;
  margin-bottom: 1.5rem;
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
  font-size: 0.875rem;
}

.error-alert i {
  font-size: 1rem;
}

.close-button {
  margin-left: auto;
  background: none;
  border: none;
  color: #c53030;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.close-button:hover {
  opacity: 0.7;
}
</style> 
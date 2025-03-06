<template>
  <AppLayout>
    <div class="hubs">
      <header class="page-header">
        <h1>Virtual Hubs</h1>
        <div class="actions">
          <button class="action-button refresh" @click="refreshData" :disabled="isLoading">
            <i class="fas fa-sync-alt" :class="{ 'rotating': isLoading }"></i>
            Refresh
          </button>
          <button class="action-button primary">
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
        <div v-for="hub in auth.hubs" :key="hub.HubName_str" class="hub-card">
          <div class="hub-header">
            <div class="hub-title">
              <span class="status-dot" :class="{ 'online': hub.Online_bool }"></span>
              <h3>{{ hub.HubName_str }}</h3>
            </div>
            <div class="hub-actions">
              <button class="icon-button" title="Edit Hub">
                <i class="fas fa-edit"></i>
              </button>
              <button class="icon-button" title="Delete Hub">
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
                <span class="label">Sessions</span>
                <span class="value">{{ hub.NumSessions_u32 }}</span>
              </div>
            </div>
            
            <div class="stat-row">
              <div class="stat-item">
                <span class="label">Users</span>
                <span class="value">{{ hub.NumUsers_u32 }}</span>
              </div>
              <div class="stat-item">
                <span class="label">Active Users</span>
                <span class="value">{{ hub.NumLogin_u32 }}</span>
              </div>
            </div>

            <div class="stat-row">
              <div class="stat-item full-width">
                <span class="label">Traffic</span>
                <div class="traffic-stats">
                  <span class="traffic-item">
                    <i class="fas fa-arrow-down"></i>
                    {{ formatBytes(hub['Ex.Recv.UnicastBytes_u64']) }}
                  </span>
                  <span class="traffic-item">
                    <i class="fas fa-arrow-up"></i>
                    {{ formatBytes(hub['Ex.Send.UnicastBytes_u64']) }}
                  </span>
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const isLoading = ref(false)

const refreshData = async () => {
  isLoading.value = true
  await auth.refreshHubs()
  isLoading.value = false
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
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

.traffic-stats {
  display: flex;
  gap: 1rem;
}

.traffic-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.traffic-item i {
  color: #718096;
  font-size: 0.75rem;
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
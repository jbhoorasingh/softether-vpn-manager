<template>
  <AppLayout>
    <div class="dashboard">
      <header class="page-header">
        <h1>Dashboard</h1>
        <div class="actions">
          <button class="refresh-button" @click="refreshData" :disabled="isLoading">
            <i class="fas fa-sync-alt" :class="{ 'rotating': isLoading }"></i>
            Refresh
          </button>
        </div>
      </header>

      <div class="stats-grid">
        <!-- Server Status Card -->
        <div class="stat-card">
          <div class="stat-header">
            <h3>Server Status</h3>
            <span class="status-badge success">Running</span>
          </div>
          <div class="stat-content">
            <div class="stat-item">
              <span class="label">Uptime</span>
              <span class="value">{{ serverStats.uptime || '0d 0h 0m' }}</span>
            </div>
            <div class="stat-item">
              <span class="label">CPU Usage</span>
              <span class="value">{{ serverStats.cpuUsage || '0' }}%</span>
            </div>
            <div class="stat-item">
              <span class="label">Memory Usage</span>
              <span class="value">{{ serverStats.memoryUsage || '0' }}%</span>
            </div>
          </div>
        </div>

        <!-- Network Statistics Card -->
        <div class="stat-card">
          <div class="stat-header">
            <h3>Network Statistics</h3>
          </div>
          <div class="stat-content">
            <div class="stat-item">
              <span class="label">Total Sessions</span>
              <span class="value">{{ networkStats.sessions || '0' }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Download</span>
              <span class="value">{{ networkStats.download || '0 MB/s' }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Upload</span>
              <span class="value">{{ networkStats.upload || '0 MB/s' }}</span>
            </div>
          </div>
        </div>

        <!-- Active Users Card -->
        <div class="stat-card">
          <div class="stat-header">
            <h3>Active Users</h3>
          </div>
          <div class="stat-content">
            <div class="stat-item">
              <span class="label">Connected Users</span>
              <span class="value">{{ userStats.connected || '0' }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Total Users</span>
              <span class="value">{{ userStats.total || '0' }}</span>
            </div>
          </div>
        </div>

        <!-- Virtual Hubs Card -->
        <div class="stat-card">
          <div class="stat-header">
            <h3>Virtual Hubs</h3>
          </div>
          <div class="stat-content">
            <div class="stat-item">
              <span class="label">Active Hubs</span>
              <span class="value">{{ hubStats.active || '0' }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Total Hubs</span>
              <span class="value">{{ hubStats.total || '0' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'

const isLoading = ref(false)

const auth = useAuthStore()

const serverStats = computed(() => {
  const totalHubs = auth.hubs.length
  const activeHubs = auth.hubs.filter(hub => hub.Online_bool).length
  
  return {
    uptime: '0d 0h 0m', // TODO: Calculate from hub data
    cpuUsage: 0, // TODO: Get from server
    memoryUsage: 0, // TODO: Get from server
    totalHubs,
    activeHubs
  }
})

const networkStats = computed(() => {
  // Calculate total network statistics from all hubs
  const stats = auth.hubs.reduce((acc, hub) => {
    acc.sessions += hub.NumSessions_u32
    acc.broadcastReceived += hub['Ex.Recv.BroadcastBytes_u64']
    acc.unicastReceived += hub['Ex.Recv.UnicastBytes_u64']
    acc.broadcastSent += hub['Ex.Send.BroadcastBytes_u64']
    acc.unicastSent += hub['Ex.Send.UnicastBytes_u64']
    return acc
  }, {
    sessions: 0,
    broadcastReceived: 0,
    unicastReceived: 0,
    broadcastSent: 0,
    unicastSent: 0
  })

  // Convert bytes to MB/s for display
  const totalReceived = (stats.broadcastReceived + stats.unicastReceived) / (1024 * 1024)
  const totalSent = (stats.broadcastSent + stats.unicastSent) / (1024 * 1024)

  return {
    sessions: stats.sessions,
    download: `${totalReceived.toFixed(2)} MB`,
    upload: `${totalSent.toFixed(2)} MB`
  }
})

const userStats = computed(() => {
  // Calculate total users from all hubs
  const stats = auth.hubs.reduce((acc, hub) => {
    acc.total += hub.NumUsers_u32
    acc.connected += hub.NumLogin_u32
    return acc
  }, { total: 0, connected: 0 })

  return stats
})

const hubStats = computed(() => {
  return {
    active: auth.hubs.filter(hub => hub.Online_bool).length,
    total: auth.hubs.length
  }
})

const refreshData = async () => {
  isLoading.value = true
  try {
    // TODO: Implement actual API calls to fetch server statistics
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    
    // Mock data for demonstration
    serverStats.value = {
      uptime: '5d 12h 30m',
      cpuUsage: 25,
      memoryUsage: 45
    }
    
    networkStats.value = {
      sessions: 12,
      download: '1.5 MB/s',
      upload: '0.8 MB/s'
    }
    
    userStats.value = {
      connected: 8,
      total: 25
    }
    
    hubStats.value = {
      active: 3,
      total: 5
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.dashboard {
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

.refresh-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-button:hover {
  background-color: #f7fafc;
}

.refresh-button:disabled {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.stat-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.success {
  background-color: #e6fffa;
  color: #047857;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item .label {
  color: #718096;
  font-size: 0.875rem;
}

.stat-item .value {
  color: #2d3748;
  font-weight: 500;
}
</style> 
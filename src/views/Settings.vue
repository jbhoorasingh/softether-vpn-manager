<template>
  <AppLayout>
    <div class="settings">
      <header class="page-header">
        <h1>Settings</h1>
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

      <!-- Success Alert -->
      <div v-if="successMessage" class="success-alert">
        <i class="fas fa-check-circle"></i>
        <span>{{ successMessage }}</span>
        <button class="close-button" @click="successMessage = null">&times;</button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'listeners' }"
          @click="activeTab = 'listeners'"
        >
          Listeners
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'syslog' }"
          @click="activeTab = 'syslog'"
        >
          Syslog
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'advanced' }"
          @click="activeTab = 'advanced'"
        >
          Advanced
        </button>
      </div>

      <!-- Listeners Tab -->
      <div v-if="activeTab === 'listeners'" class="tab-content">
        <!-- Special Listeners -->
        <div class="settings-section">
          <h2>Special Listeners</h2>
          <div class="special-listeners card">
            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="specialListeners.VpnOverIcmpListener_bool"
                  @change="saveSpecialListeners"
                >
                VPN over ICMP
              </label>
              <span class="help-text">Enable VPN over ICMP protocol</span>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="specialListeners.VpnOverDnsListener_bool"
                  @change="saveSpecialListeners"
                >
                VPN over DNS
              </label>
              <span class="help-text">Enable VPN over DNS protocol</span>
            </div>
          </div>
        </div>

        <!-- Standard Listeners -->
        <div class="settings-section">
          <div class="section-header">
            <h2>TCP Listeners</h2>
            <button class="action-button primary" @click="showNewListenerModal = true">
              <i class="fas fa-plus"></i>
              Add Listener
            </button>
          </div>
          
          <div class="listeners-grid">
            <div v-for="listener in listeners" :key="listener.Ports_u32" class="listener-card">
              <div class="listener-header">
                <h3>Port {{ listener.Ports_u32 }}</h3>
                <div class="listener-actions">
                  <button 
                    class="icon-button"
                    :class="{ 'success': listener.Enables_bool }"
                    @click="toggleListener(listener)"
                    :title="listener.Enables_bool ? 'Disable' : 'Enable'"
                  >
                    <i class="fas" :class="listener.Enables_bool ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
                  </button>
                  <button 
                    class="icon-button danger"
                    @click="deleteListener(listener)"
                    title="Delete"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div class="listener-status" :class="{ 'error': listener.Errors_bool }">
                <i class="fas" :class="listener.Errors_bool ? 'fa-exclamation-circle' : 'fa-check-circle'"></i>
                {{ listener.Errors_bool ? 'Error' : 'OK' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Syslog Tab -->
      <div v-if="activeTab === 'syslog'" class="tab-content">
        <div class="settings-section">
          <h2>Syslog Configuration</h2>
          <div class="syslog-config card">
            <div class="form-group">
              <label>Syslog Mode</label>
              <select v-model="syslogSettings.SaveType_u32" @change="saveSyslogSettings">
                <option :value="0">Disabled (Do not use syslog)</option>
                <option :value="1">Server Log Only</option>
                <option :value="2">Server and Virtual HUB Security Log</option>
                <option :value="3">All Logs (Server, Security, and Packet)</option>
              </select>
            </div>
            
            <div class="form-group" :class="{ 'disabled': syslogSettings.SaveType_u32 === 0 }">
              <label>Syslog Server Hostname</label>
              <input 
                type="text" 
                v-model="syslogSettings.Hostname_str"
                :disabled="syslogSettings.SaveType_u32 === 0"
                placeholder="Enter hostname or IP address"
                @change="saveSyslogSettings"
              >
              <span class="help-text">Hostname or IP address of the syslog server</span>
            </div>
            
            <div class="form-group" :class="{ 'disabled': syslogSettings.SaveType_u32 === 0 }">
              <label>Syslog Server Port</label>
              <input 
                type="number" 
                v-model.number="syslogSettings.Port_u32"
                :disabled="syslogSettings.SaveType_u32 === 0"
                min="1"
                max="65535"
                placeholder="514"
                @change="saveSyslogSettings"
              >
              <span class="help-text">Port number of the syslog server (default: 514)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced Tab -->
      <div v-if="activeTab === 'advanced'" class="tab-content">
        <div class="settings-section">
          <h2>Server Management</h2>
          <div class="card">
            <div class="server-management">
              <div class="management-item">
                <div class="management-info">
                  <h3>Restart VPN Server</h3>
                  <p class="warning-text">
                    Warning: This will disconnect all active VPN sessions. The server may take a few moments to restart.
                  </p>
                </div>
                <button 
                  class="action-button danger"
                  @click="confirmReboot"
                  :disabled="isLoading"
                >
                  <i class="fas fa-power-off"></i>
                  Restart Server
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Listener Modal -->
    <div v-if="showNewListenerModal" class="modal-overlay" @click="showNewListenerModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Add New Listener</h2>
          <button class="close-button" @click="showNewListenerModal = false">&times;</button>
        </div>
        <form @submit.prevent="createNewListener" class="modal-form">
          <div class="form-group">
            <label>Port Number</label>
            <input 
              type="number" 
              v-model.number="newListener.port"
              min="1"
              max="65535"
              required
              placeholder="Enter port number (1-65535)"
            >
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="newListener.enabled">
              Enable immediately
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="action-button" @click="showNewListenerModal = false">Cancel</button>
            <button type="submit" class="action-button primary">Create</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reboot Confirmation Modal -->
    <div v-if="showRebootModal" class="modal-overlay" @click="showRebootModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Confirm Server Restart</h2>
          <button class="close-button" @click="showRebootModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="warning-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>
              Are you sure you want to restart the VPN server?<br>
              This will disconnect all active VPN sessions.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-button" @click="showRebootModal = false">Cancel</button>
          <button 
            class="action-button danger"
            @click="rebootServer"
            :disabled="isLoading"
          >
            <i class="fas fa-power-off"></i>
            {{ isLoading ? 'Restarting...' : 'Restart Server' }}
          </button>
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
const error = ref(null)
const successMessage = ref(null)
const showNewListenerModal = ref(false)
const showAllCapabilities = ref(false)
const activeTab = ref('listeners')
const showRebootModal = ref(false)

const specialListeners = ref({
  VpnOverIcmpListener_bool: false,
  VpnOverDnsListener_bool: false
})

const syslogSettings = ref({
  SaveType_u32: 0,
  Hostname_str: '',
  Port_u32: 514
})

const listeners = ref([])
const capabilities = ref([])

const newListener = ref({
  port: null,
  enabled: false
})

// Show only important capabilities by default
const displayedCapabilities = computed(() => {
  if (showAllCapabilities.value) {
    return capabilities.value
  }
  // Show only enabled capabilities in compact view
  return capabilities.value.filter(cap => cap.CapsValue_u32 > 0)
})

const toggleCapabilitiesView = () => {
  showAllCapabilities.value = !showAllCapabilities.value
}

const formatCapabilityName = (name) => {
  // Remove common prefixes and format the name
  return name
    .replace(/_str$/, '')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const refreshData = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  error.value = null
  successMessage.value = null
  
  try {
    // Get server capabilities
    const capsResult = await auth.getApi().getServerCapabilities()
    if (capsResult.success) {
      capabilities.value = capsResult.capabilities
    } else {
      error.value = capsResult.error
    }

    // Get special listeners
    const specialResult = await auth.getApi().getSpecialListener()
    if (specialResult.success) {
      specialListeners.value = specialResult.settings
    } else {
      error.value = specialResult.error
    }

    // Get syslog settings
    console.log('Fetching syslog settings...')
    const syslogResult = await auth.getApi().getSysLog()
    console.log('Syslog API response:', syslogResult)
    if (syslogResult.success) {
      syslogSettings.value = syslogResult.settings
      console.log('Updated syslog settings:', syslogSettings.value)
    } else if (!error.value) {
      console.error('Error fetching syslog settings:', syslogResult.error)
      error.value = syslogResult.error
    }

    // Get standard listeners
    const listenersResult = await auth.getApi().enumListener()
    if (listenersResult.success) {
      listeners.value = listenersResult.listeners
    } else if (!error.value) {
      error.value = listenersResult.error
    }
  } catch (err) {
    console.error('Error in refreshData:', err)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const saveSpecialListeners = async () => {
  try {
    isLoading.value = true
    error.value = null
    successMessage.value = null
    
    const result = await auth.getApi().setSpecialListener(specialListeners.value)
    if (result.success) {
      successMessage.value = 'Special listeners settings saved successfully'
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const saveSyslogSettings = async () => {
  try {
    isLoading.value = true
    error.value = null
    successMessage.value = null
    
    // Ensure port is a number
    syslogSettings.value.Port_u32 = Number(syslogSettings.value.Port_u32) || 0
    
    const result = await auth.getApi().setSysLog(syslogSettings.value)
    if (result.success) {
      successMessage.value = 'Syslog settings saved successfully'
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const createNewListener = async () => {
  try {
    isLoading.value = true
    error.value = null
    successMessage.value = null
    
    const result = await auth.getApi().createListener(
      newListener.value.port,
      newListener.value.enabled
    )
    if (result.success) {
      showNewListenerModal.value = false
      successMessage.value = `Listener on port ${newListener.value.port} created successfully`
      refreshData()
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const toggleListener = async (listener) => {
  try {
    isLoading.value = true
    error.value = null
    successMessage.value = null
    
    const result = await auth.getApi().enableListener(
      listener.Ports_u32,
      !listener.Enables_bool
    )
    if (result.success) {
      successMessage.value = `Listener on port ${listener.Ports_u32} ${!listener.Enables_bool ? 'enabled' : 'disabled'} successfully`
      refreshData()
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const deleteListener = async (listener) => {
  if (!confirm(`Are you sure you want to delete the listener on port ${listener.Ports_u32}?`)) {
    return
  }

  try {
    isLoading.value = true
    error.value = null
    successMessage.value = null
    
    const result = await auth.getApi().deleteListener(listener.Ports_u32)
    if (result.success) {
      successMessage.value = `Listener on port ${listener.Ports_u32} deleted successfully`
      refreshData()
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const confirmReboot = () => {
  showRebootModal.value = true
}

const rebootServer = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  error.value = null
  successMessage.value = null
  
  try {
    const result = await auth.getApi().rebootServer()
    if (result.success) {
      successMessage.value = 'Server restart initiated successfully'
      showRebootModal.value = false
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

// Watch for tab changes to refresh data when switching tabs
watch(activeTab, (newTab) => {
  // You can add specific refresh logic for each tab if needed
})

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.settings {
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

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  color: #4a5568;
  cursor: pointer;
  font-weight: 500;
  border-bottom: 2px solid transparent;
}

.tab-button.active {
  color: #1a202c;
  border-bottom-color: #1a202c;
}

.tab-content {
  margin-top: 1.5rem;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.special-listeners, .syslog-config {
  max-width: 600px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group.disabled {
  opacity: 0.6;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2d3748;
}

.form-group select, 
.form-group input[type="text"],
.form-group input[type="number"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: white;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #2d3748;
  cursor: pointer;
}

.help-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #718096;
}

.listeners-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.listener-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.listener-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.listener-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #2d3748;
}

.listener-actions {
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

.icon-button.success {
  color: #48bb78;
}

.icon-button.danger:hover {
  color: #e53e3e;
}

.listener-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #48bb78;
}

.listener-status.error {
  color: #e53e3e;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #2d3748;
}

.close-button {
  background: none;
  border: none;
  color: #718096;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
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
  color: white;
  border: none;
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

.success-alert {
  background-color: #f0fff4;
  border: 1px solid #9ae6b4;
  color: #2f855a;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.placeholder-text {
  color: #718096;
  font-style: italic;
}

.server-management {
  padding: 1rem;
}

.management-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 6px;
}

.management-info h3 {
  margin: 0 0 0.5rem 0;
  color: #c53030;
}

.warning-text {
  color: #c53030;
  font-size: 0.875rem;
  margin: 0;
}

.action-button.danger {
  background-color: #c53030;
  color: white;
  border: none;
}

.action-button.danger:hover {
  background-color: #9b2c2c;
}

.warning-message {
  display: flex;
  align-items: start;
  gap: 1rem;
  padding: 1rem;
  background-color: #fff5f5;
  border-radius: 6px;
  margin: 1rem 0;
}

.warning-message i {
  color: #c53030;
  font-size: 1.5rem;
}

.warning-message p {
  margin: 0;
  color: #c53030;
  line-height: 1.5;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid #e2e8f0;
}
</style> 
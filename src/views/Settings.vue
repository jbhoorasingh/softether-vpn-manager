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
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const isLoading = ref(false)
const error = ref(null)
const showNewListenerModal = ref(false)

const specialListeners = ref({
  VpnOverIcmpListener_bool: false,
  VpnOverDnsListener_bool: false
})

const listeners = ref([])

const newListener = ref({
  port: null,
  enabled: false
})

const refreshData = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    // Get special listeners
    const specialResult = await auth.getApi().getSpecialListener()
    if (specialResult.success) {
      specialListeners.value = specialResult.settings
    } else {
      error.value = specialResult.error
    }

    // Get standard listeners
    const listenersResult = await auth.getApi().enumListener()
    if (listenersResult.success) {
      listeners.value = listenersResult.listeners
    } else if (!error.value) {
      error.value = listenersResult.error
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const saveSpecialListeners = async () => {
  try {
    const result = await auth.getApi().setSpecialListener(specialListeners.value)
    if (!result.success) {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  }
}

const createNewListener = async () => {
  try {
    const result = await auth.getApi().createListener(
      newListener.value.port,
      newListener.value.enabled
    )
    if (result.success) {
      showNewListenerModal.value = false
      refreshData()
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  }
}

const toggleListener = async (listener) => {
  try {
    const result = await auth.getApi().enableListener(
      listener.Ports_u32,
      !listener.Enables_bool
    )
    if (result.success) {
      refreshData()
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  }
}

const deleteListener = async (listener) => {
  if (!confirm(`Are you sure you want to delete the listener on port ${listener.Ports_u32}?`)) {
    return
  }

  try {
    const result = await auth.getApi().deleteListener(listener.Ports_u32)
    if (result.success) {
      refreshData()
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  }
}

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

.special-listeners {
  max-width: 600px;
}

.form-group {
  margin-bottom: 1rem;
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
  margin-left: 1.5rem;
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

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2d3748;
}

.form-group input[type="number"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
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
</style> 
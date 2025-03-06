<template>
  <div v-if="modelValue" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Create New Hub</h2>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label for="hubName">Hub Name</label>
          <input 
            id="hubName"
            v-model="formData.hubName"
            type="text"
            required
            placeholder="Enter hub name"
          >
        </div>

        <div class="form-group">
          <label for="adminPassword">Admin Password</label>
          <input 
            id="adminPassword"
            v-model="formData.adminPassword"
            type="password"
            required
            placeholder="Enter admin password"
          >
        </div>

        <div class="form-group">
          <label for="maxSessions">Max Sessions (0 for unlimited)</label>
          <input 
            id="maxSessions"
            v-model.number="formData.maxSessions"
            type="number"
            min="0"
            placeholder="Enter max sessions"
          >
        </div>

        <div class="form-options">
          <label class="checkbox-label">
            <input 
              type="checkbox"
              v-model="formData.online"
            >
            Create hub in online state
          </label>

          <label class="checkbox-label">
            <input 
              type="checkbox"
              v-model="formData.noEnum"
            >
            Hide hub in enumeration
          </label>
        </div>

        <div class="form-actions">
          <button type="button" class="cancel-button" @click="closeModal">Cancel</button>
          <button type="submit" class="submit-button" :disabled="isLoading">
            <span v-if="isLoading">
              <i class="fas fa-spinner fa-spin"></i>
              Creating...
            </span>
            <span v-else>Create Hub</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'hub-created'])
const auth = useAuthStore()
const isLoading = ref(false)

const formData = ref({
  hubName: '',
  adminPassword: '',
  maxSessions: 0,
  online: false,
  noEnum: false
})

const closeModal = () => {
  emit('update:modelValue', false)
  // Reset form
  formData.value = {
    hubName: '',
    adminPassword: '',
    maxSessions: 0,
    online: false,
    noEnum: false
  }
}

const handleSubmit = async () => {
  isLoading.value = true
  try {
    const result = await auth.createHub({
      hubName: formData.value.hubName,
      adminPassword: formData.value.adminPassword,
      options: {
        maxSessions: formData.value.maxSessions,
        online: formData.value.online,
        noEnum: formData.value.noEnum
      }
    })

    if (result.success) {
      emit('hub-created')
      closeModal()
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
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
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1a202c;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #718096;
  cursor: pointer;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
}

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
}

.form-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4a5568;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-button,
.submit-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.cancel-button {
  background-color: white;
  border: 1px solid #e2e8f0;
  color: #4a5568;
}

.submit-button {
  background-color: #1a202c;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 
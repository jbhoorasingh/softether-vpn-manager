<template>
  <AppLayout>
    <div class="groups">
      <header class="page-header">
        <h1>Group Management</h1>
        <div class="actions">
          <select v-model="selectedHub" class="hub-selector" @change="loadGroups">
            <option value="">Select a Hub</option>
            <option v-for="hub in hubs" :key="hub.HubName_str" :value="hub.HubName_str">
              {{ hub.HubName_str }}
            </option>
          </select>
          <button class="action-button" @click="openCreateModal" :disabled="!selectedHub">
            <i class="fas fa-plus"></i>
            New Group
          </button>
          <button class="action-button refresh" @click="loadGroups" :disabled="isLoading || !selectedHub">
            <i class="fas fa-sync-alt" :class="{ 'rotating': isLoading }"></i>
            Refresh
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

      <!-- Loading State -->
      <div v-if="isLoading && groups.length === 0" class="loading-container">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading groups...</p>
      </div>

      <!-- Groups Table -->
      <div v-else-if="groups.length > 0" class="groups-table-container">
        <table class="groups-table">
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Real Name</th>
              <th>Note</th>
              <th>Has Policy</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="group in groups" :key="group.Name_str">
              <td class="groupname">
                <i class="fas fa-users"></i>
                {{ group.Name_str }}
              </td>
              <td>{{ group.Realname_utf || '-' }}</td>
              <td>{{ group.Note_utf || '-' }}</td>
              <td>
                <span class="policy-badge" :class="{ 'has-policy': group.UsePolicy_bool }">
                  {{ group.UsePolicy_bool ? 'Yes' : 'No' }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="icon-button" @click="viewGroup(group)" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="icon-button" @click="editGroup(group)" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="icon-button danger" @click="confirmDeleteGroup(group)" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <i class="fas fa-users placeholder-icon"></i>
        <p v-if="!selectedHub">Please select a hub to view groups</p>
        <p v-else>No groups found in this hub</p>
        <button v-if="selectedHub" class="action-button" @click="openCreateModal">
          <i class="fas fa-plus"></i>
          Create First Group
        </button>
      </div>

      <!-- Create/Edit Group Modal -->
      <div v-if="showGroupModal" class="modal-overlay" @click.self="closeGroupModal">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ isEditing ? 'Edit Group' : 'Create New Group' }}</h2>
            <button class="close-button" @click="closeGroupModal">&times;</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveGroup">
              <div class="form-group">
                <label for="groupname">Group Name *</label>
                <input
                  id="groupname"
                  v-model="currentGroup.Name_str"
                  type="text"
                  required
                  :disabled="isEditing"
                  placeholder="Enter group name"
                />
              </div>

              <div class="form-group">
                <label for="realname">Real Name</label>
                <input
                  id="realname"
                  v-model="currentGroup.Realname_utf"
                  type="text"
                  placeholder="Enter real name for group"
                />
              </div>

              <div class="form-group">
                <label for="note">Note</label>
                <textarea
                  id="note"
                  v-model="currentGroup.Note_utf"
                  rows="3"
                  placeholder="Enter notes about this group"
                ></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" class="action-button" @click="closeGroupModal">
                  Cancel
                </button>
                <button type="submit" class="action-button primary" :disabled="isLoading">
                  <i class="fas" :class="isLoading ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                  {{ isLoading ? 'Saving...' : 'Save Group' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- View Group Modal -->
      <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
        <div class="modal">
          <div class="modal-header">
            <h2>Group Details</h2>
            <button class="close-button" @click="showViewModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="group-details">
              <div class="detail-row">
                <span class="detail-label">Group Name:</span>
                <span class="detail-value">{{ viewingGroup?.Name_str }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Real Name:</span>
                <span class="detail-value">{{ viewingGroup?.Realname_utf || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Has Security Policy:</span>
                <span class="detail-value">{{ viewingGroup?.UsePolicy_bool ? 'Yes' : 'No' }}</span>
              </div>
              <div v-if="viewingGroup?.Note_utf" class="detail-row">
                <span class="detail-label">Note:</span>
                <span class="detail-value">{{ viewingGroup.Note_utf }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal small">
          <div class="modal-header">
            <h2>Confirm Delete</h2>
            <button class="close-button" @click="showDeleteConfirm = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete group <strong>{{ deletingGroup?.Name_str }}</strong>?</p>
            <p class="warning-text">This action cannot be undone.</p>
          </div>
          <div class="modal-actions">
            <button class="action-button" @click="showDeleteConfirm = false">
              Cancel
            </button>
            <button class="action-button danger" @click="deleteGroup" :disabled="isLoading">
              <i class="fas" :class="isLoading ? 'fa-spinner fa-spin' : 'fa-trash'"></i>
              {{ isLoading ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import AppLayout from '../components/AppLayout.vue'

const auth = useAuthStore()
const api = auth.getApi()

const hubs = ref([])
const groups = ref([])
const selectedHub = ref('')
const isLoading = ref(false)
const error = ref(null)
const successMessage = ref(null)

// Modal states
const showGroupModal = ref(false)
const showViewModal = ref(false)
const showDeleteConfirm = ref(false)
const isEditing = ref(false)
const currentGroup = ref({})
const viewingGroup = ref(null)
const deletingGroup = ref(null)

const loadHubs = async () => {
  try {
    const result = await api.login()
    if (result.success) {
      hubs.value = result.hubs
    }
  } catch (err) {
    error.value = 'Failed to load hubs: ' + err.message
  }
}

const loadGroups = async () => {
  if (!selectedHub.value) {
    groups.value = []
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const result = await api.enumGroup(selectedHub.value)
    if (result.success) {
      groups.value = result.groups || []
    } else {
      error.value = result.error
      groups.value = []
    }
  } catch (err) {
    error.value = 'Failed to load groups: ' + err.message
    groups.value = []
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  currentGroup.value = {
    Name_str: '',
    Realname_utf: '',
    Note_utf: ''
  }
  showGroupModal.value = true
}

const editGroup = async (group) => {
  isEditing.value = true

  // Fetch full group details
  isLoading.value = true
  try {
    const result = await api.getGroup(selectedHub.value, group.Name_str)
    if (result.success) {
      currentGroup.value = { ...result.group }
      showGroupModal.value = true
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = 'Failed to load group details: ' + err.message
  } finally {
    isLoading.value = false
  }
}

const viewGroup = (group) => {
  viewingGroup.value = group
  showViewModal.value = true
}

const closeGroupModal = () => {
  showGroupModal.value = false
  currentGroup.value = {}
}

const saveGroup = async () => {
  isLoading.value = true
  error.value = null

  try {
    const groupData = {
      Realname_utf: currentGroup.value.Realname_utf || '',
      Note_utf: currentGroup.value.Note_utf || ''
    }

    let result
    if (isEditing.value) {
      result = await api.setGroup(selectedHub.value, currentGroup.value.Name_str, groupData)
      successMessage.value = 'Group updated successfully'
    } else {
      result = await api.createGroup(selectedHub.value, currentGroup.value.Name_str, groupData)
      successMessage.value = 'Group created successfully'
    }

    if (result.success) {
      closeGroupModal()
      await loadGroups()
      setTimeout(() => { successMessage.value = null }, 3000)
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = 'Failed to save group: ' + err.message
  } finally {
    isLoading.value = false
  }
}

const confirmDeleteGroup = (group) => {
  deletingGroup.value = group
  showDeleteConfirm.value = true
}

const deleteGroup = async () => {
  isLoading.value = true
  error.value = null

  try {
    const result = await api.deleteGroup(selectedHub.value, deletingGroup.value.Name_str)
    if (result.success) {
      successMessage.value = `Group ${deletingGroup.value.Name_str} deleted successfully`
      showDeleteConfirm.value = false
      deletingGroup.value = null
      await loadGroups()
      setTimeout(() => { successMessage.value = null }, 3000)
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = 'Failed to delete group: ' + err.message
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadHubs()
})
</script>

<style scoped>
.groups {
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
  gap: 0.75rem;
  align-items: center;
}

.hub-selector {
  padding: 0.5rem 1rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.875rem;
  background-color: white;
  cursor: pointer;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #3182ce;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.action-button:hover:not(:disabled) {
  background-color: #2c5282;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.refresh {
  background-color: #48bb78;
}

.action-button.refresh:hover:not(:disabled) {
  background-color: #38a169;
}

.action-button.primary {
  background-color: #3182ce;
}

.action-button.danger {
  background-color: #f56565;
}

.action-button.danger:hover:not(:disabled) {
  background-color: #e53e3e;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-alert, .success-alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.error-alert {
  background-color: #fed7d7;
  color: #9b2c2c;
  border: 1px solid #fc8181;
}

.success-alert {
  background-color: #c6f6d5;
  color: #22543d;
  border: 1px solid #68d391;
}

.close-button {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: inherit;
  padding: 0;
  line-height: 1;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  gap: 1rem;
}

.loading-container i {
  font-size: 3rem;
  color: #3182ce;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  gap: 1rem;
}

.placeholder-icon {
  font-size: 4rem;
  color: #a0aec0;
}

.empty-state p {
  color: #718096;
  font-size: 1.125rem;
}

.groups-table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.groups-table {
  width: 100%;
  border-collapse: collapse;
}

.groups-table thead {
  background-color: #f7fafc;
  border-bottom: 2px solid #e2e8f0;
}

.groups-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.groups-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
}

.groups-table tbody tr:hover {
  background-color: #f7fafc;
}

.groupname {
  font-weight: 600;
  color: #2d3748;
}

.groupname i {
  color: #805ad5;
  margin-right: 0.5rem;
}

.policy-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background-color: #e2e8f0;
  color: #4a5568;
}

.policy-badge.has-policy {
  background-color: #c3dafe;
  color: #434190;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.icon-button {
  padding: 0.5rem;
  background-color: #edf2f7;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #4a5568;
  transition: all 0.2s;
}

.icon-button:hover {
  background-color: #e2e8f0;
}

.icon-button.danger {
  color: #f56565;
}

.icon-button.danger:hover {
  background-color: #fed7d7;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal.small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.modal-body {
  padding: 1.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  margin-top: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2d3748;
  font-size: 0.875rem;
}

.form-group input[type="text"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.group-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.detail-label {
  font-weight: 600;
  color: #4a5568;
  min-width: 180px;
}

.detail-value {
  color: #2d3748;
}

.warning-text {
  color: #f56565;
  font-weight: 500;
}
</style>

<template>
  <AppLayout>
    <div class="users">
      <header class="page-header">
        <h1>User Management</h1>
        <div class="actions">
          <select v-model="selectedHub" class="hub-selector" @change="loadUsers">
            <option value="">All Hubs</option>
            <option v-for="hub in hubs" :key="hub.HubName_str" :value="hub.HubName_str">
              {{ hub.HubName_str }}
            </option>
          </select>
          <button class="action-button" @click="openCreateModal" :disabled="!selectedHub">
            <i class="fas fa-user-plus"></i>
            New User
          </button>
          <button class="action-button refresh" @click="loadUsers" :disabled="isLoading">
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
      <div v-if="isLoading && users.length === 0" class="loading-container">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading users...</p>
      </div>

      <!-- Users Table -->
      <div v-else-if="users.length > 0" class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Hub</th>
              <th>Real Name</th>
              <th>Group</th>
              <th>Auth Type</th>
              <th>Logins</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="`${user.hubName}-${user.Name_str}`">
              <td class="username">
                <i class="fas fa-user"></i>
                {{ user.Name_str }}
              </td>
              <td>{{ user.hubName }}</td>
              <td>{{ user.Realname_utf || '-' }}</td>
              <td>{{ user.GroupName_str || 'Default' }}</td>
              <td>
                <span class="auth-badge" :class="getAuthTypeClass(user.AuthType_u32)">
                  {{ getAuthTypeName(user.AuthType_u32) }}
                </span>
              </td>
              <td>{{ user.NumLogin_u32 || 0 }}</td>
              <td>
                <span v-if="user.ExpireTime_dt && user.ExpireTime_dt > 0" class="status-badge">
                  {{ isExpired(user.ExpireTime_dt) ? 'Expired' : 'Active' }}
                </span>
                <span v-else class="status-badge active">Active</span>
              </td>
              <td class="actions-cell">
                <button class="icon-button" @click="viewUser(user)" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="icon-button" @click="editUser(user)" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="icon-button danger" @click="confirmDeleteUser(user)" title="Delete">
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
        <p v-if="!selectedHub">Please select a hub to view users</p>
        <p v-else>No users found in this hub</p>
        <button v-if="selectedHub" class="action-button" @click="openCreateModal">
          <i class="fas fa-user-plus"></i>
          Create First User
        </button>
      </div>

      <!-- Create/Edit User Modal -->
      <div v-if="showUserModal" class="modal-overlay" @click.self="closeUserModal">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ isEditing ? 'Edit User' : 'Create New User' }}</h2>
            <button class="close-button" @click="closeUserModal">&times;</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveUser">
              <div class="form-group">
                <label for="username">Username *</label>
                <input
                  id="username"
                  v-model="currentUser.Name_str"
                  type="text"
                  required
                  :disabled="isEditing"
                  placeholder="Enter username"
                />
              </div>

              <div class="form-group">
                <label for="hub">Virtual Hub *</label>
                <select id="hub" v-model="currentUser.hubName" required :disabled="isEditing">
                  <option value="">Select a hub</option>
                  <option v-for="hub in hubs" :key="hub.HubName_str" :value="hub.HubName_str">
                    {{ hub.HubName_str }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="realname">Real Name</label>
                <input
                  id="realname"
                  v-model="currentUser.Realname_utf"
                  type="text"
                  placeholder="Enter real name"
                />
              </div>

              <div class="form-group">
                <label for="group">Group</label>
                <input
                  id="group"
                  v-model="currentUser.GroupName_str"
                  type="text"
                  placeholder="Enter group name"
                />
              </div>

              <div class="form-group">
                <label for="authType">Authentication Type *</label>
                <select id="authType" v-model.number="currentUser.AuthType_u32" required>
                  <option :value="0">Anonymous</option>
                  <option :value="1">Password</option>
                  <option :value="2">Certificate</option>
                  <option :value="3">Radius</option>
                  <option :value="4">NT Domain</option>
                </select>
              </div>

              <div v-if="currentUser.AuthType_u32 === 1" class="form-group">
                <label for="password">Password *</label>
                <input
                  id="password"
                  v-model="currentUser.Auth_Password_str"
                  type="password"
                  :required="!isEditing"
                  placeholder="Enter password"
                />
                <small v-if="isEditing">Leave blank to keep current password</small>
              </div>

              <div class="form-group">
                <label for="note">Note</label>
                <textarea
                  id="note"
                  v-model="currentUser.Note_utf"
                  rows="3"
                  placeholder="Enter notes about this user"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="numLogin">Max Logins (0 = unlimited)</label>
                  <input
                    id="numLogin"
                    v-model.number="currentUser.NumLogin_u32"
                    type="number"
                    min="0"
                  />
                </div>

                <div class="form-group">
                  <label>
                    <input type="checkbox" v-model="hasExpiration" />
                    Set Expiration Date
                  </label>
                  <input
                    v-if="hasExpiration"
                    v-model="expirationDate"
                    type="datetime-local"
                  />
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="action-button" @click="closeUserModal">
                  Cancel
                </button>
                <button type="submit" class="action-button primary" :disabled="isLoading">
                  <i class="fas" :class="isLoading ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                  {{ isLoading ? 'Saving...' : 'Save User' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- View User Modal -->
      <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
        <div class="modal">
          <div class="modal-header">
            <h2>User Details</h2>
            <button class="close-button" @click="showViewModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="user-details">
              <div class="detail-row">
                <span class="detail-label">Username:</span>
                <span class="detail-value">{{ viewingUser?.Name_str }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Hub:</span>
                <span class="detail-value">{{ viewingUser?.hubName }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Real Name:</span>
                <span class="detail-value">{{ viewingUser?.Realname_utf || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Group:</span>
                <span class="detail-value">{{ viewingUser?.GroupName_str || 'Default' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Authentication:</span>
                <span class="detail-value">{{ getAuthTypeName(viewingUser?.AuthType_u32) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Logins:</span>
                <span class="detail-value">{{ viewingUser?.NumLogin_u32 || 0 }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Expiration:</span>
                <span class="detail-value">
                  {{ viewingUser?.ExpireTime_dt && viewingUser.ExpireTime_dt > 0
                     ? formatDate(viewingUser.ExpireTime_dt)
                     : 'Never' }}
                </span>
              </div>
              <div v-if="viewingUser?.Note_utf" class="detail-row">
                <span class="detail-label">Note:</span>
                <span class="detail-value">{{ viewingUser.Note_utf }}</span>
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
            <p>Are you sure you want to delete user <strong>{{ deletingUser?.Name_str }}</strong>?</p>
            <p class="warning-text">This action cannot be undone.</p>
          </div>
          <div class="modal-actions">
            <button class="action-button" @click="showDeleteConfirm = false">
              Cancel
            </button>
            <button class="action-button danger" @click="deleteUser" :disabled="isLoading">
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
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import AppLayout from '../components/AppLayout.vue'

const auth = useAuthStore()
const api = auth.getApi()

const hubs = ref([])
const users = ref([])
const selectedHub = ref('')
const isLoading = ref(false)
const error = ref(null)
const successMessage = ref(null)

// Modal states
const showUserModal = ref(false)
const showViewModal = ref(false)
const showDeleteConfirm = ref(false)
const isEditing = ref(false)
const currentUser = ref({})
const viewingUser = ref(null)
const deletingUser = ref(null)
const hasExpiration = ref(false)
const expirationDate = ref('')

// Auth type mappings
const authTypes = {
  0: 'Anonymous',
  1: 'Password',
  2: 'Certificate',
  3: 'Radius',
  4: 'NT Domain'
}

const getAuthTypeName = (type) => authTypes[type] || 'Unknown'

const getAuthTypeClass = (type) => {
  const classes = {
    0: 'anonymous',
    1: 'password',
    2: 'certificate',
    3: 'radius',
    4: 'ntdomain'
  }
  return classes[type] || ''
}

const isExpired = (timestamp) => {
  if (!timestamp || timestamp === 0) return false
  return timestamp < Math.floor(Date.now() / 1000)
}

const formatDate = (timestamp) => {
  if (!timestamp || timestamp === 0) return '-'
  return new Date(timestamp * 1000).toLocaleString()
}

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

const loadUsers = async () => {
  isLoading.value = true
  error.value = null
  users.value = []

  try {
    if (selectedHub.value) {
      // Load users from selected hub
      const result = await api.getHubUsers(selectedHub.value)
      if (result.success) {
        users.value = result.users.map(user => ({
          ...user,
          hubName: selectedHub.value
        }))
      } else {
        error.value = result.error
      }
    } else {
      // Load users from all hubs
      const allUsers = []
      for (const hub of hubs.value) {
        const result = await api.getHubUsers(hub.HubName_str)
        if (result.success) {
          allUsers.push(...result.users.map(user => ({
            ...user,
            hubName: hub.HubName_str
          })))
        }
      }
      users.value = allUsers
    }
  } catch (err) {
    error.value = 'Failed to load users: ' + err.message
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  currentUser.value = {
    Name_str: '',
    hubName: selectedHub.value || '',
    Realname_utf: '',
    GroupName_str: '',
    Note_utf: '',
    AuthType_u32: 1,
    Auth_Password_str: '',
    NumLogin_u32: 0,
    ExpireTime_dt: 0
  }
  hasExpiration.value = false
  expirationDate.value = ''
  showUserModal.value = true
}

const editUser = async (user) => {
  isEditing.value = true

  // Fetch full user details
  isLoading.value = true
  try {
    const result = await api.getUser(user.hubName, user.Name_str)
    if (result.success) {
      currentUser.value = {
        ...result.user,
        hubName: user.hubName,
        Auth_Password_str: '' // Don't show existing password
      }

      if (currentUser.value.ExpireTime_dt && currentUser.value.ExpireTime_dt > 0) {
        hasExpiration.value = true
        const date = new Date(currentUser.value.ExpireTime_dt * 1000)
        expirationDate.value = date.toISOString().slice(0, 16)
      }

      showUserModal.value = true
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = 'Failed to load user details: ' + err.message
  } finally {
    isLoading.value = false
  }
}

const viewUser = (user) => {
  viewingUser.value = user
  showViewModal.value = true
}

const closeUserModal = () => {
  showUserModal.value = false
  currentUser.value = {}
}

const saveUser = async () => {
  isLoading.value = true
  error.value = null

  try {
    const userData = {
      GroupName_str: currentUser.value.GroupName_str || '',
      Realname_utf: currentUser.value.Realname_utf || '',
      Note_utf: currentUser.value.Note_utf || '',
      AuthType_u32: currentUser.value.AuthType_u32,
      Auth_Password_str: currentUser.value.Auth_Password_str || '',
      NumLogin_u32: currentUser.value.NumLogin_u32 || 0,
      ExpireTime_dt: hasExpiration.value && expirationDate.value
        ? Math.floor(new Date(expirationDate.value).getTime() / 1000)
        : 0
    }

    let result
    if (isEditing.value) {
      result = await api.setUser(currentUser.value.hubName, currentUser.value.Name_str, userData)
      successMessage.value = 'User updated successfully'
    } else {
      result = await api.createUser(currentUser.value.hubName, currentUser.value.Name_str, userData)
      successMessage.value = 'User created successfully'
    }

    if (result.success) {
      closeUserModal()
      await loadUsers()
      setTimeout(() => { successMessage.value = null }, 3000)
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = 'Failed to save user: ' + err.message
  } finally {
    isLoading.value = false
  }
}

const confirmDeleteUser = (user) => {
  deletingUser.value = user
  showDeleteConfirm.value = true
}

const deleteUser = async () => {
  isLoading.value = true
  error.value = null

  try {
    const result = await api.deleteUser(deletingUser.value.hubName, deletingUser.value.Name_str)
    if (result.success) {
      successMessage.value = `User ${deletingUser.value.Name_str} deleted successfully`
      showDeleteConfirm.value = false
      deletingUser.value = null
      await loadUsers()
      setTimeout(() => { successMessage.value = null }, 3000)
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = 'Failed to delete user: ' + err.message
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadHubs()
  if (hubs.value.length > 0) {
    selectedHub.value = hubs.value[0].HubName_str
    await loadUsers()
  }
})
</script>

<style scoped>
.users {
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

.users-table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background-color: #f7fafc;
  border-bottom: 2px solid #e2e8f0;
}

.users-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.users-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
}

.users-table tbody tr:hover {
  background-color: #f7fafc;
}

.username {
  font-weight: 600;
  color: #2d3748;
}

.username i {
  color: #3182ce;
  margin-right: 0.5rem;
}

.auth-badge, .status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.auth-badge.password {
  background-color: #bee3f8;
  color: #2c5282;
}

.auth-badge.anonymous {
  background-color: #e2e8f0;
  color: #4a5568;
}

.auth-badge.certificate {
  background-color: #fbd38d;
  color: #744210;
}

.auth-badge.radius, .auth-badge.ntdomain {
  background-color: #c3dafe;
  color: #434190;
}

.status-badge {
  background-color: #c6f6d5;
  color: #22543d;
}

.status-badge.active {
  background-color: #c6f6d5;
  color: #22543d;
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
.form-group input[type="password"],
.form-group input[type="number"],
.form-group input[type="datetime-local"],
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

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #718096;
  font-size: 0.75rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.user-details {
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
  min-width: 150px;
}

.detail-value {
  color: #2d3748;
}

.warning-text {
  color: #f56565;
  font-weight: 500;
}
</style>

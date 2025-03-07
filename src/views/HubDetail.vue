<template>
  <AppLayout>
    <div class="hub-detail">
      <header class="page-header">
        <div class="header-left">
          <button class="back-button" @click="$router.back()">
            <i class="fas fa-arrow-left"></i>
          </button>
          <h1>{{ hubName }}</h1>
        </div>
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

      <!-- Hub Details Summary -->
      <div class="hub-summary">
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-header">
              <i class="fas fa-info-circle"></i>
              <span>Status</span>
            </div>
            <div class="summary-content">
              <div class="status-indicator">
                <span class="status-dot" :class="{ 'online': hubDetails?.Online_bool }"></span>
                <span :class="{ 'text-success': hubDetails?.Online_bool }">
                  {{ hubDetails?.Online_bool ? 'Online' : 'Offline' }}
                </span>
              </div>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-header">
              <i class="fas fa-users"></i>
              <span>Users & Groups</span>
            </div>
            <div class="summary-content">
              <div class="stat-grid">
                <div class="stat-item">
                  <span class="stat-label">Total Users</span>
                  <span class="stat-value">{{ hubDetails?.NumUsers_u32 || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Active Users</span>
                  <span class="stat-value">{{ hubDetails?.NumLogin_u32 || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Groups</span>
                  <span class="stat-value">{{ hubDetails?.NumGroups_u32 || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Sessions</span>
                  <span class="stat-value">{{ hubDetails?.NumSessions_u32 || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-header">
              <i class="fas fa-network-wired"></i>
              <span>Network Tables</span>
            </div>
            <div class="summary-content">
              <div class="stat-grid">
                <div class="stat-item">
                  <span class="stat-label">MAC Entries</span>
                  <span class="stat-value">{{ hubDetails?.NumMacTables_u32 || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">IP Entries</span>
                  <span class="stat-value">{{ hubDetails?.NumIpTables_u32 || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-header">
              <i class="fas fa-clock"></i>
              <span>Timestamps</span>
            </div>
            <div class="summary-content timestamps">
              <div class="timestamp-item">
                <span class="timestamp-label">Last Communication:</span>
                <span class="timestamp-value">{{ formatDate(hubDetails?.LastCommTime_dt) }}</span>
              </div>
              <div class="timestamp-item">
                <span class="timestamp-label">Created:</span>
                <span class="timestamp-value">{{ formatDate(hubDetails?.CreatedTime_dt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'users' }"
          @click="activeTab = 'users'"
        >
          Users
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'sessions' }"
          @click="activeTab = 'sessions'"
        >
          Active Sessions
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'securenet' }"
          @click="activeTab = 'securenet'"
        >
          SecureNAT
        </button>
      </div>

      <!-- Users Table -->
      <div v-if="activeTab === 'users'" class="table-container">
        <div class="table-header">
          <h2>Users</h2>
          <button class="column-select" @click="showColumnSelector = true">
            <i class="fas fa-columns"></i>
            Columns
          </button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th v-if="userColumns.includes('name')">Name</th>
              <th v-if="userColumns.includes('group')">Group</th>
              <th v-if="userColumns.includes('realname')">Real Name</th>
              <th v-if="userColumns.includes('note')">Note</th>
              <th v-if="userColumns.includes('authType')">Auth Type</th>
              <th v-if="userColumns.includes('numLogin')">Login Count</th>
              <th v-if="userColumns.includes('lastLogin')">Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.Name_str">
              <td v-if="userColumns.includes('name')">{{ user.Name_str }}</td>
              <td v-if="userColumns.includes('group')">{{ user.GroupName_str }}</td>
              <td v-if="userColumns.includes('realname')">{{ user.Realname_utf }}</td>
              <td v-if="userColumns.includes('note')">{{ user.Note_utf }}</td>
              <td v-if="userColumns.includes('authType')">{{ getAuthType(user.AuthType_u32) }}</td>
              <td v-if="userColumns.includes('numLogin')">{{ user.NumLogin_u32 }}</td>
              <td v-if="userColumns.includes('lastLogin')">{{ formatDate(user.LastLoginTime_dt) }}</td>
              <td>
                <button class="icon-button" @click="showUserDetails(user)">
                  <i class="fas fa-info-circle"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sessions Table -->
      <div v-if="activeTab === 'sessions'" class="table-container">
        <div class="table-header">
          <h2>Active Sessions</h2>
          <button class="column-select" @click="showColumnSelector = true">
            <i class="fas fa-columns"></i>
            Columns
          </button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th v-if="sessionColumns.includes('username')">Username</th>
              <th v-if="sessionColumns.includes('ip')">IP Address</th>
              <th v-if="sessionColumns.includes('hostname')">Hostname</th>
              <th v-if="sessionColumns.includes('remote')">Remote</th>
              <th v-if="sessionColumns.includes('remoteHost')">Remote Host</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in sessions" :key="session.Name_str">
              <td v-if="sessionColumns.includes('username')">{{ session.Username_str }}</td>
              <td v-if="sessionColumns.includes('ip')">{{ session.ClientIP_ip }}</td>
              <td v-if="sessionColumns.includes('hostname')">{{ session.Hostname_str }}</td>
              <td v-if="sessionColumns.includes('remote')">{{ session.RemoteSession_bool ? 'Yes' : 'No' }}</td>
              <td v-if="sessionColumns.includes('remoteHost')">{{ session.RemoteHostname_str }}</td>
              <td>
                <button class="icon-button" @click="showSessionDetails(session)">
                  <i class="fas fa-info-circle"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- SecureNAT Settings -->
      <div v-if="activeTab === 'securenet'" class="table-container">
        <div class="table-header">
          <h2>SecureNAT Settings</h2>
          <div class="header-actions">
            <button 
              class="action-button"
              :class="{
                'success': secureNatEnabled,
                'primary': !secureNatEnabled
              }"
              @click="toggleSecureNAT"
              :disabled="isLoading"
            >
              <i class="fas" :class="secureNatEnabled ? 'fa-check-circle' : 'fa-power-off'"></i>
              SecureNAT is {{ secureNatEnabled ? 'Enabled' : 'Disabled' }}
            </button>
          </div>
        </div>

        <div class="secure-nat-settings" v-if="secureNatEnabled">
          <form @submit.prevent="saveSecureNATOptions" class="settings-form">
            <!-- Virtual NAT Settings -->
            <div class="settings-section">
              <h3>Virtual NAT Settings</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label>Virtual IP Address</label>
                  <input type="text" v-model="secureNatOptions.Ip_ip" placeholder="192.168.30.1">
                </div>
                <div class="form-group">
                  <label>Subnet Mask</label>
                  <input type="text" v-model="secureNatOptions.Mask_ip" placeholder="255.255.255.0">
                </div>
                <div class="form-group">
                  <label>MTU Value</label>
                  <input type="number" v-model.number="secureNatOptions.Mtu_u32" placeholder="1500">
                </div>
                <div class="form-group checkbox">
                  <label>
                    <input type="checkbox" v-model="secureNatOptions.UseNat_bool">
                    Enable Virtual NAT
                  </label>
                </div>
              </div>
            </div>

            <!-- DHCP Server Settings -->
            <div class="settings-section">
              <h3>DHCP Server Settings</h3>
              <div class="form-grid">
                <div class="form-group checkbox">
                  <label>
                    <input type="checkbox" v-model="secureNatOptions.UseDhcp_bool">
                    Enable DHCP Server
                  </label>
                </div>
                <div class="form-group">
                  <label>DHCP Lease Range Start</label>
                  <input type="text" v-model="secureNatOptions.DhcpLeaseIPStart_ip" placeholder="192.168.30.10">
                </div>
                <div class="form-group">
                  <label>DHCP Lease Range End</label>
                  <input type="text" v-model="secureNatOptions.DhcpLeaseIPEnd_ip" placeholder="192.168.30.200">
                </div>
                <div class="form-group">
                  <label>Subnet Mask</label>
                  <input type="text" v-model="secureNatOptions.DhcpSubnetMask_ip" placeholder="255.255.255.0">
                </div>
                <div class="form-group">
                  <label>Gateway Address</label>
                  <input type="text" v-model="secureNatOptions.DhcpGatewayAddress_ip" placeholder="192.168.30.1">
                </div>
                <div class="form-group">
                  <label>Primary DNS Server</label>
                  <input type="text" v-model="secureNatOptions.DhcpDnsServerAddress_ip" placeholder="8.8.8.8">
                </div>
                <div class="form-group">
                  <label>Secondary DNS Server</label>
                  <input type="text" v-model="secureNatOptions.DhcpDnsServerAddress2_ip" placeholder="8.8.4.4">
                </div>
                <div class="form-group">
                  <label>Domain Name</label>
                  <input type="text" v-model="secureNatOptions.DhcpDomainName_str" placeholder="local">
                </div>
                <div class="form-group">
                  <label>Lease Time (seconds)</label>
                  <input type="number" v-model.number="secureNatOptions.DhcpExpireTimeSpan_u32" placeholder="7200">
                </div>
              </div>
            </div>

            <!-- Advanced Settings -->
            <div class="settings-section">
              <h3>Advanced Settings</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label>NAT TCP Timeout (seconds)</label>
                  <input type="number" v-model.number="secureNatOptions.NatTcpTimeout_u32" placeholder="1800">
                </div>
                <div class="form-group">
                  <label>NAT UDP Timeout (seconds)</label>
                  <input type="number" v-model.number="secureNatOptions.NatUdpTimeout_u32" placeholder="60">
                </div>
                <div class="form-group checkbox">
                  <label>
                    <input type="checkbox" v-model="secureNatOptions.SaveLog_bool">
                    Save NAT Logs
                  </label>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="action-button primary" :disabled="isLoading">
                <i class="fas fa-save"></i>
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Column Selector Modal -->
    <div v-if="showColumnSelector" class="modal-overlay" @click="showColumnSelector = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Select Columns</h2>
          <button class="close-button" @click="showColumnSelector = false">&times;</button>
        </div>
        <div class="column-list">
          <template v-if="activeTab === 'users'">
            <label v-for="col in availableUserColumns" :key="col.value" class="column-option">
              <input 
                type="checkbox" 
                v-model="userColumns" 
                :value="col.value"
              >
              {{ col.label }}
            </label>
          </template>
          <template v-else>
            <label v-for="col in availableSessionColumns" :key="col.value" class="column-option">
              <input 
                type="checkbox" 
                v-model="sessionColumns" 
                :value="col.value"
              >
              {{ col.label }}
            </label>
          </template>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ detailsTitle }}</h2>
          <button class="close-button" @click="closeDetailsModal">&times;</button>
        </div>
        <div class="details-content">
          <pre>{{ JSON.stringify(selectedItem, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()
const hubName = route.params.hubName

const isLoading = ref(false)
const error = ref(null)
const activeTab = ref('users')
const users = ref([])
const sessions = ref([])

// Column selection
const showColumnSelector = ref(false)
const userColumns = ref(['name', 'group', 'realname', 'numLogin', 'lastLogin'])
const sessionColumns = ref(['username', 'ip', 'hostname', 'remote'])

const availableUserColumns = [
  { value: 'name', label: 'Name' },
  { value: 'group', label: 'Group' },
  { value: 'realname', label: 'Real Name' },
  { value: 'note', label: 'Note' },
  { value: 'authType', label: 'Auth Type' },
  { value: 'numLogin', label: 'Login Count' },
  { value: 'lastLogin', label: 'Last Login' }
]

const availableSessionColumns = [
  { value: 'username', label: 'Username' },
  { value: 'ip', label: 'IP Address' },
  { value: 'hostname', label: 'Hostname' },
  { value: 'remote', label: 'Remote' },
  { value: 'remoteHost', label: 'Remote Host' }
]

// Details modal
const showDetailsModal = ref(false)
const detailsTitle = ref('')
const selectedItem = ref(null)

const hubDetails = ref(null)

const secureNatEnabled = ref(false)
const secureNatOptions = ref({
  Ip_ip: '192.168.30.1',
  Mask_ip: '255.255.255.0',
  UseNat_bool: true,
  Mtu_u32: 1500,
  NatTcpTimeout_u32: 1800,
  NatUdpTimeout_u32: 60,
  UseDhcp_bool: true,
  DhcpLeaseIPStart_ip: '192.168.30.10',
  DhcpLeaseIPEnd_ip: '192.168.30.200',
  DhcpSubnetMask_ip: '255.255.255.0',
  DhcpExpireTimeSpan_u32: 7200,
  DhcpGatewayAddress_ip: '192.168.30.1',
  DhcpDnsServerAddress_ip: '8.8.8.8',
  DhcpDnsServerAddress2_ip: '8.8.4.4',
  DhcpDomainName_str: 'local',
  SaveLog_bool: false,
  ApplyDhcpPushRoutes_bool: false,
  DhcpPushRoutes_str: ''
})

const refreshData = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    const currentHub = auth.hubs.find(h => h.HubName_str === hubName)
    if (currentHub) {
      hubDetails.value = currentHub
    }

    await Promise.all([
      auth.getApi().getHubUsers(hubName).then(result => {
        if (result.success) users.value = result.users
        else error.value = result.error
      }),
      auth.getApi().getHubSessions(hubName).then(result => {
        if (result.success) sessions.value = result.sessions
        else if (!error.value) error.value = result.error
      }),
      refreshSecureNATStatus()
    ])
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const showUserDetails = (user) => {
  selectedItem.value = user
  detailsTitle.value = `User Details: ${user.Name_str}`
  showDetailsModal.value = true
}

const showSessionDetails = (session) => {
  selectedItem.value = session
  detailsTitle.value = `Session Details: ${session.Username_str}`
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedItem.value = null
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

const getAuthType = (type) => {
  // Add auth type mapping if available
  return type.toString()
}

const refreshSecureNATStatus = async () => {
  try {
    const options = await auth.getApi().getSecureNATOptions(hubName)
    if (options.success) {
      secureNatOptions.value = options.options
      secureNatEnabled.value = options.options.UseNat_bool || options.options.UseDhcp_bool
    }
  } catch (error) {
    console.error('Error fetching SecureNAT status:', error)
  }
}

const toggleSecureNAT = async () => {
  try {
    const result = await (secureNatEnabled.value
      ? auth.getApi().disableSecureNAT(hubName)
      : auth.getApi().enableSecureNAT(hubName))

    if (result.success) {
      secureNatEnabled.value = !secureNatEnabled.value
      if (secureNatEnabled.value) {
        await refreshSecureNATStatus()
      }
    }
  } catch (error) {
    console.error('Error toggling SecureNAT:', error)
  }
}

const saveSecureNATOptions = async () => {
  try {
    const result = await auth.getApi().setSecureNATOptions(hubName, secureNatOptions.value)
    if (result.success) {
      // Show success message or notification
      console.log('SecureNAT settings saved successfully')
    }
  } catch (error) {
    console.error('Error saving SecureNAT options:', error)
  }
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.hub-detail {
  padding: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  background: none;
  border: none;
  color: #4a5568;
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1.25rem;
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

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.table-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1a202c;
}

.column-select {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: white;
  color: #4a5568;
  cursor: pointer;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.data-table th {
  background: #f7fafc;
  font-weight: 500;
  color: #4a5568;
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.column-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.column-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.details-content {
  margin-top: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 4px;
  overflow-x: auto;
}

.details-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
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

.hub-summary {
  margin-bottom: 2rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.summary-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4a5568;
  font-weight: 500;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.summary-header i {
  font-size: 0.875rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
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

.text-success {
  color: #48bb78;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #718096;
}

.stat-value {
  font-size: 1rem;
  font-weight: 500;
  color: #2d3748;
}

.timestamps {
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

.settings-form {
  padding: 1.5rem;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section h3 {
  font-size: 1.125rem;
  color: #2d3748;
  margin-bottom: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  color: #4a5568;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="number"] {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
}

.form-group.checkbox {
  flex-direction: row;
  align-items: center;
}

.form-group.checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.action-button.primary {
  background-color: #1a202c;
  color: white;
}

.action-button i {
  font-size: 1rem;
}

.action-button.success {
  background-color: #48bb78;
  color: white;
  border: none;
}

.action-button.success:hover {
  background-color: #38a169;
}
</style> 
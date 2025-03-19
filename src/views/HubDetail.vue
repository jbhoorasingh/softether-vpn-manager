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

      <!-- Success Alert -->
      <div v-if="successMessage" class="success-alert">
        <i class="fas fa-check-circle"></i>
        <span>{{ successMessage }}</span>
        <button class="close-button" @click="successMessage = null">&times;</button>
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
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'nat' }"
          @click="activeTab = 'nat'"
          v-if="secureNatEnabled && secureNatOptions.UseNat_bool"
        >
          NAT Sessions
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'dhcp' }"
          @click="activeTab = 'dhcp'"
          v-if="secureNatEnabled && secureNatOptions.UseDhcp_bool"
        >
          DHCP Leases
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'logs' }"
          @click="activeTab = 'logs'"
        >
          Logging
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

            <!-- DHCP Push Routes Settings -->
            <div class="settings-section" v-if="secureNatOptions.UseDhcp_bool">
              <h3>DHCP Push Routes</h3>
              <div class="form-description">
                <p>Configure static routes to push to DHCP clients. Format: "network/mask/gateway"</p>
                <p>Example: 192.168.5.0/255.255.255.0/192.168.4.254</p>
              </div>
              <div class="form-grid">
                <div class="form-group checkbox">
                  <label>
                    <input type="checkbox" v-model="secureNatOptions.ApplyDhcpPushRoutes_bool">
                    Enable DHCP Push Routes
                  </label>
                </div>
                <div class="form-group" v-if="secureNatOptions.ApplyDhcpPushRoutes_bool">
                  <label>Push Routes</label>
                  <textarea 
                    v-model="secureNatOptions.DhcpPushRoutes_str" 
                    placeholder="192.168.5.0/255.255.255.0/192.168.4.254, 10.0.0.0/255.0.0.0/192.168.4.253"
                    rows="4"
                    class="form-textarea"
                  ></textarea>
                  <div class="form-help">
                    Separate multiple routes with commas. Maximum 64 entries.
                  </div>
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

      <!-- DHCP Leases Table -->
      <div v-if="activeTab === 'dhcp'" class="table-container">
        <div class="table-header">
          <h2>DHCP Leases</h2>
          <button class="action-button refresh" @click="refreshDHCPLeases" :disabled="isLoading">
            <i class="fas fa-sync-alt" :class="{ 'rotating': isLoading }"></i>
            Refresh Leases
          </button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Hostname</th>
              <th>MAC Address</th>
              <th>Leased Time</th>
              <th>Expire Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lease in dhcpLeases" :key="lease.Id_u32">
              <td>{{ lease.IpAddress_ip }}</td>
              <td>{{ lease.Hostname_str }}</td>
              <td>{{ formatMacAddress(lease.MacAddress_bin) }}</td>
              <td>{{ formatDate(lease.LeasedTime_dt) }}</td>
              <td>{{ formatDate(lease.ExpireTime_dt) }}</td>
              <td>
                <button class="icon-button" @click="showLeaseDetails(lease)">
                  <i class="fas fa-info-circle"></i>
                </button>
              </td>
            </tr>
            <tr v-if="dhcpLeases.length === 0">
              <td colspan="6" class="empty-state">No active DHCP leases</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- NAT Sessions Table -->
      <div v-if="activeTab === 'nat'" class="table-container">
        <div class="table-header">
          <h2>NAT Sessions</h2>
          <button class="action-button refresh" @click="refreshNATSessions" :disabled="isLoading">
            <i class="fas fa-sync-alt" :class="{ 'rotating': isLoading }"></i>
            Refresh Sessions
          </button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th v-if="natColumns.includes('id')">ID</th>
              <th v-if="natColumns.includes('protocol')">Protocol</th>
              <th v-if="natColumns.includes('source')">Source</th>
              <th v-if="natColumns.includes('destination')">Destination</th>
              <th v-if="natColumns.includes('created')">Created</th>
              <th v-if="natColumns.includes('lastComm')">Last Activity</th>
              <th v-if="natColumns.includes('traffic')">Traffic</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in natSessions" :key="session.Id_u32">
              <td v-if="natColumns.includes('id')">{{ session.Id_u32 }}</td>
              <td v-if="natColumns.includes('protocol')">{{ getProtocolName(session.Protocol_u32) }}</td>
              <td v-if="natColumns.includes('source')">{{ session.SrcIp_ip }}:{{ session.SrcPort_u32 }}</td>
              <td v-if="natColumns.includes('destination')">{{ session.DestIp_ip }}:{{ session.DestPort_u32 }}</td>
              <td v-if="natColumns.includes('created')">{{ formatDate(session.CreatedTime_dt) }}</td>
              <td v-if="natColumns.includes('lastComm')">{{ formatDate(session.LastCommTime_dt) }}</td>
              <td v-if="natColumns.includes('traffic')">
                <div class="traffic-stats">
                  <span class="traffic-item">
                    <i class="fas fa-arrow-up"></i> {{ formatBytes(session.SendSize_u64) }}
                  </span>
                  <span class="traffic-item">
                    <i class="fas fa-arrow-down"></i> {{ formatBytes(session.RecvSize_u64) }}
                  </span>
                </div>
              </td>
              <td>
                <button class="icon-button" @click="showNATSessionDetails(session)">
                  <i class="fas fa-info-circle"></i>
                </button>
              </td>
            </tr>
            <tr v-if="natSessions.length === 0">
              <td :colspan="getColspan(natColumns.length)" class="empty-state">No active NAT sessions</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Logs Table -->
      <div v-if="activeTab === 'logs'" class="table-container">
        <div class="table-header">
          <h2>Hub Log Settings</h2>
          <button class="action-button primary" @click="saveHubLogSettings" :disabled="isLoading">
            <i class="fas fa-save"></i>
            Save Settings
          </button>
        </div>
        
        <div class="log-settings-container">
          <div class="settings-section">
            <h3>Security Log Settings</h3>
            <div class="setting-item">
              <div class="setting-label">Save Security Log:</div>
              <div class="setting-value">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="hubLogSettings.SaveSecurityLog_bool">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div class="setting-item">
              <div class="setting-label">Security Log Format:</div>
              <div class="setting-value">
                <select v-model="hubLogSettings.SecurityLogSwitchType_u32">
                  <option v-for="type in LOG_SWITCH_TYPES" 
                          :key="type.value" 
                          :value="type.value">
                    {{ type.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>Packet Log Settings</h3>
            <div class="setting-item">
              <div class="setting-label">Save Packet Log:</div>
              <div class="setting-value">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="hubLogSettings.SavePacketLog_bool">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div class="setting-item">
              <div class="setting-label">Packet Log Format:</div>
              <div class="setting-value">
                <select v-model="hubLogSettings.PacketLogSwitchType_u32">
                  <option v-for="type in LOG_SWITCH_TYPES" 
                          :key="type.value" 
                          :value="type.value">
                    {{ type.label }}
                  </option>
                </select>
              </div>
            </div>
            <div class="setting-item packet-config">
              <div class="setting-label">Packet Log Types:</div>
              <div class="setting-value">
                <div v-for="type in PACKET_LOG_TYPES" 
                     :key="type.index" 
                     class="packet-type-item">
                  <label>{{ type.label }}:</label>
                  <select v-model="hubLogSettings.PacketLogConfig_u32[type.index]">
                    <option v-for="config in PACKET_LOG_CONFIG_VALUES" 
                            :key="config.value" 
                            :value="config.value">
                      {{ config.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
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
          <template v-else-if="activeTab === 'sessions'">
            <label v-for="col in availableSessionColumns" :key="col.value" class="column-option">
              <input 
                type="checkbox" 
                v-model="sessionColumns" 
                :value="col.value"
              >
              {{ col.label }}
            </label>
          </template>
          <template v-else-if="activeTab === 'nat'">
            <label v-for="col in availableNatColumns" :key="col.value" class="column-option">
              <input 
                type="checkbox" 
                v-model="natColumns" 
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
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()
const hubName = route.params.hubName

const isLoading = ref(false)
const error = ref(null)
const successMessage = ref(null)
const activeTab = ref('users')
const users = ref([])
const sessions = ref([])

// Column selection
const showColumnSelector = ref(false)
const userColumns = ref(['name', 'group', 'realname', 'numLogin', 'lastLogin'])
const sessionColumns = ref(['username', 'ip', 'hostname', 'remote'])
const natColumns = ref(['id', 'protocol', 'source', 'destination', 'created', 'lastComm', 'traffic'])

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

const availableNatColumns = [
  { value: 'id', label: 'ID' },
  { value: 'protocol', label: 'Protocol' },
  { value: 'source', label: 'Source' },
  { value: 'destination', label: 'Destination' },
  { value: 'created', label: 'Created' },
  { value: 'lastComm', label: 'Last Activity' },
  { value: 'traffic', label: 'Traffic' }
]

// Details modal
const showDetailsModal = ref(false)
const detailsTitle = ref('')
const selectedItem = ref(null)

const hubDetails = ref(null)
const secureNatEnabled = ref(false)
const dhcpLeases = ref([])
const natSessions = ref([])

const hubLogSettings = ref({
  SaveSecurityLog_bool: false,
  SecurityLogSwitchType_u32: 0,
  SavePacketLog_bool: false,
  PacketLogSwitchType_u32: 0,
  PacketLogConfig_u32: []
})

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
      refreshSecureNATStatus().then(() => {
        if (secureNatEnabled.value) {
          const promises = []
          if (secureNatOptions.value.UseDhcp_bool && activeTab.value === 'dhcp') {
            promises.push(refreshDHCPLeases())
          }
          if (secureNatOptions.value.UseNat_bool && activeTab.value === 'nat') {
            promises.push(refreshNATSessions())
          }
          return Promise.all(promises)
        }
      }),
      auth.getApi().getHubLog(hubName).then(result => {
        if (result.success) {
          hubLogSettings.value = result.settings
        } else if (!error.value) {
          error.value = result.error
        }
      })
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
    isLoading.value = true
    error.value = null
    successMessage.value = null

    // Use the actual form values from secureNatOptions.value
    const result = await auth.getApi().setSecureNATOptions(hubName, secureNatOptions.value)

    if (result.success) {
      successMessage.value = 'SecureNAT settings saved successfully'
      // Refresh the SecureNAT status to get the latest settings
      await refreshSecureNATStatus()
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
    console.error('Error saving SecureNAT options:', err)
  } finally {
    isLoading.value = false
  }
}

const refreshDHCPLeases = async () => {
  if (isLoading.value || !secureNatEnabled.value || !secureNatOptions.value.UseDhcp_bool) return
  
  try {
    const result = await auth.getApi().enumDHCP(hubName)
    if (result.success) {
      dhcpLeases.value = result.leases
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  }
}

const formatMacAddress = (base64Mac) => {
  try {
    // Decode base64 to bytes
    const binary = atob(base64Mac)
    // Convert to hex and format
    return Array.from(binary)
      .map(byte => byte.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(':')
      .toUpperCase()
  } catch (error) {
    return 'Invalid MAC'
  }
}

const showLeaseDetails = (lease) => {
  selectedItem.value = lease
  detailsTitle.value = `DHCP Lease Details: ${lease.IpAddress_ip}`
  showDetailsModal.value = true
}

const refreshNATSessions = async () => {
  if (isLoading.value || !secureNatEnabled.value || !secureNatOptions.value.UseNat_bool) return
  
  try {
    const result = await auth.getApi().enumNAT(hubName)
    if (result.success) {
      natSessions.value = result.sessions
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  }
}

const showNATSessionDetails = (session) => {
  selectedItem.value = session
  detailsTitle.value = `NAT Session Details: ${session.Id_u32}`
  showDetailsModal.value = true
}

const getProtocolName = (protocol) => {
  switch (protocol) {
    case 0: return 'TCP'
    case 1: return 'UDP'
    case 2: return 'ICMP'
    case 3: return 'DNS'
    default: return `Unknown (${protocol})`
  }
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
}

const getColspan = (columnsLength) => {
  // Add 1 for the actions column
  return columnsLength + 1
}

// Watch for tab changes to refresh data when switching tabs
watch(activeTab, (newTab) => {
  if (newTab === 'dhcp' && secureNatEnabled.value && secureNatOptions.value.UseDhcp_bool) {
    refreshDHCPLeases()
  } else if (newTab === 'nat' && secureNatEnabled.value && secureNatOptions.value.UseNat_bool) {
    refreshNATSessions()
  }
})

const getLogSwitchTypeDescription = (type) => {
  switch (type) {
    case 0: return 'No Save'
    case 1: return 'Save Standard Format'
    case 2: return 'Save CSV Format'
    default: return `Unknown (${type})`
  }
}

// Add these constants at the top of the script section
const LOG_SWITCH_TYPES = [
  { value: 0, label: 'No switching' },
  { value: 1, label: 'Secondly basis' },
  { value: 2, label: 'Minutely basis' },
  { value: 3, label: 'Hourly basis' },
  { value: 4, label: 'Daily basis' },
  { value: 5, label: 'Monthly basis' }
]

const PACKET_LOG_TYPES = [
  { index: 0, name: 'TcpConnection', label: 'TCP Connection' },
  { index: 1, name: 'TcpAll', label: 'TCP All' },
  { index: 2, name: 'DHCP', label: 'DHCP' },
  { index: 3, name: 'UDP', label: 'UDP' },
  { index: 4, name: 'ICMP', label: 'ICMP' },
  { index: 5, name: 'IP', label: 'IP' },
  { index: 6, name: 'ARP', label: 'ARP' },
  { index: 7, name: 'Ethernet', label: 'Ethernet' }
]

const PACKET_LOG_CONFIG_VALUES = [
  { value: 0, label: 'Not save' },
  { value: 1, label: 'Only header' },
  { value: 2, label: 'All payloads' }
]

// Add this method to handle saving the log settings
const saveHubLogSettings = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  error.value = null
  successMessage.value = null
  
  try {
    const result = await auth.getApi().setHubLog(hubName, hubLogSettings.value)
    if (result.success) {
      successMessage.value = 'Log settings saved successfully'
      hubLogSettings.value = result.settings
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
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
.form-group input[type="number"],
.form-group .form-textarea {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
}

.form-textarea {
  width: 100%;
  font-family: inherit;
  resize: vertical;
}

.form-description {
  margin-bottom: 1rem;
  color: #718096;
  font-size: 0.875rem;
}

.form-description p {
  margin: 0.25rem 0;
}

.form-help {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #718096;
}

.form-group.checkbox {
  flex-direction: row;
  align-items: center;
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

.dhcp-leases {
  margin-top: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.dhcp-leases .table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.dhcp-leases .table-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #2d3748;
}

.empty-state {
  text-align: center;
  color: #718096;
  padding: 2rem !important;
}

.traffic-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.traffic-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.traffic-item i {
  font-size: 0.75rem;
  color: #718096;
}

.log-settings-container {
  padding: 1.5rem;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section h3 {
  font-size: 1.125rem;
  color: #2d3748;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.setting-item {
  display: flex;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #f7fafc;
  border-radius: 4px;
}

.setting-label {
  flex: 0 0 200px;
  font-weight: 500;
  color: #4a5568;
}

.setting-value {
  flex: 1;
  color: #2d3748;
}

.status-enabled {
  color: #48bb78;
  font-weight: 500;
}

.status-disabled {
  color: #e53e3e;
  font-weight: 500;
}

.packet-log-types {
  font-family: monospace;
  background-color: #edf2f7;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e0;
  transition: .4s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #48bb78;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.packet-config .setting-value {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.packet-type-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.packet-type-item label {
  min-width: 150px;
  font-weight: 500;
}

select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
  color: #2d3748;
  font-size: 0.875rem;
  min-width: 200px;
}

select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}
</style> 
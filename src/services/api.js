class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export class VPNApi {
  constructor(baseURL, password, hubName = 'administrator', ignoreHttpsErrors = false) {
    this.baseURL = baseURL
    this.password = password
    this.hubName = hubName
    this.ignoreHttpsErrors = ignoreHttpsErrors
  }

  async makeRequest(method, params = {}) {
    const headers = new Headers()
    headers.append('X-VPNADMIN-PASSWORD', this.password)
    headers.append('X-VPNADMIN-HUBNAME', this.hubName)
    headers.append('Content-Type', 'application/json')
    headers.append('Accept', 'application/json')

    const requestOptions = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'rpc_call_id',
        method: method,
        params: params
      }),
      mode: 'cors',
      credentials: 'omit',
    }

    // If ignoring HTTPS errors, we need to handle certificates
    if (this.ignoreHttpsErrors) {
      requestOptions.rejectUnauthorized = false
    }

    try {
      // First, check if we need to handle HTTPS
      const protocol = this.baseURL.startsWith('https') ? 'https' : 'http'
      const apiUrl = `${protocol}://${this.baseURL.replace(/^https?:\/\//, '')}/api`
      console.log('API URL:', apiUrl)
      const response = await fetch(apiUrl, requestOptions)
      const text = await response.text()
      
      if (!response.ok) {
        // Check if it's a CORS error
        if (response.status === 0) {
          throw new ApiError('CORS error: Unable to access the server. Please ensure CORS is enabled on the server.', 0)
        }
        throw new ApiError('Failed to connect to VPN server', response.status)
      }

      try {
        const data = JSON.parse(text)
        if (data.error) {
          throw new ApiError(data.error.message || 'Unknown API error', response.status)
        }
        return data
      } catch (e) {
        throw new ApiError('Invalid response from server', response.status)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      // If it's a network error, it might be due to CORS
      if (error.message.includes('Failed to fetch')) {
        throw new ApiError('Unable to connect to the server. This might be due to CORS restrictions or the server being unavailable.', 0)
      }
      throw new ApiError(error.message || 'Network error', 0)
    }
  }

  async login() {
    try {
      const result = await this.makeRequest('EnumHub')
      return {
        success: true,
        hubs: result.result.HubList
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async createHub(hubName, adminPassword, options = {}) {
    try {
      const params = {
        HubName_str: hubName,
        AdminPasswordPlainText_str: adminPassword,
        Online_bool: Boolean(options.online ?? false),
        MaxSession_u32: Number(options.maxSessions ?? 0),
        NoEnum_bool: Boolean(options.noEnum ?? false)
      }

      console.log('Creating hub with params:', {
        ...params,
        AdminPasswordPlainText_str: '***' // Hide password in logs
      })

      const result = await this.makeRequest('CreateHub', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error creating hub:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async deleteHub(hubName) {
    try {
      const params = {
        HubName_str: hubName
      }

      console.log('Deleting hub:', hubName)
      const result = await this.makeRequest('DeleteHub', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error deleting hub:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getHubUsers(hubName) {
    try {
      const params = {
        HubName_str: hubName
      }

      const result = await this.makeRequest('EnumUser', params)
      return {
        success: true,
        users: result.result.UserList
      }
    } catch (error) {
      console.error('Error fetching hub users:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getHubSessions(hubName) {
    try {
      const params = {
        HubName_str: hubName
      }

      const result = await this.makeRequest('EnumSession', params)
      return {
        success: true,
        sessions: result.result.SessionList
      }
    } catch (error) {
      console.error('Error fetching hub sessions:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async enumDHCP(hubName) {
    try {
      const params = {
        HubName_str: hubName
      }

      const result = await this.makeRequest('EnumDHCP', params)
      return {
        success: true,
        leases: result.result.DhcpTable
      }
    } catch (error) {
      console.error('Error fetching DHCP leases:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Enumerate NAT sessions for a Virtual Hub
   * @param {string} hubName - Target Virtual HUB name
   * @returns {Promise<Object>} Result object with success status and NAT sessions
   */
  async enumNAT(hubName) {
    try {
      const params = {
        HubName_str: hubName
      }

      const result = await this.makeRequest('EnumNAT', params)
      return {
        success: true,
        sessions: result.result.NatTable,
        count: result.result.NumItem_u32
      }
    } catch (error) {
      console.error('Error fetching NAT sessions:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async enableSecureNAT(hubName) {
    try {
      const params = {
        HubName_str: hubName
      }

      const result = await this.makeRequest('EnableSecureNAT', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error enabling SecureNAT:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async disableSecureNAT(hubName) {
    try {
      const params = {
        HubName_str: hubName
      }

      const result = await this.makeRequest('DisableSecureNAT', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error disabling SecureNAT:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get SecureNAT options for a Virtual Hub
   * @param {string} hubName - Target Virtual HUB name
   * @returns {Promise<Object>} Result object with success status and options
   */
  async getSecureNATOptions(hubName) {
    try {
      const params = {
        RpcHubName_str: hubName
      }

      const result = await this.makeRequest('GetSecureNATOption', params)
      return {
        success: true,
        options: result.result
      }
    } catch (error) {
      console.error('Error getting SecureNAT options:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Set SecureNAT options for a Virtual Hub
   * @param {string} hubName - Target Virtual HUB name
   * @param {Object} options - SecureNAT options
   * @param {string} [options.MacAddress_bin] - MAC address (Base64 binary)
   * @param {string} options.Ip_ip - IP address (e.g., "192.168.30.1")
   * @param {string} options.Mask_ip - Subnet mask (e.g., "255.255.255.0")
   * @param {boolean} options.UseNat_bool - Use Virtual NAT function
   * @param {number} options.Mtu_u32 - MTU value (Standard: 1500)
   * @param {number} options.NatTcpTimeout_u32 - NAT TCP timeout in seconds
   * @param {number} options.NatUdpTimeout_u32 - NAT UDP timeout in seconds
   * @param {boolean} options.UseDhcp_bool - Use DHCP function
   * @param {string} options.DhcpLeaseIPStart_ip - Start IP for DHCP range
   * @param {string} options.DhcpLeaseIPEnd_ip - End IP for DHCP range
   * @param {string} options.DhcpSubnetMask_ip - DHCP subnet mask
   * @param {number} options.DhcpExpireTimeSpan_u32 - DHCP lease expiration time in seconds
   * @param {string} options.DhcpGatewayAddress_ip - Default gateway IP for DHCP clients
   * @param {string} options.DhcpDnsServerAddress_ip - Primary DNS server IP
   * @param {string} options.DhcpDnsServerAddress2_ip - Secondary DNS server IP
   * @param {string} options.DhcpDomainName_str - Domain name for DHCP clients
   * @param {boolean} options.SaveLog_bool - Save Virtual DHCP/NAT operations in logs
   * @param {boolean} options.ApplyDhcpPushRoutes_bool - Enable DHCP push routes
   * @param {string} options.DhcpPushRoutes_str - Static routing table to push (format: "network/mask/gateway,...")
   * @returns {Promise<Object>} Result object with success status
   */
  async setSecureNATOptions(hubName, options) {
    try {
      // Define default values for all required parameters
      const defaultOptions = {
        MacAddress_bin: '', // Base64 encoded MAC address
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
      }

      // Validate and merge provided options with defaults
      const params = {
        RpcHubName_str: hubName,
        ...defaultOptions,
        ...options
      }

      // Type checking and validation
      const validateIpAddress = (ip) => {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
        return ipRegex.test(ip)
      }

      // Validate IP addresses
      const ipFields = [
        'Ip_ip', 'Mask_ip', 'DhcpLeaseIPStart_ip', 'DhcpLeaseIPEnd_ip',
        'DhcpSubnetMask_ip', 'DhcpGatewayAddress_ip', 'DhcpDnsServerAddress_ip',
        'DhcpDnsServerAddress2_ip'
      ]

      for (const field of ipFields) {
        if (params[field] && !validateIpAddress(params[field])) {
          throw new Error(`Invalid IP address format for ${field}: ${params[field]}`)
        }
      }

      // Validate numeric fields
      const numericFields = ['Mtu_u32', 'NatTcpTimeout_u32', 'NatUdpTimeout_u32', 'DhcpExpireTimeSpan_u32']
      for (const field of numericFields) {
        if (typeof params[field] !== 'number' || params[field] < 0) {
          throw new Error(`Invalid numeric value for ${field}: ${params[field]}`)
        }
      }

      // Validate boolean fields
      const booleanFields = ['UseNat_bool', 'UseDhcp_bool', 'SaveLog_bool', 'ApplyDhcpPushRoutes_bool']
      for (const field of booleanFields) {
        params[field] = Boolean(params[field])
      }

      // Validate DHCP push routes format if enabled
      if (params.ApplyDhcpPushRoutes_bool && params.DhcpPushRoutes_str) {
        const routes = params.DhcpPushRoutes_str.split(/[,\s]+/)
        for (const route of routes) {
          const [network, mask, gateway] = route.split('/')
          if (!validateIpAddress(network) || !validateIpAddress(mask) || !validateIpAddress(gateway)) {
            throw new Error(`Invalid route format in DhcpPushRoutes_str: ${route}. Expected format: "network/mask/gateway"`)
          }
        }
      }

      const result = await this.makeRequest('SetSecureNATOption', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error setting SecureNAT options:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Listener Management Methods
  async getSpecialListener() {
    try {
      const result = await this.makeRequest('GetSpecialListener')
      return {
        success: true,
        settings: result.result
      }
    } catch (error) {
      console.error('Error getting special listener:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async setSpecialListener(settings) {
    try {
      const result = await this.makeRequest('SetSpecialListener', settings)
      return {
        success: true,
        settings: result.result
      }
    } catch (error) {
      console.error('Error setting special listener:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async enumListener() {
    try {
      const result = await this.makeRequest('EnumListener')
      return {
        success: true,
        listeners: result.result.ListenerList
      }
    } catch (error) {
      console.error('Error enumerating listeners:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async createListener(port, enable = false) {
    try {
      const result = await this.makeRequest('CreateListener', {
        Port_u32: port,
        Enable_bool: enable
      })
      return {
        success: true,
        listener: result.result
      }
    } catch (error) {
      console.error('Error creating listener:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async deleteListener(port) {
    try {
      const result = await this.makeRequest('DeleteListener', {
        Port_u32: port
      })
      return {
        success: true,
        listener: result.result
      }
    } catch (error) {
      console.error('Error deleting listener:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async enableListener(port, enable) {
    try {
      const result = await this.makeRequest('EnableListener', {
        Port_u32: port,
        Enable_bool: enable
      })
      return {
        success: true,
        listener: result.result
      }
    } catch (error) {
      console.error('Error enabling/disabling listener:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getServerCapabilities() {
    try {
      const result = await this.makeRequest('GetCaps')
      return {
        success: true,
        capabilities: result.result.CapsList
      }
    } catch (error) {
      console.error('Error getting server capabilities:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getLogFiles() {
    try {
      const result = await this.makeRequest('EnumLogFile')
      return {
        success: true,
        logs: result.result.LogFiles
      }
    } catch (error) {
      console.error('Error getting log files:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get syslog configuration settings
   * @returns {Promise<Object>} Result object with success status and syslog settings
   */
  async getSysLog() {
    try {
      console.log('Calling GetSysLog API...')
      const result = await this.makeRequest('GetSysLog')
      console.log('GetSysLog API response:', result)
      return {
        success: true,
        settings: result.result
      }
    } catch (error) {
      console.error('Error getting syslog settings:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Configure syslog settings
   * @param {Object} settings - Syslog settings
   * @param {number} settings.SaveType_u32 - The behavior of the syslog function (0: Disabled, 1: Server log, 2: Server and Hub security log, 3: All logs)
   * @param {string} settings.Hostname_str - Host name or IP address of the syslog server
   * @param {number} settings.Port_u32 - Port number of the syslog server
   * @returns {Promise<Object>} Result object with success status
   */
  async setSysLog(settings) {
    try {
      const params = {
        SaveType_u32: Number(settings.SaveType_u32 || 0),
        Hostname_str: String(settings.Hostname_str || ''),
        Port_u32: Number(settings.Port_u32 || 0)
      }
      
      console.log('Calling SetSysLog API with params:', params)
      const result = await this.makeRequest('SetSysLog', params)
      console.log('SetSysLog API response:', result)
      return {
        success: true,
        settings: result.result
      }
    } catch (error) {
      console.error('Error setting syslog settings:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async readLogFile(filePath, offset = 0) {
    try {
      const result = await this.makeRequest('ReadLogFile', {
        FilePath_str: filePath,
        Offset_u32: offset
      })
      
      // Decode the Base64 buffer to text
      const buffer = result.result.Buffer_bin
      const text = atob(buffer)
      
      return {
        success: true,
        serverName: result.result.ServerName_str,
        filePath: result.result.FilePath_str,
        offset: result.result.Offset_u32,
        content: text
      }
    } catch (error) {
      console.error('Error reading log file:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get hub log settings
   * @param {string} hubName - Target Virtual HUB name
   * @returns {Promise<Object>} Result object with success status and log settings
   */
  async getHubLog(hubName) {
    try {
      const params = {
        HubName_str: hubName
      }
      
      console.log('Calling GetHubLog API with params:', params)
      const result = await this.makeRequest('GetHubLog', params)
      console.log('GetHubLog API response:', result)
      return {
        success: true,
        settings: result.result
      }
    } catch (error) {
      console.error('Error getting hub log settings:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Set hub log settings
   * @param {string} hubName - Target Virtual Hub name
   * @param {Object} settings - Log settings
   * @param {boolean} settings.SaveSecurityLog_bool - Enable/disable security log
   * @param {number} settings.SecurityLogSwitchType_u32 - Security log switching type (0-5)
   * @param {boolean} settings.SavePacketLog_bool - Enable/disable packet log
   * @param {number} settings.PacketLogSwitchType_u32 - Packet log switching type (0-5)
   * @param {number[]} settings.PacketLogConfig_u32 - Packet log configuration array
   * @returns {Promise<Object>} Result object with success status and settings
   */
  async setHubLog(hubName, settings) {
    try {
      const params = {
        HubName_str: hubName,
        SaveSecurityLog_bool: Boolean(settings.SaveSecurityLog_bool),
        SecurityLogSwitchType_u32: Number(settings.SecurityLogSwitchType_u32),
        SavePacketLog_bool: Boolean(settings.SavePacketLog_bool),
        PacketLogSwitchType_u32: Number(settings.PacketLogSwitchType_u32),
        PacketLogConfig_u32: settings.PacketLogConfig_u32.map(Number)
      }

      console.log('Calling SetHubLog API with params:', params)
      const result = await this.makeRequest('SetHubLog', params)
      console.log('SetHubLog API response:', result)
      return {
        success: true,
        settings: result.result
      }
    } catch (error) {
      console.error('Error setting hub log settings:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Reboot the VPN server
   * @returns {Promise<Object>} Result object with success status
   */
  async rebootServer() {
    try {
      console.log('Calling RebootServer API...')
      const result = await this.makeRequest('RebootServer')
      console.log('RebootServer API response:', result)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error rebooting server:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Set hub online/offline status
   * @param {string} hubName - The Virtual Hub name
   * @param {boolean} online - Online/offline flag
   * @returns {Promise<Object>} Result object with success status
   */
  async setHubOnline(hubName, online) {
    try {
      console.log('Calling SetHubOnline API...', { hubName, online })
      const params = {
        HubName_str: hubName,
        Online_bool: online
      }
      
      const result = await this.makeRequest('SetHubOnline', params)
      console.log('SetHubOnline API response:', result)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error setting hub online status:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
} 
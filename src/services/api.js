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

  /**
   * Get hub message
   * @param {string} hubName - Target Virtual Hub name
   * @returns {Promise<Object>} Result object with success status and message
   */
  async getHubMsg(hubName) {
    try {
      console.log('Calling GetHubMsg API...')
      const params = {
        HubName_str: hubName
      }
      
      const result = await this.makeRequest('GetHubMsg', params)
      console.log('GetHubMsg API response:', result)
      
      // Decode the Base64 message
      const message = result.result.Msg_bin ? atob(result.result.Msg_bin) : ''
      
      return {
        success: true,
        message: message
      }
    } catch (error) {
      console.error('Error getting hub message:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Set hub message
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} message - Message to set (will be converted to Base64)
   * @returns {Promise<Object>} Result object with success status
   */
  async setHubMsg(hubName, message) {
    try {
      console.log('Calling SetHubMsg API...')
      const params = {
        HubName_str: hubName,
        Msg_bin: btoa(message) // Convert message to Base64
      }

      const result = await this.makeRequest('SetHubMsg', params)
      console.log('SetHubMsg API response:', result)

      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error setting hub message:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== USER MANAGEMENT ====================

  /**
   * Create a new user in a Virtual Hub
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} userName - User name
   * @param {Object} options - User options
   * @param {string} [options.GroupName_str] - Group name
   * @param {string} [options.Realname_utf] - Real name
   * @param {string} [options.Note_utf] - Note/description
   * @param {number} [options.ExpireTime_dt] - Expiration date (JavaScript Date.getTime() / 1000)
   * @param {number} [options.AuthType_u32] - Authentication type (0: Anonymous, 1: Password, 2: Certificate, 3: Radius, 4: NTDomain)
   * @param {string} [options.Auth_Password_str] - Password for password authentication
   * @param {number} [options.NumLogin_u32] - Limit number of logins (0 = unlimited)
   * @param {number} [options.MaxConnection_u32] - Maximum number of connections (0 = unlimited)
   * @param {Object} [options.policy] - Security policy object (optional)
   * @returns {Promise<Object>} Result object with success status
   */
  async createUser(hubName, userName, options = {}) {
    try {
      const params = {
        HubName_str: hubName,
        Name_str: userName,
        GroupName_str: options.GroupName_str || '',
        Realname_utf: options.Realname_utf || '',
        Note_utf: options.Note_utf || '',
        ExpireTime_dt: options.ExpireTime_dt || 0,
        AuthType_u32: options.AuthType_u32 || 0,
        Auth_Password_str: options.Auth_Password_str || '',
        UserX_bin: options.UserX_bin || '',
        Serial_bin: options.Serial_bin || '',
        CommonName_utf: options.CommonName_utf || '',
        RadiusUsername_utf: options.RadiusUsername_utf || '',
        NtUsername_utf: options.NtUsername_utf || '',
        UsePolicy_bool: options.policy ? true : false,
        NumLogin_u32: options.NumLogin_u32 || 0,
        ...(options.policy || {})
      }

      console.log('Creating user with params:', {
        ...params,
        Auth_Password_str: params.Auth_Password_str ? '***' : ''
      })

      const result = await this.makeRequest('CreateUser', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error creating user:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get user information
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} userName - User name
   * @returns {Promise<Object>} Result object with success status and user details
   */
  async getUser(hubName, userName) {
    try {
      const params = {
        HubName_str: hubName,
        Name_str: userName
      }

      const result = await this.makeRequest('GetUser', params)
      return {
        success: true,
        user: result.result
      }
    } catch (error) {
      console.error('Error getting user:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Update an existing user
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} userName - User name
   * @param {Object} options - User options (same as createUser)
   * @returns {Promise<Object>} Result object with success status
   */
  async setUser(hubName, userName, options = {}) {
    try {
      const params = {
        HubName_str: hubName,
        Name_str: userName,
        GroupName_str: options.GroupName_str || '',
        Realname_utf: options.Realname_utf || '',
        Note_utf: options.Note_utf || '',
        ExpireTime_dt: options.ExpireTime_dt || 0,
        AuthType_u32: options.AuthType_u32 || 0,
        Auth_Password_str: options.Auth_Password_str || '',
        UserX_bin: options.UserX_bin || '',
        Serial_bin: options.Serial_bin || '',
        CommonName_utf: options.CommonName_utf || '',
        RadiusUsername_utf: options.RadiusUsername_utf || '',
        NtUsername_utf: options.NtUsername_utf || '',
        UsePolicy_bool: options.policy ? true : false,
        NumLogin_u32: options.NumLogin_u32 || 0,
        ...(options.policy || {})
      }

      console.log('Updating user with params:', {
        ...params,
        Auth_Password_str: params.Auth_Password_str ? '***' : ''
      })

      const result = await this.makeRequest('SetUser', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error updating user:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete a user from a Virtual Hub
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} userName - User name to delete
   * @returns {Promise<Object>} Result object with success status
   */
  async deleteUser(hubName, userName) {
    try {
      const params = {
        HubName_str: hubName,
        Name_str: userName
      }

      console.log('Deleting user:', userName)
      const result = await this.makeRequest('DeleteUser', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== GROUP MANAGEMENT ====================

  /**
   * Enumerate all groups in a Virtual Hub
   * @param {string} hubName - Target Virtual Hub name
   * @returns {Promise<Object>} Result object with success status and group list
   */
  async enumGroup(hubName) {
    try {
      const params = {
        HubName_str: hubName
      }

      const result = await this.makeRequest('EnumGroup', params)
      return {
        success: true,
        groups: result.result.GroupList
      }
    } catch (error) {
      console.error('Error enumerating groups:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Create a new group in a Virtual Hub
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} groupName - Group name
   * @param {Object} options - Group options
   * @param {string} [options.Realname_utf] - Real name
   * @param {string} [options.Note_utf] - Note/description
   * @param {Object} [options.policy] - Security policy object
   * @returns {Promise<Object>} Result object with success status
   */
  async createGroup(hubName, groupName, options = {}) {
    try {
      const params = {
        HubName_str: hubName,
        Name_str: groupName,
        Realname_utf: options.Realname_utf || '',
        Note_utf: options.Note_utf || '',
        UsePolicy_bool: options.policy ? true : false,
        ...(options.policy || {})
      }

      console.log('Creating group:', groupName)
      const result = await this.makeRequest('CreateGroup', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error creating group:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get group information
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} groupName - Group name
   * @returns {Promise<Object>} Result object with success status and group details
   */
  async getGroup(hubName, groupName) {
    try {
      const params = {
        HubName_str: hubName,
        Name_str: groupName
      }

      const result = await this.makeRequest('GetGroup', params)
      return {
        success: true,
        group: result.result
      }
    } catch (error) {
      console.error('Error getting group:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Update an existing group
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} groupName - Group name
   * @param {Object} options - Group options (same as createGroup)
   * @returns {Promise<Object>} Result object with success status
   */
  async setGroup(hubName, groupName, options = {}) {
    try {
      const params = {
        HubName_str: hubName,
        Name_str: groupName,
        Realname_utf: options.Realname_utf || '',
        Note_utf: options.Note_utf || '',
        UsePolicy_bool: options.policy ? true : false,
        ...(options.policy || {})
      }

      console.log('Updating group:', groupName)
      const result = await this.makeRequest('SetGroup', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error updating group:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete a group from a Virtual Hub
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} groupName - Group name to delete
   * @returns {Promise<Object>} Result object with success status
   */
  async deleteGroup(hubName, groupName) {
    try {
      const params = {
        HubName_str: hubName,
        Name_str: groupName
      }

      console.log('Deleting group:', groupName)
      const result = await this.makeRequest('DeleteGroup', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== ACCESS CONTROL LIST (ACL) ====================

  /**
   * Enumerate all access control lists in a Virtual Hub
   * @param {string} hubName - Target Virtual Hub name
   * @returns {Promise<Object>} Result object with success status and ACL list
   */
  async enumAccess(hubName) {
    try {
      const params = {
        HubName_str: hubName
      }

      const result = await this.makeRequest('EnumAccess', params)
      return {
        success: true,
        accessList: result.result.AccessList
      }
    } catch (error) {
      console.error('Error enumerating access lists:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Add a new access control rule
   * @param {string} hubName - Target Virtual Hub name
   * @param {Object} rule - Access rule object
   * @param {number} rule.Priority_u32 - Priority (lower number = higher priority)
   * @param {boolean} [rule.Discard_bool] - Discard (true) or Pass (false)
   * @param {string} [rule.Note_utf] - Description/note
   * @param {number} [rule.SrcIpAddress_ip] - Source IP address
   * @param {number} [rule.SrcSubnetMask_ip] - Source subnet mask
   * @param {number} [rule.DestIpAddress_ip] - Destination IP address
   * @param {number} [rule.DestSubnetMask_ip] - Destination subnet mask
   * @param {number} [rule.Protocol_u32] - Protocol (1: ICMP, 6: TCP, 17: UDP)
   * @param {number} [rule.SrcPortStart_u32] - Source port range start
   * @param {number} [rule.SrcPortEnd_u32] - Source port range end
   * @param {number} [rule.DestPortStart_u32] - Destination port range start
   * @param {number} [rule.DestPortEnd_u32] - Destination port range end
   * @param {string} [rule.SrcUsername_str] - Source username
   * @param {string} [rule.DestUsername_str] - Destination username
   * @param {boolean} [rule.CheckSrcMac_bool] - Check source MAC address
   * @param {string} [rule.SrcMacAddress_bin] - Source MAC address (Base64)
   * @param {string} [rule.SrcMacMask_bin] - Source MAC mask (Base64)
   * @param {boolean} [rule.CheckDstMac_bool] - Check destination MAC address
   * @param {string} [rule.DstMacAddress_bin] - Destination MAC address (Base64)
   * @param {string} [rule.DstMacMask_bin] - Destination MAC mask (Base64)
   * @param {boolean} [rule.CheckTcpState_bool] - Check TCP state
   * @param {boolean} [rule.Established_bool] - Match established connections
   * @param {number} [rule.Delay_u32] - Delay in milliseconds
   * @param {number} [rule.Jitter_u32] - Jitter in milliseconds
   * @param {number} [rule.Loss_u32] - Packet loss percentage
   * @param {boolean} [rule.IsIPv6_bool] - Is IPv6 rule
   * @param {string} [rule.UniqueId_bin] - Unique ID (Base64)
   * @param {string} [rule.RedirectUrl_str] - Redirect URL
   * @returns {Promise<Object>} Result object with success status
   */
  async addAccess(hubName, rule) {
    try {
      const params = {
        HubName_str: hubName,
        ...rule
      }

      console.log('Adding access rule with priority:', rule.Priority_u32)
      const result = await this.makeRequest('AddAccess', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error adding access rule:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete an access control rule
   * @param {string} hubName - Target Virtual Hub name
   * @param {number} priority - Priority of the rule to delete
   * @returns {Promise<Object>} Result object with success status
   */
  async deleteAccess(hubName, priority) {
    try {
      const params = {
        HubName_str: hubName,
        Priority_u32: priority
      }

      console.log('Deleting access rule with priority:', priority)
      const result = await this.makeRequest('DeleteAccess', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error deleting access rule:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Set (replace) all access control rules at once
   * @param {string} hubName - Target Virtual Hub name
   * @param {Array} accessList - Array of access rule objects
   * @returns {Promise<Object>} Result object with success status
   */
  async setAccessList(hubName, accessList) {
    try {
      const params = {
        HubName_str: hubName,
        AccessList: accessList
      }

      console.log(`Setting ${accessList.length} access rules`)
      const result = await this.makeRequest('SetAccessList', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error setting access list:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== SESSION CONTROL ====================

  /**
   * Delete (disconnect) a session
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} sessionName - Session name to disconnect
   * @returns {Promise<Object>} Result object with success status
   */
  async deleteSession(hubName, sessionName) {
    try {
      const params = {
        HubName_str: hubName,
        Name_str: sessionName
      }

      console.log('Disconnecting session:', sessionName)
      const result = await this.makeRequest('DeleteSession', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error disconnecting session:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== SERVER INFORMATION ====================

  /**
   * Get server information
   * @returns {Promise<Object>} Result object with success status and server info
   */
  async getServerInfo() {
    try {
      const result = await this.makeRequest('GetServerInfo')
      return {
        success: true,
        serverInfo: result.result
      }
    } catch (error) {
      console.error('Error getting server info:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get server status
   * @returns {Promise<Object>} Result object with success status and server status
   */
  async getServerStatus() {
    try {
      const result = await this.makeRequest('GetServerStatus')
      return {
        success: true,
        status: result.result
      }
    } catch (error) {
      console.error('Error getting server status:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== MAC AND IP TABLES ====================

  /**
   * Enumerate MAC address table for a Virtual Hub
   * @param {string} hubName - Target Virtual Hub name
   * @returns {Promise<Object>} Result object with success status and MAC table
   */
  async enumMacTable(hubName) {
    try {
      const params = {
        HubName_str: hubName
      }

      const result = await this.makeRequest('EnumMacTable', params)
      return {
        success: true,
        macTable: result.result.MacTable
      }
    } catch (error) {
      console.error('Error enumerating MAC table:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Enumerate IP address table for a Virtual Hub
   * @param {string} hubName - Target Virtual Hub name
   * @returns {Promise<Object>} Result object with success status and IP table
   */
  async enumIpTable(hubName) {
    try {
      const params = {
        HubName_str: hubName
      }

      const result = await this.makeRequest('EnumIpTable', params)
      return {
        success: true,
        ipTable: result.result.IpTable
      }
    } catch (error) {
      console.error('Error enumerating IP table:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== HUB INFORMATION ====================

  /**
   * Get detailed information about a Virtual Hub
   * @param {string} hubName - Target Virtual Hub name
   * @returns {Promise<Object>} Result object with success status and hub details
   */
  async getHub(hubName) {
    try {
      const params = {
        HubName_str: hubName
      }

      const result = await this.makeRequest('GetHub', params)
      return {
        success: true,
        hub: result.result
      }
    } catch (error) {
      console.error('Error getting hub info:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Set hub configuration
   * @param {string} hubName - Target Virtual Hub name
   * @param {Object} options - Hub configuration options
   * @returns {Promise<Object>} Result object with success status
   */
  async setHub(hubName, options = {}) {
    try {
      const params = {
        HubName_str: hubName,
        ...options
      }

      console.log('Setting hub configuration for:', hubName)
      const result = await this.makeRequest('SetHub', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error setting hub configuration:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== BRIDGE/LOCAL BRIDGE ====================

  /**
   * Enumerate local bridge connections
   * @returns {Promise<Object>} Result object with success status and bridge list
   */
  async enumLocalBridge() {
    try {
      const result = await this.makeRequest('EnumLocalBridge')
      return {
        success: true,
        bridges: result.result.LocalBridgeList
      }
    } catch (error) {
      console.error('Error enumerating local bridges:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Create a local bridge
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} deviceName - Network device/adapter name
   * @param {boolean} [tapMode] - TAP mode (true) or normal mode (false)
   * @returns {Promise<Object>} Result object with success status
   */
  async addLocalBridge(hubName, deviceName, tapMode = false) {
    try {
      const params = {
        HubNameLB_str: hubName,
        DeviceName_str: deviceName,
        TapMode_bool: tapMode
      }

      console.log('Creating local bridge:', { hubName, deviceName, tapMode })
      const result = await this.makeRequest('AddLocalBridge', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error creating local bridge:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete a local bridge
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} deviceName - Network device/adapter name
   * @returns {Promise<Object>} Result object with success status
   */
  async deleteLocalBridge(hubName, deviceName) {
    try {
      const params = {
        HubNameLB_str: hubName,
        DeviceName_str: deviceName
      }

      console.log('Deleting local bridge:', { hubName, deviceName })
      const result = await this.makeRequest('DeleteLocalBridge', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error deleting local bridge:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== CASCADE CONNECTIONS ====================

  /**
   * Enumerate cascade connections in a Virtual Hub
   * @param {string} hubName - Target Virtual Hub name
   * @returns {Promise<Object>} Result object with success status and cascade list
   */
  async enumLink(hubName) {
    try {
      const params = {
        HubName_str: hubName
      }

      const result = await this.makeRequest('EnumLink', params)
      return {
        success: true,
        links: result.result.LinkList
      }
    } catch (error) {
      console.error('Error enumerating cascade connections:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Create a cascade connection
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} linkName - Cascade connection name
   * @param {Object} options - Cascade connection options
   * @param {string} options.Hostname_str - Destination hostname
   * @param {number} options.Port_u32 - Destination port
   * @param {string} options.HubName_str - Destination hub name
   * @param {number} options.AuthType_u32 - Authentication type
   * @param {string} [options.Username_str] - Username
   * @param {string} [options.Password_str] - Password
   * @param {boolean} [options.Online_bool] - Online status
   * @returns {Promise<Object>} Result object with success status
   */
  async createLink(hubName, linkName, options) {
    try {
      const params = {
        HubName_Ex_str: hubName,
        ClientOption_AccountName_utf: linkName,
        ...options
      }

      console.log('Creating cascade connection:', linkName)
      const result = await this.makeRequest('CreateLink', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error creating cascade connection:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get cascade connection details
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} linkName - Cascade connection name
   * @returns {Promise<Object>} Result object with success status and link details
   */
  async getLink(hubName, linkName) {
    try {
      const params = {
        HubName_Ex_str: hubName,
        AccountName_utf: linkName
      }

      const result = await this.makeRequest('GetLink', params)
      return {
        success: true,
        link: result.result
      }
    } catch (error) {
      console.error('Error getting cascade connection:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Set cascade connection online/offline
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} linkName - Cascade connection name
   * @param {boolean} online - Online (true) or offline (false)
   * @returns {Promise<Object>} Result object with success status
   */
  async setLinkOnline(hubName, linkName, online) {
    try {
      const params = {
        HubName_Ex_str: hubName,
        AccountName_utf: linkName,
        Online_bool: online
      }

      console.log('Setting cascade connection online status:', { linkName, online })
      const result = await this.makeRequest('SetLinkOnline', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error setting cascade connection status:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete a cascade connection
   * @param {string} hubName - Target Virtual Hub name
   * @param {string} linkName - Cascade connection name
   * @returns {Promise<Object>} Result object with success status
   */
  async deleteLink(hubName, linkName) {
    try {
      const params = {
        HubName_Ex_str: hubName,
        AccountName_utf: linkName
      }

      console.log('Deleting cascade connection:', linkName)
      const result = await this.makeRequest('DeleteLink', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error deleting cascade connection:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== LAYER 3 SWITCH ====================

  /**
   * Enumerate Layer 3 switches
   * @returns {Promise<Object>} Result object with success status and L3 switch list
   */
  async enumL3Switch() {
    try {
      const result = await this.makeRequest('EnumL3Switch')
      return {
        success: true,
        switches: result.result.L3SWList
      }
    } catch (error) {
      console.error('Error enumerating L3 switches:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Create a Layer 3 switch
   * @param {string} switchName - L3 switch name
   * @returns {Promise<Object>} Result object with success status
   */
  async addL3Switch(switchName) {
    try {
      const params = {
        Name_str: switchName
      }

      console.log('Creating L3 switch:', switchName)
      const result = await this.makeRequest('AddL3Switch', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error creating L3 switch:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete a Layer 3 switch
   * @param {string} switchName - L3 switch name
   * @returns {Promise<Object>} Result object with success status
   */
  async delL3Switch(switchName) {
    try {
      const params = {
        Name_str: switchName
      }

      console.log('Deleting L3 switch:', switchName)
      const result = await this.makeRequest('DelL3Switch', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error deleting L3 switch:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Start a Layer 3 switch
   * @param {string} switchName - L3 switch name
   * @returns {Promise<Object>} Result object with success status
   */
  async startL3Switch(switchName) {
    try {
      const params = {
        Name_str: switchName
      }

      console.log('Starting L3 switch:', switchName)
      const result = await this.makeRequest('StartL3Switch', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error starting L3 switch:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Stop a Layer 3 switch
   * @param {string} switchName - L3 switch name
   * @returns {Promise<Object>} Result object with success status
   */
  async stopL3Switch(switchName) {
    try {
      const params = {
        Name_str: switchName
      }

      console.log('Stopping L3 switch:', switchName)
      const result = await this.makeRequest('StopL3Switch', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error stopping L3 switch:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Add interface to Layer 3 switch
   * @param {string} switchName - L3 switch name
   * @param {string} hubName - Virtual Hub name
   * @param {string} ipAddress - IP address for the interface
   * @param {string} subnetMask - Subnet mask
   * @returns {Promise<Object>} Result object with success status
   */
  async addL3If(switchName, hubName, ipAddress, subnetMask) {
    try {
      const params = {
        Name_str: switchName,
        HubName_str: hubName,
        IpAddress_ip: ipAddress,
        SubnetMask_ip: subnetMask
      }

      console.log('Adding L3 interface:', { switchName, hubName, ipAddress })
      const result = await this.makeRequest('AddL3If', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error adding L3 interface:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete interface from Layer 3 switch
   * @param {string} switchName - L3 switch name
   * @param {string} hubName - Virtual Hub name
   * @returns {Promise<Object>} Result object with success status
   */
  async delL3If(switchName, hubName) {
    try {
      const params = {
        Name_str: switchName,
        HubName_str: hubName
      }

      console.log('Deleting L3 interface:', { switchName, hubName })
      const result = await this.makeRequest('DelL3If', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error deleting L3 interface:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Enumerate interfaces of a Layer 3 switch
   * @param {string} switchName - L3 switch name
   * @returns {Promise<Object>} Result object with success status and interface list
   */
  async enumL3If(switchName) {
    try {
      const params = {
        Name_str: switchName
      }

      const result = await this.makeRequest('EnumL3If', params)
      return {
        success: true,
        interfaces: result.result.L3IFList
      }
    } catch (error) {
      console.error('Error enumerating L3 interfaces:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Add routing table entry to Layer 3 switch
   * @param {string} switchName - L3 switch name
   * @param {string} networkAddress - Network address
   * @param {string} subnetMask - Subnet mask
   * @param {string} gatewayAddress - Gateway address
   * @param {number} [metric] - Route metric (default: 1)
   * @returns {Promise<Object>} Result object with success status
   */
  async addL3Table(switchName, networkAddress, subnetMask, gatewayAddress, metric = 1) {
    try {
      const params = {
        Name_str: switchName,
        NetworkAddress_ip: networkAddress,
        SubnetMask_ip: subnetMask,
        GatewayAddress_ip: gatewayAddress,
        Metric_u32: metric
      }

      console.log('Adding L3 routing table entry:', { switchName, networkAddress, gatewayAddress })
      const result = await this.makeRequest('AddL3Table', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error adding L3 routing table entry:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete routing table entry from Layer 3 switch
   * @param {string} switchName - L3 switch name
   * @param {string} networkAddress - Network address
   * @param {string} subnetMask - Subnet mask
   * @param {string} gatewayAddress - Gateway address
   * @returns {Promise<Object>} Result object with success status
   */
  async delL3Table(switchName, networkAddress, subnetMask, gatewayAddress) {
    try {
      const params = {
        Name_str: switchName,
        NetworkAddress_ip: networkAddress,
        SubnetMask_ip: subnetMask,
        GatewayAddress_ip: gatewayAddress
      }

      console.log('Deleting L3 routing table entry:', { switchName, networkAddress })
      const result = await this.makeRequest('DelL3Table', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error deleting L3 routing table entry:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Enumerate routing table of a Layer 3 switch
   * @param {string} switchName - L3 switch name
   * @returns {Promise<Object>} Result object with success status and routing table
   */
  async enumL3Table(switchName) {
    try {
      const params = {
        Name_str: switchName
      }

      const result = await this.makeRequest('EnumL3Table', params)
      return {
        success: true,
        routes: result.result.L3Table
      }
    } catch (error) {
      console.error('Error enumerating L3 routing table:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== CONNECTION INFO ====================

  /**
   * Get connection information (for debugging)
   * @returns {Promise<Object>} Result object with success status and connection info
   */
  async getConnectionInfo() {
    try {
      const result = await this.makeRequest('GetConnectionInfo')
      return {
        success: true,
        connectionInfo: result.result
      }
    } catch (error) {
      console.error('Error getting connection info:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== CERTIFICATE MANAGEMENT ====================

  /**
   * Get server certificate
   * @returns {Promise<Object>} Result object with success status and certificate
   */
  async getServerCert() {
    try {
      const result = await this.makeRequest('GetServerCert')
      return {
        success: true,
        cert: result.result
      }
    } catch (error) {
      console.error('Error getting server certificate:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Set server certificate
   * @param {string} certData - Certificate data (Base64 encoded)
   * @param {string} keyData - Private key data (Base64 encoded)
   * @returns {Promise<Object>} Result object with success status
   */
  async setServerCert(certData, keyData) {
    try {
      const params = {
        Cert_bin: certData,
        Key_bin: keyData
      }

      console.log('Setting server certificate')
      const result = await this.makeRequest('SetServerCert', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error setting server certificate:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== ADMIN OPTIONS ====================

  /**
   * Get admin options (server configuration)
   * @returns {Promise<Object>} Result object with success status and options
   */
  async getAdminOptions() {
    try {
      const result = await this.makeRequest('GetAdminOptions')
      return {
        success: true,
        options: result.result
      }
    } catch (error) {
      console.error('Error getting admin options:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Set admin options (server configuration)
   * @param {Array} options - Array of admin option objects
   * @returns {Promise<Object>} Result object with success status
   */
  async setAdminOptions(options) {
    try {
      const params = {
        AdminOptionList: options
      }

      console.log('Setting admin options')
      const result = await this.makeRequest('SetAdminOptions', params)
      return {
        success: true,
        result: result.result
      }
    } catch (error) {
      console.error('Error setting admin options:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== CLUSTERING ====================

  /**
   * Get clustering configuration
   * @returns {Promise<Object>} Result object with success status and cluster info
   */
  async getFarmSetting() {
    try {
      const result = await this.makeRequest('GetFarmSetting')
      return {
        success: true,
        farmInfo: result.result
      }
    } catch (error) {
      console.error('Error getting cluster settings:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get clustering member information
   * @returns {Promise<Object>} Result object with success status and member list
   */
  async enumFarmMember() {
    try {
      const result = await this.makeRequest('EnumFarmMember')
      return {
        success: true,
        members: result.result.FarmMemberList
      }
    } catch (error) {
      console.error('Error enumerating cluster members:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
} 
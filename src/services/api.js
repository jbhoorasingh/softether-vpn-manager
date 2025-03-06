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
} 
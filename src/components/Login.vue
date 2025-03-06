<template>
  <div class="login-container">
    <div class="background-pattern"></div>
    <div class="login-content">
      <div class="login-card">
        <div class="brand">
          <i class="fas fa-shield-alt brand-icon"></i>
          <h1 class="title">SoftEther VPN Manager</h1>
          <p class="subtitle">Connect to your VPN server</p>
        </div>
        
        <!-- Show error message if exists -->
        <div v-if="auth.error" class="error-alert">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ auth.error }}</span>
          <button class="close-button" @click="auth.clearError">&times;</button>
        </div>

        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label for="host">
              <i class="fas fa-server"></i>
              Server Host
            </label>
            <input
              id="host"
              v-model="formData.host"
              type="text"
              placeholder="https://vpn.server.com"
              :class="{ 'error': errors.host }"
              required
            />
            <span class="error-message" v-if="errors.host">{{ errors.host }}</span>
          </div>

          <div class="form-group">
            <label for="port">
              <i class="fas fa-plug"></i>
              Admin Port
            </label>
            <input
              id="port"
              v-model="formData.port"
              type="number"
              placeholder="5555"
              :class="{ 'error': errors.port }"
              required
            />
            <span class="error-message" v-if="errors.port">{{ errors.port }}</span>
          </div>

          <div class="form-group">
            <label for="username">
              <i class="fas fa-user"></i>
              Username
            </label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              placeholder="administrator"
              :class="{ 'error': errors.username }"
              required
            />
            <span class="error-message" v-if="errors.username">{{ errors.username }}</span>
          </div>

          <div class="form-group">
            <label for="password">
              <i class="fas fa-lock"></i>
              Password
            </label>
            <div class="password-input">
              <input
                id="password"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                :class="{ 'error': errors.password }"
                required
              />
              <button 
                type="button" 
                class="toggle-password"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <span class="error-message" v-if="errors.password">{{ errors.password }}</span>
          </div>

          <div class="form-group checkbox">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="formData.ignoreHttpsErrors"
              />
              <i class="fas fa-shield-alt checkbox-icon"></i>
              <span>Ignore HTTPS errors</span>
            </label>
          </div>

          <button type="submit" :disabled="isLoading" class="submit-button">
            <i class="fas fa-sign-in-alt"></i>
            {{ isLoading ? 'Connecting...' : 'Connect' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const showPassword = ref(false)

const formData = reactive({
  host: 'http://localhost',
  port: '5555',
  username: 'administrator',
  password: '',
  ignoreHttpsErrors: false
})

const errors = reactive({
  host: '',
  port: '',
  username: '',
  password: ''
})

const isLoading = ref(false)

const validateForm = () => {
  let isValid = true
  
  // Reset errors
  Object.keys(errors).forEach(key => errors[key] = '')
  
  // Host validation
  if (!formData.host) {
    errors.host = 'Server host is required'
    isValid = false
  } else if (!formData.host.match(/^https?:\/\/.+/)) {
    errors.host = 'Please enter a valid URL with http:// or https://'
    isValid = false
  }

  // Port validation
  if (!formData.port) {
    errors.port = 'Port is required'
    isValid = false
  } else if (formData.port < 1 || formData.port > 65535) {
    errors.port = 'Port must be between 1 and 65535'
    isValid = false
  }

  // Username validation
  if (!formData.username) {
    errors.username = 'Username is required'
    isValid = false
  }

  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isLoading.value = true
  try {
    const success = await auth.login({
      ...formData,
      port: parseInt(formData.port, 10)
    })
    
    if (success) {
      // Check for redirect query parameter
      const redirectPath = router.currentRoute.value.query.redirect || '/dashboard'
      router.push(redirectPath)
    }
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #f7fafc;
}

.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.03;
  background: 
    linear-gradient(45deg, #1a202c 25%, transparent 25%) -50px 0,
    linear-gradient(-45deg, #1a202c 25%, transparent 25%) -50px 0,
    linear-gradient(45deg, transparent 75%, #1a202c 75%) -50px 0,
    linear-gradient(-45deg, transparent 75%, #1a202c 75%) -50px 0;
  background-size: 100px 100px;
  background-color: #f7fafc;
}

.login-content {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
}

.brand {
  text-align: center;
  margin-bottom: 2rem;
}

.brand-icon {
  font-size: 2.5rem;
  color: #1a202c;
  margin-bottom: 0.75rem;
}

.title {
  color: #1a202c;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: #718096;
  font-size: 0.875rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
}

label i {
  color: #4a5568;
  width: 1rem;
  text-align: center;
  font-size: 0.875rem;
}

input {
  padding: 0.625rem 0.875rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
  width: 100%;
}

input:focus {
  outline: none;
  border-color: #2d3748;
  box-shadow: 0 0 0 3px rgba(45, 55, 72, 0.1);
}

.password-input {
  position: relative;
  display: flex;
}

.password-input input {
  padding-right: 2.5rem;
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 0.25rem;
}

.toggle-password:hover {
  color: #4a5568;
}

input.error {
  border-color: #e53e3e;
}

.error-message {
  color: #e53e3e;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.checkbox {
  flex-direction: row;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  user-select: none;
  font-size: 0.875rem;
}

.checkbox-icon {
  color: #4a5568;
  font-size: 0.875rem;
}

.submit-button {
  background-color: #1a202c;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
}

.submit-button:hover {
  background-color: #2d3748;
}

.submit-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.error-alert {
  background-color: #fff5f5;
  border: 1px solid #feb2b2;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.error-alert i {
  font-size: 1rem;
}

.close-button {
  margin-left: auto;
  background: none;
  border: none;
  color: #c53030;
  font-size: 1.125rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.close-button:hover {
  opacity: 0.7;
}

/* Remove number input arrows */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

@media (max-width: 640px) {
  .login-card {
    padding: 1.5rem;
  }
  
  .title {
    font-size: 1.5rem;
  }
}
</style> 
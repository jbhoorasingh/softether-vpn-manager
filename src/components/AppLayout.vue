<template>
  <div class="app-layout">
    <!-- Sidebar Navigation -->
    <nav class="sidebar">
      <div class="sidebar-header">
        <h1 class="logo">VPN Manager</h1>
      </div>
      
      <div class="nav-links">
        <router-link to="/dashboard" class="nav-link" active-class="active">
          <i class="fas fa-chart-line"></i>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/hubs" class="nav-link" active-class="active">
          <i class="fas fa-network-wired"></i>
          <span>Virtual Hubs</span>
        </router-link>
        <router-link to="/users" class="nav-link" active-class="active">
          <i class="fas fa-users"></i>
          <span>Users</span>
        </router-link>
        <router-link to="/logs" class="nav-link" active-class="active">
          <i class="fas fa-file-alt"></i>
          <span>Logs</span>
        </router-link>
        <router-link to="/settings" class="nav-link" active-class="active">
          <i class="fas fa-cog"></i>
          <span>Settings</span>
        </router-link>
        <router-link to="/capabilities" class="nav-link" active-class="active">
          <i class="fas fa-microchip"></i>
          <span>Capabilities</span>
        </router-link>
      </div>
    </nav>

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Top Header -->
      <header class="header">
        <div class="server-info">
          <span class="server-name">{{ serverInfo.host }}</span>
          <span class="connection-status" :class="{ 'connected': true }">
            Connected
          </span>
        </div>
        
        <div class="header-actions">
          <button class="logout-button" @click="handleLogout">
            <i class="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="content">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const auth = useAuthStore()
const router = useRouter()

const serverInfo = computed(() => auth.currentServer)

const handleLogout = async () => {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  background-color: #1a202c;
  color: white;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  margin-bottom: 2rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #a0aec0;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-link i {
  width: 1.25rem;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.active {
  background-color: #2d3748;
  color: white;
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #f7fafc;
}

.header {
  background-color: white;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
}

.server-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.server-name {
  font-weight: 500;
  color: #2d3748;
}

.connection-status {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background-color: #e6fffa;
  color: #047857;
}

.connection-status.connected {
  background-color: #e6fffa;
  color: #047857;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background-color: #fff;
  color: #e53e3e;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-button:hover {
  background-color: #fff5f5;
}

.content {
  padding: 2rem;
  flex-grow: 1;
}
</style> 
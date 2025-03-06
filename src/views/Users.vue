<template>
  <AppLayout>
    <div class="users">
      <header class="page-header">
        <h1>Users</h1>
        <div class="actions">
          <button class="action-button">
            <i class="fas fa-user-plus"></i>
            New User
          </button>
        </div>
      </header>

      <div class="content-placeholder">
        <i class="fas fa-users placeholder-icon"></i>
        <p>User management coming soon</p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '../components/AppLayout.vue'
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
}

.action-button:hover {
  background-color: #2c5282;
}

.content-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.placeholder-icon {
  font-size: 4rem;
  color: #a0aec0;
  margin-bottom: 1rem;
}

.content-placeholder p {
  color: #718096;
  font-size: 1.125rem;
}
</style> 
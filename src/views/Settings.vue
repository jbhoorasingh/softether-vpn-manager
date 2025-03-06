<template>
  <AppLayout>
    <div class="settings">
      <header class="page-header">
        <h1>Settings</h1>
      </header>

      <div class="content-placeholder">
        <i class="fas fa-cog placeholder-icon"></i>
        <p>Settings panel coming soon</p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '../components/AppLayout.vue'
</script>

<style scoped>
.settings {
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
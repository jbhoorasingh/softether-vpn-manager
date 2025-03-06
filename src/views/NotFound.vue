<template>
  <div class="not-found">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>The page you're looking for doesn't exist or has been moved.</p>
    <router-link to="/" class="home-link">Go to Home</router-link>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-color: #f5f7fa;
  padding: 2rem;
}

h1 {
  font-size: 6rem;
  color: #2d3748;
  margin: 0;
  line-height: 1;
}

h2 {
  font-size: 2rem;
  color: #4a5568;
  margin: 1rem 0;
}

p {
  color: #718096;
  margin-bottom: 2rem;
}

.home-link {
  display: inline-block;
  background-color: #3182ce;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  transition: background-color 0.2s;
}

.home-link:hover {
  background-color: #2c5282;
}
</style> 
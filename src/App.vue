<script>
export default {
  name: 'App'
}
</script>

<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <keep-alive :max="3">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  font-family: 'Kanit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
  background: #f5f5f5;
}

button,
input,
select,
textarea,
table,
dialog {
  font-family: inherit;
}

#app {
  width: 100%;
  height: 100vh;
}
</style>

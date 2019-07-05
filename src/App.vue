<template>
  <div id="root">
    <p>
      <img src="./assets/oops.png" alt srcset />
    </p>
    <router-link to="/test">路由测试</router-link>
    <router-view />
  </div>
</template>
<script>
export default {
  name: "app"
};
</script>
<style lang="scss" scoped>
#root {
  text-align: center;
}
</style>


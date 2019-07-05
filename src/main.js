import Vue from 'vue'
import App from './App.vue'
import router from '@/route'
import './styles/index.scss'
// import a from 'a'

new Vue({
  router,
  render: h => h(App)
}).$mount('#root')
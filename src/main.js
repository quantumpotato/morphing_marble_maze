// import form from '@unrest/form'
import { createApp } from 'vue'
import unrest from '@unrest/vue'

import App from './App.vue'
import router from './router'
import EventLog from './components/EventLog.vue'

import '@unrest/tailwind/dist.css'
import './css/index.css'

createApp(App)
  .use(router)
  .use(unrest.plugin)
  .use(unrest.ui)
  .component('EventLog', EventLog)
  .mount('#app')

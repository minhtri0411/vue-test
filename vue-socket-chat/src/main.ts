import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
// import Textarea from 'primevue/textarea';

import 'primevue/resources/primevue.min.css'
import 'primevue/resources/themes/saga-blue/theme.css'
import 'primeicons/primeicons.css'

const app = createApp(App);
app.use(PrimeVue);

app.component('Dialog', Dialog);
app.component('InputText', InputText);
// app.component('Textarea', Textarea);

app.mount('#app');
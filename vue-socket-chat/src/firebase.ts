// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyC86swyXYVHeCdBu5U93cCgLeIfxM38too",
  authDomain: "vue-chat-c6a60.firebaseapp.com",
  projectId: "vue-chat-c6a60",
  storageBucket: "vue-chat-c6a60.appspot.com",
  messagingSenderId: "179031419485",
  appId: "1:179031419485:web:05ac9b363bf0867801fbb4",
  measurementId: "G-9L52W4ZYSN"
};

const firebaseApp = initializeApp(firebaseConfig);

const fireStore = firebaseApp.firestore();
fireStore.settings({ timestampsInSnapshots: true });

// auth.useEmulator('http://localhost:9099')
if (window.location.hostname === 'localhost') {
  fireStore.useEmulator('localhost', '8080')
}

export default fireStore;


// firebase emulator setup

// 1: create folder firebase-emulator
// 2: cd to folder firebase-emulator
// 3: npm i -g firebase-tools
// 4:cmd: firebase login
// 5: firebase init
// setup
// 6: firebase emulators:start
// 7: edit firebase config

// auth.useEmulator('http://localhost:9099')
// if(window.location.hostname === 'localhost') {
// 	fireStore.useEmulator('localhost', '8080')
// }
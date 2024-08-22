
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAiBY5marAkD2WKxZUc5PJ2oUMpGERzZ4g",
  authDomain: "asistente-gastos-6b587.firebaseapp.com",
  projectId: "asistente-gastos-6b587",
  storageBucket: "asistente-gastos-6b587.appspot.com",
  messagingSenderId: "616052727317",
  appId: "1:616052727317:web:2c3ede2bcc71212b1db81c",
  measurementId: "G-DPY5H44C2Y"
};

export const db = initializeApp(firebaseConfig);
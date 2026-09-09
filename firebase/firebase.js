import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBWopeKczIQKam_KT8T-8HMnhpjKLetvaI",
  authDomain: "dev-nomad-acl.firebaseapp.com",
  projectId: "dev-nomad-acl",
  storageBucket: "dev-nomad-acl.firebasestorage.app",
  messagingSenderId: "864118637838",
  appId: "1:864118637838:web:9a3b4bf4bf7933df0c035f",
  measurementId: "G-NTWVGG1ZFF"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
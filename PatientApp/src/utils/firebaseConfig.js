// Using Firebase compat API — works reliably in React Native / Expo Go
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBlP91iQoSxaWxk-S1WbxrT7ic5bu4vIoc",
    authDomain: "charitynet-6ebdc.firebaseapp.com",
    projectId: "charitynet-6ebdc",
    storageBucket: "charitynet-6ebdc.firebasestorage.app",
    messagingSenderId: "197476262169",
    appId: "1:197476262169:web:0c05f2ecce43f129c7a588"
};

// Initialize only once
if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export default firebase;

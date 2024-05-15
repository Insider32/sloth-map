import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: 'AIzaSyBg9oTSxgiXb9P_FPet0snym1R3szJawx8',
    authDomain: 'budgie-dc9f6.firebaseapp.com',
    projectId: 'budgie-dc9f6',
    storageBucket: 'budgie-dc9f6.appspot.com',
    messagingSenderId: '105899101971',
    appId: '1:105899101971:web:2c0cd86a5f2bc28c6a54e6',
    measurementId: 'G-G2Q5FYSZN8',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
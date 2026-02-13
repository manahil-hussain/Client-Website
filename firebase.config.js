const firebaseConfig = {
    apiKey: "AIzaSyBobjmJN3zaqUFVFzSfbxG9LzWVIS6P78E",
    authDomain: "moonbling-website.firebaseapp.com",
    projectId: "moonbling-website",
    storageBucket: "moonbling-website.firebasestorage.app",
    messagingSenderId: "819778842555",
    appId: "1:819778842555:web:1e7de5082e808e98261e9e",
    measurementId: "G-WGEWSDRV06"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.database();

// Import the auth service from our config file
import { auth } from './firebase-client.js';
// Import the auth functions we will use
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.querySelector('.container');

const registerForm = document.querySelector('.sign-up-container form');
const loginForm = document.querySelector('.sign-in-container form');
const forgotPasswordLink = document.querySelector('.forgot-password');

// Helper untuk memaparkan mesej
const showMessage = (form, message, isError = false) => {
    const messageElement = form.querySelector('.form-message');
    messageElement.textContent = message;
    messageElement.style.color = isError ? 'red' : 'green';
};

// Helper untuk mengurus keadaan memuat (loading state)
const toggleLoading = (form, isLoading) => {
    const button = form.querySelector('button[type="submit"]');
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    } else {
        button.disabled = false;
        button.textContent = form.parentElement.classList.contains('sign-in-container') ? 'Log Masuk' : 'Daftar';
    }
};

// Helper untuk memetakan kod ralat Firebase kepada mesej mesra pengguna
const getFriendlyErrorMessage = (errorCode) => {
    switch (errorCode) {
        case 'auth/email-already-in-use': return 'Alamat e-mel ini telah digunakan.';
        case 'auth/invalid-email': return 'Alamat e-mel tidak sah.';
        case 'auth/weak-password': return 'Kata laluan terlalu lemah. Gunakan sekurang-kurangnya 6 aksara.';
        case 'auth/user-not-found':
        case 'auth/wrong-password': return 'E-mel atau kata laluan tidak betul.';
        default: return 'Satu ralat telah berlaku. Sila cuba lagi.';
    }
};

signUpButton.addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.remove("right-panel-active");
});

// Fungsi untuk menghantar data pendaftaran ke backend
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Halang borang daripada dimuat semula

    toggleLoading(registerForm, true);
    showMessage(registerForm, ''); // Kosongkan mesej lama

    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData.entries());

    try {
        // 1. Create user with Firebase Authentication on the client-side
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        // 2. Prepare profile data to send to our own server
        const profileData = {
            uid: user.uid, // The unique ID from Firebase Auth
            peranan: data.peranan,
            nama: data.nama,
            sekolah: data.sekolah,
            email: data.email
            // We DO NOT send the password to our server
        };

        // 3. Send profile data to our backend to store in Firestore
        const response = await fetch('http://localhost:3000/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(loginForm, "Pendaftaran berjaya! Sila log masuk.");
            registerForm.reset();
            signInButton.click(); // Kembali ke borang log masuk
        } else {
            // This could happen if the backend fails. The user is created in Auth but not in our DB.
            showMessage(registerForm, `Ralat menyimpan profil: ${result.message}`, true);
        }
    } catch (error) {
        // This will catch errors from Firebase, like "email-already-in-use"
        console.error('Ralat Pendaftaran:', error);
        showMessage(registerForm, getFriendlyErrorMessage(error.code), true);
    } finally {
        toggleLoading(registerForm, false);
    }
});

// Fungsi untuk menghantar data log masuk ke backend
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    toggleLoading(loginForm, true);
    showMessage(loginForm, '');

    try {
        // 1. Sign in using Firebase Authentication on the client-side
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;
        
        // 2. Dapatkan profil pengguna dari backend
        const profileResponse = await fetch(`http://localhost:3000/get-profile/${user.uid}`);
        if (!profileResponse.ok) {
            // Ini berlaku jika pengguna wujud dalam Auth tetapi tiada rekod profil di Firestore
            throw new Error('Profil pengguna tidak ditemui. Sila hubungi pentadbir.');
        }
        
        const profileData = await profileResponse.json();

        // 3. Simpan data pengguna ke localStorage untuk kegunaan di halaman lain
        localStorage.setItem('sars_currentUser', JSON.stringify(profileData));

        showMessage(loginForm, `Log masuk berjaya! Mengalihkan...`);

        // 4. Halakan pengguna ke papan pemuka yang betul berdasarkan peranan
        setTimeout(() => {
            if (profileData.peranan === 'guru') {
                window.location.href = '(SARS)-Guru.html';
            } else if (profileData.peranan === 'pelajar') {
                window.location.href = '(SARS)-PELAJAR.html';
            } else {
                // Fallback jika peranan tidak dikenali
                throw new Error('Peranan pengguna tidak sah.');
            }
        }, 1500);
    } catch (error) {
        console.error('Ralat Log Masuk:', error);
        const errorMessage = error.code ? getFriendlyErrorMessage(error.code) : error.message;
        showMessage(loginForm, errorMessage, true);
        toggleLoading(loginForm, false);
    }
});

forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[name="email"]').value;
    if (!email) {
        showMessage(loginForm, 'Sila masukkan e-mel anda untuk menetapkan semula kata laluan.', true);
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        showMessage(loginForm, 'E-mel penetapan semula kata laluan telah dihantar!');
    } catch (error) {
        showMessage(loginForm, getFriendlyErrorMessage(error.code), true);
    }
});
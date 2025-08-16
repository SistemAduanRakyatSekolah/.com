// 1. Import pakej yang diperlukan
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// 2. Konfigurasi
const app = express();
app.use(express.json()); // Benarkan server menerima data JSON
app.use(cors()); // Benarkan permintaan dari domain lain (frontend anda)

// --- KONFIGURASI FIREBASE ---
// Muat turun fail kunci peribadi (private key) dari projek Firebase anda
// Firebase Console > Project Settings > Service accounts > Generate new private key
// Simpan sebagai 'serviceAccountKey.json' dalam folder projek anda
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 3. Cipta API Endpoint untuk menyimpan data profil pengguna
// Endpoint ini dipanggil SELEPAS pengguna berjaya didaftarkan melalui Firebase Auth di frontend.
app.post('/create-profile', async (req, res) => {
    try {
        const { uid, peranan, nama, sekolah, email } = req.body;

        // Semak jika semua data wujud
        if (!uid || !peranan || !nama || !sekolah || !email) {
            return res.status(400).send({ message: 'Maklumat profil tidak lengkap.' });
        }

        // Gunakan UID dari Firebase Auth sebagai ID dokumen.
        // Ini menghubungkan data profil Firestore dengan pengguna Auth.
        await db.collection('users').doc(uid).set({
            peranan,
            nama,
            sekolah,
            email,
            profilePicUrl: 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg', // URL lalai
            diciptaPada: admin.firestore.FieldValue.serverTimestamp()
        });

        // Hantar respons berjaya
        res.status(201).send({ message: 'Profil pengguna berjaya disimpan.' });

    } catch (error) {
        console.error('Ralat semasa mencipta profil:', error);
        res.status(500).send({ message: 'Ralat pada pelayan. Sila cuba lagi.' });
    }
});

// Endpoint BARU untuk mengemas kini URL gambar profil
app.post('/update-profile-picture', async (req, res) => {
    try {
        const { uid, url } = req.body;
        if (!uid || !url) {
            return res.status(400).send({ message: 'UID dan URL diperlukan.' });
        }

        await db.collection('users').doc(uid).update({
            profilePicUrl: url
        });

        res.status(200).send({ message: 'Gambar profil berjaya dikemas kini.' });

    } catch (error) {
        console.error('Ralat mengemas kini gambar profil:', error);
        res.status(500).send({ message: 'Ralat pada pelayan. Sila cuba lagi.' });
    }
});

// Endpoint BARU untuk mendapatkan data profil pengguna
app.get('/get-profile/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).send({ message: 'Profil pengguna tidak ditemui.' });
        }

        const userData = userDoc.data();
        // Cipta kunci sekolah untuk kegunaan di frontend
        const sekolah_key = userData.sekolah.replace(/\s/g, '_').toLowerCase();
        
        res.status(200).send({ ...userData, sekolah_key });

    } catch (error) {
        console.error('Ralat mendapatkan profil:', error);
        res.status(500).send({ message: 'Ralat pada pelayan. Sila cuba lagi.' });
    }
});

// 4. Mulakan pelayan
const PORT = 3000; // Pelayan akan berjalan di port 3000
app.listen(PORT, () => {
    console.log(`Pelayan sedang berjalan di http://localhost:${PORT}`);
});
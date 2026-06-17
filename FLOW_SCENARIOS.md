# Open BK - App Flow, User Roles, dan Skenario

Dokumen ini memetakan alur interaksi pengguna dengan sistem mulai dari pendaftaran, pengiriman masalah, triase, hingga administratif. Hal ini akan memudahkan developer, product manager, maupun pihak sekolah untuk memahami bagaimana sistem bekerja secara fungsional.

---

## 1. Definisi User (Aktor)

Aplikasi **Open BK** memiliki pemisahan akses (Authorization) menjadi tiga entitas aktor utama:

1. **Siswa (End-User)**
   * **Deskripsi:** Pengguna yang menggunakan layanan untuk berkonsultasi, mengirim laporan, atau mencari bantuan secara asinkronus (berbalas pesan dalam format surat).
   * **Autentikasi:** Mendaftar (*signup*) secara mandiri dengan memvalidasi **NIS (Nomor Induk Siswa)** yang sebelumnya telah di-whitelist oleh sistem.
2. **Guru BK / Konselor (Operator)**
   * **Deskripsi:** Pakar yang meninjau, menganalisis, dan membalas surat yang dikirim siswa. Mereka melihat dasbor berdasarkan prioritas agar masalah *urgent* bisa ditangani secepatnya.
   * **Autentikasi:** Memiliki kredensial yang dibuat oleh Admin IT. Login melewati autentikasi berbasis Token.
3. **Admin IT (System Administrator)**
   * **Deskripsi:** Penjaga gawang operasional aplikasi. Tidak membaca isi surat secara spesifik (untuk privasi), melainkan mengelola akses pengguna, kamus deteksi masalah otomatis, dan pemeliharaan _server_.
   * **Autentikasi:** Sama seperti Guru BK, dengan _role/permissions_ paling tinggi.

---

## 2. Alur Utama Aplikasi (App Flow)

Berikut adalah gambaran alur berdasarkan aktivitas masing-masing pengguna.

### A. Flow Autentikasi dan Registrasi Siswa
1. **Whitelist:** Admin IT pada wal ajaran baru mengunggah file Excel berisi data NIS siswa resmi (`allowed_nis`).
2. **Registrasi:** Siswa mencoba mendaftar (Signup). Sistem akan mencocokan NIS yang dimasukkan. Jika NIS tidak ada di database whitelist, registrasi ditolak.
3. **Account Creation:** Jika valid, siswa mengatur _username_ dan _password_.
4. **Access:** Siswa melakukan login untuk mendapatkan *access token* ke halaman utama aplikasi.

### B. Flow Kirim Surat & Sistem Deteksi Dini (Early Warning System)
1. **Penulisan:** Siswa menekan "Kirim Surat" dan mulai menceritakan keluhannya di kolom _message body_.
2. **Scan Kata Kunci (Backend):** Saat data disubmit, Laravel tidak serta merta hanya menyimpan surat. Sistem melakukan pengecekan (*scanning*) teks terhadap **Kamus Risiko**.
3. **Penilaian Skor:** Jika sistem menemukan kata kunci "depresi", "dibully", atau hal krusial lain, sistem memberikan skor tinggi.
4. **Tagging:** Surat lalu disematkan status level risiko secara _realtime_ (`Low`, `Medium`, `High`, atau `Critical`) ke dalam database tanpa sepengetahuan siswa.

### C. Flow Triase Surat (Pandangan Guru BK)
1. Guru BK melakukan login menuju Dasbor `/admin/inbox`.
2. Halaman ini bertindak layaknya *Triage Room* Rumah Sakit; menyortir kasus dari yang Paling Darurat hingga ke yang paling ringan.
3. **Critical Status:** Surat merah bertanda `Critical` berada di paling atas. Guru BK masuk ke detail surat tersebut lalu membalas pesannya.
4. **Berbalas Pesan:** Muncul _thread_ (utas) berlanjut antara Siswa dan Guru BK sampai masalah terselesaikan (_Resolved_).

### D. Flow Pemeliharaan Sistem (Pandangan Admin IT)
1. **Pengendalian Akun:** Terkadang Siswa lupa kata sandinya sendiri. Admin IT dapat menuju menu **User Management**, mencari akun Siswa tersebut dan menekan fungsi "Reset Password".
2. **Pembaharuan Kamus Risiko:** Jika banyak kasus menggunakan bahasa *slang* remaja (*contoh: fomo, mental health jatoh*), Admin IT akan memasukkan kosa kata tersebut ke sistem bobot risiko, sehingga pendeteksian bahaya tetap relevan dan _update_ dari waktu ke waktu.

---

## 3. Skenario Penggunaan (User Scenarios)

Mari kita asumsikan skenario di dunia nyata mengenai bagaimana aplikasi ini digunakan:

### 🌟 Skenario 1: Krisis Mental / Perundungan (Level: Critical)
* **Kondisi Awal:** Andi, siswa kelas X tertekan akibat sering diminta memberikan uang pada teman-teman sekalasnya. Ia menulis surat subuh-subuh: *"Rasanya saya nggak kuat sekolah lagi, sering diganggu, mau mati rasanya."*
* **Aktivitas Sistem:** Secara instan _AI Simple_ / _Rule Based Scanning_ menangkap kata "nggak kuat" serta frasa "mati". Surat Andi ditandai dengan bobot "Critical Risk" 🛑.
* **Tindakan (Action):** Pagi harinya jam 06.30 saat Pak Budi (Guru BK) membuka Inbox, kasus Andi "berkelip" di peringkat atas. Karena ini darurat nyawa/psikologis, Pak Budi tidak membalas via chat melainkan bergegas mendatangi kelas Andi pada pelarajan pertama untuk menjemput Andi agar _face-to-face_ di ruang BK dengan rasa aman.

### 🌱 Skenario 2: Pertanyaan Akademik Ringan (Level: Low / Medium)
* **Kondisi Awal:** Chika ingin tahu mengenai perkuliahan. Ia menulis: *"Ibu, kalau mau lintas jurusan dari IPA ke Sastra, persyaratannya apa saja ya? Bingung banget."*
* **Aktivitas Sistem:** Tidak terdapat entitas diksi / kata kunci bahaya. Sistem memberikan _Rating_ = `Low Risk`.
* **Tindakan (Action):** Bu Rina (Guru BK) menyelesaikan masalah ini pada jam istirahat. Dia membalas surat tersebut dengan menyantumkan _link guide_ seleksi PTN terbaru, dan masalah selesai dalam format asinkron (*tanpa diselesaikan tatap muka*). Status tiket menjadi _Resolved_.

### 🔧 Skenario 3: NIS Dipakai Orang Lain (Incident Response)
* **Kondisi Awal:** Dika ingin mendaftar ke portal, tapi sistem melaporkan bahwa NIS `1202302` sudah ada pengguna (sudah dicaplok pihak tak bertanggung jawab).
* **Aktivitas Sistem:** Sistem memblokir *signup* duplikat untuk memastikan validitas satu akun untuk 1 individu yang valid.
* **Tindakan (Action):** Dika melaporkannya dengan menyebutkan nama pada operator lab / kepala IT sekolah. Admin IT membuka dasbor Manajemen Akun, menghapus (Delete) profil bajakan yang mendaftarkan NIS Dika, dan mencabut akses sesi (*Revoke Token*) akun tersebut. Dika akhirnya berhasil *signup* sendiri dari awal dengan aman.

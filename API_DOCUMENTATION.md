# API Documentation - MyAPD Backend

Base URL: `http://localhost:3000/api`

**Semua endpoint (kecuali Login) membutuhkan Bearer Token.**
Kirimkan token pada Headers request:
```json
{
  "Authorization": "Bearer <TOKEN_JWT_DARI_LOGIN>"
}
```

---

## 1. Authentication

### Login
Digunakan untuk masuk ke dalam sistem dan mendapatkan token JWT.
- **Method**: `POST`
- **URL**: `/login`
- **Request Body** (JSON / Form Data):
  ```json
  {
    "nid": "admin123",
    "password": "password123"
  }
  ```

---

## 2. Users (Pengguna)

### Get All Users
Mengambil semua data pengguna.
- **Method**: `GET`
- **URL**: `/users`

### Get User by ID
Mengambil data satu pengguna berdasarkan ID.
- **Method**: `GET`
- **URL**: `/users/:id`

### Create User
Menambahkan pengguna baru.
- **Method**: `POST`
- **URL**: `/users`
- **Request Body** (JSON):
  ```json
  {
    "nid": "karyawan001",
    "password": "password123",
    "role": "karyawan" // enum: admin, karyawan, mandor
  }
  ```

### Update User
Mengubah data pengguna (biasanya password atau role).
- **Method**: `PUT`
- **URL**: `/users/:id`
- **Request Body** (JSON):
  ```json
  {
    "nid": "karyawan001",
    "password": "newpassword123",
    "role": "mandor"
  }
  ```

### Delete User
Menghapus pengguna.
- **Method**: `DELETE`
- **URL**: `/users/:id`

---

## 3. APD (Alat Pelindung Diri)

### Get All APD
Mengambil semua daftar APD yang tersedia.
- **Method**: `GET`
- **URL**: `/apd`

### Get APD by ID
Mengambil data satu APD berdasarkan ID.
- **Method**: `GET`
- **URL**: `/apd/:id`

### Create APD
Menambahkan master data APD baru.
- **Method**: `POST`
- **URL**: `/apd`
- **Request Body** (JSON):
  ```json
  {
    "name": "Sepatu Safety",
    "description": "Sepatu proyek ujung baja"
  }
  ```

### Update APD
Mengubah data APD.
- **Method**: `PUT`
- **URL**: `/apd/:id`
- **Request Body** (JSON):
  ```json
  {
    "name": "Sepatu Safety V2",
    "description": "Sepatu safety premium"
  }
  ```

### Delete APD
Menghapus data APD.
- **Method**: `DELETE`
- **URL**: `/apd/:id`

---

## 4. Transactions (Laporan)

### Create Transaction (Lapor Penggunaan APD)
Membuat laporan penggunaan APD beserta foto.
- **Method**: `POST`
- **URL**: `/transactions`
- **Content-Type**: `multipart/form-data`
- **Request Body** (Form-Data):
  - `foto`: [File Gambar] *(required, tipe file gambar spt: .png, .jpg)*
  - `tempat`: "Proyek Pembangunan Gedung A" *(required, string)*
  - `waktu`: "2026-06-09T05:54:43Z" *(required, format ISO 8601 Date String)*
  - `apdId`: 1 *(required, number)*

### Get All Transactions (Lihat Semua Laporan)
Mengambil daftar semua laporan/transaksi.
- **Method**: `GET`
- **URL**: `/transactions`
- **Query Parameters** (Optional, untuk filter data):
  - `?status=pending` (Saring berdasarkan status `pending` atau `approved`)
  - `?apdId=1` (Saring laporan berdasarkan APD tertentu)
  - `?userId=1` (Saring laporan berdasarkan User yang melaporkan)
  - `?limit=10` (Batasi jumlah data yang diambil)

### Update Transaction Status (Approval Laporan)
Mengubah status laporan (approval). Biasanya digunakan oleh Mandor/Admin.
- **Method**: `PUT`
- **URL**: `/transactions/:id/status`
- **Request Body** (JSON):
  ```json
  {
    "status": "approved" // Pilihan: "pending" atau "approved"
  }
  ```

---
**Catatan Response Format:**
Setiap response yang sukses selalu dibungkus dengan format:
```json
{
  "success": true,
  "message": "Pesan status/kode HTTP",
  "data": { ... } // Berisi object atau array hasil
}
```
Jika gagal:
```json
{
  "success": false,
  "message": "Pesan error"
}
```

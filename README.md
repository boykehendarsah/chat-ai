Upload Tugas API Yang terkoneksi dengan Gemini AI

API yang di buat untuk upload dokumen kemudian, pengguna bisa bertanya. Dalam contoh kasus saya upload dokumen kecil yang berisi nama toko, alamat, jam buka tutup, menjual apa saja, berapa harga barangnya. Jika tidak ada maka Char akan menjawab tidak ada dalam data.

# 📄 PDF Document RAG API Documentation

Dokumentasi API untuk pengunggahan dokumen PDF (*single upload*) dan fitur **Tanya Jawab Berbasis Isi Dokumen (RAG)** menggunakan Google Gen AI SDK.

---

## 🚀 Overview

- **Base URL:** `http://localhost:3001`
- **Authentication:** None / Public (dikelola internal via `.env`)
- **Fitur Utama:**
  - **Single File Upload:** Mengunggah PDF satu kali ke Google Files API untuk mendapatkan `fileUri`.
  - **Strict Answering:** AI hanya menjawab pertanyaan sesuai isi PDF. Jika informasi tidak ada di PDF, AI menjawab: *"Maaf, pertanyaan Anda tidak ada datanya."*
  - **Context Continuity:** Sesi tanya jawab dapat berkesinambungan menggunakan `interactionId`.

---

## 📡 Endpoint API

### 1. Upload Dokumen PDF

Mengunggah berkas PDF ke server cloud Google GenAI. Panggil endpoint ini **satu kali** per dokumen.

* **URL:** `/upload-pdf`
* **Method:** `POST`
* **Content-Type:** `multipart/form-data`

#### 📥 Request Body (`form-data`)

| Key | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `pdf` | `File` | **Ya** | Berkas dokumen dengan ekstensi `.pdf` |

#### 📤 Response Examples

* **`200 OK` (Berhasil Upload):**
  ```json
  {
    "message": "File PDF berhasil diunggah!",
    "fileUri": "[https://generativelanguage.googleapis.com/v1beta/files/abc123xyz456](https://generativelanguage.googleapis.com/v1beta/files/abc123xyz456)",
    "mimeType": "application/pdf"
  }
400 Bad Request (File Kosong):JSON{
  "error": "Silakan unggah berkas PDF!"
}
2. Chat Tanya Jawab PDF (RAG)Mengajukan pertanyaan berdasarkan dokumen PDF yang telah diunggah sebelumnya.URL: /chat-pdfMethod: POSTContent-Type: application/json📥 Request Body (application/json)ParameterTypeRequiredDescriptionfileUristringYaString URI yang didapat dari respon /upload-pdfmimeTypestringYaapplication/pdfquestionstringYaPertanyaan user terkait isi PDFinteractionIdstringOpsionalID dari respon sebelumnya untuk melanjutkan thread percakapan💬 Payload Request ExampleJSON{
  "fileUri": "[https://generativelanguage.googleapis.com/v1beta/files/abc123xyz456](https://generativelanguage.googleapis.com/v1beta/files/abc123xyz456)",
  "mimeType": "application/pdf",
  "question": "Jelaskan ringkasan materi pada Bab 1!",
  "interactionId": "int_998877"
}
📤 Response Examples200 OK (Jawaban Ditemukan di PDF):JSON{
  "result": "Pada Bab 1, dokumen menjelaskan tentang...",
  "interactionId": "int_998877"
}
200 OK (Pertanyaan Tidak Ada di PDF):JSON{
  "result": "Maaf, pertanyaan Anda tidak ada datanya.",
  "interactionId": "int_998877"
}
400 Bad Request (Parameter Tidak Lengkap):JSON{
  "error": "fileUri dan question wajib diisi!"
}
📌 Catatan PenggunaanMasa Simpan File: File yang diunggah ke Google Files API tersimpan selama 48 jam. Setelah itu, URI akan kadaluarsa dan file perlu diunggah ulang.Melanjutkan Thread Chat: Kirimkan nilai interactionId dari respon pertama ke request berikutnya agar AI mengingat konteks percakapan sebelumnya.
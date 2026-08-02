import express from "express";
import multer from "multer";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import fs from "fs";
import path from "path";

const app = express();

// Gunakan storage temporary disk untuk multer agar file dapat di-upload ke Google Files API
const upload = multer({ dest: "uploads/" });

const ai = new GoogleGenAI({});

app.use(cors());
app.use(express.json());

/**
 * 1. ENDPOINT UPLOAD PDF (Cukup dipanggil 1x saja per berkas)
 * Menerima file PDF, mengunggah ke Google GenAI Files API, lalu mengembalikan fileUri
 */
app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Silakan unggah berkas PDF!" });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype || "application/pdf";

    // PERBAIKAN: Masukkan mimeType ke dalam objek `config`
    const uploadResult = await ai.files.upload({
      file: filePath,
      config: {
        mimeType: mimeType, // SDK meminta mimeType di dalam `config`
        displayName: req.file.originalname,
      },
    });

    // Hapus berkas temporary lokal setelah diunggah
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.status(200).json({
      message: "File PDF berhasil diunggah!",
      fileUri: uploadResult.uri,
      mimeType: uploadResult.mimeType || mimeType,
    });
  } catch (e) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Error upload PDF:", e);
    return res.status(500).json({ 
      error: "Gagal mengunggah berkas PDF.", 
      details: e.message 
    });
  }
}); 

/**
 * 2. ENDPOINT CHAT BERBASIS PDF
 * Menerima 'fileUri', 'mimeType', dan 'question' dari client
 */
app.post("/chat-pdf", async (req, res) => {
  const { fileUri, mimeType, question, interactionId } = req.body;

  if (!fileUri || !question) {
    return res.status(400).json({ error: "fileUri dan question wajib diisi!" });
  }

  try {
    const systemInstruction = 
      "Anda adalah asisten khusus yang bertugas menjawab pertanyaan HANYA berdasarkan konteks dokumen PDF yang diberikan. " +
      "Aturan penting:\n" +
      "1. Jawab pertanyaan hanya menggunakan informasi yang ada di dalam dokumen PDF.\n" +
      "2. Jika jawaban dari pertanyaan user TIDAK ADA di dalam dokumen PDF, Anda WAJIB menjawab persis: 'Maaf, pertanyaan Anda tidak ada datanya.'.\n" +
      "3. Jangan gunakan pengetahuan di luar konteks dokumen PDF tersebut.";

    // PERBAIKAN: Gunakan type "document" dan field "uri"
    const inputData = [
      {
        type: "document",
        uri: fileUri,
        mime_type: mimeType || "application/pdf"
      },
      {
        type: "text",
        text: question
      }
    ];

    const payload = {
      model: "gemma-4-26b-a4b-it", // Atau "gemini-1.5-flash"
      input: inputData,
      system_instruction: systemInstruction,
      generation_config: {
        temperature: 0.1,
      }
    };

    if (interactionId) {
      payload.previous_interaction_id = interactionId;
    }

    const aiResponse = await ai.interactions.create(payload);

    return res.status(200).json({
      result: aiResponse.output_text,
      interactionId: aiResponse.id
    });

  } catch (e) {
    console.error("Error pada chat-pdf:", e);
    return res.status(500).json({
      error: "Gagal memproses pertanyaan.",
      details: e.message
    });
  }
}); 
    
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server RAG PDF berjalan di Port: ${PORT}`);
}); 
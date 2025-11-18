import * as FileSystem from "expo-file-system";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ Substitua pela sua chave
const GEMINI_API_KEY = "AIzaSyBhF4FHY97Lhd6izbSYOWzRyW97qGYDjzs";

// 🚀 Use um modelo disponível (suporta áudio)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function transcribeAudio(audioUri) {
  try {
    console.log("🎧 Lendo arquivo de áudio:", audioUri);

    // Converte o áudio para Base64
    const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log("📡 Enviando áudio para Gemini...");

    // Envia o áudio ao Gemini
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "audio/m4a",
          data: base64Audio,
        },
      },
      {
        text: "Transcreva o áudio falado para texto em português, sem comentários adicionais.",
      },
    ]);

    const text = result.response.text();

    console.log("✅ Transcrição Gemini:", text);
    return text;
  } catch (error) {
    console.error("❌ Erro ao transcrever com Gemini:", error);
    return null;
  }
}
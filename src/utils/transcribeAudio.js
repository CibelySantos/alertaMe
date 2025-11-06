import * as FileSystem from "expo-file-system";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../../supabaseClient";

export async function transcribeAudio(audioUri) {
    try {
        console.log("🎧 Enviando áudio ao Supabase...");

        console.log("🔗 URL Supabase:", SUPABASE_URL);
        console.log("🔑 Chave:", SUPABASE_ANON_KEY ? "OK" : "Faltando");


        const functionUrl = `${SUPABASE_URL.replace(".supabase.co", ".functions.supabase.co")}/transcribe-audio`;

        // Usa o uploadAsync, que é compatível com o ambiente do Expo Go
        const response = await FileSystem.uploadAsync(functionUrl, audioUri, {
            httpMethod: "POST",
            headers: {
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "audio/m4a", // tipo do arquivo
            },
            fieldName: "file",
        });

        if (response.status !== 200) {
            console.error("❌ Erro na resposta do Supabase:", response.body);
            throw new Error(`Erro ${response.status}: ${response.body}`);
        }

        const data = JSON.parse(response.body);
        console.log("✅ Transcrição concluída:", data);

        return data.text || "Sem transcrição recebida";
    } catch (error) {
        console.error("❌ Erro ao transcrever via Supabase:", error);
        return null;
    }
}

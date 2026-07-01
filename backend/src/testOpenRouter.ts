// src/testOpenRouter.ts
// Jalankan dengan: npx ts-node src/testOpenRouter.ts
// (atau: npx tsx src/testOpenRouter.ts kalau pakai tsx)
//
// Pastikan .env sudah berisi OPENROUTER_API_KEY (key BARU, bukan yang lama).

import "dotenv/config";
import { GeminiService } from "./ai/openrouter.service";; 
const MODELS_TO_CHECK = [
    "Claude-Sonnet-5",
    "deepseek-V4-flash",
    "openai/gpt-4o-mini",
    "google/gemini-3.5-flash",
    "google/gemini-3.1-flash-lite",
];

// Skema database contoh (dummy) — cukup untuk uji format JSON tanpa perlu koneksi SQL Server asli
const DUMMY_SCHEMA = `
Tabel "TD_karyawan" — Data karyawan.
  Kolom: Nrp (varchar), Name (varchar), Dept (varchar), status (varchar)
`;

async function testBasicConnectivity() {
    console.log("====================================");
    console.log("1) TES KONEKSI DASAR KE OPENROUTER");
    console.log("====================================");

    if (!process.env.OPENROUTER_API_KEY) {
        console.log("❌ OPENROUTER_API_KEY tidak ditemukan di .env — stop di sini.");
        process.exit(1);
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
            model: process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat",
            messages: [{ role: "user", content: "Balas hanya kata OK" }],
        }),
    });

    const data: any = await res.json();
    if (!res.ok) {
        console.log("❌ Gagal konek:", data.error?.message || res.status);
        process.exit(1);
    }
    console.log("✅ Berhasil konek. Balasan model:", data.choices?.[0]?.message?.content);
}

async function testModelAvailability() {
    console.log("\n====================================");
    console.log("2) CEK KETERSEDIAAN BEBERAPA MODEL");
    console.log("====================================");

    for (const model of MODELS_TO_CHECK) {
        try {
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: "user", content: "Balas hanya kata OK" }],
                    max_tokens: 10,
                }),
            });
            const data: any = await res.json();
            if (res.ok) {
                console.log("✅", model, "READY");
            } else {
                console.log("❌", model, "-", data.error?.message || res.status);
            }
        } catch (err: any) {
            console.log("❌", model, "-", err.message);
        }
        console.log("--------------------------------");
    }
}

async function testAnalyzeAndChat() {
    console.log("\n====================================");
    console.log("3) TES analyzeAndChat() — GENERAL_CHAT");
    console.log("====================================");

    const ai = new GeminiService();
    const result = await ai.analyzeAndChat("Apa itu HRD? dan siapa hrd di voksel", DUMMY_SCHEMA);
    console.log(JSON.stringify(result, null, 2));

    if (result.action !== "GENERAL_CHAT" && result.action !== "EXECUTE_SQL") {
        console.log("⚠️  Format action tidak sesuai ekspektasi.");
    } else {
        console.log("✅ Format JSON valid, action:", result.action);
    }
}

async function testAnalyzeAndChatSQL() {
    console.log("\n====================================");
    console.log("4) TES analyzeAndChat() — EXECUTE_SQL");
    console.log("====================================");

    const ai = new GeminiService();
    const result = await ai.analyzeAndChat("berikan saya data komputer terbaru voksel", DUMMY_SCHEMA);
    console.log(JSON.stringify(result, null, 2));

    if (result.action === "EXECUTE_SQL" && result.sqlQuery?.toUpperCase().startsWith("SELECT")) {
        console.log("✅ SQL query berhasil digenerate:", result.sqlQuery);
    } else {
        console.log("⚠️  Tidak menghasilkan SQL query yang diharapkan.");
    }
}

async function main() {
    await testBasicConnectivity();
    await testModelAvailability();
    await testAnalyzeAndChat();
    await testAnalyzeAndChatSQL();
    console.log("\n🎉 Semua tes selesai.");
}

main().catch((err) => {
    console.error("Test gagal total:", err);
    process.exit(1);
});
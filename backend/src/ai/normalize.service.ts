import levenshtein from "fast-levenshtein";
import { LearningService } from "../services/learning.service";

const learningService = new LearningService();

export class NormalizeService {

    private readonly departments = [
        "IT", "HRD", "ACCOUNTING", "MARKETING", "PROCUREMENT",
        "ENGINEERING", "QA", "QC", "PPIC", "WAREHOUSE",
        "PRODUKSI", "FINANCE", "EXPORT", "IMPORT", "SALES",
        "GENERAL AFFAIR", "GA", "MR", "PRODALC", "LOGISTIC OUT"
    ];

    private readonly dictionary = [
        "karyawan", "ticket", "tiket", "work order", "asset", "aset",
        "open", "closed", "computer", "komputer", "laptop", "jumlah",
        "data", "berapa", "tampilkan", "cari", "lihat", "semua",
        "total", "berikan", "kasih", "saya", "show", "find"
    ];

    private readonly commonWords = new Set([
        "berikan", "tampilkan", "lihat", "cari", "tunjukkan", "minta",
        "tolong", "bantu", "saya", "aku", "kamu", "anda", "dia", "mereka",
        "yang", "dan", "atau", "dengan", "untuk", "dari", "ke", "di", "pada",
        "adalah", "ada", "tidak", "bisa", "mau", "ingin", "perlu", "harus",
        "sudah", "akan", "sedang", "punya", "milik", "semua", "seluruh",
        "berapa", "bagaimana", "mengapa", "kapan", "siapa", "apa", "dimana",
        "artinya", "arti", "maksud", "maksudnya", "berarti", "yaitu",
        "ini", "itu", "sini", "situ", "juga", "hanya", "saja", "lagi",
        "kasih", "beri", "minta", "ambil", "kirim", "buat", "buka",
        "nama", "nomor", "nomer", "status", "info", "informasi",
        "laporan", "report", "hasil", "output", "rekap", "rekapitulasi",
        "aktif", "pak", "bu", "bapak", "ibu", "mas", "mbak", "dari", "milik",
    ]);

    private readonly nameIndicators = new Set([
        "pak", "bu", "bapak", "ibu", "mas", "mbak"
    ]);

    private readonly aliases: Record<string, string> = {
        "pegawai": "karyawan", "staff": "karyawan",
        "kryawan": "karyawan", "kariawan": "karyawan",
        "jml": "jumlah", "jmlh": "jumlah", "jmh": "jumlah",
        "brp": "jumlah", "total": "jumlah",
        "comp": "computer", "komp": "computer",
        "komputer": "computer", "cpu": "computer", "pc": "computer",
        "tiket": "ticket", "tkt": "ticket",
        "wo": "work order", "workorder": "work order",
        "aset": "asset", "assett": "asset",
        "accunting": "accounting", "akunting": "accounting",
        "keuangan": "finance", "pemasaran": "marketing",
        "pengadaan": "procurement", "hr": "hrd",
    };

    normalize(text: string): string {
        return text.toLowerCase().trim()
            .replace(/[.,?!;:]/g, "")
            .replace(/\s+/g, " ");
    }

    correctTypos(question: string): string {
        const normalized = this.normalize(question);

        return normalized.split(" ").map(word => {
            if (this.commonWords.has(word)) return word;

            const learned = learningService.lookup(word);
            if (learned) {
                console.log(`📚 Dari database: "${word}" → "${learned}"`);
                return learned;
            }

            if (this.aliases[word]) return this.aliases[word];

            let closestWord = word;
            let minDistance = 2;
            for (const validWord of this.dictionary) {
                const dist = levenshtein.get(word, validWord);
                if (dist < minDistance && word.length >= 3) {
                    minDistance = dist;
                    closestWord = validWord;
                }
            }

            return closestWord;
        }).join(" ");
    }

    findUnknownWords(question: string): string[] {
        const normalized = this.normalize(question);
        const words = normalized.split(" ");
        const unknown: string[] = [];
        let skipNext = false;

        for (const word of words) {

            // Skip kata pendek
            if (word.length <= 2) {
                skipNext = false;
                continue;
            }

            // Kalau kata sebelumnya adalah pak/bu/mas/mbak → ini nama orang, skip
            if (skipNext) {
                skipNext = false;
                continue;
            }

            // Tandai kata berikutnya sebagai nama orang
            if (this.nameIndicators.has(word)) {
                skipNext = true;
                continue;
            }

            // Kata umum Indonesia → lolos
            if (this.commonWords.has(word)) continue;

            // Ada di learned words
            if (learningService.lookup(word)) continue;

            // Ada di aliases
            if (this.aliases[word]) continue;

            // Mirip dictionary (levenshtein ≤ 2)
            const inDict = this.dictionary.some(d =>
                levenshtein.get(word, d) <= 2
            );
            if (inDict) continue;

            // Mirip nama departemen
            const inDept = this.departments.some(d =>
                levenshtein.get(word, d.toLowerCase()) <= 2
            );
            if (inDept) continue;

            // Benar-benar tidak dikenal
            unknown.push(word);
        }

        return unknown;
    }

    extractDepartment(question: string): string | null {
        const normalized = this.normalize(question);
        const words = normalized.split(" ");
        let bestDept: string | null = null;
        let bestScore = 999;

        for (const word of words) {
            for (const dept of this.departments) {
                const score = levenshtein.get(word, dept.toLowerCase());
                if (score < bestScore) {
                    bestScore = score;
                    bestDept = dept;
                }
            }
        }
        return bestScore <= 2 ? bestDept : null;
    }

    isCountQuery(question: string): boolean {
        const corrected = this.correctTypos(question);
        return (
            corrected.includes("jumlah") ||
            corrected.includes("berapa") ||
            corrected.includes("total") ||
            /^jm/i.test(question)
        );
    }
}
import levenshtein from "fast-levenshtein";

export class NormalizeService {
    private readonly departments = [
        "IT", "HRD", "ACCOUNTING", "MARKETING", "PURCHASING",
        "ENGINEERING", "QA", "QC", "PPIC", "WAREHOUSE",
        "PRODUKSI", "FINANCE", "EXPORT", "IMPORT", "SALES", "GENERAL AFFAIR"
    ];

    private readonly dictionary = [
        "karyawan", "ticket", "tiket", "work order", "asset", "aset", "open", "closed"
    ];

    private readonly aliases: Record<string, string> = {
        "pegawai": "karyawan", "staff": "karyawan", "kryawan": "karyawan",
        "kariawan": "karyawan", "akunting": "accounting", "accunting": "accounting",
        "wo": "work order", "rusak": "ticket", "pc": "asset", "komputer": "asset"
    };

    // Fungsi asli Anda untuk merapikan teks dasar
    normalize(text: string): string {
        return text.toLowerCase().trim().replace(/[.,?!]/g, "").replace(/\s+/g, " ");
    }

    // Ekstraksi Departemen (Kode Asli Dipertahankan)
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

    // FITUR BARU SPRINT 9: SMART CORRECTION UMUM
    correctTypos(question: string): string {
        const normalized = this.normalize(question);
        const words = normalized.split(" ");

        const correctedWords = words.map(word => {
            if (this.aliases[word]) return this.aliases[word];

            let closestWord = word;
            let minDistance = 3; 
            for (const validWord of this.dictionary) {
                const dist = levenshtein.get(word, validWord);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestWord = validWord;
                }
            }
            return closestWord;
        });

        return correctedWords.join(" ");
    }
}
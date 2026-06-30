import fs from "fs";
import path from "path";

const DB_PATH = path.join(__dirname, "../../data/learned_words.json");

function ensureFile() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "{}");
}

export class LearningService {

    getAll(): Record<string, string> {
        ensureFile();
        return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    }

    learn(typo: string, correction: string): void {
        ensureFile();
        const data = this.getAll();
        data[typo.toLowerCase().trim()] = correction.toLowerCase().trim();
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        console.log(`✅ Sistem belajar: "${typo}" → "${correction}"`);
    }

    lookup(word: string): string | null {
        const data = this.getAll();
        return data[word.toLowerCase().trim()] ?? null;
    }
}
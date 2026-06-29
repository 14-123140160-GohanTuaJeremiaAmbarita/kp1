import levenshtein from "fast-levenshtein";

export class NormalizeService {

    private readonly departments = [

        "IT",
        "HRD",
        "ACCOUNTING",
        "MARKETING",
        "PURCHASING",
        "ENGINEERING",
        "QA",
        "QC",
        "PPIC",
        "WAREHOUSE",
        "PRODUKSI",
        "FINANCE",
        "EXPORT",
        "IMPORT",
        "SALES",
        "GENERAL AFFAIR"

    ];

    normalize(text: string): string {

        return text

            .toLowerCase()

            .trim()

            .replace(/[.,?!]/g, "")

            .replace(/\s+/g, " ");

    }

    extractDepartment(question: string): string | null {

        question = this.normalize(question);

        const words = question.split(" ");

        let bestDept: string | null = null;

        let bestScore = 999;

        for (const word of words) {

            for (const dept of this.departments) {

                const score = levenshtein.get(

                    word,

                    dept.toLowerCase()

                );

                if (score < bestScore) {

                    bestScore = score;

                    bestDept = dept;

                }

            }

        }

        if (bestScore <= 2) {

            return bestDept;

        }

        return null;

    }

}
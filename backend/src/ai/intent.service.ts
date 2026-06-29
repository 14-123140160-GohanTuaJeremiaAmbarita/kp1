import { NormalizeService } from "./normalize.service";

export type IntentType =
    | "employee_department"
    | "employee_search"
    | "ticket_department"
    | "ticket_search"
    | "workorder_department"
    | "workorder_search"
    | "asset_department"
    | "asset_search"
    | "general";

export interface IntentResult {
    intent: IntentType;
    department?: string;
    keyword?: string;
}

export class IntentService {

    private normalize = new NormalizeService();

    detect(message: string): IntentResult {

        const text = this.normalize.normalize(message);
        const department = this.normalize.extractDepartment(text);

        // ===========================
        // EMPLOYEE
        // ===========================
        const isEmployee =
            text.includes("karyawan") ||
            text.includes("pegawai") ||
            text.includes("employee") ||
            text.includes("staff") ||
            text.includes("personel") ||
            text.includes("berapa") ||       // "berapa karyawan IT"
            text.includes("jumlah") ||       // "jumlah karyawan"
            text.includes("data") ||         // "data IT", "data karyawan"
            text.includes("tampilkan") ||
            text.includes("lihat") ||
            text.includes("show");

        if (isEmployee) {
            if (department) {
                return { intent: "employee_department", department };
            }
            // Kalau ada kata data/karyawan/berapa tanpa dept → ambil semua
            if (
                text.includes("karyawan") ||
                text.includes("pegawai") ||
                text.includes("employee") ||
                text.includes("staff") ||
                text.includes("berapa") ||
                text.includes("jumlah")
            ) {
                return { intent: "employee_search", keyword: text };
            }
        }

        // ===========================
        // TICKET
        // ===========================
        if (
            text.includes("ticket") ||
            text.includes("tiket") ||
            text.includes("problem") ||
            text.includes("kendala")
        ) {
            if (department) return { intent: "ticket_department", department };
            return { intent: "ticket_search", keyword: text };
        }

        // ===========================
        // WORK ORDER
        // ===========================
        if (
            text.includes("work order") ||
            text.includes("workorder") ||
            /\bwo\b/.test(text)
        ) {
            if (department) return { intent: "workorder_department", department };
            return { intent: "workorder_search", keyword: text };
        }

        // ===========================
        // ASSET
        // ===========================
        if (
            text.includes("komputer") ||
            text.includes("computer") ||
            text.includes("laptop") ||
            text.includes("notebook") ||
            text.includes("aset") ||
            text.includes("asset") ||
            text.includes("cpu") ||
            (/\bpc\b/.test(text) && !text.includes("ppic"))
        ) {
            if (department) return { intent: "asset_department", department };
            return { intent: "asset_search", keyword: text };
        }

        // ===========================
        // User hanya ketik nama departemen
        // ===========================
        if (department) {
            return { intent: "employee_department", department };
        }

        return { intent: "general", keyword: message };
    }
}
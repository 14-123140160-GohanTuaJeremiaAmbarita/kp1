import { EmployeeService } from "../services/employee.service";
import { TicketService } from "../services/ticket.service";
import { WorkOrderService } from "../services/workorder.service";
import { AssetService } from "../services/asset.service";

export class SQLService {

    private employeeService = new EmployeeService();
    private ticketService   = new TicketService();
    private workorderService = new WorkOrderService();
    private assetService    = new AssetService();

    async execute(message: string) {
        const q = message.toLowerCase().trim();

        // ==========================================
        // NAMA ORANG — "data pak indra", "cari jaenudin"
        // ==========================================
        const namePrefixes = ["pak ", "bu ", "bapak ", "ibu ", "mas ", "mbak "];
        for (const prefix of namePrefixes) {
            if (q.includes(prefix)) {
                const name = q.split(prefix)[1]?.split(" ")[0]?.trim();
                if (name && name.length > 1) {
                    const data = await this.employeeService.search(name);
                    return {
                        type: "employees",
                        answer: data.length > 0
                            ? `Ditemukan ${data.length} karyawan dengan nama "${name}".`
                            : `Tidak ada karyawan dengan nama "${name}".`,
                        data
                    };
                }
            }
        }

        // ==========================================
        // DEPARTMENT — cek eksplisit dulu sebelum keyword umum
        // ==========================================
        const deptMap: Record<string, string> = {
            "marketing":    "MARKETING",
            "pemasaran":    "MARKETING",
            "it":           "IT",
            "hrd":          "HRD",
            "hr":           "HRD",
            "accounting":   "ACCOUNTING",
            "accunting":    "ACCOUNTING",
            "akunting":     "ACCOUNTING",
            "finance":      "FINANCE",
            "keuangan":     "FINANCE",
            "ppic":         "PPIC",
            "procurement":  "PROCUREMENT",
            "pengadaan":    "PROCUREMENT",
            "ga":           "GA",
            "general affair": "GA",
            "logistic":     "LOGISTIC OUT",
            "logistik":     "LOGISTIC OUT",
            "mr":           "MR",
            "prodalc":      "PRODALC",
            "warehouse":    "WAREHOUSE",
            "gudang":       "WAREHOUSE",
            "engineering":  "ENGINEERING",
            "qa":           "QA",
            "qc":           "QC",
            "sales":        "SALES",
            "export":       "EXPORT",
            "import":       "IMPORT",
        };

        // Deteksi dept dengan regex word boundary
        for (const [key, deptName] of Object.entries(deptMap)) {
            // Khusus "it" dan "ga" pakai word boundary agar tidak cocok dengan kata lain
            const isShort = key.length <= 2;
            const pattern = isShort
                ? new RegExp(`\\b${key}\\b`)
                : new RegExp(key);

            if (pattern.test(q)) {
                // Apakah query adalah tentang karyawan?
                const isEmpQuery =
                    q.includes("karyawan") || q.includes("pegawai") ||
                    q.includes("staff") || q.includes("data") ||
                    q.includes("employee") || q.includes("berapa") ||
                    q.includes("jumlah") || q.includes("tampilkan") ||
                    q.includes("lihat") || q.includes("show") ||
                    !q.includes("ticket") && !q.includes("tiket") &&
                    !q.includes("work order") && !q.includes("asset") &&
                    !q.includes("komputer") && !q.includes("computer");

                if (isEmpQuery) {
                    const data = await this.employeeService.getDepartment(deptName);
                    return {
                        type: "employees",
                        answer: `Departemen ${deptName} memiliki ${data.length} karyawan.`,
                        data
                    };
                }
            }
        }

        // ==========================================
        // EMPLOYEE — semua karyawan
        // ==========================================
        if (
            q.includes("karyawan") || q.includes("pegawai") ||
            q.includes("employee") || q.includes("semua staff") ||
            (q.includes("data") && q.includes("karyawan"))
        ) {
            // Cek apakah ada keyword nama spesifik setelah strip kata umum
            const keyword = q
                .replace(/data|karyawan|pegawai|employee|semua|seluruh|berikan|tampilkan|cari|lihat/g, "")
                .trim();

            if (keyword.length > 1) {
                const data = await this.employeeService.search(keyword);
                return {
                    type: "employees",
                    answer: `Ditemukan ${data.length} karyawan dengan kata kunci "${keyword}".`,
                    data
                };
            }

            const data = await this.employeeService.getAllEmployees();
            return {
                type: "employees",
                answer: `Ditemukan ${data.length} data karyawan.`,
                data
            };
        }

        // ==========================================
        // TICKET
        // ==========================================
        if (
            q.includes("ticket") || q.includes("tiket") ||
            q.includes("problem") || q.includes("kendala")
        ) {
            const keyword = q
                .replace(/ticket|tiket|problem|kendala/g, "")
                .trim();

            const data = keyword.length
                ? await this.ticketService.search(keyword)
                : await this.ticketService.getAll();

            return {
                type: "tickets",
                answer: `Ditemukan ${data.length} ticket.`,
                data
            };
        }

        // ==========================================
        // WORK ORDER
        // ==========================================
        if (
            q.includes("work order") || q.includes("workorder") ||
            /\bwo\b/.test(q)
        ) {
            const keyword = q
                .replace(/work order|workorder|wo/g, "")
                .trim();

            const data = keyword.length
                ? await this.workorderService.search(keyword)
                : await this.workorderService.getAll();

            return {
                type: "workorders",
                answer: `Ditemukan ${data.length} Work Order.`,
                data
            };
        }

        // ==========================================
        // ASSET / KOMPUTER
        // ==========================================
        if (
            q.includes("komputer") || q.includes("computer") ||
            q.includes("laptop") || q.includes("aset") ||
            q.includes("asset") || q.includes("cpu") ||
            (/\bpc\b/.test(q) && !q.includes("ppic"))
        ) {
            const keyword = q
                .replace(/komputer|computer|laptop|aset|asset|cpu|pc/g, "")
                .trim();

            const data = keyword.length
                ? await this.assetService.search(keyword)
                : await this.assetService.getAll();

            return {
                type: "assets",
                answer: `Ditemukan ${data.length} aset komputer.`,
                data
            };
        }

        return null;
    }
}
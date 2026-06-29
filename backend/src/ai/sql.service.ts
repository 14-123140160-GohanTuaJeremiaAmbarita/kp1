import { EmployeeService } from "../services/employee.service";
import { TicketService } from "../services/ticket.service";
import { WorkOrderService } from "../services/workorder.service";
import { AssetService } from "../services/asset.service";

export class SQLService {

    private employeeService = new EmployeeService();
    private ticketService = new TicketService();
    private workorderService = new WorkOrderService();
    private assetService = new AssetService();

    async execute(message: string) {
        const q = message.toLowerCase().trim();

        // ==========================================
        // DEPARTMENT SPESIFIK — cek lebih dulu
        // ==========================================

        // IT
        if (this.matchDept(q, "it")) {
            const data = await this.employeeService.getDepartment("IT");
            return {
                type: "employees",
                answer: `Departemen IT memiliki ${data.length} karyawan.`,
                data
            };
        }

        // HRD
        if (this.matchDept(q, "hrd")) {
            const data = await this.employeeService.getDepartment("HRD");
            return {
                type: "employees",
                answer: `Departemen HRD memiliki ${data.length} karyawan.`,
                data
            };
        }

        // ACCOUNTING
        if (this.matchDept(q, "accounting") || this.matchDept(q, "akuntansi")) {
            const data = await this.employeeService.getDepartment("ACCOUNTING");
            return {
                type: "employees",
                answer: `Departemen Accounting memiliki ${data.length} karyawan.`,
                data
            };
        }

        // FINANCE
        if (this.matchDept(q, "finance") || this.matchDept(q, "keuangan")) {
            const data = await this.employeeService.getDepartment("FINANCE");
            return {
                type: "employees",
                answer: `Departemen Finance memiliki ${data.length} karyawan.`,
                data
            };
        }

        // MARKETING
        if (this.matchDept(q, "marketing") || this.matchDept(q, "pemasaran")) {
            const data = await this.employeeService.getDepartment("MARKETING");
            return {
                type: "employees",
                answer: `Departemen Marketing memiliki ${data.length} karyawan.`,
                data
            };
        }

        // PROCUREMENT
        if (this.matchDept(q, "procurement") || this.matchDept(q, "pengadaan")) {
            const data = await this.employeeService.getDepartment("PROCUREMENT");
            return {
                type: "employees",
                answer: `Departemen Procurement memiliki ${data.length} karyawan.`,
                data
            };
        }

        // LOGISTIC
        if (this.matchDept(q, "logistic") || this.matchDept(q, "logistik")) {
            const data = await this.employeeService.getDepartment("LOGISTIC OUT");
            return {
                type: "employees",
                answer: `Departemen Logistic memiliki ${data.length} karyawan.`,
                data
            };
        }

        // GA
        if (this.matchDept(q, "ga") || this.matchDept(q, "general affair")) {
            const data = await this.employeeService.getDepartment("GA");
            return {
                type: "employees",
                answer: `Departemen GA memiliki ${data.length} karyawan.`,
                data
            };
        }

        // PPIC
        if (this.matchDept(q, "ppic")) {
            const data = await this.employeeService.getDepartment("PPIC");
            return {
                type: "employees",
                answer: `Departemen PPIC memiliki ${data.length} karyawan.`,
                data
            };
        }

        // ==========================================
        // EMPLOYEE — semua karyawan
        // ==========================================
        if (
            q.includes("karyawan") ||
            q.includes("pegawai") ||
            q.includes("employee") ||
            q.includes("staff") ||
            q.includes("personel") ||
            q.includes("data karyawan") ||
            q.includes("semua karyawan") ||
            q.includes("berapa karyawan") ||
            q.includes("jumlah karyawan")
        ) {
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
            q.includes("ticket") ||
            q.includes("tiket") ||
            q.includes("problem") ||
            q.includes("kendala") ||
            q.includes("laporan masalah")
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
            q.includes("work order") ||
            q.includes("workorder") ||
            q.includes("wo ") ||
            q === "wo"
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
            q.includes("komputer") ||
            q.includes("computer") ||
            q.includes("laptop") ||
            q.includes("notebook") ||
            q.includes("aset") ||
            q.includes("asset") ||
            q.includes("cpu") ||
            (q.includes("pc") && !q.includes("ppic"))
        ) {
            const keyword = q
                .replace(/komputer|computer|laptop|notebook|aset|asset|cpu|pc/g, "")
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

    // Helper: cek apakah query mengandung nama departemen
    private matchDept(q: string, dept: string): boolean {
        // Pastikan "it" tidak cocok dengan kata seperti "ticket", "tiket", "kriteria"
        if (dept === "it") {
            return /\bit\b/.test(q);
        }
        if (dept === "ga") {
            return /\bga\b/.test(q);
        }
        if (dept === "wo") {
            return /\bwo\b/.test(q);
        }
        return q.includes(dept);
    }
}
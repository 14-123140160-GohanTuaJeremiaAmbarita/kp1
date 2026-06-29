import { Request, Response } from "express";
import { EmployeeService } from "../services/employee.service";
import { TicketService } from "../services/ticket.service";
import { WorkOrderService } from "../services/workorder.service";
import { AssetService } from "../services/asset.service";
import { SQLService } from "../ai/sql.service";
import { exportExcel } from "../utils/exportExcel";
import exportPdf  from "../utils/exportPdf";

const sql = new SQLService();
const empService = new EmployeeService();
const tikService = new TicketService();
const woService = new WorkOrderService();
const asetService = new AssetService();

export class ExportController {

    async excel(req: Request, res: Response) {
        try {
            const query = String(req.query.q ?? "").toLowerCase();
            const dept = String(req.query.dept ?? "All");
            
            let exportData: any[] = [];
            let dataType = "Laporan";

            // SPRINT 8: JALUR DETERMINISTIK (Langsung ke Database, Bebas Halusinasi AI)
            if (query === "employee" || query === "karyawan") {
                dataType = "Data Karyawan";
                let data = await empService.getAllEmployees();
                if (dept !== "All" && dept.trim() !== "") {
                    const targetDept = dept.toLowerCase().trim();
                    data = data.filter(e => String(e.Dept ?? "").toLowerCase().trim().includes(targetDept));
                }
                exportData = data;
            } 
            else if (query === "ticket") {
                dataType = "Data Tiket";
                let data = await tikService.getAll();
                if (dept !== "All" && dept.trim() !== "") {
                    const targetDept = dept.toLowerCase().trim();
                    data = data.filter(t => String((t as any).Dept || (t as any).dept || "").toLowerCase().trim().includes(targetDept));
                }
                exportData = data;
            }
            else if (query === "workorder") {
                dataType = "Data Work Order";
                let data = await woService.getAll();
                if (dept !== "All" && dept.trim() !== "") {
                    const targetDept = dept.toLowerCase().trim();
                    data = data.filter(w => String((w as any).Dept || (w as any).dept || "").toLowerCase().trim().includes(targetDept));
                }
                exportData = data;
            }
            else if (query === "asset") {
                dataType = "Data Aset Komputer";
                let data = await asetService.getAll();
                if (dept !== "All" && dept.trim() !== "") {
                    const targetDept = dept.toLowerCase().trim();
                    data = data.filter(a => String((a as any).dept ?? "").toLowerCase().trim().includes(targetDept));
                }
                exportData = data;
            }
            else {
                // JALUR FALLBACK AI: Digunakan JIKA DAN HANYA JIKA perintah berasal dari obrolan bebas (Chatbot)
                let aiQuery = query;
                if (dept !== "All" && dept.trim() !== "") {
                    aiQuery = `${query} khususnya untuk departemen ${dept}`;
                }
                const result = await sql.execute(aiQuery);
                exportData = result && result.data ? (result.data as object[]) : [];
                dataType = result && result.type ? result.type : "Laporan AI";
            }

            const buffer = await exportExcel("export.xlsx", dataType, exportData);

            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", `attachment; filename=Voksel_${dataType.replace(/\s+/g, '')}_${dept}.xlsx`);
            res.send(buffer);

        } catch (error) {
            console.error("❌ Export Excel Error:", error);
            res.status(500).json({ message: "Terjadi kesalahan internal saat membuat file Excel." });
        }
    }

    async pdf(req: Request, res: Response) {
        try {
            const query = String(req.query.q ?? "").toLowerCase();
            const dept = String(req.query.dept ?? "All");
            
            let exportData: any[] = [];
            let dataType = "Laporan";

            // SPRINT 8: JALUR DETERMINISTIK UNTUK PDF
            if (query === "employee" || query === "karyawan") {
                dataType = "Data Karyawan";
                let data = await empService.getAllEmployees();
                if (dept !== "All" && dept.trim() !== "") {
                    const targetDept = dept.toLowerCase().trim();
                    data = data.filter(e => String(e.Dept ?? "").toLowerCase().trim().includes(targetDept));
                }
                exportData = data;
            } 
            else if (query === "ticket") {
                dataType = "Data Tiket";
                let data = await tikService.getAll();
                if (dept !== "All" && dept.trim() !== "") {
                    const targetDept = dept.toLowerCase().trim();
                    data = data.filter(t => String((t as any).Dept || (t as any).dept || "").toLowerCase().trim().includes(targetDept));
                }
                exportData = data;
            }
            else if (query === "workorder") {
                dataType = "Data Work Order";
                let data = await woService.getAll();
                if (dept !== "All" && dept.trim() !== "") {
                    const targetDept = dept.toLowerCase().trim();
                    data = data.filter(w => String((w as any).Dept || (w as any).dept || "").toLowerCase().trim().includes(targetDept));
                }
                exportData = data;
            }
            else if (query === "asset") {
                dataType = "Data Aset Komputer";
                let data = await asetService.getAll();
                if (dept !== "All" && dept.trim() !== "") {
                    const targetDept = dept.toLowerCase().trim();
                    data = data.filter(a => String((a as any).dept ?? "").toLowerCase().trim().includes(targetDept));
                }
                exportData = data;
            }
            else {
                // JALUR FALLBACK AI
                let aiQuery = query;
                if (dept !== "All" && dept.trim() !== "") {
                    aiQuery = `${query} khususnya untuk departemen ${dept}`;
                }
                const result = await sql.execute(aiQuery);
                exportData = result && result.data ? (result.data as object[]) : [];
                dataType = result && result.type ? result.type : "Laporan AI";
            }

            const buffer = await exportPdf(`PT Voksel Electric Tbk - ${dataType} (${dept})`, exportData);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=Voksel_${dataType.replace(/\s+/g, '')}_${dept}.pdf`);
            res.send(buffer);

        } catch (error) {
            console.error("❌ Export PDF Error:", error);
            res.status(500).json({ message: "Terjadi kesalahan internal saat membuat file PDF." });
        }
    }
}

export default new ExportController();
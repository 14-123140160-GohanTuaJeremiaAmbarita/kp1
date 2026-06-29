import { EmployeeService }  from "./employee.service";
import { TicketService }    from "./ticket.service";
import { WorkOrderService } from "./workorder.service";
import { AssetService }     from "./asset.service";

export class DashboardService {
  private emp  = new EmployeeService();
  private tik  = new TicketService();
  private wo   = new WorkOrderService();
  private aset = new AssetService();

  async getStats(department?: string) {
    let [employees, tickets, workorders, assets] = await Promise.all([
      this.emp.getAllEmployees(),
      this.tik.getAll(),
      this.wo.getAll(),
      this.aset.getAll(),
    ]);

    const isFiltered = department && department !== "All";

    if (isFiltered) {
      const targetDept = department.toLowerCase().trim();
      
      // Saring data secara akurat sesuai divisi/departemen pilihan pengguna
      employees = employees.filter(e => String(e.Dept ?? "").toLowerCase().trim() === targetDept);
      
      tickets = tickets.filter(t => {
        const ticketDept = (t as any).Dept || (t as any).dept || "";
        return String(ticketDept).toLowerCase().trim() === targetDept;
      });
      
      workorders = workorders.filter(w => {
        const woDept = (w as any).Dept || (w as any).dept || "";
        return String(woDept).toLowerCase().trim() === targetDept;
      });
      
      assets = assets.filter(a => String(a.dept ?? "").toLowerCase().trim() === targetDept);
    }

    // HITUNG DISTRIBUSI: Murni menghitung data per Divisi / Departemen (Sesuai Permintaan)
    const deptMap: Record<string, number> = {};
    for (const e of employees) {
      const dept = String(e.Dept ?? "Lainnya");
      deptMap[dept] = (deptMap[dept] ?? 0) + 1;
    }
    const karyawanByDept = Object.entries(deptMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    // Hitung status karyawan (Aktif, Kontrak, dll. tetap dinamis mengikuti filter divisi)
    const statusMap: Record<string, number> = {};
    for (const e of employees) {
      const s = String(e.status ?? "Lainnya");
      statusMap[s] = (statusMap[s] ?? 0) + 1;
    }
    const karyawanByStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    const ticketByStatus = [
      { name: "Ada WO",   value: tickets.filter(t => t.NoWO && t.NoWO.trim() !== "").length },
      { name: "Tanpa WO", value: tickets.filter(t => !t.NoWO || t.NoWO.trim() === "").length },
    ];

    const woByStatus = [
      { name: "Open",   value: workorders.filter(w => w.Closed === 0).length },
      { name: "Closed", value: workorders.filter(w => w.Closed === 1).length },
    ];

    const typeMap: Record<string, number> = {};
    for (const w of workorders) {
      const type = String(w.Type ?? "Lainnya");
      typeMap[type] = (typeMap[type] ?? 0) + 1;
    }
    const woByType = Object.entries(typeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return {
      totalKaryawan: employees.length,
      totalTicket:   tickets.length,
      totalWO:       workorders.length,
      totalAsset:    assets.length,
      karyawanByDept,
      karyawanByDeptTop10: karyawanByDept.slice(0, 10),
      karyawanByStatus,
      ticketByStatus,
      woByStatus,
      woByType,
      chartTitle: isFiltered ? `Distribusi Data Departemen ${department}` : "Distribusi Karyawan Per Seluruh Divisi / Departemen"
    };
  }
}
import { EmployeeService }  from "./employee.service";
import { TicketService }    from "./ticket.service";
import { WorkOrderService } from "./workorder.service";
import { AssetService }     from "./asset.service";

export class DashboardService {
  private emp  = new EmployeeService();
  private tik  = new TicketService();
  private wo   = new WorkOrderService();
  private aset = new AssetService();

  async getStats() {
    const [employees, tickets, workorders, assets] = await Promise.all([
      this.emp.getAllEmployees(),
      this.tik.getAll(),
      this.wo.getAll(),
      this.aset.getAll(),
    ]);

    // Karyawan per departemen
    const deptMap: Record<string, number> = {};
    for (const e of employees) {
      const dept = String(e.Dept ?? "Lainnya");
      deptMap[dept] = (deptMap[dept] ?? 0) + 1;
    }
    const karyawanByDept = Object.entries(deptMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    const karyawanByDeptTop10 = karyawanByDept.slice(0, 10);

    // Status karyawan
    const statusMap: Record<string, number> = {};
    for (const e of employees) {
      const s = String(e.status ?? "Lainnya");
      statusMap[s] = (statusMap[s] ?? 0) + 1;
    }
    const karyawanByStatus = Object.entries(statusMap)
      .map(([name, value]) => ({ name, value }));

    // Tiket
    const ticketByStatus = [
      { name: "Ada WO",   value: tickets.filter(t => t.NoWO && t.NoWO.trim() !== "").length },
      { name: "Tanpa WO", value: tickets.filter(t => !t.NoWO || t.NoWO.trim() === "").length },
    ];

    // WO status
    const woOpen   = workorders.filter(w => w.Closed === 0).length;
    const woClosed = workorders.filter(w => w.Closed === 1).length;
    const woByStatus = [
      { name: "Open",   value: woOpen },
      { name: "Closed", value: woClosed },
    ];

    // WO per type
    const typeMap: Record<string, number> = {};
    for (const w of workorders) {
      const type = String(w.Type ?? "Lainnya");
      typeMap[type] = (typeMap[type] ?? 0) + 1;
    }
    const woByType = Object.entries(typeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      totalKaryawan: employees.length,
      totalTicket:   tickets.length,
      totalWO:       workorders.length,
      totalAsset:    assets.length,
      karyawanByDept,
      karyawanByDeptTop10,
      karyawanByStatus,
      ticketByStatus,
      woByStatus,
      woByType,
    };
  }
}
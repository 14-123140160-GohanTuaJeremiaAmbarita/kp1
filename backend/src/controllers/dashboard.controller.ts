import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";

const dashboardService = new DashboardService();

// Gunakan Named Export fungsi sesuai dengan struktur kode lama Anda
export async function getDashboardStats(req: Request, res: Response) {
  try {
    // SPRINT 7: Tangkap query parameter 'department' yang dikirim dari frontend
    const department = req.query.department ? String(req.query.department) : undefined;

    // Oper parameter tersebut ke dalam fungsi getStats milik DashboardService yang sudah kita perbarui
    const stats = await dashboardService.getStats(department);

    // Kirim data kembali ke frontend
    res.json(stats);
  } catch (err) {
    console.error("❌ Error pada getDashboardStats:", err);
    res.status(500).json({ error: "Gagal mengambil statistik dashboard" });
  }
}
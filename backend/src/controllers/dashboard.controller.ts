import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";

const dashboardService = new DashboardService();

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const stats = await dashboardService.getStats();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil statistik" });
  }
}
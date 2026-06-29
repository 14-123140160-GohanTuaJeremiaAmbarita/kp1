import { Request, Response } from "express";
import { EmployeeService } from "../services/employee.service";

const service = new EmployeeService();

export class EmployeeController {

    async getAll(req: Request, res: Response) {
        try {
            const employees = await service.getAllEmployees();
            return res.json({
                success: true,
                total: employees.length,
                data: employees
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: String(err)
            });
        }
    }

    async search(req: Request, res: Response) {
        try {
            const keyword = String(req.query.keyword || "");
            const data = await service.search(keyword);
            return res.json({
                success: true,
                total: data.length,
                data
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: String(err)
            });
        }
    }

    async department(req: Request, res: Response) {
        try {
            // PERBAIKAN: Bungkus dengan String() agar TS tidak komplain soal tipe 'string[]'
            const dept = String(req.params.dept || "");
            const data = await service.getDepartment(dept);
            
            return res.json({
                success: true,
                total: data.length,
                data
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: String(err)
            });
        }
    }
}

export default new EmployeeController();
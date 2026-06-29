import { Request, Response } from "express";

import { SQLService } from "../ai/sql.service";

import { exportExcel } from "../utils/exportExcel";

import exportPdf  from "../utils/exportPdf";

const sql = new SQLService();

export class ExportController {

    async excel(req: Request, res: Response) {

        const query = String(req.query.q ?? "");

        const result = await sql.execute(query);

        if (!result) {

            return res.status(404).json({

                message: "Data tidak ditemukan"

            });

        }

        const buffer = await exportExcel(

            "export.xlsx",

            result.type,

            result.data as object[]

        );

        res.setHeader(

            "Content-Type",

            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        );

        res.setHeader(

            "Content-Disposition",

            "attachment; filename=report.xlsx"

        );

        res.send(buffer);

    }

    async pdf(req: Request, res: Response) {

        const query = String(req.query.q ?? "");

        const result = await sql.execute(query);

        if (!result) {

            return res.status(404).json({

                message: "Data tidak ditemukan"

            });

        }

        const buffer = await exportPdf(

            "PT Voksel Indonesia",

            result.data as object[]

        );

        res.setHeader(

            "Content-Type",

            "application/pdf"

        );

        res.setHeader(

            "Content-Disposition",

            "attachment; filename=report.pdf"

        );

        res.send(buffer);

    }

}

export default new ExportController();
import { Request, Response } from "express";
import { TicketService } from "../services/ticket.service";

const service = new TicketService();

export class TicketController {

    async getAll(req: Request, res: Response) {

        try {

            const tickets = await service.getAll();

            return res.json({

                success: true,

                total: tickets.length,

                data: tickets

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

    async getOpen(req: Request, res: Response) {

        try {

            const data = await service.getOpen();

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

    async getByNRP(req: Request, res: Response) {

        try {

            const nrp = req.params.nrp;

            const data = await service.getByNRP(nrp);

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
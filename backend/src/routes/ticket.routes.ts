import { Router } from "express";
import { TicketController } from "../controllers/ticket.controller";

const router = Router();

const controller = new TicketController();

router.get("/", controller.getAll.bind(controller));

router.get("/search", controller.search.bind(controller));

router.get("/open", controller.getOpen.bind(controller));

router.get("/nrp/:nrp", controller.getByNRP.bind(controller));

export default router;
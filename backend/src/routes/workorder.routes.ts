import { Router } from "express";
import { WorkOrderController } from "../controllers/workorder.controller";

const router=Router();

const controller=new WorkOrderController();

router.get("/",controller.getAll.bind(controller));

router.get("/search",controller.search.bind(controller));

router.get("/department/:dept",controller.department.bind(controller));

export default router;
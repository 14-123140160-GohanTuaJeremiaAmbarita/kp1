import { Router } from "express";
import { EmployeeController } from "../controllers/employee.controller";

const router = Router();

const controller = new EmployeeController();

router.get("/", controller.getAll.bind(controller));

router.get("/search", controller.search.bind(controller));

router.get("/department/:dept", controller.department.bind(controller));

export default router;
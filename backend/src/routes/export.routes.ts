import { Router } from "express";

import exportController from "../controllers/export.controller";

const router = Router();

router.get(

    "/excel",

    exportController.excel.bind(exportController)

);

router.get(

    "/pdf",

    exportController.pdf.bind(exportController)

);

export default router;
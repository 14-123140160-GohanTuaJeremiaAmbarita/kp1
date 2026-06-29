import { Router } from "express";
import { AssetController } from "../controllers/asset.controller";

const router=Router();

const controller=new AssetController();

router.get("/",controller.getAll.bind(controller));

router.get("/search",controller.search.bind(controller));

router.get("/department/:dept",controller.department.bind(controller));

export default router;
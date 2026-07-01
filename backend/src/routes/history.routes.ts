import { Router } from "express";

import { historyController } from "../controllers/history.controller";

const router = Router();

router.get(
    "/",
    historyController.getConversations.bind(historyController)
);

router.get(
    "/:conversationId",
    historyController.getMessages.bind(historyController)
);

router.put(
    "/:conversationId",
    historyController.renameConversation.bind(historyController)
);

router.delete(
    "/:conversationId",
    historyController.deleteConversation.bind(historyController)
);

export default router;
import { Request, Response } from "express";
import { HistoryService } from "../services/history.service";

const historyService = new HistoryService();

export class HistoryController {

    async getConversations(req: Request, res: Response) {

        try {

            const conversations =
                await historyService.getConversationList();

            res.json({
                success: true,
                data: conversations
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                success: false,
                message: "Gagal mengambil daftar percakapan."
            });

        }

    }

    async getMessages(req: Request, res: Response) {

        try {

            const { conversationId } = req.params;

            const messages =
                await historyService.getConversationHistory(
                    conversationId
                );

            res.json({
                success: true,
                data: messages
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                success: false,
                message: "Gagal mengambil history."
            });

        }

    }

    async deleteConversation(req: Request, res: Response) {

        try {

            const { conversationId } = req.params;

            await historyService.deleteConversation(
                conversationId
            );

            res.json({
                success: true,
                message: "Conversation berhasil dihapus."
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                success: false,
                message: "Gagal menghapus conversation."
            });

        }

    }

    async renameConversation(req: Request, res: Response) {

        try {

            const { conversationId } = req.params;

            const { title } = req.body;

            await historyService.renameConversation(

                conversationId,

                title

            );

            res.json({

                success: true,

                message: "Conversation berhasil diubah."

            });

        } catch (err) {

            console.error(err);

            res.status(500).json({

                success: false,

                message: "Rename gagal."

            });

        }

    }

}

export const historyController =
    new HistoryController();
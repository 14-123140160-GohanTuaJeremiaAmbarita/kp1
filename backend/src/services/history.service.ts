import { HistoryRepository } from "../repositories/history.repository";

export class HistoryService {

    private historyRepository: HistoryRepository;

    constructor() {
        this.historyRepository = new HistoryRepository();
    }

    async createConversation(
        title: string,
        model: string = "Gemini"
    ) {

        return await this.historyRepository.createConversation(
            title,
            model
        );

    }

    async saveUserMessage(
        conversationId: string,
        message: string,
        model: string = "Gemini"
    ) {

        return await this.historyRepository.saveMessage(

            conversationId,

            "user",

            message,

            undefined,

            model

        );

    }

    async saveAssistantMessage(

        conversationId: string,

        message: string,

        sqlQuery?: string,

        model: string = "Gemini"

    ) {

        return await this.historyRepository.saveMessage(

            conversationId,

            "assistant",

            message,

            sqlQuery,

            model

        );

    }

    async getConversationList() {

        return await this.historyRepository.getConversationList();

    }

    async getConversationHistory(
        conversationId: string
    ) {

        return await this.historyRepository.getMessages(
            conversationId
        );

    }

    async deleteConversation(
        conversationId: string
    ) {

        return await this.historyRepository.deleteConversation(
            conversationId
        );

    }

    async renameConversation(
        conversationId: string,
        title: string
    ) {

        return await this.historyRepository.renameConversation(
            conversationId,
            title
        );

    }

    async getConversationForAI(
        conversationId: string
    ) {

        const messages =
            await this.historyRepository.getMessages(
                conversationId
            );

        return messages.map((item: any) => ({

            role: item.Role,

            content: item.Content

        }));

    }

    async createOrGetConversation(

        conversationId: string | undefined,

        firstMessage: string,

        model: string = "Gemini"

    ) {

        if (conversationId)
            return conversationId;

        const conversation =
            await this.createConversation(

                firstMessage.length > 50
                    ? firstMessage.substring(0, 50)
                    : firstMessage,

                model

            );

        return conversation.ConversationId;

    }

}
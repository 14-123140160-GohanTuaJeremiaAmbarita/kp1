import { TicketRepository } from "../repositories/ticket.repository";

export class TicketService {

    private repository = new TicketRepository();

    async getAll() {
        return await this.repository.getAll();
    }

    async getOpen() {
        return await this.repository.getOpen();
    }

    async getByNRP(nrp: string) {
        return await this.repository.getByNRP(nrp);
    }

    async search(keyword: string) {
        return await this.repository.search(keyword);
    }

}
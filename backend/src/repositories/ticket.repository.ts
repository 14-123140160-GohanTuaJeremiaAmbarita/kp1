import { BaseRepository } from "./base.repository";
import { Ticket } from "../types/ticket";

export class TicketRepository extends BaseRepository {

    async getAll(): Promise<Ticket[]> {

        return await this.executeQuery<Ticket>(`
            SELECT
                NRP,
                name,
                problem,
                NoWO,
                tgl,
                tglupdate
            FROM TD_TICKET
            ORDER BY tgl DESC
        `);

    }

    async getOpen(): Promise<Ticket[]> {

        return await this.executeQuery<Ticket>(`
            SELECT
                NRP,
                name,
                problem,
                NoWO,
                tgl,
                tglupdate
            FROM TD_TICKET
            WHERE tglupdate IS NULL
            ORDER BY tgl DESC
        `);

    }

    async getByNRP(nrp: string): Promise<Ticket[]> {

        return await this.executeQuery<Ticket>(`
            SELECT
                NRP,
                name,
                problem,
                NoWO,
                tgl,
                tglupdate
            FROM TD_TICKET
            WHERE NRP=@nrp
            ORDER BY tgl DESC
        `, { nrp });

    }

    async search(keyword: string): Promise<Ticket[]> {

        return await this.executeQuery<Ticket>(`
            SELECT
                NRP,
                name,
                problem,
                NoWO,
                tgl,
                tglupdate
            FROM TD_TICKET
            WHERE
                name LIKE '%' + @keyword + '%'
                OR problem LIKE '%' + @keyword + '%'
                OR NRP LIKE '%' + @keyword + '%'
                OR NoWO LIKE '%' + @keyword + '%'
            ORDER BY tgl DESC
        `, { keyword });

    }

}
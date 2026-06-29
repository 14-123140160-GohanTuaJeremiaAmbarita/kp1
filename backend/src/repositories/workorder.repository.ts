import { BaseRepository } from "./base.repository";
import { WorkOrder } from "../types/workorder";

export class WorkOrderRepository extends BaseRepository {

    async getAll(): Promise<WorkOrder[]> {

        return await this.executeQuery<WorkOrder>(`

            SELECT

                NoWO,
                Date,
                Dept,
                Type,
                JenisWO,
                SubType,
                NoIdentification,
                Content,
                Uraiankerusakan,
                UserC,
                MulaiPengerjaan,
                SelesaiPengarjaan,
                TotalDowntime,
                DeskripsiTindakan,
                TingkatKesulitan,
                Closed,
                ITPic,
                Penyebab,
                Tglupdate,
                Name

            FROM TD_WO

            ORDER BY Date DESC

        `);

    }

    async search(keyword:string):Promise<WorkOrder[]>{

        return await this.executeQuery<WorkOrder>(`

            SELECT

                NoWO,
                Date,
                Dept,
                Type,
                JenisWO,
                SubType,
                NoIdentification,
                Content,
                Uraiankerusakan,
                UserC,
                MulaiPengerjaan,
                SelesaiPengarjaan,
                TotalDowntime,
                DeskripsiTindakan,
                TingkatKesulitan,
                Closed,
                ITPic,
                Penyebab,
                Tglupdate,
                Name

            FROM TD_WO

            WHERE

                   Name LIKE '%' + @keyword + '%'

                OR Dept LIKE '%' + @keyword + '%'

                OR NoWO LIKE '%' + @keyword + '%'

                OR Content LIKE '%' + @keyword + '%'

                OR Uraiankerusakan LIKE '%' + @keyword + '%'

            ORDER BY Date DESC

        `,{keyword});

    }

    async getDepartment(dept:string):Promise<WorkOrder[]>{

        return await this.executeQuery<WorkOrder>(`

            SELECT *

            FROM TD_WO

            WHERE Dept=@dept

            ORDER BY Date DESC

        `,{dept});

    }

}
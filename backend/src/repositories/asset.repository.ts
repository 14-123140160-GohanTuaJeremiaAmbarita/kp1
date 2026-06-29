import { BaseRepository } from "./base.repository";
import { Computer } from "../types/computer";

export class AssetRepository extends BaseRepository {

    async getAll(): Promise<Computer[]> {

        return await this.executeQuery<Computer>(`

            SELECT *

            FROM TD_COMPUTER

            ORDER BY CodeCpu

        `);

    }

    async search(keyword: string): Promise<Computer[]> {

        return await this.executeQuery<Computer>(`

            SELECT *

            FROM TD_COMPUTER

            WHERE

                    CodeCpu LIKE '%' + @keyword + '%'

                OR  UserNama LIKE '%' + @keyword + '%'

                OR  Dept LIKE '%' + @keyword + '%'

                OR  CPU_Merk LIKE '%' + @keyword + '%'

                OR  CPU_Type LIKE '%' + @keyword + '%'

                OR  Processor LIKE '%' + @keyword + '%'

                OR  NameComp LIKE '%' + @keyword + '%'

                OR  Nrp LIKE '%' + @keyword + '%'

            ORDER BY CodeCpu

        `,{keyword});

    }

    async department(dept:string):Promise<Computer[]>{

        return await this.executeQuery<Computer>(`

            SELECT *

            FROM TD_COMPUTER

            WHERE Dept=@dept

            ORDER BY UserNama

        `,{dept});

    }

}
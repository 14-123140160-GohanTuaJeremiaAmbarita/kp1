import { BaseRepository } from "./base.repository";

export interface Employee {

    Nrp: string;
    Name: string;
    Dept: string;
    status: string;

}

export class EmployeeRepository extends BaseRepository {

    async getAll() {

        return this.executeQuery<Employee>(`

            SELECT

                Nrp,
                Name,
                Dept,
                status

            FROM TD_karyawan

            ORDER BY Name

        `);

    }

    async findByDepartment(dept: string) {

        return this.executeQuery<Employee>(`

            SELECT

                Nrp,
                Name,
                Dept,
                status

            FROM TD_karyawan

            WHERE Dept=@dept

            ORDER BY Name

        `,{dept});

    }

    async search(keyword:string){

        return this.executeQuery<Employee>(`

            SELECT

                Nrp,
                Name,
                Dept,
                status

            FROM TD_karyawan

            WHERE

                Name LIKE '%' + @keyword + '%'

                OR

                Dept LIKE '%' + @keyword + '%'

                OR

                Nrp LIKE '%' + @keyword + '%'

            ORDER BY Name

        `,{keyword});

    }

}
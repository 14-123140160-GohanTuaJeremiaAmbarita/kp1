import { EmployeeRepository } from "../repositories/employee.repository";

export class EmployeeService {

    private repository = new EmployeeRepository();

    async getAllEmployees() {

        return await this.repository.getAll();

    }

    async getDepartment(dept:string){

        return await this.repository.findByDepartment(dept);

    }

    async search(keyword:string){

        return await this.repository.search(keyword);

    }

}
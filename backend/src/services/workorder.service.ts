import { WorkOrderRepository } from "../repositories/workorder.repository";

export class WorkOrderService{

    private repository=new WorkOrderRepository();

    async getAll(){

        return await this.repository.getAll();

    }

    async search(keyword:string){

        return await this.repository.search(keyword);

    }

    async getDepartment(dept:string){

        return await this.repository.getDepartment(dept);

    }

}
import { AssetRepository } from "../repositories/asset.repository";

export class AssetService{

    private repository=new AssetRepository();

    async getAll(){

        return await this.repository.getAll();

    }

    async search(keyword:string){

        return await this.repository.search(keyword);

    }

    async department(dept:string){

        return await this.repository.department(dept);

    }

}
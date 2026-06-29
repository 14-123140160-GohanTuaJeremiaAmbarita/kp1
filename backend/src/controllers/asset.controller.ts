import { Request,Response } from "express";
import { AssetService } from "../services/asset.service";

const service=new AssetService();

export class AssetController{

    async getAll(req:Request,res:Response){

        try{

            const data=await service.getAll();

            return res.json({

                success:true,

                total:data.length,

                data

            });

        }

        catch(err){

            return res.status(500).json({

                success:false,

                message:String(err)

            });

        }

    }

    async search(req:Request,res:Response){

        try{

            const keyword=String(req.query.keyword||"");

            const data=await service.search(keyword);

            return res.json({

                success:true,

                total:data.length,

                data

            });

        }

        catch(err){

            return res.status(500).json({

                success:false,

                message:String(err)

            });

        }

    }

    async department(req:Request,res:Response){

        try{

            const dept=req.params.dept;

            const data=await service.department(dept);

            return res.json({

                success:true,

                total:data.length,

                data

            });

        }

        catch(err){

            return res.status(500).json({

                success:false,

                message:String(err)

            });

        }

    }

}
import { getPool } from "../config/database";
import sql from "mssql";

export abstract class BaseRepository {

    protected async executeQuery<T>(
        query: string,
        params?: Record<string, any>
    ): Promise<T[]> {

        const pool = getPool();

        const request = pool.request();

        if (params) {

            for (const key in params) {

                request.input(key, params[key]);

            }

        }

        const result = await request.query(query);

        return result.recordset as T[];

    }

}
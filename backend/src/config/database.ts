import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const dbConfig: sql.config = {
    server: process.env.DB_SERVER!,
    database: process.env.DB_DATABASE!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    port: Number(process.env.DB_PORT),

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },

    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

let pool: sql.ConnectionPool;

export async function connectDatabase() {

    try {

        pool = await new sql.ConnectionPool(dbConfig).connect();

        console.log("================================");
        console.log("SQL SERVER CONNECTED");
        console.log("Database :", process.env.DB_DATABASE);
        console.log("================================");

    } catch (err) {

        console.error("DATABASE ERROR");

        console.error(err);

        process.exit(1);

    }

}

export function getPool() {

    if (!pool) {

        throw new Error("Database belum connect.");

    }

    return pool;

}
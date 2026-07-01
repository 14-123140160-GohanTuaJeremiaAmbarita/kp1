import dotenv from "dotenv";
dotenv.config();

import app from "./app";

import { connectDatabase } from "./config/database";
import { connectHistoryDatabase } from "./config/history.database";

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {

    try {

        console.clear();

        console.log("=========================================");
        console.log("     SMART IT ASSISTANT BACKEND");
        console.log("=========================================\n");

        await connectDatabase();

        await connectHistoryDatabase();

        console.log("=========================================");
        console.log("SERVER");
        console.log("=========================================");
        console.log(`Server Running : http://localhost:${PORT}`);

        console.log("\n=========================================");
        console.log("API");
        console.log("=========================================");

        console.log(`http://localhost:${PORT}/api/chat`);
        console.log(`http://localhost:${PORT}/api/history`);
        console.log(`http://localhost:${PORT}/api/employees`);
        console.log(`http://localhost:${PORT}/api/tickets`);
        console.log(`http://localhost:${PORT}/api/workorders`);
        console.log(`http://localhost:${PORT}/api/assets`);
        console.log(`http://localhost:${PORT}/api/dashboard`);
        console.log(`http://localhost:${PORT}/api/export`);

        console.log("\n=========================================");

        app.listen(PORT, () => {

            console.log("Backend Ready");

        });

    }

    catch (err) {

        console.error(err);

        process.exit(1);

    }

}

startServer();
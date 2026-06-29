import app from "./app";
import { connectDatabase } from "./config/database";

const PORT = Number(process.env.PORT) || 5000;

async function start() {

    try {

        await connectDatabase();

        app.listen(PORT, () => {

            console.clear();

            console.log("=========================================");
            console.log("   SMART IT ASSISTANT BACKEND");
            console.log("=========================================\n");

            console.log("✅ SQL Server Connected");
            console.log(`✅ Server Running : http://localhost:${PORT}`);
            console.log("");

            console.log("=========================================");
            console.log("API");
            console.log("=========================================");

            console.log(`👉 http://localhost:${PORT}/api/employees`);
            console.log(`👉 http://localhost:${PORT}/api/tickets`);
            console.log(`👉 http://localhost:${PORT}/api/workorders`);
            console.log(`👉 http://localhost:${PORT}/api/assets`);
            console.log(`👉 http://localhost:${PORT}/api/chat`);

            console.log("");
            console.log("=========================================");
            console.log("TEST");
            console.log("=========================================");

            console.log(`Employees Search`);
            console.log(`http://localhost:${PORT}/api/employees/search?keyword=it`);

            console.log("");

            console.log(`Department`);
            console.log(`http://localhost:${PORT}/api/employees/department/HRD`);

            console.log("");

            console.log(`Tickets`);
            console.log(`http://localhost:${PORT}/api/tickets/search?keyword=printer`);

            console.log("");

            console.log(`WorkOrder`);
            console.log(`http://localhost:${PORT}/api/workorders/search?keyword=monitor`);

            console.log("");

            console.log(`Assets`);
            console.log(`http://localhost:${PORT}/api/assets/search?keyword=IT`);

            console.log("");

            console.log("=========================================");

        });

    } catch (err) {

        console.error(err);

    }

}

start();
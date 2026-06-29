import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import employeeRoutes from "./routes/employee.routes";
import ticketRoutes from "./routes/ticket.routes";
import workorderRoutes from "./routes/workorder.routes";
import assetRoutes from "./routes/asset.routes";
import chatbotRoutes from "./routes/chatbot.routes";
import dashboardRouter from "./routes/dashboard.routes";
import exportRoutes from "./routes/export.routes";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use(compression());

app.use(helmet());

app.use(morgan("dev"));

app.use("/api/employees",employeeRoutes);

app.use("/api/tickets", ticketRoutes);

app.use("/api/workorders",workorderRoutes);

app.use("/api/assets",assetRoutes);

app.use("/api/chat", chatbotRoutes);

app.use("/api/dashboard", dashboardRouter);

app.use(

    "/api/export",

    exportRoutes

);
app.get("/", (_, res) => {

    res.json({

        success:true,

        application:"Smart IT Assistant",

        version:"1.0.0"

    });

});

export default app;
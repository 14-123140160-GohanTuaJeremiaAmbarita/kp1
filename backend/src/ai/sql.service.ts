import { EmployeeService } from "../services/employee.service";
import { TicketService } from "../services/ticket.service";
import { WorkOrderService } from "../services/workorder.service";
import { AssetService } from "../services/asset.service";

export class SQLService {

    private employeeService = new EmployeeService();

    private ticketService = new TicketService();

    private workorderService = new WorkOrderService();

    private assetService = new AssetService();

    async execute(message: string) {

        const q = message.toLowerCase();

        //----------------------------------
        // EMPLOYEE
        //----------------------------------

        if (q.includes("karyawan")) {

            const keyword = q.replace("karyawan", "").trim();

            const data = keyword.length
                ? await this.employeeService.search(keyword)
                : await this.employeeService.getAllEmployees();

            return {

                type: "employees",

                answer: `Ditemukan ${data.length} data karyawan.`,

                data

            };

        }

        //----------------------------------
        // HRD
        //----------------------------------

        if (q.includes("hrd")) {

            const data = await this.employeeService.getDepartment("HRD");

            return {

                type: "employees",

                answer: `Departemen HRD memiliki ${data.length} karyawan.`,

                data

            };

        }

        //----------------------------------
        // IT
        //----------------------------------

        if (q.includes("it")) {

            const data = await this.employeeService.getDepartment("IT");

            return {

                type: "employees",

                answer: `Departemen IT memiliki ${data.length} karyawan.`,

                data

            };

        }

        //----------------------------------
        // TICKET
        //----------------------------------

        if (q.includes("ticket") || q.includes("tiket")) {

            const keyword = q
                .replace("ticket", "")
                .replace("tiket", "")
                .trim();

            const data = keyword.length
                ? await this.ticketService.search(keyword)
                : await this.ticketService.getAll();

            return {

                type: "tickets",

                answer: `Ditemukan ${data.length} ticket.`,

                data

            };

        }

        //----------------------------------
        // WORK ORDER
        //----------------------------------

        if (q.includes("work order") || q.includes("wo")) {

            const keyword = q
                .replace("work order", "")
                .replace("wo", "")
                .trim();

            const data = keyword.length
                ? await this.workorderService.search(keyword)
                : await this.workorderService.getAll();

            return {

                type: "workorders",

                answer: `Ditemukan ${data.length} Work Order.`,

                data

            };

        }

        //----------------------------------
        // COMPUTER
        //----------------------------------

        if (
            q.includes("komputer") ||
            q.includes("cpu") ||
            q.includes("pc")
        ) {

            const keyword = q
                .replace("komputer", "")
                .replace("cpu", "")
                .replace("pc", "")
                .trim();

            const data = keyword.length
                ? await this.assetService.search(keyword)
                : await this.assetService.getAll();

            return {

                type: "assets",

                answer: `Ditemukan ${data.length} komputer.`,

                data

            };

        }

        return null;

    }

}
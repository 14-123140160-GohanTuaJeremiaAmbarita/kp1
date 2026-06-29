import { NormalizeService } from "./normalize.service";

export type IntentType =
    | "employee_department"
    | "employee_search"
    | "ticket_department"
    | "ticket_search"
    | "workorder_department"
    | "workorder_search"
    | "asset_department"
    | "asset_search"
    | "general";

export interface IntentResult {

    intent: IntentType;

    department?: string;

    keyword?: string;

}

export class IntentService {

    private normalize = new NormalizeService();

    detect(message: string): IntentResult {

        const text = this.normalize.normalize(message);

        const department = this.normalize.extractDepartment(text);

        // ===========================
        // EMPLOYEE
        // ===========================

        if (

            text.includes("karyawan") ||
            text.includes("pegawai") ||
            text.includes("employee") ||
            text.includes("staff")

        ) {

            if (department) {

                return {

                    intent: "employee_department",

                    department

                };

            }

            return {

                intent: "employee_search",

                keyword: text

            };

        }

        // ===========================
        // TICKET
        // ===========================

        if (

            text.includes("ticket") ||
            text.includes("tiket") ||
            text.includes("problem") ||
            text.includes("kendala")

        ) {

            if (department) {

                return {

                    intent: "ticket_department",

                    department

                };

            }

            return {

                intent: "ticket_search",

                keyword: text

            };

        }

        // ===========================
        // WORK ORDER
        // ===========================

        if (

            text.includes("work order") ||
            text.includes("workorder") ||
            text.includes("wo")

        ) {

            if (department) {

                return {

                    intent: "workorder_department",

                    department

                };

            }

            return {

                intent: "workorder_search",

                keyword: text

            };

        }

        // ===========================
        // ASSET
        // ===========================

        if (

            text.includes("komputer") ||
            text.includes("computer") ||
            text.includes("pc") ||
            text.includes("cpu") ||
            text.includes("laptop") ||
            text.includes("notebook") ||
            text.includes("aset") ||
            text.includes("asset")

        ) {

            if (department) {

                return {

                    intent: "asset_department",

                    department

                };

            }

            return {

                intent: "asset_search",

                keyword: text

            };

        }

        // ===========================
        // User hanya mengetik nama departemen
        // ===========================

        if (department) {

            return {

                intent: "employee_department",

                department

            };

        }

        // ===========================
        // General Question
        // ===========================

        return {

            intent: "general",

            keyword: message

        };

    }

}
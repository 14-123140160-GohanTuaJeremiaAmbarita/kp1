import ExcelJS from "exceljs";

export async function exportExcel(
    filename: string,
    sheetName: string,
    rows: object[]
): Promise<Buffer> {

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet(sheetName);

    if (rows.length > 0) {

    const first = rows[0] as Record<string, unknown>;

    sheet.columns = Object.keys(first).map(key => ({

            header: key,

            key,

            width: 25

        }));

        rows.forEach(row => {

            sheet.addRow(row as Record<string, unknown>);

        });

        sheet.getRow(1).font = {

            bold: true

        };

    }

    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer);

}
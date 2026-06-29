import PDFDocument from "pdfkit";

export default function exportPdf(
    title: string,
    rows: object[]
): Promise<Buffer> {

    return new Promise((resolve) => {

        const doc = new PDFDocument({
            margin: 40
        });

        const buffers: Buffer[] = [];

        doc.on("data", (b) => buffers.push(b));

        doc.on("end", () => {

            resolve(Buffer.concat(buffers));

        });

        doc.fontSize(18).text(title);

        doc.moveDown();

        rows.forEach((row, index) => {

            doc.fontSize(12).text(`${index + 1}`);

            Object.entries(row).forEach(([key, value]) => {

                doc.text(`${key} : ${String(value)}`);

            });

            doc.moveDown();

        });

        doc.end();

    });

}
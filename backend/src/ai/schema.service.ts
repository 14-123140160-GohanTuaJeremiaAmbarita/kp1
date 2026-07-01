import { getPool } from "../config/database";

/**
 * Daftar tabel yang boleh "dilihat" oleh AI dan dijadikan target query.
 * Tambahkan/kurangi di sini saja kalau ada tabel baru — tidak perlu ubah prompt manual.
 */
const ALLOWED_TABLES = ["TD_karyawan", "TD_COMPUTER", "TD_WO", "TD_TICKET"];

/** Deskripsi singkat tiap tabel & relasi join-nya, supaya Gemini paham konteks bisnisnya. */
const TABLE_DESCRIPTIONS: Record<string, string> = {
    TD_karyawan: "Data karyawan PT Voksel Electric Tbk (NRP, nama, departemen, status aktif/resign).",
    TD_COMPUTER: "Inventaris aset komputer/notebook/server beserta pemilik penggunanya.",
    TD_WO: "Riwayat Work Order (WO) perbaikan/permintaan IT.",
    TD_TICKET: "Riwayat tiket helpdesk IT."
};

/** Kolom kunci untuk JOIN antar tabel (semua merujuk ke NRP karyawan). */
const JOIN_HINTS = `
Relasi antar tabel (semuanya terhubung lewat NRP karyawan, walau nama kolomnya berbeda-beda per tabel):
- TD_karyawan.Nrp  <->  TD_COMPUTER.Nrp        (pemilik/pengguna aset)
- TD_karyawan.Nrp  <->  TD_TICKET.NRP          (pelapor tiket)
- TD_karyawan.Nrp  <->  TD_WO.UserC            (user yang minta WO, BUKAN ITPic)
Catatan: penulisan NRP berbeda case di tiap tabel (Nrp / NRP / UserC), tapi SQL Server tidak case-sensitive untuk nama kolom.
`;

interface ColumnInfo {
    TABLE_NAME: string;
    COLUMN_NAME: string;
    DATA_TYPE: string;
}

export class SchemaService {
    private cachedSchemaText: string | null = null;
    private cachedAt = 0;
    private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 menit — cukup untuk hindari query berulang tiap chat, tapi tetap "segar" kalau ada migrasi kolom

    /**
     * Mengembalikan teks skema yang siap disisipkan ke system prompt Gemini.
     * Diambil langsung dari SQL Server (INFORMATION_SCHEMA), bukan hardcode,
     * supaya selalu sinkron dengan struktur database yang sebenarnya.
     */
    async getSchemaText(): Promise<string> {
        const now = Date.now();
        if (this.cachedSchemaText && now - this.cachedAt < this.CACHE_TTL_MS) {
            return this.cachedSchemaText;
        }

        try {
            const pool = await getPool();
            // Ambil SEMUA kolom dari SEMUA tabel/schema dulu (tanpa filter di SQL),
            // lalu filter di JS secara case-insensitive. Ini menghindari masalah
            // collation/format penulisan nama tabel yang berbeda dengan ALLOWED_TABLES.
            const result = await pool.request().query(`
                SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE
                FROM INFORMATION_SCHEMA.COLUMNS
                ORDER BY TABLE_NAME, ORDINAL_POSITION
            `);

            const allColumns = result.recordset as (ColumnInfo & { TABLE_SCHEMA: string })[];

            // Cocokkan nama tabel tanpa peduli besar/kecil huruf
            const normalizedAllowed = ALLOWED_TABLES.map((t) => t.toLowerCase());
            const matchedColumns = allColumns.filter((c) =>
                normalizedAllowed.includes(c.TABLE_NAME.toLowerCase())
            );

            // Diagnostik: cek kalau ada tabel di ALLOWED_TABLES yang ternyata tidak ketemu sama sekali
            const foundTableNames = new Set(matchedColumns.map((c) => c.TABLE_NAME.toLowerCase()));
            const missingTables = ALLOWED_TABLES.filter((t) => !foundTableNames.has(t.toLowerCase()));
            if (missingTables.length > 0) {
                console.error(
                    `[SchemaService] PERINGATAN: Tabel berikut tidak ditemukan di database (cek nama tabel/schema yang benar): ${missingTables.join(", ")}`
                );
                // Bantu debugging: tampilkan nama tabel mirip yang sebenarnya ada
                const allTableNames = [...new Set(allColumns.map((c) => `${c.TABLE_SCHEMA}.${c.TABLE_NAME}`))];
                console.error(`[SchemaService] Tabel yang TERDETEKSI di database: ${allTableNames.join(", ")}`);
            }

            this.cachedSchemaText = this.buildSchemaText(matchedColumns);
            this.cachedAt = now;
            return this.cachedSchemaText;
        } catch (err) {
            console.error("[SchemaService] Gagal mengambil skema dari SQL Server:", err);
            // Fallback: kalau introspeksi gagal (mis. DB belum connect), kembalikan cache lama kalau ada,
            // supaya chatbot tetap bisa jalan alih-alih total error.
            if (this.cachedSchemaText) return this.cachedSchemaText;
            throw new Error("Skema database tidak tersedia dan tidak ada cache sebelumnya.");
        }
    }

    /** Paksa refresh cache (mis. dipanggil manual lewat endpoint admin kalau ada perubahan kolom). */
    invalidateCache() {
        this.cachedSchemaText = null;
        this.cachedAt = 0;
    }

    private buildSchemaText(columns: ColumnInfo[]): string {
        // Kelompokkan berdasarkan nama tabel ASLI dari database (apa adanya, sesuai casing aslinya)
        const grouped: Record<string, string[]> = {};
        for (const col of columns) {
            if (!grouped[col.TABLE_NAME]) grouped[col.TABLE_NAME] = [];
            grouped[col.TABLE_NAME].push(`${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        }

        const sections = Object.keys(grouped).map((tableName) => {
            // Cari deskripsi berdasarkan ALLOWED_TABLES secara case-insensitive
            const matchedKey = Object.keys(TABLE_DESCRIPTIONS).find(
                (k) => k.toLowerCase() === tableName.toLowerCase()
            );
            const desc = matchedKey ? TABLE_DESCRIPTIONS[matchedKey] : "";
            return `Tabel "${tableName}" — ${desc}\n  Kolom: ${grouped[tableName].join(", ")}`;
        });

        return sections.join("\n\n") + "\n" + JOIN_HINTS;
    }
}
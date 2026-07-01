import mssql from "mssql";

/**
 * Daftar kata kunci yang tidak boleh muncul di mana pun dalam query,
 * meskipun query-nya "dimulai" dengan SELECT. Ini proteksi lapis kedua
 * di luar instruksi prompt AI -- kalau AI kebobolan/kena prompt injection,
 * lapisan ini yang mencegah query destruktif benar-benar dieksekusi.
 */
const FORBIDDEN_KEYWORDS = [
    "DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "EXEC", "EXECUTE",
    "TRUNCATE", "CREATE", "GRANT", "REVOKE", "MERGE", "BACKUP", "RESTORE",
    "SHUTDOWN", "DENY", "DBCC",
];

export class SQLService {
    private dbConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER || "localhost",
        database: process.env.DB_DATABASE,
        options: {
            encrypt: process.env.DB_ENCRYPT === "true",
            trustServerCertificate: true,
        },
        // Query yang nyangkut lebih dari 20 detik dianggap bermasalah, jangan sampai
        // menggantung request selamanya dan menghabiskan koneksi di pool.
        requestTimeout: 20000,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000,
        },
    };

    // Singleton connection pool -- dibuat SEKALI saja lalu dipakai ulang terus.
    // Sebelumnya setiap chat masuk membuka koneksi baru tanpa pernah menutupnya,
    // yang lama-lama menghabiskan slot koneksi di SQL Server (connection leak).
    // Catatan: tipe pool sengaja "any" karena versi @types/mssql yang berbeda-beda
    // punya nama export tipe yang tidak konsisten (ConnectionPool vs lainnya).
    private poolPromise: Promise<any> | null = null;

    private async getPool(): Promise<any> {
    if (this.poolPromise) {
        return await this.poolPromise;
    }

    this.poolPromise = new mssql.ConnectionPool(this.dbConfig)
        .connect()
        .then((pool: any) => {
            console.log("[SQL] Connection pool siap digunakan.");

            pool.on("error", (err: any) => {
                console.error("[SQL] Pool error:", err);
                this.poolPromise = null;
            });

            return pool;
        })
        .catch((err: any) => {
            this.poolPromise = null;
            throw err;
        });

    return await this.poolPromise;
}

    /**
     * Validasi keamanan berlapis untuk query hasil generate AI.
     * Mengembalikan pesan error kalau query dianggap tidak aman, atau null kalau aman.
     */
    private validateQuery(rawQuery: string): string | null {
        const query = rawQuery.trim();

        if (!query.toUpperCase().startsWith("SELECT")) {
            return "Query harus diawali dengan SELECT.";
        }

        // Cek multi-statement: pisahkan berdasarkan titik koma, buang bagian kosong.
        // Query sah cuma boleh punya 1 statement (titik koma di akhir masih ditoleransi).
        const statements = query.split(";").map(s => s.trim()).filter(s => s.length > 0);
        if (statements.length > 1) {
            return "Terdeteksi lebih dari satu statement SQL dalam satu query (kemungkinan SQL injection).";
        }

        // Cek keyword berbahaya di mana pun dalam query (bukan cuma di awal).
        const upperQuery = query.toUpperCase();
        for (const keyword of FORBIDDEN_KEYWORDS) {
            const pattern = new RegExp(`\\b${keyword}\\b`, "i");
            if (pattern.test(upperQuery)) {
                return `Query mengandung keyword terlarang: ${keyword}.`;
            }
        }

        // Cek stored procedure system (xp_/sp_) yang bisa dipakai buat hal di luar SELECT biasa.
        if (/\b(xp_|sp_)\w+/i.test(query)) {
            return "Query mencoba memanggil stored procedure, tidak diperbolehkan.";
        }

        // Cek "SELECT ... INTO" -- pola ini dipakai untuk membuat tabel baru dari hasil SELECT,
        // secara teknis bukan DDL eksplisit tapi tetap mengubah struktur database.
        if (/\bSELECT\b[\s\S]+\bINTO\b\s+\w+/i.test(query)) {
            return "Pola 'SELECT ... INTO' tidak diperbolehkan (dapat membuat tabel baru).";
        }

        // Cek indikasi komentar SQL, yang sering dipakai untuk menyembunyikan/memotong instruksi injection.
        if (query.includes("--") || query.includes("/*")) {
            return "Query mengandung komentar SQL, tidak diperbolehkan demi keamanan.";
        }

        return null; // aman
    }

    async execute(aiGeneratedSql: string): Promise<{ type: string; data: any[] }> {
        const validationError = this.validateQuery(aiGeneratedSql);

        if (validationError) {
            console.error(`[SECURITY BLOCKED] ${validationError} | Query: ${aiGeneratedSql}`);
            return { type: "error", data: [] };
        }

        const cleanQuery = aiGeneratedSql.trim();

        try {
            console.log(`[SQL EXECUTE] Menjalankan query ke SQL Server: ${cleanQuery}`);

            const pool = await this.getPool();
            const result = await pool.request().query(cleanQuery);

            return {
                type: "dynamic_result",
                data: result.recordset, // Mengembalikan baris data mentah ke ChatbotService
            };
        } catch (err) {
            console.error("Eksekusi query SQL Server gagal:", err);
            return { type: "error", data: [] };
        }
    }
}
import mssql from "mssql"; 

export class SQLService {
    private dbConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER || "localhost",
        database: process.env.DB_DATABASE,
        options: {
            encrypt: process.env.DB_ENCRYPT === "true", 
            trustServerCertificate: true 
        }
    };

    async execute(aiGeneratedSql: string): Promise<{ type: string; data: any[] }> {
        try {
            const cleanQuery = aiGeneratedSql.trim();
            
            // VALIDASI KEAMANAN: Memastikan query HANYA melakukan SELECT (tidak boleh DROP, DELETE, atau UPDATE)
            if (!cleanQuery.toUpperCase().startsWith("SELECT")) {
                console.error(`[SECURITY BLOCKED] Query tidak aman: ${cleanQuery}`);
                throw new Error("Akses ditolak! Hanya perintah SELECT yang diperbolehkan.");
            }

            console.log(`[SQL EXECUTE] Menjalankan query ke SQL Server: ${cleanQuery}`);
            
            const pool = await mssql.connect(this.dbConfig);
            const result = await pool.request().query(cleanQuery);
            
            return { 
                type: "dynamic_result", 
                data: result.recordset // Mengembalikan baris data mentah ke ChatbotService
            };

        } catch (err) {
            console.error("Eksekusi query SQL Server gagal:", err);
            return { type: "error", data: [] }; 
        }
    }
}
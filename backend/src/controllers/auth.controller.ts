import { Request, Response } from "express";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "super_access_secret_123";

export const login = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const { username, password } = req.body;

        // TODO: Ganti dengan query database sesungguhnya (Bcrypt compare)
        if (username === "admin" && password === "admin123") {
            const userPayload = { 
                id: "1", 
                username: "admin", 
                role: "Admin", 
                department: "IT" 
            };
            
            const accessToken = jwt.sign(userPayload, ACCESS_TOKEN_SECRET, { expiresIn: "8h" });
            
            return res.json({
                message: "Login berhasil",
                token: accessToken,
                user: userPayload
            });
        }

        return res.status(401).json({ message: "Username atau password salah" });
    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan server" });
    }
};
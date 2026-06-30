import { Request, Response, NextFunction } from "express";
import jwt, { VerifyErrors, JwtPayload } from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "super_access_secret_123";

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        username: string;
        role: "Admin" | "IT" | "HRD" | "Manager" | "Employee";
        department?: string;
    };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Token tidak ditemukan, akses ditolak." });
    }

    // Perbaikan error 7006 dengan menambahkan tipe data eksplisit (VerifyErrors & JwtPayload)
    jwt.verify(token, ACCESS_TOKEN_SECRET, (err: VerifyErrors | null, decoded: JwtPayload | string | undefined) => {
        if (err) {
            return res.status(403).json({ message: "Token tidak valid atau kedaluwarsa." });
        }
        req.user = decoded as AuthenticatedRequest["user"];
        next();
    });
}

export function authorizeRoles(...allowedRoles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Anda tidak memiliki izin (Forbidden)." });
        }
        next();
    };
}
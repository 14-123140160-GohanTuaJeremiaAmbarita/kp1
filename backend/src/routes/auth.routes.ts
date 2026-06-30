import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";
import { login } from "../controllers/auth.controller";

const router = Router();

router.post("/login", login);
// Endpoint Chatbot hanya bisa diakses oleh user yang sudah login
router.post("/chat", authenticateToken, (req, res) => {
    // Logika chat masuk ke chatbot.controller
});

// Endpoint data karyawan hanya bisa diakses oleh HRD atau Admin
router.get("/employees", authenticateToken, authorizeRoles("Admin", "HRD"), (req, res) => {
    // Logika mengambil semua data karyawan
});

// Endpoint aset IT hanya bisa diakses oleh IT atau Admin
router.get("/assets", authenticateToken, authorizeRoles("Admin", "IT"), (req, res) => {
    // Logika mengambil data aset perangkat keras
});

export default router;
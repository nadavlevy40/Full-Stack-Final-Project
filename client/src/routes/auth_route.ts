import express from "express";
const router = express.Router();
import authController from "../controllers/auth_controller";

router.post("/register", authController.register);

router.post("/google", authController.googleSignin);

router.post("/login", authController.login);

router.get("/logout", authController.logout);

router.get("/refreshToken", authController.refresh);

export default router;


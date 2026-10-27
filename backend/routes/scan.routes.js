import { Router } from "express";
import { createScan, getScans, getScan, deleteScan, getStats } from "../controllers/scan.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

router.use(authenticate);
router.post("/", createScan);
router.get("/", getScans);
router.get("/stats", getStats);
router.get("/:scanId", getScan);
router.delete("/:scanId", deleteScan);

export default router;

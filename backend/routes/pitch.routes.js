import { Router } from "express";
import { createPitch, getPitches, deletePitch } from "../controllers/pitch.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

router.use(authenticate);
router.post("/", createPitch);
router.get("/", getPitches);
router.delete("/:pitchId", deletePitch);

export default router;

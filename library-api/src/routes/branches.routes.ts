import express from "express";
import { getBranches } from "../controllers/branches.controller.ts";

const router = express.Router();

router.get("/", getBranches);

export default router;

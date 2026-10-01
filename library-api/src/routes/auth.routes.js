import express from "express";
import { login, logout, refreshToken } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", login);

router.get("/test-cookie", (req, res) => {
  console.log(req.cookies);

  console.log(req.get("X-Client-Id"));

  res.set("X-Request-Id", "req-12345");

  res.json({
    accessToken: req.cookies.accessToken,
  });
});

router.post("/logout", logout);
router.post("/refresh", refreshToken);

export default router;

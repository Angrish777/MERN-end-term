import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./utils/db.js";
import authRoutes from "./routes/auth.routes.js";
import scanRoutes from "./routes/scan.routes.js";
import pitchRoutes from "./routes/pitch.routes.js";

const app = express();
const port = process.env.PORT || 8084;

const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true
    })
);
app.use(express.json({ limit: "200kb" }));
app.use(cookieParser());

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/pitches", pitchRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

const bodyErrors = {
    400: "Invalid request body",
    413: "Request body is too large"
};

app.use((err, req, res, next) => {
    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({ success: false, message: err.message });
    }

    const status = bodyErrors[err.status] ? err.status : 500;
    res.status(status).json({
        success: false,
        message: bodyErrors[status] || "Internal server error"
    });
});

connectDB().then(() => {
    app.listen(port, "0.0.0.0", () => {
        console.log(`Server Started at ${port}`);
    });
});

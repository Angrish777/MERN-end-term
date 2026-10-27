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
    "http://localhost:3000",
    process.env.CLIENT_URL
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true
    })
);

app.use(express.json({ limit: "200kb" }));
app.use(cookieParser());

// Database connection middleware for incoming requests
app.use(async (req, res, next) => {
    if (req.path === "/health" || req.path === "/api/health") {
        return next();
    }
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("Database connection error:", err.message);
        return res.status(503).json({
            success: false,
            message: "Database connection failed. Please ensure the dbURL or MONGODB_URI environment variable is configured in Vercel settings.",
            error: err.message
        });
    }
});

// Health check endpoint
app.get(["/health", "/api/health"], (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
});

// Mount routes supporting both /api/* and /* paths
app.use(["/api/auth", "/auth"], authRoutes);
app.use(["/api/scans", "/scans"], scanRoutes);
app.use(["/api/pitches", "/pitches"], pitchRoutes);

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
        message: bodyErrors[status] || err.message || "Internal server error"
    });
});

// In local development, start the HTTP server
if (!process.env.VERCEL) {
    connectDB()
        .then(() => {
            app.listen(port, "0.0.0.0", () => {
                console.log(`Server Started at ${port}`);
            });
        })
        .catch((err) => {
            console.error("Initial DB connection failed:", err.message);
            // Still listen locally so developer can see server is alive
            app.listen(port, "0.0.0.0", () => {
                console.log(`Server Started at ${port} (waiting for valid DB connection)`);
            });
        });
}

export default app;

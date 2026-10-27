import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
const JWT_SECRET = process.env.JWT_SECRET || "develevate-jwt-secret-key-production";

const cookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
};

const publicUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email
});

const issueToken = (res, user) => {
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: "7d"
    });
    res.cookie("token", token, cookieOptions);
};

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }

        if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
            return res.status(400).json({ success: false, message: "Enter a valid email" });
        }

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const existing = await User.findOne({ email: email.trim().toLowerCase() });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        const user = await User.create({
            name: name.trim(),
            email: email.trim(),
            password: await bcrypt.hash(password, 10)
        });

        issueToken(res, user);

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: publicUser(user)
        });
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: "Incorrect email or password"
            });
        }

        issueToken(res, user);

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: publicUser(user)
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};

export const logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        path: "/"
    });
    return res.status(200).json({ success: true, message: "Logged out" });
};

export const me = (req, res) => {
    return res.status(200).json({ success: true, user: publicUser(req.user) });
};

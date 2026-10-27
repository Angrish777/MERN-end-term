import mongoose from "mongoose";
import Scan from "../models/scan.model.js";
import { analyze } from "../utils/analyzer.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createScan = async (req, res) => {
    try {
        const { input, mode } = req.body;

        if (typeof input !== "string" || !input.trim()) {
            return res.status(400).json({ success: false, message: "Input is empty" });
        }

        if (input.trim().length < 10) {
            return res.status(400).json({ success: false, message: "Input is too short to analyze" });
        }

        if (input.length > 50000) {
            return res.status(400).json({ success: false, message: "Input exceeds 50,000 characters" });
        }

        if (mode !== undefined && !["auto", "code", "resume"].includes(mode)) {
            return res.status(400).json({ success: false, message: "Invalid mode" });
        }

        const result = analyze(input, mode);

        const scan = await Scan.create({
            owner: req.user._id,
            title: result.title,
            kind: result.kind,
            score: result.score,
            complexity: result.complexity,
            risk: result.risk,
            issues: result.issues,
            metrics: result.metrics,
            input
        });

        return res.status(201).json({
            success: true,
            message: "Scan completed",
            scan
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getScans = async (req, res) => {
    try {
        const { search, kind, sort } = req.query;
        const page = Number.parseInt(req.query.page, 10) || 1;
        const limit = Math.min(Number.parseInt(req.query.limit, 10) || 8, 50);

        if (page < 1 || limit < 1) {
            return res.status(400).json({ success: false, message: "Invalid pagination" });
        }

        if (kind && !["code", "resume"].includes(kind)) {
            return res.status(400).json({ success: false, message: "Invalid kind" });
        }

        const sorts = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            score_low: { score: 1 },
            score_high: { score: -1 }
        };

        if (sort && !sorts[sort]) {
            return res.status(400).json({ success: false, message: "Invalid sort" });
        }

        const filter = { owner: req.user._id };
        if (kind) filter.kind = kind;
        if (search) filter.title = { $regex: escapeRegex(String(search).slice(0, 60)), $options: "i" };

        const total = await Scan.countDocuments(filter);
        const scans = await Scan.find(filter)
            .select("-input")
            .sort(sorts[sort || "newest"])
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).json({
            success: true,
            total,
            page,
            pages: Math.max(1, Math.ceil(total / limit)),
            scans
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getScan = async (req, res) => {
    try {
        const { scanId } = req.params;

        if (!mongoose.isValidObjectId(scanId)) {
            return res.status(400).json({ success: false, message: "Invalid scan id" });
        }

        const scan = await Scan.findById(scanId);

        if (!scan) {
            return res.status(404).json({ success: false, message: "Scan not found" });
        }

        if (!scan.owner.equals(req.user._id)) {
            return res.status(403).json({ success: false, message: "You cannot view this scan" });
        }

        return res.status(200).json({ success: true, scan });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const deleteScan = async (req, res) => {
    try {
        const { scanId } = req.params;

        if (!mongoose.isValidObjectId(scanId)) {
            return res.status(400).json({ success: false, message: "Invalid scan id" });
        }

        const scan = await Scan.findById(scanId);

        if (!scan) {
            return res.status(404).json({ success: false, message: "Scan not found" });
        }

        if (!scan.owner.equals(req.user._id)) {
            return res.status(403).json({ success: false, message: "You cannot delete this scan" });
        }

        await scan.deleteOne();

        return res.status(200).json({ success: true, message: "Scan deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getStats = async (req, res) => {
    try {
        const [summary] = await Scan.aggregate([
            { $match: { owner: req.user._id } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    average: { $avg: "$score" },
                    best: { $max: "$score" },
                    findings: { $sum: { $size: "$issues" } }
                }
            }
        ]);

        const recent = await Scan.find({ owner: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("score createdAt");

        return res.status(200).json({
            success: true,
            stats: {
                total: summary?.total || 0,
                average: Math.round(summary?.average || 0),
                best: summary?.best || 0,
                findings: summary?.findings || 0,
                recent: recent.reverse()
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

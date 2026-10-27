import mongoose from "mongoose";
import Pitch from "../models/pitch.model.js";
import { buildPitch, buildReadme } from "../utils/pitch.js";

const clean = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export const createPitch = async (req, res) => {
    try {
        const title = clean(req.body.title, 80);
        const tagline = clean(req.body.tagline, 140);
        const audience = clean(req.body.audience, 60);
        const tone = req.body.tone || "pro";

        if (title.length < 2) {
            return res.status(400).json({ success: false, message: "Title must be at least 2 characters" });
        }

        if (!["pro", "bold", "min"].includes(tone)) {
            return res.status(400).json({ success: false, message: "Invalid tone" });
        }

        const rawFeatures = Array.isArray(req.body.features) ? req.body.features : [];
        const features = [...new Set(rawFeatures.map((f) => clean(f, 200)).filter(Boolean))].slice(0, 12);

        if (features.length < 2) {
            return res.status(400).json({ success: false, message: "Add at least 2 features" });
        }

        const rawStack = Array.isArray(req.body.stack) ? req.body.stack : [];
        const stack = rawStack.map((s) => clean(s, 30)).filter(Boolean).slice(0, 10);

        const details = { title, tagline, audience, tone, features, stack };
        const pitch = buildPitch(details);

        const saved = await Pitch.create({
            ...details,
            owner: req.user._id,
            readme: buildReadme(details),
            pitch: pitch.text,
            words: pitch.words
        });

        return res.status(201).json({ success: true, message: "Pitch generated", pitch: saved });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getPitches = async (req, res) => {
    try {
        const pitches = await Pitch.find({ owner: req.user._id }).sort({ createdAt: -1 }).limit(20);
        return res.status(200).json({ success: true, pitches });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const deletePitch = async (req, res) => {
    try {
        const { pitchId } = req.params;

        if (!mongoose.isValidObjectId(pitchId)) {
            return res.status(400).json({ success: false, message: "Invalid pitch id" });
        }

        const pitch = await Pitch.findById(pitchId);

        if (!pitch) {
            return res.status(404).json({ success: false, message: "Pitch not found" });
        }

        if (!pitch.owner.equals(req.user._id)) {
            return res.status(403).json({ success: false, message: "You cannot delete this pitch" });
        }

        await pitch.deleteOne();

        return res.status(200).json({ success: true, message: "Pitch deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

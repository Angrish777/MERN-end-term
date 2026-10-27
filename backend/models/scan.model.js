import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
    {
        cat: String,
        sev: String,
        line: Number,
        msg: String,
        fix: String,
        snip: String
    },
    { _id: false }
);

const scanSchema = new mongoose.Schema(
    {
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        title: { type: String, required: true },
        kind: { type: String, enum: ["code", "resume"], required: true },
        score: { type: Number, required: true },
        complexity: { type: String, required: true },
        risk: { type: String, required: true },
        issues: [issueSchema],
        metrics: { lines: Number, chars: Number, cc: Number, depth: Number, ms: Number },
        input: { type: String, required: true, maxlength: 50000 }
    },
    { timestamps: true }
);

export default mongoose.model("Scan", scanSchema);

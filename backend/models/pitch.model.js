import mongoose from "mongoose";

const pitchSchema = new mongoose.Schema(
    {
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        title: { type: String, required: true },
        tagline: String,
        features: [String],
        stack: [String],
        audience: String,
        tone: { type: String, enum: ["pro", "bold", "min"], default: "pro" },
        readme: { type: String, required: true },
        pitch: { type: String, required: true },
        words: Number
    },
    { timestamps: true }
);

export default mongoose.model("Pitch", pitchSchema);

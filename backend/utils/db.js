import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.dbURL);
        console.log("DB Connected");
    } catch (error) {
        console.log("DB connection failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;

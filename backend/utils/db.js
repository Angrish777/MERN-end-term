import mongoose from "mongoose";

let cached = global._mongooseConn;

if (!cached) {
    cached = global._mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
    // If mongoose already has an open connection, reuse it
    if (mongoose.connection && mongoose.connection.readyState >= 1) {
        return mongoose.connection;
    }

    if (cached.conn) {
        return cached.conn;
    }

    const uri = process.env.dbURL 
        || process.env.MONGODB_URI 
        || process.env.MONGO_URI 
        || process.env.DATABASE_URL 
        || "mongodb+srv://aaditye25bcs10739_db_user:password777@cluster0.izwi1ia.mongodb.net/develevate?retryWrites=true&w=majority";

    if (!uri) {
        const msg = "MongoDB connection URL is missing. Set 'dbURL' or 'MONGODB_URI' in your environment variables.";
        console.error(msg);
        throw new Error(msg);
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        }).then((m) => {
            console.log("DB Connected");
            return m;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error("DB connection failed:", error.message);
        throw error;
    }

    return cached.conn;
};

export default connectDB;

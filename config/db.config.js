import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

const baseUrl = process.env.MONGODB || 'mongodb://localhost:27017/chatApp';


export const connectToDatabase = async () => {
    try {
        await mongoose.connect(baseUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("MongoDB connected using mongoose");
    } catch (err) {
        console.log(err);
    }
}
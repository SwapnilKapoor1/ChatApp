import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: String,
    socketId: {
        type: String,
        default: null // Optionally, you can set a default value
    }
});

export const UserModel = mongoose.model('Users', userSchema);
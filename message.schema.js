import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    username: String,
    text: String,
    date: String
});

export const messageModel = mongoose.model('Message', messageSchema);



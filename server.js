import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { messageModel } from './message.schema.js';
import { connectToDatabase } from './db.config.js';
import { UserModel } from './users.schema.js';

export const app = express();
app.use(cors());

export const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("Connection made.");

    socket.on("newUserJoined", async (data) => {
        try{
        const user = new UserModel({username:data,socketId:socket.id});
        await user.save();
        // Broadcast a message to all other users in the same room
        socket.broadcast.emit("message", {
            username:"Chatbot",
            msg: `${data} has joined the room.`
        });
        const previousMessages = await messageModel.find().sort({ timestamp: 1 }); // Sort messages by timestamp in ascending order
        // Emit previous messages to the newly joined user
        socket.emit("prevChats", previousMessages);
        
        let activeUser = await UserModel.find({});
        const usernames = activeUser.map(user => user.username)
        io.emit("joineduserList", usernames);
        }catch(err){
            console.log("issue adding user:",err);
        }
        });

    socket.on("new_message_received", async (data) => {
        try{
        const message = new messageModel({
            username: data.PERSON_NAME,
            text: data.msgText,
            date: data.date
        })

        await message.save();

        // Broadcast the received message to all users
        socket.broadcast.emit("message", {
            username: data.PERSON_NAME,
            msg: data.msgText
        });
    }catch(Err){
        console.log("error saving message:",Err);
    }
    });

    socket.on("userTyping",(userName)=>{
        socket.broadcast.emit("userTypingBroadcast",userName);
    });
    socket.on("userTypingCompleted",(userName)=>{
        socket.broadcast.emit("userTypingCompletedBroadcast",userName);
    });

    let isDisconnected = false;

socket.on("disconnect", async () => {
    try {
        // Mark the user as disconnected
        isDisconnected = true;

        // Wait for a certain period to allow the user to reconnect
        setTimeout(async () => {
            if (isDisconnected) {
                // Get the username of the disconnected user
                const disconnectedUser = await UserModel.findOne({ socketId: socket.id });
    
                if (disconnectedUser) {
                    // Remove the disconnected user from the database
                    await UserModel.deleteOne({ _id: disconnectedUser._id });
                    console.log(`User ${disconnectedUser.username} disconnected and removed from the database.`);
                } else {
                    console.log(`Disconnected user not found in the database.`);
                }
    
                // Optionally, emit an updated user list to all clients after removal
                const activeUsers = await UserModel.find({}).select('username');
                const usernames = activeUsers.map(user => user.username)
                io.emit("joineduserList", usernames);
            }
        }, 5000); // Adjust the timeout period as needed (e.g., 5000 milliseconds)
    } catch (error) {
        console.error("Error while disconnecting:", error);
    }
});

socket.on("connect", () => {
    // When the user reconnects, cancel the timeout
    isDisconnected = false;
});

    
});

server.listen(3000, () => {
    console.log("Listening on port 3000");
    connectToDatabase();
});

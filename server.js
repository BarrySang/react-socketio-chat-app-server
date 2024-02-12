// test data
let onlineUsers = [
    // {1: 'user1'},
    // {2: 'user2'},
    // {3: 'user3'},
    // {4: 'user4'},
    // {5: 'user5'},
]

// dependencies
const io = require('socket.io')(4000, {
    cors: {
        origin: ['http://localhost:3000']
    }
})

// array to store conversations
let conversations = []

io.on('connection', socket => {
    // add user to list of online users
    socket.on('user-info', userInfo => {
        onlineUsers.push({[userInfo.id]: userInfo.username})
    
        // send list of online users to client
        io.emit('online-users', onlineUsers)    

        // send conversations to the connected clients
        io.emit('conversations', conversations)
    })

    // delete a user from onlineUsers array when they disconnect
    socket.on('disconnect', () => {
        const newOnlineUsers = onlineUsers.filter(onlineUser => Object.keys(onlineUser)[0] !== socket.id)

        onlineUsers = newOnlineUsers

        // send updated list of online users to all clients
        io.emit('online-users', onlineUsers)
    })

    // emit message on 'send-message' event
    socket.on('send-message', (messageData, socketId) => {
        console.log(messageData)
        /**
         * store the messages sent between the clients
         */
        // check if such a conversation already exists
        let conversationExists = conversations.find(
            conversation => (conversation.sender === socket.id && conversation.recipient === socketId) || (conversation.sender === socketId && conversation.recipient === socket.id)
        )
        /**
         * TODO - each messages has the same id of one, ensure each message has a unique id
         */
        // if the conversation exists, add the message to it
        if (conversationExists) {

            // console.log('conversationExists: ', conversationExists)
            conversationExists.messages.push(
                {
                    id: conversationExists.length ? conversationExists[conversationExists.length - 1].id + 1 :
                        1,
                    sender: socket.id,
                    message: messageData.message
                }
            )
            console.log(conversationExists)
        } else {
            // create a new conversation object and add it to the conversations array if the conversation does not exist
            // create conversation object
            const conversation = {
                id: conversations.length ? conversations[conversations.length - 1].id + 1 :
                1,
                sender: socket.id,
                recipient: socketId,
                messages: [
                    {
                        id: 1,
                        sender: socket.id,
                        message: messageData.message
                    }
                ]
            }

            // push the conversation to the conversations array
            conversations.push(conversation)
        }
        
        // io.emit('receive-message', message)
        socket.to(socketId).emit('receive-message', messageData)
        // console.log(message)
        // console.log('conversations: ', conversations)

        // send conversations to client
        io.emit('conversations', conversations)
    })
})
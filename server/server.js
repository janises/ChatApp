const express = require('express')
    , http = require('http')
    , sockets = require('socket.io')
    , bodyParser = require('body-parser')
    , massive = require('massive')
    , app = express()
    , server = http.createServer(app)
    , io = sockets(server)
    , port = 3001

app.use(bodyParser.json());


//save messages to server and emit the messages array to all connected users
let messages = [];

let users = [];

//make a heartbeat setInterval to send out the messages array every 33 milliseconds
setInterval(heartbeat, 33);
  function heartbeat(){
    io.sockets.emit('heartbeat', {users, messages})
}



//io.on('connection') listens for any user who connects to the server
io.on('connection', (socket)=> {
      console.log('A user has connected', socket.id);
        socket.on('addUser', (data)=> {
          let found = false;
            //if the socket id is the same as a socket id in the users array, don't push it
            for(var i = 0; i < users.length; i++) {
              for(var prop in users[i]) {
                  if(users[i][prop] === data.socketId) {
                    found = true;
                  }

              }
            }

          //if the user name is not taken, push the user object to the users array
          !found ? users.push({name: data.name, socketId: data.socketId })
          : null

          socket.username = data.name;

          console.log(socket)

          //send out the 'addUsers' keyword so the client can listen for it
          io.sockets.emit('addUsers', users)
        })


    socket.on('sendMessage', (data) => {
        let username;
        users.map(user => {
          if(user.socketId == data.socketId) {
            username = user.name;
          }
        })
        messages.push({username: username, message: data.message});
        io.sockets.emit('message', messages)
    })

    socket.on('private message', data=> {
      //loop through users to match username, then match fromUser socket.id to socketId to get name, then emit to that user the message object and set the state to privateMessages array.
      let toUser, fromUser;
      users.map(user=> {
        if(data.toUser.toLowerCase() == user.name.toLowerCase() ){
          toUser = {name: user.name, socketId: user.socketId}
        }
        if(data.fromUser == user.socketId){
          fromUser = user.name
        }
      })
      socket.to(toUser && toUser.socketId).emit('new private message', {fromUser, message: data.message})
    })

    //broadcast to other users when a user is typing
    socket.on('typing', (data)=> {
      let username;
      users.map(user=> {
        if(data == user.socketId) {
          username = user.name
        }
      })
      socket.broadcast.emit('user typing', `${username} is typing...` )
    })

    socket.on('stopped typing', data => {
      let username;
      users.map(user=> {
        if(data == user.socketId) {
          username = user.name
        }
      })
      socket.broadcast.emit('user typing', '')
    })

    //reserved keyword 'disconnect', socket listens for anyone who disconnects with server
    socket.on('disconnect', ()=> {
        console.log('A user has disconnected', socket.id);

        //loop through users array and splice out the user that disconnected by socket id
        for(var i = 0; i < users.length; i++){
            if(users[i].socketId == socket.id) {
              users.splice(i, 1);
            }

        }
    });
});

server.listen(port, ()=> {
    console.log('listening on port ' + port);
});

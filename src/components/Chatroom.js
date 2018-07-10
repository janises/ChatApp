import React, { Component } from 'react';
import openSocket from 'socket.io-client';
import $ from 'jquery';
import './App.css';
const socket = openSocket('http://localhost:3001');


export default class Chatroom extends Component {
  constructor() {
      super();
      this.state={
        messages: [],
        newMessage:'',
        users: [],
        newUser: '',
        userTyping: '',
        isPrivateMessage: false,
        isUserName: false,
        privateUser: '',
        privateMessage: '',
        privateMessages: [],
      }
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
      this.joinChatroom = this.joinChatroom.bind(this);
      this.openPrivateMessageModal = this.openPrivateMessageModal.bind(this);
      this.closePrivateMessageModal = this.closePrivateMessageModal.bind(this);
      this.sendPrivateMessage = this.sendPrivateMessage.bind(this);
  } 

componentDidMount(){
//listens for the heartbeat from the server. setState to update the array of users to render
  socket.on('heartbeat', (data)=> {
    this.setState({
      users: data.users,
      messages: data.messages
    })
  })

  socket.on('addUsers', users => {
    this.setState({
      users
    })
  })

  socket.on('message', messages => {
    this.setState({
      messages,
      userTyping: ''
    })
  })

  socket.on('user typing', data => {
    this.setState({
      userTyping: data
    })
  })

  socket.on('new private message', data => {
    this.setState({
      privateMessages: [...this.state.privateMessages, data]
    })
  })

}

handleChange(e, input) {
  let val = e.target.value;
  switch (input) {
    case ('message') :
      this.setState({ newMessage: val });
      val.length > 0 ? socket.emit('typing', socket.id) : socket.emit('stopped typing', socket.id);
      break;
    case ('name') :
      this.setState({ newUser: val });
      break;
    case ('privateUser') :
      this.setState({ privateUser: val });
      break;
    case ('privateMessage') :
      this.setState({ privateMessage: val });
      break;
    default :
      break;
  }
}

joinChatroom(e) {
    e.preventDefault();
    // sends user object to the server
    socket.emit('addUser', { name: this.state.newUser, socketId: socket.id })
    this.setState({
      newUser: '',
      isUserName: true
    })
}

handleSubmit(e){
  e.preventDefault();
  socket.emit('sendMessage', {message: this.state.newMessage, socketId: socket.id});
  this.setState({
    newMessage: '' 
  });
  // scroll to the newest message on submit
  $('.chat-window').scrollTop($('.chat-window')[0].scrollHeight);
}

sendPrivateMessage(e){
  e.preventDefault();
  socket.emit('private message', {toUser: this.state.privateUser, fromUser: socket.id, message: this.state.privateMessage});
  this.setState({
    privateMessage: '',
    privateUser: '',
    isPrivateMessage: false
  })
}

openPrivateMessageModal(){
  this.setState({
    isPrivateMessage: true
  })
}

closePrivateMessageModal(){
  this.setState({
    isPrivateMessage: false
  })
}


  render() {
    let {users, messages, newMessage, newUser, privateMessages, userTyping, isUserName, privateUser, privateMessage} = this.state;

    return (
      <div id="Chatroom">
          <div id="join-chat">

          <h1 id="title">Chatroom</h1>
            {
              !isUserName ? 
            <form className="join-chatroom-form" onSubmit={this.joinChatroom}>
                <input value={newUser} onChange={(e, input) => this.handleChange(e, "name")} placeholder="name"/>
                <input type="submit" value="Join"/>
            </form>
              : null
            }
          <div className="users-in-chatroom">
            <ul>
              {
                users && users[0] ? (
                  users.map((user, index)=> {
                    if(user.socketId === socket.id) {
                      return <li key={index} style={{fontWeight: "bold", textDecoration: 'underline'}}>{user.name}</li>
                    } else {
                      return <li key={index}>{user.name}</li>
                    }
                  })
                ) : null
              }
            </ul>
          </div> {/* end of .users-in-chatroom */}
          </div> { /* end of #join-chat */ }
        <div className="chat-window">

          <div id='message-window'>
          <ul>

          { messages.length > 0 ? 
            (
              messages.map((message, index)=> {
                return <li className="message" key={index}> {message.username}: {message.message}</li>
              })
            ) : null
          }

          {/* private messages in the message window */}
          {privateMessages ? (
            privateMessages.map((message, index)=> {
              return <li key={index} className='private-message'> {message.fromUser}: {message.message}</li>
            })
          ): null}
          <p>{userTyping}</p>
          </ul>

          </div> {/* end of #message-window */}


        </div> {/*end of .chat-window*/}

          <div id="submit-messages">
          <form onSubmit={this.handleSubmit}>
            <input value={newMessage} onChange={(e)=> this.handleChange(e, 'message')} placeholder="new message" />
            <input disabled={ newMessage.length < 1 } type="submit" value="Send To All"/>
          </form>
          <button onClick={()=> this.openPrivateMessageModal()}> Send Private Message</button>

          </div>

        <div className="private-messages">

          {/* check for private message flag, if it's true, open a modal that allows you to send a message to the user you want to */}
          {
            this.state.isPrivateMessage ? (
              <div className="private-message-modal">
                <form onSubmit={this.sendPrivateMessage}>
                  <input onChange={(e, input)=> this.handleChange(e, 'privateUser')} type='text' value={privateUser} placeholder="send to user"/>
                  <input onChange={(e, input)=> this.handleChange(e, 'privateMessage')} type='text' value={privateMessage} placeholder="your private message"/>
                  <input type='submit' value="Send"/>
                </form>
                <button onClick={()=>this.closePrivateMessageModal()}> Cancel </button>
              </div>
            ) : null
          }

        </div> {/*end of .private-messages*/}

      </div> // end of #Chatroom
    );
  }
}

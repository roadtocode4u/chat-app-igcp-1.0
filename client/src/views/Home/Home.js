import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import "./Home.css";

const socket = io('http://localhost:5002');

function Home() {
  const [message, setMessage] = useState();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState();
  const [currentUser, setCurrentUser] = useState();

  const loadUsers = async () => {
    try {
      const { data } = await axios.get('/users');
      setUsers(data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const loadCurrentUser = () => {
    setCurrentUser(JSON.parse(localStorage.getItem('user')));
  }

  const findFullName = (id) => {
    return users.find((user) => user._id === id)?.fullName;
  }

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  /*
    {
      sender: 'sender',
      receiver: 'receiver',
      message: 'message',
      timestamp: 'timestamp',
    }
  */

  socket.on('message', (data) => {
    if (data?.receiver === currentUser?._id || data?.sender === currentUser?._id) {
      setMessages([...messages, data])
    }
  });

  const readableTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes()}`;
  }


  return (
    <div>
      <h1>Chat App (User-{JSON.parse(localStorage.getItem('user')).fullName})</h1>

      <select
        className='form-control'
        onChange={(e) => {
          const selectedUser = users.find((user) => user._id === e.target.value);
          setSelectedUser(selectedUser);
        }}>
        <option value=''>Select user</option>
        {
          users.map((user) => (
            <option key={user._id} value={user._id}>{user.fullName}</option>
          ))
        }
      </select>

      {
        messages.filter((message) => message.sender === selectedUser?._id || message.receiver === selectedUser?._id || !selectedUser?._id)
          .map((message) => (
            <div key={message.timestamp}
              className={`chatbox ${currentUser?._id === message?.sender ? 'chatbox-sent' : 'chatbox-received'}`}>

              <p className='user-name'>{findFullName(message?.sender)} ({readableTimestamp(message.timestamp)})</p>
              <p className='message-text'>{message.message}</p>
            </div>
          ))
      }

      <input type="text" placeholder="Enter message"
        onChange={(e) => setMessage(e.target.value)} value={message} />


      <button onClick={() => {
        socket.emit('message', {
          sender: JSON.parse(localStorage.getItem('user'))._id,
          receiver: selectedUser._id,
          message,
          timestamp: new Date().toISOString(),
        });
        setMessage('');
      }}>Send Message</button>
    </div>
  )
}

export default Home

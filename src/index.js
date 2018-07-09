import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Chatroom from './components/Chatroom';
import {Provider} from 'react-redux';
import store from './store';


ReactDOM.render(
<Provider store={store}>
    <Chatroom />
</Provider>
, document.getElementById('root'));


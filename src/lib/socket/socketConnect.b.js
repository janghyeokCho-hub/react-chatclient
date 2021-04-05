import socketio from 'socket.io-client';
import Config from '@/config/config';

const EVENT_SERVER = Config.ServerURL.EVENT;

let socketInstance;

class Socket {
  constructor(url, { token, accessid }, events, connectCallback, disconnectCallback) {
    // 이미 socketInstance가 존재한다면 기존 socket은 끊고 새 socket을 만들어서 return 함
    if (socketInstance) return socketInstance;
    this.socket = null;
    this.url = url;
    this.token = token;
    this.accessid = accessid;
    this.events = events;
    this.connectCallback = connectCallback;
    this.disconnectCallback = disconnectCallback;
    socketInstance = this;
  }

  connect = () => {
    // connect가 호출되었으나 연결되어있는경우 먼저 disconnect 진행
    if (this.socket && this.socket.disconnected === false) {
      if (this.socket.hasListeners('disconnect')) this.socket.off('disconnect');
      this.socket.close();
      this.socket = null;
    } else {
      this.socket = null;
    }

    console.log('connection');

    this.socket = socketio(this.url, {
      forceNew: true, // 연결 끊어지면 새로운 연결 생성
      transports: ['websocket'],
      reconnection: false,
    });

    this.socket.on('message', data => {
      if (data.result === 'success') {
        console.log('token auth :: success');
        this.connectCallback(data);
        for (let [key, value] of Object.entries(this.events)) {
          if (this.socket.hasListeners(key)) this.socket.off(key);

          this.socket.on(key, value);
        }
      } else {
        console.log('token auth :: fail');
        // token 인증 실패
        // TODO: 처리 필요
      }
    });
    this.socket.on('connect', () => {
      // event server subscribe
      console.log('token auth :: send');
      this.socket.emit('message', {
        token: this.token,
        accessid: this.accessid
      });
    });

    this.socket.on('connect_error', e => {
      console.dir(e);
      console.log('socket connect_error event :: force new connect');
    });

    this.socket.on('connect_timeout', () => {
      console.log('socket connect_error event :: force new connect');
    });

    this.socket.on('error', () => {
      console.log('socket error event :: force new connect');
    });

    this.socket.on('disconnect', this.disconnectCallback);

    return this.socket;
  };

  getSocket = () => {
    return this.socket;
  };

  close = () => {
    if (this.socket.hasListeners('disconnect')) this.socket.off('disconnect');
    this.socket.close();
    socketInstance = null;
  };
}

export const socketConnect = (
  {
    token,
    accessid
  },
  events,
  connectCallback,
  disconnectCallback,
) => {
  const connection = new Socket(
    EVENT_SERVER,
    {
      token,
      accessid,
    },
    events,
    connectCallback,
    disconnectCallback,
  );
  return connection.connect();
};

export const getSocket = () => {
  if (socketInstance) return socketInstance.getSocket();
  else return null;
};

export const closeSocket = logout => {
  if (socketInstance) {
    const connection = getSocket();

    if (!connection.disconnected) {
      if (logout) {
        // logout시 disconnect option 해제
        if (connection.hasListeners('disconnect')) connection.off('disconnect');
      }
      connection.close();
    }
    socketInstance = null;
  }
};

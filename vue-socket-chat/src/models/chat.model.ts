export interface IMessage {
  content: {
    messageText: string,
    time: Date,
    fromUser: {userId: string, userName: string}
  },
  fromSelf?: boolean
}

export interface IUser {
  userId: string,
  userName: string,
  roleName: string,
  connected?: boolean,
  messages?: IMessage[],
  self?: boolean,
  hasNewMessages?: string
}

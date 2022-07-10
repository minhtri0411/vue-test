export interface IMessage {
  content: {
    messageText: string,
    time: Date,
    fromUserId: string
  }
}

export interface IUser {
  userId: string,
  userName: string,
  roleName: string,
  isActive?: boolean,
  messagesLog?: [IMessage],
  self?: boolean,
  socketId?: string
}

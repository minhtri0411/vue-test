<template>
    <template v-if="!joined">
        <span class="p-input-icon-left">
            <i class="pi pi-arrow-circle-right" />
            <InputText type="text" placeholder="Enter your userId" v-model="userAuthor" @keyup.enter="login()"/>
            <Button label="Login" icon="pi pi-send" iconPos="right" @click="login()" />
        </span>
    </template>

    <br/>
    
    <template v-if="joined">
        <div class="user__profile">
            <Avatar class="user__avatar" shape="circle" size="large" :label="currentUser?.userName[0]" />
            <div class="user__title">Hello <span>{{currentUser?.userName}}</span></div>
            <!-- <span class="user__status" :class="{'user__status--active': currentUser?.connected}"></span> -->
        </div>
        
        <div class="chat-room__wrap">
            <template v-for="user in usersConnected" :key="user.userId">
                <RoomChat v-if="currentUser?.userId !== user.userId"
                    :currentUser="currentUser"
                    :userContact="user"
                    @sendMessage="sendMessage">
                </RoomChat>
            </template>
        </div>


        <br/>
        <div class="waiting" v-if="!usersConnected || !usersConnected?.length || usersConnected?.length < 2">
            Nobody here
        </div>
        <template v-if="usersConnected && usersConnected.length">
            <strong>User connected:</strong>
            <ul>
                <li v-for="user in usersConnected" :key="user.userId">
                    <span :style="{color: user.connected ? 'green' : 'red'}">
                        {{user.userName}} - {{user.connected ? 'Online' : 'Offline'}}
                        {{socket?.userId === user.userId ? '- It\'s you' : ''}}
                    </span>
                </li>
            </ul>
        </template>
    </template>

    
    
</template>

<script setup lang="ts">
    import { ref, onUnmounted, nextTick } from 'vue';
    import io from "socket.io-client";
    import type { IMessage, IUser } from "../../models/chat.model";
    import RoomChat from './RoomChat.vue';

    const userAuthor = ref<string>();
    const currentUser = ref<IUser>();
    const socket = io("http://172.16.1.45:3300/", { autoConnect: false });
    const joined = ref(false)

    const selectedChannel = ref();
    const channels = ref([
            {name: 'Channel 01', code: 'CHANNEL01'},
            {name: 'Channel 02', code: 'CHANNEL02'},
            {name: 'Channel 03', code: 'CHANNEL03'},
            {name: 'Channel 04', code: 'CHANNEL04'},
            {name: 'Channel 05', code: 'CHANNEL05'}
        ]);

    const usersContact = ref<IUser[]>([
        {
            userId: '111',
            userName: "Kenny Jung",
            roleName: 'Liner Planner'
        },
        {
            userId: '222',
            userName: "Jason Lim",
            roleName: 'Terminal Planner'
        },
        {
            userId: '333',
            userName: "Tom Phillip",
            roleName: 'Ship\'s Captain'
        },
        {
            userId: '444',
            userName: "IU",
            roleName: 'Port Agent'
        }
    ]);
    const usersConnected = ref<any[]>([]);

    // start setup socket
    const initReactiveProperties = (user) => {
        user.messages = [];
        user.hasNewMessages = false;
    };
    
    const sessionChat = localStorage.getItem("sessionChat");
    if (sessionChat) {
        const sessionTemp = JSON.parse(sessionChat);
        joined.value = true;
        socket.auth = {
            sessionId: sessionTemp.sessionId
        };
        socket.connect();
    }
    
    socket.on("session", ({ sessionId, userId, userName }) => {
        // attach the session ID to the next reconnection attempts
        socket.auth = { sessionId };
        // store it in the localStorage
        localStorage.setItem("sessionChat", JSON.stringify({sessionId, userName}));
        // save the ID of the user
        socket.userId = userId;
        currentUser.value = {
            userId: userId,
            userName: userName,
            roleName: 'N/A',
        }
    });

    socket.on("connect_error", (err) => {
        debugger;
        if (err.message === "invalid user") {
            joined.value = false;
            selectedChannel.value = null;
            console.error('invalid user')
        }
    });

    // *****************************
    socket.on("connect", () => {
        usersConnected.value.forEach((user) => {
            if (user.self) {
                user.activated = true;
            }
        });
    });

    socket.on("disconnect", () => {
        usersConnected.value.forEach((user) => {
            if (user.self) {
                user.activated = false;
            }
        });
    });

    socket.on("users", (users) => {
        console.log('user: ', users);
        users.forEach((user) => {
            for (let i = 0; i < usersConnected.value.length; i++) {
                const existingUser = usersConnected.value[i];
                if (existingUser.userId === user.userId) {
                    existingUser.connected = user.connected;
                    return;
                }
            }
            user.self = user.userId === socket.userId;
            initReactiveProperties(user);
            usersConnected.value.push(user);
        });

        // put the current user first, and sort by username
        usersConnected.value.sort((a, b) => {
            if (a.self) return -1;
            if (b.self) return 1;
            if (a.userName < b.userName) return -1;
            return a.userName > b.userName ? 1 : 0;
        });
    });

    socket.on("user connected", (user) => {
        for (let i = 0; i < usersConnected.value.length; i++) {
            const existingUser = usersConnected.value[i];
            if (existingUser.userId === user.userId) {
                existingUser.connected = true;
                return;
            }
        }
        initReactiveProperties(user);
        usersConnected.value.push(user);
    });
    
    socket.on("message:private", ({ content, from, to }) => {
        console.log('content: ', content)
        console.log('from: ', from)
        console.log('to: ', to)
        const fromSelf = socket.userId === from;
        for (let i = 0; i < usersConnected.value.length; i++) {
            const user = usersConnected.value[i];
            if (user.userId === (fromSelf ? to : from)) {
                user.messages.push({    
                    content,
                    fromSelf,
                });
                // if (user !== selectedUser) {
                //     user.hasNewMessages = true;
                // }
                break;
            }  
        }
    });

    socket.on("user disconnected", (id) => {
      for (let i = 0; i < usersConnected.value.length; i++) {
        const user = usersConnected.value[i];
        if (user.userId === id) {
            user.connected = false;
          break;
        }
      }
    });
    // end setup socket

    onUnmounted(() => {
        socket.off("connect_error");

        socket.off("connect");
        socket.off("disconnect");
        socket.off("users");
        socket.off("user connected");
        socket.off("user disconnected");
        socket.off("private message");
    })

    const login = () =>{
        socket.auth = { userName: userAuthor.value }
        socket.connect();
        joined.value = true;
    }

    const sendMessage = (selectedUser: IUser, typingMessage: string) => {
      const message: any = {
            messageText: typingMessage,
            time: new Date().getTime(),
            fromUser: {
                userId: currentUser.value?.userId,
                userName: currentUser.value?.userName
            }
        };

        for (let i = 0; i < usersConnected.value.length; i++) {
            const user = usersConnected.value[i];
            if (user.userId === selectedUser.userId) {
                user.messages.push({
                    content: message,
                    fromSelf: true,
                });
                break;
            }
        }

        socket.emit("message:private", {
            content: message,
            to: selectedUser.userId,
        });
    }
</script>

<style lang="scss">
.user {
    &__profile {
        margin-bottom: 20px;
        display: flex;
        flex-direction: row-reverse;
        align-items: center;
        gap: 10px;
    }
    
    &__avatar {
        text-transform: uppercase;
    }

    &__title span {
        font-weight: 600;
        text-transform: capitalize;
    }
}

.chat-room {
    width: 500px;
    box-shadow: 1px 1px 5px #b5b5b5;
    padding: 15px;
    border-radius: 4px;

    &__wrap {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 30px 20px;
    }
}

.room-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.messages-list {
    border: 1px solid #ccc;
    padding: 15px;
    border-radius: 4px;
    min-height: 100px;
    max-height: 300px;
    overflow-y: auto;
}

.message-box {
    display: flex;
    align-items: flex-start;
    margin-bottom: 10px;
    gap: 10px;

    &__info {
        display: flex;
        flex-direction: column;
    }

    &__short-time {
        font-size: 11px;
        text-align: center;
    }

    &__wrap-text {
        width: 100%;
    }

    &__text {
        box-sizing: border-box;
        background-color: #d1d7dd;
        padding: 10px;
        border-radius: 4px;
        max-width: 75%;
        display: inline-block;
    }

    &--user {
        flex-direction: row-reverse;

        .message-box {
            &__text {
                background-color: #6ec2d387;
            }
        }
    }
}

.room-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 5px;
    gap: 5px;
}
</style>

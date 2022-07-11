<template>
    <template v-if="!joined">
        <span class="p-input-icon-left">
            <i class="pi pi-arrow-circle-right" />
            <InputText type="text" placeholder="Enter your userId" v-model="userAuthor"/>
            <Button label="send" icon="pi pi-send" iconPos="right" @click="login()" />
        </span>
    </template>

    <Dropdown v-if="joined" v-model="selectedChannel" :options="channels" optionLabel="name" optionValue="code" placeholder="Select a Channel" />
    <br/>
    
    <template v-if="joined && selectedChannel">
        <!-- <label>Hello {{currentUser?.userName}}/ {{currentUser?.roleName}}</label>
        <template v-for="user in usersContact" :key="user.userId">
            <RoomChat v-if="currentUser?.userId !== user.userId"
                :currentUser="currentUser"
                :userContact="user"
                @sendMessage="sendMessage">
            </RoomChat>
        </template> -->

        <label>Hello {{currentUser?.userName}}/ {{currentUser?.roleName}}</label>
        <template v-for="user in usersConnected" :key="user.userId">
            <RoomChat v-if="currentUser?.userId !== user.userId"
                :currentUser="currentUser"
                :userContact="user"
                @sendMessage="sendMessage">
            </RoomChat>
        </template>
    </template>

    <br/>
    <strong>User connected:</strong>
    <ul>
        <li v-for="user in usersConnected" :key="user.userId">
            <span :style="{color: user.connected ? 'green' : 'red'}">
                {{user.userName}} - {{user.connected ? 'Online' : 'Offline'}}
            </span>
        </li>
    </ul>
</template>

<script setup lang="ts">
    import { defineProps, reactive, ref } from 'vue';
    import io from "socket.io-client";
    import type { IMessage, IUser } from "../../models/chat.model";
    import RoomChat from './RoomChat.vue';
    import { onUnmounted } from 'vue';

 
    const userAuthor = ref<string>();
    const currentUser = ref<IUser>();
    const socket = io("http://localhost:3300/", { autoConnect: false });
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
    let usersConnected: any[] = [];

    // start setup socket
    const initReactiveProperties = (user) => {
        user.messages = [];
        user.hasNewMessages = false;
    };
    
    const sessionId = localStorage.getItem("sessionId");
    if (sessionId) {
        joined.value = true;
        socket.auth = { sessionId };
        socket.connect();
    }
    
    socket.on("session", ({ sessionId, userId }) => {
        // attach the session ID to the next reconnection attempts
        socket.auth = { sessionId };
        // store it in the localStorage
        localStorage.setItem("sessionId", sessionId);
        // save the ID of the user
        socket.userId = userId;
    });

    socket.on("connect_error", (err) => {
        if (err.message === "invalid username") {
            joined.value = false;
            selectedChannel.value = null;
            console.error('invalid username')
        }
    });

    // *****************************
    socket.on("connect", () => {
        usersConnected.forEach((user) => {
            if (user.self) {
                user.activated = true;
            }
        });
    });

    socket.on("disconnect", () => {
        usersConnected.forEach((user) => {
            if (user.self) {
                user.activated = false;
            }
        });
    });

    socket.on("users", (users) => {
        users.forEach((user) => {
            for (let i = 0; i < usersConnected.length; i++) {
                const existingUser = usersConnected[i];
                if (existingUser.userId === user.userId) {
                    existingUser.connected = user.connected;
                    return;
                }
            }
            user.self = user.userId === socket.userId;
            initReactiveProperties(user);
            usersConnected.push(user);
        });
        console.log('users', usersConnected);
    });

    socket.on("user connected", (user) => {
        for (let i = 0; i < usersConnected.length; i++) {
            const existingUser = usersConnected[i];
            if (existingUser.userId === user.userId) {
                existingUser.connected = true;
                return;
            }
        }
        initReactiveProperties(user);
        usersConnected.push(user);
        console.log('users connected: ', usersConnected);
    });
    
    socket.on("message:private", ({ content, from, to }) => {
        // for (let i = 0; i < usersContact.value.length; i++) {
        //     const user = usersContact.value[i];
        //     if (user.socketId === from) {
        //         const temp: any = { content, fromSelf: false };
        //         user.messagesLog
        //             ? user.messagesLog.concat(temp)
        //             : user.messagesLog = [temp];
                
        //         usersContact.value[i] = user;
        //         break;
        //     }
        // }

        for (let i = 0; i < usersConnected.length; i++) {
            const user = usersConnected[i];
            const fromSelf = socket.userId === from;
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
        // a simple login flow
        const listIdContact: any = ['111', '222', '333', '444'];
        if(listIdContact.includes(userAuthor.value)) {
            join();
        } else {
            alert('User invalid!')
        }
    }
    
    const join = () => {
        socket.auth = { userName: userAuthor.value }
        socket.connect();
        joined.value = true;
    }

    const addMessage = (selectedUser: IUser, typingMessage: string) => {
        const message: any = {
            messageText: typingMessage,
            time: new Date().getTime(),
            fromUserId: currentUser.value
        };

        // for (let i = 0; i < usersContact.value.length; i++) {
        //     const user = usersContact.value[i];
        //     if (user.socketId === selectedUser.socketId) {
        //         const temp = { content: message, fromSelf: true };
        //         user.messagesLog
        //             ? user.messagesLog.push(temp)
        //             : user.messagesLog = [temp];
                
        //         usersContact.value[i] = user;
        //         break;
        //     }
        // }

        socket.emit("message:private", {
            content: message,
            to: selectedUser.userId,
        });
    }

    const sendMessage = (selectedUser: IUser, typingMessage: string) => {
      addMessage(selectedUser, typingMessage);
    }

</script>

<style lang="scss">
.chat-room {
    width: 500px;
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

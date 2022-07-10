<template>
    <template v-if="!joined">
        <Dropdown v-model="selectedVessel" :options="vessels" optionLabel="name" optionValue="code" placeholder="Select a Vessel" />
        <Dropdown v-model="selectedPort" :options="ports" optionLabel="name" optionValue="code" placeholder="Select a port" />

        <span class="p-input-icon-left" v-if="!joined">
            <i class="pi pi-arrow-circle-right" />
            <InputText type="text" placeholder="Enter your userId" v-model="userAuthor"/>
            <Button label="send" icon="pi pi-send" iconPos="right" @click="login()" />
        </span>
    </template>

    <template v-if="joined">
        <label>Hello {{currentUser?.userName}}/ {{currentUser?.roleName}}</label>
        <template v-for="user in usersContact" :key="user.userId">
            <RoomChat v-if="currentUser?.userId !== user.userId"
                :currentUser="currentUser"
                :userContact="user"
                @sendMessage="sendMessage">
            </RoomChat>
        </template>
    </template>

    <strong>User connected:</strong>
    <ul>
        <li v-for="user in usersConnected" :key="user.userId">{{user.userName}}</li>
    </ul>
</template>

<script setup lang="ts">
    import { defineProps, reactive, ref } from 'vue';
    import io from "socket.io-client";
    import type { IMessage, IUser } from "../../models/chat.model";
    import RoomChat from './RoomChat.vue';
 
    const messagesLog = ref<IMessage[]>([])
    const userAuthor = ref<string>();
    const currentUser = ref<IUser>();
    const socket = io("http://localhost:3300/", { autoConnect: false });
    const joined = ref(false)
    const typingMessage = ref('');

    const selectedVessel = ref();
    const vessels = ref([
            {name: 'Vessel 01', code: 'VESSEL01'},
            {name: 'Vessel 02', code: 'VESSEL02'},
            {name: 'Vessel 03', code: 'VESSEL03'},
            {name: 'Vessel 04', code: 'VESSEL04'},
            {name: 'Vessel 05', code: 'VESSEL05'}
        ]);

    const selectedPort = ref();
    const ports = ref([
            {name: 'Port 01', code: 'PORT01'},
            {name: 'Port 02', code: 'PORT02'},
            {name: 'Port 03', code: 'PORT03'}
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
    const usersConnected = ref<[IUser]>();

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
        socket.auth = { userId: userAuthor.value }
        socket.connect();
        joined.value = true;

        socket.on("users:connected", (users: [IUser]) => {
            users.forEach((user) => {
                user.self = user.userId === socket.id;
                currentUser.value = user;
            });

            // put the current user first, and then sort by username
            usersConnected.value = users.sort((a, b) => {
                if (a.self) return -1;
                if (b.self) return 1;
                if (a.userName < b.userName) return -1;
                return a.userName > b.userName ? 1 : 0;
            });
        });

        socket.on("message:private", ({ content, from }) => {
            debugger;
            for (let i = 0; i < usersContact.value.length; i++) {
                const user = usersContact.value[i];
                if (user.socketId === from) {
                    const temp: any = { content, fromSelf: false };
                    user.messagesLog
                        ? user.messagesLog.concat(temp)
                        : user.messagesLog = [temp];
                    
                    usersContact.value[i] = user;
                    break;
                }
            }
        });

        socket.on("connect_error", (err) => {
            if (err.message === "invalid username") {
                joined.value = false;
                console.error('invalid username')
            }
        });
    }

    const addMessage = (selectedUser: IUser, typingMessage: string) => {
        const message: any = {
            messageText: typingMessage,
            time: new Date().getTime(),
            fromUserId: currentUser.value
        };

        for (let i = 0; i < usersContact.value.length; i++) {
            const user = usersContact.value[i];
            if (user.socketId === selectedUser.socketId) {
                const temp = { content: message, fromSelf: true };
                user.messagesLog
                    ? user.messagesLog.push(temp)
                    : user.messagesLog = [temp];
                
                usersContact.value[i] = user;
                break;
            }
        }

        debugger;
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

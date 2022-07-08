<template>
<span class="p-input-icon-left" v-if="!joined">
    <i class="pi pi-arrow-circle-right" />
    <InputText type="text" placeholder="Enter your name" v-model="userName"/>
    <InputText type="text" placeholder="Enter room id" v-model="roomId"/>
    <Button label="send" icon="pi pi-send" iconPos="right" @click="join()" />
</span>

<div class="chat-room" v-if="joined">
    Hello {{userName}}
    <div class="room-header">
        <div class="room-name">Liner Planner</div>
        <Avatar label="P" />
    </div>

    <div class="messages-list">
        <template v-for="item in messagesLog" :key="item.messageId">
            <div class="message-box" :class="item.userId === userName ? ' message-box--user' : 'message-box--guest'">
                <div class="message-box__info">
                    <Avatar label="U" />
                    <span class="message-box__short-time">time</span>
                </div>
                <div class="message-box__text">
                    {{item.messageText}}
                </div>
            </div>
        </template>
    </div>

    <div class="room-footer">
        <Textarea class="room-textarea" v-model="typingMessage" :autoResize="true" placeholder="Type message" 
            :style="{ height: '40px'}"/>
        <Button icon="pi pi-send" iconPos="right" @click="sendMessage()"/>
    </div>
</div>
</template>

<script setup lang="ts">
    import Avatar from 'primevue/avatar';
    import Textarea from 'primevue/textarea';
    import Button from 'primevue/button';
    import InputText from 'primevue/inputtext';

    import { defineProps, reactive, ref } from 'vue';
    import io from "socket.io-client";

    interface IMessage {
        messageId: string,
        isCurrentUser: boolean,
        userId: string;
        messageText: string,
        time: string
    }
 
    const messagesLog = ref<IMessage[]>([])
    const userName = ref()
    const roomId = ref();
    let socketInstance: any
    const joined = ref(false)
    const typingMessage = ref('');

    const join = () => {
      socketInstance = io("http://localhost:3300/", { query: { roomId: roomId.value } });
      joined.value = true;

      socketInstance.on( "message:received", (data: any) => {
          messagesLog.value = messagesLog.value.concat(data);
        }
      )
    }

    const addMessage = () => {
      const message = {
        messageId: new Date().getTime(),
        messageText: typingMessage.value,
        time: new Date().getTime(),
        userId: userName
      } as any;
      messagesLog.value = messagesLog.value.concat(message);
      socketInstance.emit('message', message);
    }

    const sendMessage = () => {
      addMessage();
      typingMessage.value = "";
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

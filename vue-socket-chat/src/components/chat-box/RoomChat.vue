<template>
  <div class="chat-room">
	<div class="room-header">
		<div class="room-name">{{userContact?.roleName ? userContact?.roleName + '/ ' : ''}}{{userContact?.userName}}</div>
        <div class="room-name__wrap-avatar">
            <Avatar class="room-name__avatar" shape="circle" size="large" :label="userContact.userName[0]" />
            <span class="room-name__status" :class="{'room-name__status--active': userContact?.connected}"></span>
        </div>
	</div>

	<div class="messages-list">
		<template v-for="item in userContact?.messages" :key="item.content.messageText">
        <!-- {{item}} -->
			<div class="message-box" :class="item.content.fromUser.userId === currentUser?.userId ? ' message-box--user' : 'message-box--guest'">
				<div class="message-box__info">
					<Avatar class="message-box__avatar" :label="item.content.fromUser.userName[0]" />
					<span class="message-box__short-time">{{moment(item.content.time).format('h:mm')}}</span>
				</div>
				<div class="message-box__text">
					{{item.content.messageText}}
				</div>
			</div>
		</template>
	</div>

	<div class="room-footer">
		<Textarea class="room-textarea" placeholder="Type message"
            v-model="typingMessage"
            :autoResize="true" 
			:style="{ height: '40px'}"
            @keyup.enter="sendMessage(userContact)"/>
		<Button icon="pi pi-send" iconPos="right" @click="sendMessage(userContact)"/>
	</div>
    </div>
</template>

<script setup lang="ts">
	import { ref } from "vue";
	import type { IMessage, IUser } from "../../models/chat.model";
    import moment from 'moment';

	defineProps<{
		userContact: IUser,
		currentUser: IUser | undefined,
	}>()

	const typingMessage = ref('');
	const emit = defineEmits(['sendMessage'])

	const sendMessage = (user: IUser) => {
        if (!typingMessage.value.trim()) return;

		emit('sendMessage', user, typingMessage.value.trim());
		typingMessage.value = "";
	}
    
    const getAvatarName = (name: string) => {
        return name[0];
    }
</script>

<style lang="scss">
    .room-footer {
        textarea {
            width: 100%;
        }
        button {
            width: 60px !important;
            height: 60px;
        }
    }

    .message-box {
        &__avatar {
            text-transform: uppercase;
        }
    }

    .room-name {
        font-size: 16px;
        text-transform: capitalize;

        &__avatar.p-avatar {
            text-transform: uppercase;
        }

        &__wrap-avatar {
            position: relative;
        }

        &__status {
            width: 10px;
            height: 10px;
            background-color: red;
            border-radius: 50%;
            position: absolute;
            bottom: 0;
            right: 30px;

            &--active {
                background-color: #27e929;
            }
        }
    }

    
</style>




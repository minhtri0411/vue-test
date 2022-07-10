<template>
  <div class="chat-room">
	<div class="room-header">
		<div class="room-name">{{userContact?.userName}}/{{userContact?.roleName}}</div>
		<Avatar label="P" />
	</div>

	<div class="messages-list">
		<template v-for="item in userContact?.messagesLog" :key="item.messageId">
			<div class="message-box" :class="item.content.fromUserId === currentUser?.userId ? ' message-box--user' : 'message-box--guest'">
				<div class="message-box__info">
					<Avatar label="U" />
					<span class="message-box__short-time">time</span>
				</div>
				<div class="message-box__text">
					{{item.content.messageText}}
				</div>
			</div>
		</template>
	</div>

	<div class="room-footer">
		<Textarea class="room-textarea" v-model="typingMessage" :autoResize="true" placeholder="Type message" 
			:style="{ height: '40px'}"/>
		<Button icon="pi pi-send" iconPos="right" @click="sendMessage(userContact)"/>
	</div>
    </div>
</template>

<script setup lang="ts">
	import { ref } from "vue";
	import type { IMessage, IUser } from "../../models/chat.model"

	defineProps<{
		userContact: IUser,
		currentUser: IUser | undefined,
	}>()

	const typingMessage = ref('');
	const emit = defineEmits(['sendMessage'])

	const sendMessage = (user: IUser) => {
		emit('sendMessage', user, typingMessage.value);
		typingMessage.value = "";
	}
</script>




<script setup>
import { ref, watch, computed, nextTick } from 'vue';
import baseChatBox from './baseChatBox.vue';
import { apiJson } from '../services/api.js';
import { currentUser } from '../services/auth.js';

const props = defineProps({
    channel: {
        type: Object,
        default: null
    },
    mode: {
        type: String,
        default: 'dm'
    }
});

const isDm = computed(() => props.mode === 'dm');

const conversationId = computed(() =>
    isDm.value ? props.channel.channel_id : props.channel.id
);

const conversationTitle = computed(() =>
    isDm.value
        ? props.channel.other_username
        : '#' + props.channel.name
);

const apiPath = computed(() =>
    `/${isDm.value ? 'dm' : 'channel'}/${conversationId.value}`
);

const messages = ref([]);
const messageError = ref('');
const loading = ref(false);
const refresh = ref(0);

const messageScroller = ref(null);

const hasNewMessages = ref(false);
let scrollAfterSend = false;

const hasOlderMessages = ref(false);
const loadingOlder = ref(false);

let messageLimit = 50;
let preservePosition = false;
let scrollOnLoad = false;
let previousScrollTop = 0;

function loadOlderMessages() {
    if (
        loading.value ||
        loadingOlder.value ||
        preservePosition ||
        !hasOlderMessages.value
    ) return;

    loadingOlder.value = true;
    preservePosition = true;
    messageLimit += 50;
    refresh.value++;
}

function isNearBottom() {
    const element = messageScroller.value;
    if (!element) return true;

    return element.scrollHeight - element.scrollTop
        - element.clientHeight < 80;
}

function scrollToBottom() {
    const element = messageScroller.value;
    if (!element) return;

    element.scrollTop = element.scrollHeight;
    previousScrollTop = element.scrollTop;
    hasNewMessages.value = false;
}

function onMessageScroll() {
    const element = messageScroller.value;
    if (!element) return;

    const currentTop = element.scrollTop;
    const scrollingUp = currentTop < previousScrollTop;
    previousScrollTop = currentTop;

    if (isNearBottom()) hasNewMessages.value = false;

    if (scrollingUp && currentTop < 600) {
        loadOlderMessages();
    }
}

function onMessageSent() {
    scrollAfterSend = true;
    refresh.value++;
}

const messageRows = computed(() => {
    let previous = null;
    let groupStart = 0;

    return messages.value.map(message => {
        const date = new Date(message.created_at);
        const timestamp = date.getTime();
        const day = date.toDateString();

        const newDay = !previous || previous.day !== day;
        const showHeader =
            newDay ||
            String(previous.userId) !== String(message.user_id) ||
            timestamp - groupStart >= 5 * 60 * 1000;

        if (showHeader) groupStart = timestamp;

        previous = { day, userId: message.user_id };

        return { ...message, date, newDay, showHeader };
    });
});

function formatTime(date) {
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(date) {
    return date.toLocaleDateString([], {
        month: 'long',
        day: '2-digit',
        year: 'numeric'
    });
}

function formatHeaderDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit'
    });
}

function isToday(date) {
    return date.toDateString() === new Date().toDateString();
}

watch(
    [apiPath, refresh],
    ([path], previous, onCleanup) => {
        const controller = new AbortController();
        let timer;

        onCleanup(() => {
            controller.abort();
            clearTimeout(timer);
        });

        const changedChannel = path !== previous?.[0];

        if (changedChannel) {
            messages.value = [];
            hasNewMessages.value = false;
            scrollAfterSend = false;
            previousScrollTop = 0;

            messageLimit = 50;
            hasOlderMessages.value = false;
            loadingOlder.value = false;
            preservePosition = false;
            scrollOnLoad = true;
        }
        messageError.value = '';
        loading.value = Boolean(conversationId.value && changedChannel);

        if (!conversationId.value) return;

        async function loadMessages() {
            try {
                const data = await apiJson(`${path}/messages?limit=${messageLimit}`, {
                    signal: controller.signal,
                    cache: 'no-store'
                });

                if (!controller.signal.aborted) {
                    const element = messageScroller.value;
                    const previousHeight = element?.scrollHeight ?? 0;
                    const previousTop = element?.scrollTop ?? 0;
                    const previousLastId = messages.value.at(-1)?.id;

                    const receivedNewMessages =
                        previousLastId != null &&
                        data.messages.some(
                            message => Number(message.id) > Number(previousLastId)
                        );

                    const shouldScroll =
                        scrollOnLoad ||
                        scrollAfterSend ||
                        (!preservePosition && receivedNewMessages && isNearBottom());

                    messages.value = data.messages;
                    hasOlderMessages.value = data.hasMore;

                    await nextTick();
                    if (controller.signal.aborted) return;

                    if (shouldScroll) {
                        scrollToBottom();
                        scrollOnLoad = false;
                        scrollAfterSend = false;
                    } else {
                        if (preservePosition && element) {
                            element.scrollTop =
                                previousTop + element.scrollHeight - previousHeight;
                            previousScrollTop = element.scrollTop;
                        }

                        if (receivedNewMessages) hasNewMessages.value = true;
                    }

                    preservePosition = false;
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    messageError.value = error.message;
                }
            } finally {
                if (!controller.signal.aborted) {
                    loading.value = false;
                    loadingOlder.value = false;
                    timer = setTimeout(loadMessages, 3000);
                }
            }
        }

        loadMessages();
    }, { immediate: true }
);

const editingId = ref(null);
const editDraft = ref('');
const savingEdit = ref(false);

function openEdit(message) {
    editingId.value = message.id;
    editDraft.value = message.content;
    messageError.value = '';
}

async function saveEdit(message) {
    const content = editDraft.value.trim();
    if (!content || savingEdit.value) return;

    savingEdit.value = true;
    messageError.value = '';

    try {
        await apiJson(
            `${apiPath.value}/message/${message.id}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content })
            }
        );

        const original = messages.value.find(item => item.id === message.id);
        if (original) original.content = content;

        editingId.value = null;
        refresh.value++;
    } catch (error) {
        messageError.value = error.message;
    } finally {
        savingEdit.value = false;
    }
}

async function deleteMessage(message) {
    messageError.value = '';

    try {
        await apiJson(`${apiPath.value}/message/${message.id}`, { method: 'DELETE' });

        messages.value = messages.value.filter(
            item => item.id !== message.id
        );
        refresh.value++;
    } catch (error) {
        messageError.value = error.message;
    }
}

const vFocus = {
    mounted(element) {
        element.focus();
    }
};
</script>

<template>
    <div class="bg-background-ligher">
        <div class="h-12 border-b border-t border-app-border flex flex-row items-center pl-4 p-2">
            <div class="flex flex-row items-center">
                <span class="mr-2 h-5 w-5">
                    <svg width="25" height="25" viewBox="0 0 25 25" aria-hidden="true">
                        <foreignObject x="0" y="0" width="20" height="20" mask="url(#svg-mask-avatar-status-round-20)">
                            <div class="avatarStack__44b0c"><img alt=" " aria-hidden="true" src="/profile.png">
                            </div>
                        </foreignObject>
                        <g>
                            <rect width="6" height="6" x="14" y="14" fill="#da3e44" mask="url(#svg-mask-status-dnd)">
                            </rect>
                        </g>
                    </svg>
                </span>{{ conversationTitle }}
            </div>
        </div>



        <div class="flex flex-row h-[calc(100%-48px)]">
            <main class="w-full flex flex-col overflow-hidden">
                <div class="flex-1 min-h-0 overflow-y-auto [overflow-anchor:none]" ref="messageScroller"
                    @scroll.passive="onMessageScroll">

                    <div v-if="isDm" class="m-4">
                        <svg width="80" height="80" viewBox="0 0 80 80" class="mask__44b0c svg__44b0c"
                            aria-hidden="true">
                            <foreignObject x="0" y="0" width="80" height="80" mask="url(#svg-mask-avatar-default)">
                                <div class="avatarStack__44b0c"><img alt=" " class="avatar__44b0c" aria-hidden="true"
                                        src="/profile.png">
                                </div>
                            </foreignObject>
                        </svg>

                        <h3 class="font-bold text-interactive-text-active text-[32px]">
                            {{ props.channel.other_username }}
                        </h3>

                        <h3 class="font-medium mb-5 text-interactive-text-active text-2xl">
                            {{ props.channel.other_username }}
                        </h3>

                        This is the beginning of your direct message history with
                        <strong>{{ props.channel.other_username }}</strong>.


                        <div class="mt-2 flex flex-row gap-2 items-center">
                            <div
                                class="flex flex-row gap-2 items-center after:content-[''] after:bg-border-strong after:rounded-[50%] after:h-1 after:w-1 after:mx-1">

                                <div class="text-lottie">x mutual servers</div>
                            </div>

                            <button type="button"
                                class="btn bg-background-mod hover:bg-secondary-background-hover border-secondary-border border rounded-lg text-secondary-text-default">
                                Remove Friend
                            </button>

                            <button type="button"
                                class="btn bg-background-mod hover:bg-secondary-background-hover border-secondary-border border rounded-lg text-secondary-text-default">
                                Block
                            </button>
                        </div>
                    </div>

                    <div v-else class="m-4">
                        <h3 class="text-2xl font-bold">
                            {{ conversationTitle }}
                        </h3>
                        <p class="text-channels-default">
                            This is the beginning of this channel.
                        </p>
                    </div>

                    <div class="mt-6 w-full pr-3 pb-8">
                        <p v-if="loading">Loading messages...</p>

                        <p v-if="messageError" role="alert">
                            {{ messageError }}
                            <button class="underline" @click="refresh++">Retry</button>
                        </p>

                        <template v-for="message in messageRows" :key="message.id">
                            <div v-if="message.newDay" class="my-5 ml-4 flex items-center gap-3">
                                <div class="h-px flex-1 bg-app-border border-solid"></div>
                                <span class="shrink-0 text-xs text-text-muted">
                                    {{ formatDate(message.date) }}
                                </span>
                                <div class="h-px flex-1 bg-app-border border-solid"></div>
                            </div>

                            <div class="group relative flex items-start gap-3 rounded-r-lg px-4 py-0.5 hover:bg-app-border"
                                :class="{ 'mt-3': message.showHeader, 'bg-app-border': editingId === message.id }">
                                <div class="flex w-14 shrink-0 justify-center self-start">
                                    <img v-if="message.showHeader" src="/profile.png" alt=""
                                        class="h-10 w-10 rounded-full object-cover relative top-1" />

                                    <time v-else :datetime="message.date.toISOString()"
                                        :title="message.date.toLocaleString()"
                                        class="invisible relative top-3 -translate-y-1/2 text-center text-[10px] leading-3 text-channels-default group-hover:visible">
                                        {{ formatTime(message.date) }}
                                    </time>
                                </div>

                                <div class="min-w-0 flex-1">
                                    <div v-if="message.showHeader" class="flex flex-wrap items-baseline gap-x-2">
                                        <span class="font-bold">
                                            {{ message.username ?? (
                                                String(message.user_id) === String(props.channel.other_user_id)
                                                    ? props.channel.other_username
                                                    : currentUser?.username
                                            ) }}
                                        </span>

                                        <time :datetime="message.date.toISOString()"
                                            class="text-xs text-channels-default">
                                            <template v-if="!isToday(message.date)">
                                                {{ formatHeaderDate(message.date) }}
                                            </template>
                                            {{ formatTime(message.date) }}
                                        </time>
                                    </div>

                                    <form v-if="editingId === message.id" @submit.prevent="saveEdit(message)">
                                        <input v-focus v-model="editDraft" aria-label="Edit message" maxlength="2000"
                                            :disabled="savingEdit"
                                            class="w-full rounded border border-transparent bg-chat-background-default px-2 py-1 focus:border-app-border focus:outline-none"
                                            @keydown.enter.prevent="saveEdit(message)"
                                            @keydown.esc.prevent="editingId = null" />

                                        <div class="mt-1 flex gap-2 text-xs">
                                            <button type="button" :disabled="savingEdit" @click="editingId = null">
                                                escape to <span
                                                    class="hover:underline text-text-link-dark">cancel</span>
                                            </button>
                                            •
                                            <button type="submit" :disabled="savingEdit || !editDraft.trim()">
                                                <span v-if="savingEdit">Saving…</span>
                                                <template v-else>
                                                    enter to <span
                                                        class="text-text-link-dark hover:underline">save</span>
                                                </template>
                                            </button>
                                        </div>
                                    </form>

                                    <p v-else class="whitespace-pre-wrap wrap-break-word leading-6">
                                        {{ message.content }}
                                    </p>
                                    <div v-if="String(message.user_id) === String(currentUser?.id)"
                                        class="absolute right-2 -top-3 z-10 hidden items-center gap-0 rounded border border-border-muted bg-background-surface-high p-0.5 shadow group-hover:flex group-focus-within:flex">

                                        <div class="tooltip tooltip-top
                                                before:bg-background-surface-high before:text-white
                                                before:text-xs before:font-semibold
                                                before:rounded-md before:px-3 before:py-2
                                                before:shadow-lg
                                                before:border-app-border
                                                after:border-app-border
                                                after:bg-background-surface-high" data-tip="Edit">
                                            <button type="button" @click="openEdit(message)"
                                                class="flex h-7 w-7 items-center justify-center rounded hover:bg-interactive-background-hover">
                                                <svg class="icon_f84418" aria-hidden="true" role="img"
                                                    xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                    fill="none" viewBox="0 0 24 24">
                                                    <path fill="currentColor"
                                                        d="m13.96 5.46 4.58 4.58a1 1 0 0 0 1.42 0l1.38-1.38a2 2 0 0 0 0-2.82l-3.18-3.18a2 2 0 0 0-2.82 0l-1.38 1.38a1 1 0 0 0 0 1.42ZM2.11 20.16l.73-4.22a3 3 0 0 1 .83-1.61l7.87-7.87a1 1 0 0 1 1.42 0l4.58 4.58a1 1 0 0 1 0 1.42l-7.87 7.87a3 3 0 0 1-1.6.83l-4.23.73a1.5 1.5 0 0 1-1.73-1.73Z"
                                                        class=""></path>
                                                </svg>
                                            </button>
                                        </div>

                                        <button type="button" @click="deleteMessage(message)"
                                            class="flex h-7 gap-2 px-2 items-center justify-center rounded text-red-400 hover:bg-red-500/15 flex-row">
                                            <svg aria-hidden="true" class="icon_c1e9c4" role="img"
                                                xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                                                viewBox="0 0 24 24">
                                                <path fill="currentColor"
                                                    d="M14.25 1c.41 0 .75.34.75.75V3h5.25c.41 0 .75.34.75.75v.5c0 .41-.34.75-.75.75H3.75A.75.75 0 0 1 3 4.25v-.5c0-.41.34-.75.75-.75H9V1.75c0-.41.34-.75.75-.75h4.5Z"
                                                    class=""></path>
                                                <path fill="currentColor" fill-rule="evenodd"
                                                    d="M5.06 7a1 1 0 0 0-1 1.06l.76 12.13a3 3 0 0 0 3 2.81h8.36a3 3 0 0 0 3-2.81l.75-12.13a1 1 0 0 0-1-1.06H5.07ZM11 12a1 1 0 1 0-2 0v6a1 1 0 1 0 2 0v-6Zm3-1a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z"
                                                    clip-rule="evenodd" class=""></path>
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>

                <div class="relative px-2 z-1000">
                    <button v-if="hasNewMessages" type="button" class="absolute bottom-full left-1/2 z-10 mb-4 -translate-x-1/2
                        whitespace-nowrap rounded bg-background-surface-high
                        px-3 py-1 text-text-link shadow hover:underline" @click="scrollToBottom">
                        New messages ↓
                    </button>

                    <baseChatBox :key="apiPath" :api-path="apiPath" :title="conversationTitle" @sent="onMessageSent" />
                </div>
            </main>

            <aside v-if="isDm"
                class="flex flex-col overflow-x-hidden overflow-y-scroll w-85 bg-background-surface-high">
                <div class="relative">
                    <div class="flex z-3 absolute top-2 inset-e-2 gap-2">
                        <div
                            class="flex justify-center items-center rounded-[50%] border border-white-8 border-solid cursor-pointer h-8 w-8 bg-overlay-secondary-background-default hover:bg-overlay-secondary-background-active transition-colors ease-out duration-150">
                            <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                fill="none" viewBox="0 0 24 24">
                                <path fill="currentColor"
                                    d="M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM11.53 11A9.53 9.53 0 0 0 2 20.53c0 .81.66 1.47 1.47 1.47h.22c.24 0 .44-.17.5-.4.29-1.12.84-2.17 1.32-2.91.14-.21.43-.1.4.15l-.26 2.61c-.02.3.2.55.5.55h6.4a.5.5 0 0 0 .35-.85l-.02-.03a3 3 0 1 1 4.24-4.24l.53.52c.2.2.5.2.7 0l1.8-1.8c.17-.17.2-.43.06-.62A9.52 9.52 0 0 0 12.47 11h-.94Z"
                                    class=""></path>
                                <path fill="currentColor"
                                    d="M23.7 17.7a1 1 0 1 0-1.4-1.4L18 20.58l-2.3-2.3a1 1 0 0 0-1.4 1.42l3 3a1 1 0 0 0 1.4 0l5-5Z"
                                    class=""></path>
                            </svg>
                        </div>

                        <div
                            class="flex justify-center items-center rounded-[50%] border border-white-8 border-solid cursor-pointer h-8 w-8 bg-overlay-secondary-background-default hover:bg-overlay-secondary-background-active transition-colors ease-out duration-150">
                            <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                fill="none" viewBox="0 0 24 24">
                                <path fill="currentColor" fill-rule="evenodd"
                                    d="M4 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
                                    clip-rule="evenodd" class=""></path>
                            </svg>
                        </div>

                    </div>

                    <div class="static box-content mb-2">
                        <svg class="box-content" viewBox="0 0 340 120" style="min-width: 340px; min-height: 120px;">
                            <mask id="uid_59">
                                <rect fill="white" x="0" y="0" width="100%" height="100%"></rect>
                                <circle fill="black" cx="56" cy="112" r="46"></circle>
                            </mask>
                            <foreignObject x="0" y="0" width="100%" height="100%" overflow="visible"
                                mask="url(#uid_59)">
                                <div class="banner__68edb banner__7f9c0"
                                    style="height: 120px; min-height: 120px; background-color: rgb(0, 0, 0);"></div>
                            </foreignObject>
                        </svg>

                        <div class="cursor-pointer inset-s-4 top-18 box-content absolute h-20 w-20">
                            <svg class="box-content absolute" width="92" height="92" viewBox="0 0 92 92"
                                aria-hidden="true">
                                <foreignObject x="0" y="0" width="80" height="80"
                                    mask="url(#svg-mask-avatar-status-round-80)">
                                    <div class="avatarStack__44b0c overlay__75742"><img alt=" " class="avatar__44b0c"
                                            aria-hidden="true" src="/profile.png">
                                    </div>
                                </foreignObject>
                                <g>
                                    <rect width="16" height="16" x="60" y="60" fill="#da3e44"
                                        mask="url(#svg-mask-status-dnd)" class="pointerEvents__44b0c"></rect>
                                </g>
                            </svg>
                        </div>
                    </div>


                    <div class="flex static gap-3">
                        <div class="flex flex-col">
                            <span class="text-xl font-bold">
                                {{ props.channel.other_username }}
                            </span>

                            <span class="">
                                {{ props.channel.other_username }}
                            </span>
                        </div>

                    </div>
                </div>



                <footer class="flex items-center bottom-0 mt-auto">
                    <button type="button"
                        class="btn bg-transparent border border-t-app-border shadow-none w-full hover:bg-interactive-background-hover transition-colors ease-out duration-150">
                        View Full Profile
                    </button>
                </footer>
            </aside>
        </div>
    </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiJson } from '../services/api.js';

const router = useRouter();
const route = useRoute();
const emit = defineEmits(['opened']);

const query = ref('');
const users = ref([]);
const searching = ref(false);
const searched = ref(false);
const opening = ref(false);
const searchError = ref('');

const searchDialog = ref(null);
const searchInput = ref(null);

function openSearch() {
    query.value = '';
    users.value = [];
    searched.value = false;
    searchError.value = '';

    searchDialog.value.showModal();
    searchInput.value.focus();
}

watch(query, (value, previous, onCleanup) => {
    const controller = new AbortController();
    let timer;

    onCleanup(() => {
        clearTimeout(timer);
        controller.abort();
    });

    users.value = [];
    searched.value = false;
    searchError.value = '';
    searching.value = false;

    const term = value.trim();
    if (term.length < 2) return;

    searching.value = true;

    timer = setTimeout(async () => {
        try {
            const data = await apiJson(
                `/users/search?q=${encodeURIComponent(term)}`,
                { signal: controller.signal }
            );

            if (!controller.signal.aborted) {
                users.value = data;
                searched.value = true;
            }
        } catch (error) {
            if (!controller.signal.aborted) {
                searchError.value = error.message;
            }
        } finally {
            if (!controller.signal.aborted) {
                searching.value = false;
            }
        }
    }, 300);
}, { flush: 'sync' });

async function startDm(user) {
    if (opening.value) return;

    opening.value = true;
    searchError.value = '';

    try {
        const data = await apiJson('/dm/open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetId: user.id })
        });

        emit('opened');

        await router.push({
            name: 'dm',
            params: { channelId: String(data.channelId) }
        });

        searchDialog.value.close();

        query.value = '';
        users.value = [];
        searched.value = false;
    } catch (error) {
        searchError.value = error.message;
    } finally {
        opening.value = false;
    }
}

const props = defineProps({
    channels: {
        type: Array,
        default: () => [],
    }
});
</script>

<template>
    <nav
        class="border-t border-s rounded-s-xl border-app-border bg-neutral flex flex-col min-w-48 max-w-90 items-center gap-1 text-nowrap overflow-hidden resize-x">
        <div class="w-full border-b border-app-border p-2">
            <button type="button" class="w-full truncate rounded-lg border border-control-secondary-border-default hover:border-control-secondary-border-default
               bg-control-secondary-background-default px-3 py-1 text-left text-sm text-control-secondary-text-default hover:text-control-secondary-text-hover
               hover:bg-control-secondary-background-hover cursor-pointer" @click="openSearch">
                Find or start a conversation
            </button>
        </div>

        <div class="flex flex-col w-full font-medium text-sm leading-5">
            <RouterLink :to="{ name: 'dm' }" :class="[
                'btn flex justify-start p-2 pr-4 hover:bg-interactive-background-hover active:bg-interactive-background-selected border-0 shadow-none ml-2 py-px',
                route.name === 'dm' && route.params.channelId == null ? 'bg-interactive-background-selected' : 'bg-transparent'
            ]">
                <div class="flex flex-row">
                    <svg class="mr-3" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="20"
                        height="20" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M13 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" class=""></path>
                        <path fill="currentColor"
                            d="M3 5v-.75C3 3.56 3.56 3 4.25 3s1.24.56 1.33 1.25C6.12 8.65 9.46 12 13 12h1a8 8 0 0 1 8 8 2 2 0 0 1-2 2 .21.21 0 0 1-.2-.15 7.65 7.65 0 0 0-1.32-2.3c-.15-.2-.42-.06-.39.17l.25 2c.02.15-.1.28-.25.28H9a2 2 0 0 1-2-2v-2.22c0-1.57-.67-3.05-1.53-4.37A15.85 15.85 0 0 1 3 5Z"
                            class=""></path>
                    </svg>
                    Friends
                </div>
            </RouterLink>
            <button
                class="btn justify-start p-2 pr-4 bg-transparent hover:bg-interactive-background-hover active:bg-interactive-background-selected border-0 shadow-none ml-2 py-px">
                <div class="flex flex-row">
                    <svg class="mr-3" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="20"
                        height="20" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor"
                            d="M16.23 12c0 1.29-.95 2.25-2.22 2.25A2.18 2.18 0 0 1 11.8 12c0-1.29.95-2.25 2.22-2.25 1.27 0 2.22.96 2.22 2.25ZM23 12c0 5.01-4 9-8.99 9a8.93 8.93 0 0 1-8.75-6.9H3.34l-.9-4.2H5.3c.26-.96.68-1.89 1.21-2.7H1.89L1 3h12.74C19.13 3 23 6.99 23 12Zm-4.26 0c0-2.67-2.1-4.8-4.73-4.8A4.74 4.74 0 0 0 9.28 12c0 2.67 2.1 4.8 4.73 4.8a4.74 4.74 0 0 0 4.73-4.8Z"
                            class=""></path>
                    </svg>
                    Nitro
                </div>
            </button>
            <button
                class="btn justify-start p-2 pr-4 bg-transparent hover:bg-interactive-background-hover active:bg-interactive-background-selected border-0 shadow-none ml-2 py-px">
                <div class="flex flex-row">
                    <svg class="mr-3" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="20"
                        height="20" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor"
                            d="M2.63 4.19A3 3 0 0 1 5.53 2H7a1 1 0 0 1 1 1v3.98a3.07 3.07 0 0 1-.3 1.35A2.97 2.97 0 0 1 4.98 10c-2 0-3.44-1.9-2.9-3.83l.55-1.98ZM10 2a1 1 0 0 0-1 1v4a3 3 0 0 0 3 3 3 3 0 0 0 3-2.97V3a1 1 0 0 0-1-1h-4ZM17 2a1 1 0 0 0-1 1v3.98a3.65 3.65 0 0 0 0 .05A2.95 2.95 0 0 0 19.02 10c2 0 3.44-1.9 2.9-3.83l-.55-1.98A3 3 0 0 0 18.47 2H17Z"
                            class=""></path>
                        <path fill="currentColor"
                            d="M21 11.42V19a3 3 0 0 1-3 3h-2.75a.25.25 0 0 1-.25-.25V16a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v5.75c0 .14-.11.25-.25.25H6a3 3 0 0 1-3-3v-7.58c0-.18.2-.3.37-.24a4.46 4.46 0 0 0 4.94-1.1c.1-.12.3-.12.4 0a4.49 4.49 0 0 0 6.58 0c.1-.12.3-.12.4 0a4.45 4.45 0 0 0 4.94 1.1c.17-.07.37.06.37.24Z"
                            class=""></path>
                    </svg>
                    Shop
                </div>
            </button>
            <button
                class="btn justify-start p-2 pr-4 bg-transparent hover:bg-interactive-background-hover active:bg-interactive-background-selected border-0 shadow-none ml-2 py-px">
                <div class="flex flex-row">
                    <svg class="mr-3" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="20"
                        height="20" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor"
                            d="M7.5 21.7a8.95 8.95 0 0 1 9 0 1 1 0 0 0 1-1.73c-.6-.35-1.24-.64-1.9-.87.54-.3 1.05-.65 1.52-1.07a3.98 3.98 0 0 0 5.49-1.8.77.77 0 0 0-.24-.95 3.98 3.98 0 0 0-2.02-.76A4 4 0 0 0 23 10.47a.76.76 0 0 0-.71-.71 4.06 4.06 0 0 0-1.6.22 3.99 3.99 0 0 0 .54-5.35.77.77 0 0 0-.95-.24c-.75.36-1.37.95-1.77 1.67V6a4 4 0 0 0-4.9-3.9.77.77 0 0 0-.6.72 4 4 0 0 0 3.7 4.17c.89 1.3 1.3 2.95 1.3 4.51 0 3.66-2.75 6.5-6 6.5s-6-2.84-6-6.5c0-1.56.41-3.21 1.3-4.51A4 4 0 0 0 11 2.82a.77.77 0 0 0-.6-.72 4.01 4.01 0 0 0-4.9 3.96A4.02 4.02 0 0 0 3.73 4.4a.77.77 0 0 0-.95.24 3.98 3.98 0 0 0 .55 5.35 4 4 0 0 0-1.6-.22.76.76 0 0 0-.72.71l-.01.28a4 4 0 0 0 2.65 3.77c-.75.06-1.45.33-2.02.76-.3.22-.4.62-.24.95a4 4 0 0 0 5.49 1.8c.47.42.98.78 1.53 1.07-.67.23-1.3.52-1.91.87a1 1 0 1 0 1 1.73Z"
                            class=""></path>
                    </svg>
                    Quests
                </div>
            </button>
        </div>

        <div class="ml-2 pr-2 my-3 w-full h-px self-center bg-app-border"></div>

        <div class="w-full">
            <h2 class="pl-4 pb-1 pr-2 text-channels-default">
                Direct Messages
                <button></button>
            </h2>

            <RouterLink v-for="channel in props.channels"
                :to="{ name: 'dm', params: { channelId: channel.channel_id } }" :key="channel.channel_id"
                class="rounded-xl w-full flex justify-start items-center transition-colors ml-2 py-px hover:bg-interactive-background-hover active:bg-interactive-background-selected"
                exact-active-class="bg-interactive-background-selected">
                <div class="pl-2 flex flex-row h-10.5 items-center">
                    <span class="mr-3 h-8 w-8">
                        <svg width="40" height="40" viewBox="0 0 40 40" class="mask__44b0c svg__44b0c"
                            aria-hidden="true">
                            <foreignObject x="0" y="0" width="32" height="32"
                                mask="url(#svg-mask-avatar-status-round-32)">
                                <div class="avatarStack__44b0c"><img alt=" " class=" rounded-[50%]" aria-hidden="true"
                                        src="/profile.png"></div>
                            </foreignObject>
                            <g>
                                <rect width="10" height="10" x="22" y="22" fill="#84858d"
                                    mask="url(#svg-mask-status-offline)" class="pointerEvents__44b0c"></rect>
                            </g>
                        </svg>
                    </span>{{ channel.other_username }}
                </div>
            </RouterLink>
        </div>

        <Teleport to="body">
            <dialog ref="searchDialog" aria-labelledby="search-title" class="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-160
               max-h-[85dvh] overflow-y-auto rounded-xl
               border border-border-muted bg-background-surface-high
               p-0 text-white shadow-2xl backdrop:bg-black/70" @click.self="searchDialog.close()" @close="query = ''">
                <div class="p-6">
                    <div class="mb-4 flex items-center justify-between gap-4">
                        <h2 id="search-title" class="text-lg font-semibold">
                            Find a conversation
                        </h2>

                        <button type="button" aria-label="Close search" class="rounded px-2 py-1 text-channels-default
                           hover:bg-interactive-background-hover hover:text-white" @click="searchDialog.close()">
                            ✕
                        </button>
                    </div>

                    <input ref="searchInput" v-model="query" aria-label="Search usernames"
                        placeholder="Who would you like to message?" maxlength="50" :disabled="opening" class="h-16 w-full rounded-lg border border-secondary-border
                            bg-background-mod px-4 text-lg
                            placeholder:text-channels-default
                            focus:border-text-link focus:outline-none" />

                    <p v-if="searchError" role="alert" class="mt-4 text-sm text-red-400">
                        {{ searchError }}
                    </p>

                    <div class="mt-6">
                        <h3 class="mb-2 px-2 text-xs font-semibold uppercase text-channels-default">
                            {{ query.trim() ? 'Search results' : 'Recent conversations' }}
                        </h3>

                        <p v-if="searching" role="status" class="px-2 py-4 text-channels-default">
                            Searching…
                        </p>

                        <template v-else-if="query.trim()">
                            <button v-for="user in users" :key="user.id" type="button" :disabled="opening" class="flex w-full items-center gap-3 rounded-md p-3 text-left
                               hover:bg-interactive-background-hover
                               focus-visible:bg-interactive-background-hover
                               disabled:opacity-50" @click="startDm(user)">
                                <img src="/profile.png" alt="" class="h-8 w-8 rounded-full" />
                                <span class="truncate">{{ user.username }}</span>
                            </button>

                            <p v-if="searched && !users.length" class="px-2 py-4 text-channels-default">
                                No users found.
                            </p>
                        </template>

                        <template v-else>
                            <button v-for="channel in props.channels" :key="channel.channel_id" type="button"
                                :disabled="opening" class="flex w-full items-center gap-3 rounded-md p-3 text-left
                               hover:bg-interactive-background-hover
                               focus-visible:bg-interactive-background-hover
                               disabled:opacity-50" @click="startDm({ id: channel.other_user_id })">
                                <img src="/profile.png" alt="" class="h-8 w-8 rounded-full" />
                                <span class="truncate">{{ channel.other_username }}</span>
                            </button>

                            <p v-if="!props.channels.length" class="px-2 py-4 text-channels-default">
                                Search for a user to start your first conversation.
                            </p>
                        </template>
                    </div>

                    <p class="mt-6 text-xs text-channels-default">
                        Type at least 2 characters to search. Escape closes this window.
                    </p>
                </div>
            </dialog>
        </Teleport>
    </nav>
</template>
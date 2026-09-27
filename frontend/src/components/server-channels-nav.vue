<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiJson } from '../services/api.js';
import { currentUser } from '../services/auth.js'

const route = useRoute();
const router = useRouter();
const emit = defineEmits(['created', 'renamed'])

const createDialog = ref(null);
const nameInput = ref(null);
const channelName = ref('');
const creating = ref(false);
const createError = ref('');
const renameDialog = ref(null);
const renameInput = ref(null);
const renameTarget = ref(null);
const renameName = ref('');
const renaming = ref(false);
const renameError = ref('');

function openRename(type, item) {
    if (!isOwner.value) return;

    renameTarget.value = {
        type,
        id: item.id,
        serverId: props.server.id
    };
    renameName.value = item.name;
    renameError.value = '';

    renameDialog.value.showModal();
    renameInput.value.focus();
    renameInput.value.select();
}

async function saveRename() {
    const name = renameName.value.trim();
    if (!name || renaming.value || !renameTarget.value) return;

    const target = renameTarget.value;
    renaming.value = true;
    renameError.value = '';

    try {
        const data = await apiJson(`/${target.type}/${target.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        emit('renamed', { ...target, name: data.name });
        renameDialog.value.close();
    } catch (error) {
        renameError.value = error.message;
    } finally {
        renaming.value = false;
    }
}

const isOwner = computed(() =>
    currentUser.value &&
    String(props.server.owner_id) === String(currentUser.value.id)
);

function openCreateChannel() {
    channelName.value = '';
    createError.value = '';
    createDialog.value.showModal();
    nameInput.value.focus();
}

async function createChannel() {
    const name = channelName.value.trim();
    if (!name || creating.value) return;

    const serverId = props.server.id;
    creating.value = true;
    createError.value = '';

    let channel;

    try {
        const data = await apiJson(`/channel/${serverId}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        channel = data.channel;
    } catch (error) {
        createError.value = error.message;
        return;
    } finally {
        creating.value = false;
    }

    createDialog.value.close();

    // Select the channel before updating the list, so automatic
    // first-channel selection doesn't redirect elsewhere.
    try {
        await router.push({
            name: 'channel',
            params: {
                serverId: String(serverId),
                channelId: String(channel.id)
            }
        });
    } finally {
        emit('created');
    }
}

const props = defineProps({
    channels: {
        type: Array,
        default: () => [],
    },
    server: {
        type: Object,
        default: null,
    }
});

const routeId = computed(() => String(route.params.channelId));
</script>

<template>
    <nav
        class="border-t border-s rounded-s-xl border-app-border bg-neutral flex flex-col min-w-48 max-w-90 gap-1 overflow-hidden pr-2">
        <div class="h-12 flex border-b border-app-border items-center p-2 w-full justify-center grow-0">
            <div class="w-full" :class="{ 'tooltip tooltip-bottom rename-tooltip': isOwner }"
                :data-tip="isOwner ? 'Rename server' : undefined">
                <button type="button" class="w-full truncate rounded-lg bg-transparent px-2 py-1
               text-sm font-medium text-text-default" :class="isOwner
                ? 'cursor-pointer hover:bg-background-mod-subtle'
                : 'cursor-default'" @click="openRename('server', props.server)">
                    {{ props.server.name }}
                </button>
            </div>
        </div>

        <div class="flex flex-col w-full font-medium text-sm leading-5">
            <RouterLink :to="{ name: 'dm' }" :class="[
                'btn flex justify-start p-2 pr-4 hover:bg-interactive-background-hover active:bg-interactive-background-selected border-0 shadow-none ml-2 py-px',
                route.name === 'dm' && route.params.channelId == null ? 'bg-interactive-background-selected' : 'bg-transparent'
            ]">
                <div class="flex flex-row">
                    <svg class="mr-3 h-5 w-5" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg"
                        width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor"
                            d="M7 1a1 1 0 0 1 1 1v.75c0 .14.11.25.25.25h7.5c.14 0 .25-.11.25-.25V2a1 1 0 1 1 2 0v.75c0 .14.11.25.25.25H19a3 3 0 0 1 3 3 1 1 0 0 1-1 1H3a1 1 0 0 1-1-1 3 3 0 0 1 3-3h.75c.14 0 .25-.11.25-.25V2a1 1 0 0 1 1-1Z"
                            class=""></path>
                        <path fill="currentColor" fill-rule="evenodd"
                            d="M2 10a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-9Zm3.5 2a.5.5 0 0 0-.5.5v3c0 .28.22.5.5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3Z"
                            clip-rule="evenodd" class=""></path>
                    </svg>
                    Events
                </div>
            </RouterLink>
        </div>

        <div class="mt-2.5 w-[90%] h-px self-center bg-app-border"></div>

        <button v-if="isOwner" type="button" class="mx-2 flex cursor-pointer items-center gap-2 rounded px-3 py-2
           text-text-default hover:bg-background-mod-subtle" @click="openCreateChannel">
            <span aria-hidden="true" class="text-xl">+</span>
            Add channel
        </button>

        <div class="w-full p-2">
            <div class="w-full p-2">
                <div v-for="channel in props.channels" :key="channel.id" class="group flex items-center rounded-xl"
                    :class="routeId === String(channel.id)
                        ? 'bg-interactive-background-selected'
                        : 'hover:bg-interactive-background-hover'">
                    <RouterLink :to="{
                        name: 'channel',
                        params: {
                            serverId: props.server.id,
                            channelId: channel.id
                        }
                    }" class="flex h-10 min-w-0 flex-1 items-center gap-2 px-3">
                        <span aria-hidden="true">#</span>
                        <span class="truncate">{{ channel.name }}</span>
                    </RouterLink>

                    <button v-if="isOwner" type="button" :aria-label="'Rename ' + channel.name" title="Rename channel"
                        class="mr-1 cursor-pointer rounded px-2 py-1 text-xs
                   opacity-0 hover:bg-background-mod-subtle
                   group-hover:opacity-100 group-focus-within:opacity-100" @click="openRename('channel', channel)">
                        Rename
                    </button>
                </div>
            </div>
        </div>

        <Teleport to="body">
            <dialog ref="createDialog" aria-labelledby="create-channel-title" class="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md
               rounded-xl border border-border-muted bg-background-surface-high
               p-0 text-white shadow-2xl backdrop:bg-black/70" @cancel="creating && $event.preventDefault()"
                @click.self="!creating && createDialog.close()">
                <form class="p-6" @submit.prevent="createChannel">
                    <h2 id="create-channel-title" class="mb-5 text-xl font-bold">
                        Create a channel
                    </h2>

                    <label for="channel-name" class="mb-2 block text-sm">
                        Channel name
                    </label>

                    <input id="channel-name" ref="nameInput" v-model="channelName" maxlength="100" required
                        :disabled="creating" class="w-full rounded border border-secondary-border
                       bg-background-mod-subtle px-3 py-2
                       focus:border-text-link focus:outline-none" />

                    <p v-if="createError" role="alert" class="mt-3 text-sm text-red-400">
                        {{ createError }}
                    </p>

                    <div class="mt-6 flex justify-end gap-2">
                        <button type="button" :disabled="creating" class="cursor-pointer rounded px-4 py-2
                           hover:bg-background-mod-subtle" @click="createDialog.close()">
                            Cancel
                        </button>

                        <button type="submit" :disabled="creating || !channelName.trim()" class="cursor-pointer rounded bg-background-brand
                           px-4 py-2 text-white hover:brightness-110
                           disabled:cursor-not-allowed disabled:opacity-50">
                            {{ creating ? 'Creating…' : 'Create' }}
                        </button>
                    </div>
                </form>
            </dialog>

            <dialog ref="renameDialog" aria-labelledby="rename-title" class="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md
           rounded-xl border border-border-muted bg-background-surface-high
           p-0 text-white shadow-2xl backdrop:bg-black/70" @cancel="renaming && $event.preventDefault()"
                @click.self="!renaming && renameDialog.close()">
                <form class="p-6" @submit.prevent="saveRename">
                    <h2 id="rename-title" class="mb-5 text-xl font-bold">
                        Rename {{ renameTarget?.type }}
                    </h2>

                    <label for="rename-name" class="mb-2 block text-sm">
                        Name
                    </label>

                    <input id="rename-name" ref="renameInput" v-model="renameName" maxlength="100" required
                        :disabled="renaming" class="w-full rounded border border-secondary-border
                   bg-background-mod-subtle px-3 py-2
                   focus:border-text-link focus:outline-none" />

                    <p v-if="renameError" role="alert" class="mt-3 text-sm text-red-400">
                        {{ renameError }}
                    </p>

                    <div class="mt-6 flex justify-end gap-2">
                        <button type="button" :disabled="renaming" class="cursor-pointer rounded px-4 py-2
                       hover:bg-background-mod-subtle" @click="renameDialog.close()">
                            Cancel
                        </button>

                        <button type="submit" :disabled="renaming || !renameName.trim()" class="cursor-pointer rounded bg-background-brand
                       px-4 py-2 text-white hover:brightness-110
                       disabled:cursor-not-allowed disabled:opacity-50">
                            {{ renaming ? 'Saving…' : 'Save' }}
                        </button>
                    </div>
                </form>
            </dialog>
        </Teleport>
    </nav>
</template>

<style scoped>
.rename-tooltip {
    --tt-bg: var(--color-background-surface-high);
    --tooltip-border: var(--color-border-subtle);
}

.rename-tooltip::before {
    background: var(--tt-bg);
    color: var(--color-text-default);
    border: 0;
    border-radius: 4px;
    padding: 8px 12px;
    max-width: 200px;
    box-shadow:
        inset 0 0 0 1px var(--tooltip-border),
        0 8px 24px rgb(0 0 0 / 25%);
}

.rename-tooltip.tooltip-bottom::after {
    mask: none;
    width: 8px;
    height: 8px;
    box-sizing: border-box;
    background: var(--tt-bg);
    border-top: 1px solid var(--tooltip-border);
    border-left: 1px solid var(--tooltip-border);
    top: calc(100% + 0.5rem - 4px);
    bottom: auto;
    left: 50%;
    z-index: 3;
    transform: translateX(-50%) translateY(var(--tt-pos, -0.25rem)) rotate(45deg);
}
</style>
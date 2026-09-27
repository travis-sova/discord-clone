<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiJson } from '../services/api.js';

const route = useRoute();
const router = useRouter();
const emit = defineEmits(['created']);

const createDialog = ref(null);
const nameInput = ref(null);
const serverName = ref('');
const creating = ref(false);
const createError = ref('');

function openCreateServer() {
    serverName.value = '';
    createError.value = '';
    createDialog.value.showModal();
    nameInput.value.focus();
}

async function createServer() {
    const name = serverName.value.trim();
    if (!name || creating.value) return;

    creating.value = true;
    createError.value = '';

    let server;

    try {
        const data = await apiJson('/server/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        server = data.server;
    } catch (error) {
        createError.value = error.message;
        return;
    } finally {
        creating.value = false;
    }

    emit('created', server);
    createDialog.value.close();

    try {
        await router.push({
            name: 'server',
            params: { serverId: String(server.id) }
        });
    } catch {
    }
}

const props = defineProps({
    servers: {
        type: Array,
        default: () => [],
    },
});

const servers = props.servers;

const routeId = computed(() => String(route.params.serverId ?? "@me"));
const isMe = computed(() => routeId.value === "@me");
const currentServerId = computed(() => (isMe.value ? null : Number(routeId.value)));

</script>

<template>
    <nav class="bg-neutral flex flex-col w-18 items-center gap-1">
        <RouterLink to="/channels/@me" :class="[
            'rounded-xl w-10 h-10 flex justify-center items-center transition-colors',
            isMe ? 'bg-brand text-white' : 'bg-background-mod hover:bg-brand'
        ]">
            <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                viewBox="0 0 24 24">
                <path fill="currentColor"
                    d="M19.73 4.87a18.2 18.2 0 0 0-4.6-1.44c-.21.4-.4.8-.58 1.21-1.69-.25-3.4-.25-5.1 0-.18-.41-.37-.82-.59-1.2-1.6.27-3.14.75-4.6 1.43A19.04 19.04 0 0 0 .96 17.7a18.43 18.43 0 0 0 5.63 2.87c.46-.62.86-1.28 1.2-1.98-.65-.25-1.29-.55-1.9-.92.17-.12.32-.24.47-.37 3.58 1.7 7.7 1.7 11.28 0l.46.37c-.6.36-1.25.67-1.9.92.35.7.75 1.35 1.2 1.98 2.03-.63 3.94-1.6 5.64-2.87.47-4.87-.78-9.09-3.3-12.83ZM8.3 15.12c-1.1 0-2-1.02-2-2.27 0-1.24.88-2.26 2-2.26s2.02 1.02 2 2.26c0 1.25-.89 2.27-2 2.27Zm7.4 0c-1.1 0-2-1.02-2-2.27 0-1.24.88-2.26 2-2.26s2.02 1.02 2 2.26c0 1.25-.88 2.27-2 2.27Z"
                    class="row-start-2"></path>
            </svg>
        </RouterLink>

        <div class="m-0 w-8 h-px self-center bg-app-border"></div>

        <RouterLink v-for="server in props.servers" :to="{ name: 'server', params: { serverId: server.id } }"
            :key="server.id" :class="[
                'rounded-xl w-10 h-10 flex justify-center items-center transition-colors',
                currentServerId === Number(server.id) ? 'bg-brand text-white' : 'bg-background-mod hover:bg-brand'
            ]">
            {{ server.name + server.id }}</RouterLink>

        <div class="tooltip tooltip-right server-tooltip" data-tip="Add a server">
            <button type="button" aria-label="Create server" title="Create server" class="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center
            rounded-xl bg-background-mod-subtle text-text-default
            transition-colors hover:bg-background-brand hover:text-white" @click="openCreateServer">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                    viewBox="0 0 24 24">
                    <path fill="currentColor" fill-rule="evenodd"
                        d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm0-17a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H7a1 1 0 1 1 0-2h4V7a1 1 0 0 1 1-1Z"
                        clip-rule="evenodd" />
                </svg>
            </button>
        </div>

        <Teleport to="body">
            <dialog ref="createDialog" aria-labelledby="create-server-title" class="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md
               rounded-xl border border-border-muted
               bg-background-surface-high p-0 text-white
               shadow-2xl backdrop:bg-black/70" @cancel="creating && $event.preventDefault()"
                @click.self="!creating && createDialog.close()">
                <form class="p-6" @submit.prevent="createServer">
                    <h2 id="create-server-title" class="mb-5 text-xl font-bold">
                        Create a server
                    </h2>

                    <label for="server-name" class="mb-2 block text-sm">
                        Server name
                    </label>

                    <input id="server-name" ref="nameInput" v-model="serverName" maxlength="100" required
                        :disabled="creating" class="w-full rounded border border-secondary-border
                       bg-background-mod px-3 py-2
                       focus:border-text-link focus:outline-none" />

                    <p v-if="createError" role="alert" class="mt-3 text-sm text-red-400">
                        {{ createError }}
                    </p>

                    <div class="mt-6 flex justify-end gap-2">
                        <button type="button" :disabled="creating"
                            class="rounded px-4 py-2 hover:bg-interactive-background-hover"
                            @click="createDialog.close()">
                            Cancel
                        </button>

                        <button type="submit" :disabled="creating || !serverName.trim()" class="rounded bg-indigo-600 px-4 py-2
                           hover:bg-indigo-500 disabled:opacity-50">
                            {{ creating ? 'Creating…' : 'Create' }}
                        </button>
                    </div>
                </form>
            </dialog>
        </Teleport>
    </nav>
</template>

<style scoped>
.server-tooltip {
    --tt-bg: var(--color-background-surface-high);
    --tooltip-border: var(--color-border-subtle);
}

.server-tooltip::before {
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

.server-tooltip.tooltip-right::after {
    mask: none;
    width: 8px;
    height: 8px;
    box-sizing: border-box;

    background: var(--tt-bg);

    border-left: 1px solid var(--tooltip-border);
    border-bottom: 1px solid var(--tooltip-border);

    left: calc(100% + 0.5rem - 4px);
    right: auto;

    top: 50%;
    bottom: auto;

    z-index: 3;

    transform:
        translateY(-50%) translateX(50%) rotate(45deg);
}
</style>
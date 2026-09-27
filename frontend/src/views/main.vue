<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { apiJson } from '../services/api.js';
import { useRoute, useRouter } from 'vue-router';
import titleNav from '../components/title-nav.vue';
import serversNav from '../components/servers-nav.vue';
import dmChannelsNav from '../components/dm-channels-nav.vue';
import serverChannelsNav from '../components/server-channels-nav.vue';
import pageDm from '../components/page-dm.vue';
import svgDefinition from '../components/svg-definition.vue';

const route = useRoute();
const router = useRouter();
let servers = ref([]);

const serverIdParam = computed(() => String(route.params.serverId ?? "@me"));
const isMe = computed(() => serverIdParam.value === "@me");
const currentServerId = computed(() => (isMe.value ? null : Number(serverIdParam.value)));
const currentServer = computed(() => {
    if (isMe.value) return null;
    return servers.value.find((s) => s.id === currentServerId.value) || null;
});

let channels = ref([]);
const channelIdParam = computed(() => String(route.params.channelId ?? ''));

const selectedChannel = computed(() => {
    if (!channelIdParam.value) return null;

    return channels.value.find(channel =>
        String(isMe.value ? channel.channel_id : channel.id)
        === channelIdParam.value
    ) ?? null;
});

const channelsLoading = ref(false);
const channelsError = ref('');
const serversLoading = ref(false);
const serversError = ref('');
const retryChannels = ref(0);
const serverController = new AbortController();

watch([serverIdParam, retryChannels], async ([serverId], previous, onCleanup) => {
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    channels.value = [];
    channelsError.value = '';
    channelsLoading.value = true;
    try {
        const path = serverId === '@me' ? '/dm' : '/server/' + encodeURIComponent(serverId) + '/channels';
        const data = await apiJson(path, { signal: controller.signal });
        if (!Array.isArray(data)) throw new Error('The server returned an invalid channel list.');
        if (!controller.signal.aborted) channels.value = data;
    } catch (error) {
        if (!controller.signal.aborted) channelsError.value = error.message;
    } finally {
        if (!controller.signal.aborted) channelsLoading.value = false;
    }
}, { immediate: true });

watch(
    [() => route.name, channelIdParam, serverIdParam, channels, channelsLoading],
    async () => {
        if (
            channelIdParam.value ||
            channelsLoading.value ||
            !channels.value.length ||
            !['server', 'dm'].includes(route.name)
        ) return;

        const first = channels.value[0];

        try {
            await router.replace(
                isMe.value
                    ? {
                        name: 'dm',
                        params: { channelId: String(first.channel_id) }
                    }
                    : {
                        name: 'channel',
                        params: {
                            serverId: serverIdParam.value,
                            channelId: String(first.id)
                        }
                    }
            );
        } catch (error) {
            channelsError.value = error.message;
        }
    },
    { immediate: true }
);

async function loadServers() {
    if (serversLoading.value) return;
    serversLoading.value = true;
    serversError.value = '';
    try {
        const data = await apiJson('/server', { signal: serverController.signal });
        if (!Array.isArray(data)) throw new Error('The server returned an invalid server list.');
        if (!serverController.signal.aborted) servers.value = data;
    } catch (error) {
        if (!serverController.signal.aborted) serversError.value = error.message;
    } finally {
        if (!serverController.signal.aborted) serversLoading.value = false;
    }
}

function applyRename({ type, id, name, serverId }) {
    if (
        type === 'channel' &&
        String(serverId) !== serverIdParam.value
    ) return;

    const list = type === 'server' ? servers.value : channels.value;
    const item = list.find(item => String(item.id) === String(id));

    if (item) item.name = name;
}

onMounted(loadServers);
onBeforeUnmount(() => serverController.abort());
</script>

<template>
    <svgDefinition />
    <div
        class="bg-neutral w-dvw h-dvh grid grid-cols-[min-content_min-content_1fr] grid-rows-[32px_min-content_1fr] font-sans">
        <titleNav class="a col-span-full" />
        <serversNav class="row-span-full row-start-2" :servers="servers" @created="server => servers.push(server)" />
        <dmChannelsNav v-if="isMe" key="dm" class="row-span-full row-start-2" :channels="channels"
            @opened="retryChannels++" />
        <serverChannelsNav v-if="!isMe && currentServer" :key="currentServer.id" class="row-span-full row-start-2"
            :channels="channels" :server="currentServer" @created="retryChannels++" @renamed="applyRename" />
        <div v-if="channelsLoading || serversLoading || channelsError || serversError"
            class="col-start-3 row-start-2 row-span-2 p-4" aria-live="polite">
            <p v-if="channelsLoading || serversLoading">Loading conversations…</p>
            <p v-if="channelsError" role="alert">{{ channelsError }} <button class="underline"
                    @click="retryChannels++">Retry channels</button></p>
            <p v-if="serversError" role="alert">{{ serversError }} <button class="underline" @click="loadServers">Retry
                    servers</button></p>
        </div>
        <pageDm v-else-if="selectedChannel" :key="`${isMe ? 'dm' : 'channel'}:${channelIdParam}`"
            class="row-span-full row-start-2" :channel="selectedChannel" :mode="isMe ? 'dm' : 'channel'" />
    </div>
</template>
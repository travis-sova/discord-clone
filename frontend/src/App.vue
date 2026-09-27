<script setup>
import { useRouter } from 'vue-router';
import { authError, authDestination } from './services/auth.js';
const router = useRouter();
</script>

<template>
  <div v-if="authError" role="alert" class="fixed top-0 inset-x-0 z-100 bg-neutral p-4 text-white">
    {{ authError }} <button type="button" class="underline ml-2" @click="router.push(authDestination)">Retry</button>
  </div>
  <RouterView />
</template>

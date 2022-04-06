<template>
  <div class="event-log" v-if="visible">
    <div v-for="(event, i) in events" :key="i" @click="selected = event" class="event-log__row">
      {{ i }}: {{ JSON.stringify(event) }}
    </div>
    <teleport to="body">
      <unrest-modal v-if="selected" @close="selected = null">
        <div>{{ selected[0] }}</div>
        <pre>{{ JSON.stringify(selected[1], null, 4) }}</pre>
      </unrest-modal>
    </teleport>
  </div>
</template>

<script>
export default {
  props: {
    events: Array,
  },
  data() {
    return { selected: null }
  },
  computed: {
    visible() {
      return this.$route.query.DEBUG || process.env.NODE_ENV === 'development'
    },
  },
}
</script>

<style>
.event-log {
  @apply fixed bottom-0;
  background: var(--bg);
  max-height: 8rem;
  overflow-y: auto;
  width: 100vw;
  &__row {
    @apply border-t cursor-pointer p-2 truncate;
  }
}
</style>

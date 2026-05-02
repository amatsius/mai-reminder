<template>
  <div class="column-actions" data-test="reminder-actions-col">
    <div class="time-remaining">
      <ion-note color="primary" class="countdown-badge">
        {{ distanceText }}
      </ion-note>
    </div>
    <div class="action-buttons">
      <ion-button
        fill="clear"
        class="static-action-btn"
        data-test="static-edit-btn"
        :aria-label="t('reminder.edit')"
        @click.stop="emit('edit')"
      >
        <ion-icon slot="icon-only" :icon="createOutline" aria-hidden="true"></ion-icon>
      </ion-button>
      <ion-button
        v-if="showDelete"
        fill="clear"
        color="danger"
        class="static-action-btn delete-btn"
        data-test="static-delete-btn"
        :aria-label="t('reminder.delete')"
        @click.stop="emit('cancel')"
      >
        <ion-icon slot="icon-only" :icon="closeOutline" aria-hidden="true"></ion-icon>
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonNote, IonButton, IonIcon } from '@ionic/vue'
import { createOutline, closeOutline } from 'ionicons/icons'
import { useI18n } from 'vue-i18n'
import { fromUTCString } from '../utils/datetime'
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  scheduledAt: Date | string
  showDelete: boolean
}>()

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'cancel'): void
}>()

const { t } = useI18n()

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 30000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

const distanceText = computed(() => {
  const dateStr = props.scheduledAt
  const date = typeof dateStr === 'string' ? fromUTCString(dateStr) : dateStr
  const diffMs = date.getTime() - now.value.getTime()
  const diffMins = Math.round(diffMs / 60000)

  if (diffMins < 0) return t('reminder.past') || 'Past'
  if (diffMins < 60) return t('reminder.inMinutes', { n: diffMins }) || `in ${diffMins}m`

  if (diffMins < 24 * 60) {
    const diffHours = Math.floor(diffMins / 60)
    const remainingMinutes = diffMins % 60

    if (remainingMinutes === 0) {
      return t('reminder.inHours', { n: diffHours }) || `in ${diffHours}h`
    }

    return (
      t('reminder.inHoursMinutes', { h: diffHours, m: remainingMinutes }) ||
      `in ${diffHours}h ${remainingMinutes}m`
    )
  }

  const diffDays = Math.floor(diffMins / (24 * 60))
  const remainingHours = Math.floor((diffMins % (24 * 60)) / 60)
  const remainingMinutes = diffMins % 60

  if (remainingHours === 0 && remainingMinutes === 0) {
    return t('reminder.inDays', { n: diffDays }) || `in ${diffDays}d`
  }

  if (remainingHours > 0 && remainingMinutes > 0) {
    return (
      t('reminder.inDaysHoursMinutes', {
        d: diffDays,
        h: remainingHours,
        m: remainingMinutes,
      }) || `in ${diffDays}d ${remainingHours}h ${remainingMinutes}m`
    )
  }

  if (remainingHours > 0) {
    return (
      t('reminder.inDaysHours', { d: diffDays, h: remainingHours }) ||
      `in ${diffDays}d ${remainingHours}h`
    )
  }

  return (
    t('reminder.inDaysMinutes', { d: diffDays, m: remainingMinutes }) ||
    `in ${diffDays}d ${remainingMinutes}m`
  )
})
</script>

<style scoped>
.column-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  flex-shrink: 0;
}
.time-remaining {
  display: flex;
  align-items: center;
}
.countdown-badge {
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(var(--ion-color-primary-rgb, 56, 128, 255), 0.1);
  color: var(--ion-color-primary);
  padding: 3px 8px;
  border-radius: 12px;
  white-space: nowrap;
}
.action-buttons {
  display: flex;
  gap: 0;
}
.static-action-btn {
  --padding-start: 2px;
  --padding-end: 2px;
  height: 30px;
  width: 30px;
  margin: 0;
  --border-radius: 8px;
}
.static-action-btn ion-icon {
  font-size: 1rem;
}
.delete-btn {
  --color-hover: var(--ion-color-danger-tint);
}
</style>

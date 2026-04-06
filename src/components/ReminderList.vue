<template>
  <div class="reminder-list-container">
    <div
      v-if="displayedReminders.length === 0"
      class="empty-state"
      :class="{ 'compact-empty-state': compactEmptyState }"
      role="status"
      aria-live="polite"
    >
      <ion-icon :icon="notificationsOffOutline" class="empty-icon" aria-hidden="true"></ion-icon>
      <p>{{ t('reminder.noReminders') }}</p>
    </div>

    <ion-list v-else class="modern-list">
      <ion-item
        v-for="reminder in displayedReminders"
        :key="reminder.reminder.id"
        data-test="reminder-item"
        class="reminder-item-card"
        :class="{ 'highlight-missed': highlightedIds.has(reminder.reminder.id) }"
        lines="none"
      >
        <div class="reminder-grid">
          <div class="reminder-row-top">
            <ReminderColumnDateTime
              class="grid-col-datetime"
              :scheduled-at="reminder.displayScheduledAt"
            />
            <ReminderColumnTitle class="grid-col-title" :title="reminder.reminder.title" />
            <button
              class="priority-flag-btn"
              :class="{ 'is-priority': reminder.reminder.priority }"
              data-test="priority-flag"
              :aria-label="
                reminder.reminder.priority
                  ? t('reminder.removePriority', 'Remove priority')
                  : t('reminder.addPriority', 'Add priority')
              "
              :aria-pressed="reminder.reminder.priority"
              @click.stop="emit('togglePriority', reminder.reminder)"
            >
              <ion-icon
                :icon="reminder.reminder.priority ? star : starOutline"
                aria-hidden="true"
              ></ion-icon>
            </button>
          </div>
          <div class="reminder-row-bottom">
            <ReminderColumnRecurrence
              class="grid-col-recurrence"
              :recurrence-rule="reminder.reminder.recurrenceRule"
            />
            <ReminderColumnActions
              class="grid-col-actions"
              :scheduled-at="reminder.displayScheduledAt"
              :show-delete="store.filterStatus === ReminderStatus.PENDING"
              @edit="emit('edit', reminder.reminder)"
              @cancel="emit('cancel', reminder.reminder)"
            />
          </div>
        </div>
      </ion-item>
    </ion-list>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { IonList, IonItem, IonIcon } from '@ionic/vue'
import { notificationsOffOutline, star, starOutline } from 'ionicons/icons'
import { useReminderStore } from '../stores/reminder'
import { useSettingsStore } from '../stores/settings'
import { ReminderStatus } from '../types/reminder'
import { useI18n } from 'vue-i18n'
import { resolveReminderDisplayScheduledAt } from '../services/schedulerService'

import type { Reminder } from '../types/reminder'

// Import subcomponents
import ReminderColumnDateTime from './ReminderColumnDateTime.vue'
import ReminderColumnRecurrence from './ReminderColumnRecurrence.vue'
import ReminderColumnTitle from './ReminderColumnTitle.vue'
import ReminderColumnActions from './ReminderColumnActions.vue'

const { t } = useI18n()
const store = useReminderStore()
const settingsStore = useSettingsStore()
const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

const emit = defineEmits<{
  (e: 'edit', reminder: Reminder): void
  (e: 'cancel', reminder: Reminder): void
  (e: 'togglePriority', reminder: Reminder): void
}>()

const props = defineProps<{
  filterDate?: Date | null
  compactEmptyState?: boolean
}>()

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

const displayedReminders = computed(() => {
  const remindersWithDisplayTime = store.filteredReminders
    .map((reminder) => ({
      reminder,
      displayScheduledAt: resolveReminderDisplayScheduledAt(
        reminder,
        settingsStore.hourlyReminderStartTime,
        settingsStore.hourlyReminderEndTime,
        now.value
      ),
    }))
    .sort((a, b) => {
      const timeA = a.displayScheduledAt.getTime()
      const timeB = b.displayScheduledAt.getTime()
      if (store.filterStatus === ReminderStatus.SENT) {
        return timeB - timeA
      }
      return timeA - timeB
    })

  if (!props.filterDate) {
    return remindersWithDisplayTime
  }

  return remindersWithDisplayTime.filter((entry) => {
    return entry.displayScheduledAt.toDateString() === props.filterDate!.toDateString()
  })
})

const highlightedIds = computed(() => {
  console.log('[ReminderList] Re-evaluating highlightedIds:', Array.from(store.missedReminderIds))
  return store.missedReminderIds
})
</script>

<style scoped>
.modern-list {
  background: transparent;
  padding: 8px 16px 100px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reminder-item-card {
  --background: #ffffff;
  --border-radius: 14px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --inner-padding-end: 0;
  margin: 0;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 0.5px 2px rgba(0, 0, 0, 0.04);
  border: 0.5px solid rgba(60, 60, 67, 0.08);
  transition: all 0.2s ease;
}

.highlight-missed {
  border-color: #007aff !important;
  --background: rgba(0, 122, 255, 0.06) !important;
  background: rgba(0, 122, 255, 0.06) !important;
}

/* Base grid layout */
.reminder-grid {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 6px;
}

.reminder-row-top {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.reminder-row-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.priority-flag-btn {
  background: transparent;
  border: none;
  font-size: 1.3rem;
  color: #aeaeb2;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition:
    color 0.2s ease,
    transform 0.15s ease;
}

.priority-flag-btn:focus-visible {
  outline: 2px solid #007aff;
  outline-offset: 2px;
}

.priority-flag-btn.is-priority {
  color: #ff9f0a;
}

.priority-flag-btn.is-priority:active,
.priority-flag-btn:active {
  transform: scale(0.85);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  margin-top: 20vh;
  color: #aeaeb2;
  padding: 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  opacity: 0.45;
}

.empty-state p {
  font-size: 15px;
  font-weight: 400;
  color: #8e8e93;
  letter-spacing: -0.1px;
}

.empty-state.compact-empty-state {
  margin-top: 0.5rem;
  padding: 0.5rem;
  min-height: auto;
}

.empty-state.compact-empty-state .empty-icon {
  display: block;
  font-size: 1.3rem;
  margin-bottom: 0.25rem;
}
</style>

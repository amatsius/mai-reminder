import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { Pinia, createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import ReminderList from '../src/components/ReminderList.vue'
import { useReminderStore } from '../src/stores/reminder'
import { useSettingsStore } from '../src/stores/settings'
import {
  ReminderLanguage,
  ReminderSource,
  ReminderParserMode,
  ReminderStatus,
} from '../src/types/reminder'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      reminder: {
        noReminders: 'No reminders yet',
        recurring: 'Recurring',
        once: 'Once',
        edit: 'Edit',
        delete: 'Delete',
        addPriority: 'Add priority',
        removePriority: 'Remove priority',
        repeatsEvery: {
          mo: 'Repeats every Monday',
          tu: 'Repeats every Tuesday',
          we: 'Repeats every Wednesday',
          th: 'Repeats every Thursday',
          fr: 'Repeats every Friday',
          sa: 'Repeats every Saturday',
          su: 'Repeats every Sunday',
        },
        repeatsWeeklyOnDays: 'Repeats weekly on {days}',
        repeatsEveryNHours: 'Repeats every {count} hours',
        repeatsHourly: 'Repeats hourly',
        inMinutes: 'in {n}m',
        inHours: 'in {n}h',
        inHoursMinutes: 'in {h}h {m}m',
        inDays: 'in {n}d',
        inDaysHours: 'in {d}d {h}h',
        inDaysMinutes: 'in {d}d {m}m',
        inDaysHoursMinutes: 'in {d}d {h}h {m}m',
        past: 'Past',
        weekdays: {
          mo: 'Monday',
        },
      },
    },
  },
})

describe('ReminderList.vue (E3-01)', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const commonStubs = {
    'ion-list': { template: '<div><slot /></div>' },
    'ion-item': { template: '<div><slot /><slot name="end" /></div>' },
    'ion-label': { template: '<div><slot /></div>' },
    'ion-note': { template: '<div><slot /></div>' },
    'ion-item-sliding': { template: '<div><slot /></div>' },
    'ion-item-options': { template: '<div><slot /></div>' },
    'ion-item-option': { template: '<div><slot /></div>' },
    'ion-icon': true,
    'ion-button': { template: '<button><slot /></button>' },
  }

  it('renders "No reminders yet" message when list is empty', () => {
    const store = useReminderStore()
    store.reminders = []

    const wrapper = mount(ReminderList, {
      global: {
        plugins: [pinia, i18n],
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('No reminders yet')
  })

  it('renders a list of reminders when data is present', () => {
    const store = useReminderStore()
    store.reminders = [
      {
        id: '1',
        title: 'Meeting with team',
        originalText: 'meeting tomorrow',
        language: ReminderLanguage.EN,
        scheduledAt: new Date(Date.now() + 3600000),
        source: ReminderSource.TEXT,
        parserMode: ReminderParserMode.LOCAL,
        status: ReminderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        title: 'Call doctor',
        originalText: 'call doctor at 5pm',
        language: ReminderLanguage.EN,
        scheduledAt: new Date(Date.now() + 7200000),
        source: ReminderSource.TEXT,
        parserMode: ReminderParserMode.LLM,
        status: ReminderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const wrapper = mount(ReminderList, {
      global: {
        plugins: [pinia, i18n],
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('Meeting with team')
    expect(wrapper.text()).toContain('Call doctor')
  })

  it('shows a recurring indicator for recurring reminders', () => {
    const store = useReminderStore()
    store.reminders = [
      {
        id: '1',
        title: 'Weekly team sync',
        originalText: 'team sync every monday',
        language: ReminderLanguage.EN,
        scheduledAt: new Date(Date.now() + 3600000),
        source: ReminderSource.TEXT,
        parserMode: ReminderParserMode.LLM,
        status: ReminderStatus.PENDING,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const wrapper = mount(ReminderList, {
      global: {
        plugins: [pinia, i18n],
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('[data-test="recurring-indicator"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="recurring-indicator"]').text()).toContain(
      'Repeats every Monday'
    )
  })

  it('emits edit event when static edit button is clicked', async () => {
    const store = useReminderStore()
    store.reminders = [
      {
        id: '1',
        title: 'Meeting with team',
        originalText: 'meeting tomorrow',
        language: ReminderLanguage.EN,
        scheduledAt: new Date(),
        source: ReminderSource.TEXT,
        parserMode: ReminderParserMode.LOCAL,
        status: ReminderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const wrapper = mount(ReminderList, {
      global: {
        plugins: [pinia, i18n],
        stubs: commonStubs,
      },
    })

    const editBtn = wrapper.find('[data-test="static-edit-btn"]')
    await editBtn.trigger('click')

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')![0][0]).toEqual(store.reminders[0])
  })

  it('emits cancel event when static delete button is clicked', async () => {
    const store = useReminderStore()
    store.reminders = [
      {
        id: '1',
        title: 'Meeting with team',
        originalText: 'meeting tomorrow',
        language: ReminderLanguage.EN,
        scheduledAt: new Date(),
        source: ReminderSource.TEXT,
        parserMode: ReminderParserMode.LOCAL,
        status: ReminderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const wrapper = mount(ReminderList, {
      global: {
        plugins: [pinia, i18n],
        stubs: commonStubs,
      },
    })

    const deleteBtn = wrapper.find('[data-test="static-delete-btn"]')
    await deleteBtn.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('cancel')![0][0]).toEqual(store.reminders[0])
  })

  it('hides cancel button when filter status is SENT', async () => {
    const store = useReminderStore()
    store.filterStatus = ReminderStatus.SENT
    store.reminders = [
      {
        id: '1',
        title: 'Meeting with team',
        originalText: 'meeting tomorrow',
        language: ReminderLanguage.EN,
        scheduledAt: new Date(),
        source: ReminderSource.TEXT,
        parserMode: ReminderParserMode.LOCAL,
        status: ReminderStatus.SENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const wrapper = mount(ReminderList, {
      global: {
        plugins: [pinia, i18n],
        stubs: commonStubs,
      },
    })

    const deleteBtn = wrapper.find('[data-test="static-delete-btn"]')
    expect(deleteBtn.exists()).toBe(false)
  })

  it('hides cancel button when filter status is CANCELLED', async () => {
    const store = useReminderStore()
    store.filterStatus = ReminderStatus.CANCELLED
    store.reminders = [
      {
        id: '1',
        title: 'Meeting with team',
        originalText: 'meeting tomorrow',
        language: ReminderLanguage.EN,
        scheduledAt: new Date(),
        source: ReminderSource.TEXT,
        parserMode: ReminderParserMode.LOCAL,
        status: ReminderStatus.CANCELLED,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const wrapper = mount(ReminderList, {
      global: {
        plugins: [pinia, i18n],
        stubs: commonStubs,
      },
    })

    const deleteBtn = wrapper.find('[data-test="static-delete-btn"]')
    expect(deleteBtn.exists()).toBe(false)
  })

  it('emits togglePriority event when priority flag is clicked', async () => {
    const store = useReminderStore()
    store.reminders = [
      {
        id: '1',
        title: 'Meeting with team',
        originalText: 'meeting tomorrow',
        language: ReminderLanguage.EN,
        scheduledAt: new Date(),
        source: ReminderSource.TEXT,
        parserMode: ReminderParserMode.LOCAL,
        status: ReminderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        priority: false,
      },
    ]

    const wrapper = mount(ReminderList, {
      global: {
        plugins: [pinia, i18n],
        stubs: commonStubs,
      },
    })

    const priorityFlag = wrapper.find('[data-test="priority-flag"]')
    await priorityFlag.trigger('click')

    expect(wrapper.emitted('togglePriority')).toBeTruthy()
    expect(wrapper.emitted('togglePriority')![0][0]).toEqual(store.reminders[0])
  })

  it('shows pending hourly reminders at their projected trigger time and projected filter day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 1, 20, 45, 0))

    const store = useReminderStore()
    const settingsStore = useSettingsStore()
    settingsStore.hourlyReminderStartTime = '09:00'
    settingsStore.hourlyReminderEndTime = '22:00'
    settingsStore.timeFormat = '24h'

    store.reminders = [
      {
        id: 'hourly-next-day',
        title: 'Hydrate',
        originalText: 'hydrate every hour',
        language: ReminderLanguage.EN,
        scheduledAt: new Date(2026, 0, 1, 23, 30, 0),
        source: ReminderSource.TEXT,
        parserMode: ReminderParserMode.LOCAL,
        status: ReminderStatus.PENDING,
        recurrenceRule: 'FREQ=HOURLY;INTERVAL=1;BYMINUTE=30;BYSECOND=0',
        createdAt: new Date(2026, 0, 1, 20, 0, 0),
        updatedAt: new Date(2026, 0, 1, 20, 0, 0),
      },
    ]

    const wrapper = mount(ReminderList, {
      props: {
        filterDate: new Date(2026, 0, 2, 12, 0, 0),
      },
      global: {
        plugins: [pinia, i18n],
        stubs: commonStubs,
      },
    })

    expect(wrapper.find('[data-test="reminder-item"]').exists()).toBe(true)
    expect(wrapper.find('.time').text()).toBe('09:30')
    expect(wrapper.find('[data-test="reminder-actions-col"]').text()).toContain('in 12h 45m')
  })
})

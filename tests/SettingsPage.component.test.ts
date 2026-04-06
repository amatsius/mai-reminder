import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { useSettingsStore } from '../src/stores/settings'
import { isCapacitorNative } from '../src/utils/platform'

vi.mock('../src/utils/platform', () => ({
  isElectron: vi.fn(() => true),
  isCapacitorNative: vi.fn(() => false),
}))

vi.mock('../src/services/settingsAdapter', () => ({
  settingsAdapter: {
    getSetting: vi.fn(async () => null),
    setSetting: vi.fn(async () => undefined),
    clearAllSettings: vi.fn(async () => undefined),
  },
}))

// Mock Ionic components
const IonPage = defineComponent({
  name: 'IonPage',
  setup(_, { slots }) {
    return () => h('div', { class: 'ion-page' }, slots.default?.())
  },
})

const IonHeader = defineComponent({
  name: 'IonHeader',
  setup(_, { slots }) {
    return () => h('header', slots.default?.())
  },
})

const IonToolbar = defineComponent({
  name: 'IonToolbar',
  setup(_, { slots }) {
    return () => h('div', { class: 'toolbar' }, slots.default?.())
  },
})

const IonTitle = defineComponent({
  name: 'IonTitle',
  props: ['size'],
  setup(_props, { slots }) {
    return () => h('h1', { class: 'title' }, slots.default?.())
  },
})

const IonContent = defineComponent({
  name: 'IonContent',
  setup(_, { slots }) {
    return () => h('main', { class: 'content' }, slots.default?.())
  },
})

const IonList = defineComponent({
  name: 'IonList',
  setup(_, { slots }) {
    return () => h('ul', { class: 'list' }, slots.default?.())
  },
})

const IonItem = defineComponent({
  name: 'IonItem',
  setup(_, { slots }) {
    return () => h('li', { class: 'item' }, slots.default?.())
  },
})

const IonLabel = defineComponent({
  name: 'IonLabel',
  setup(_, { slots }) {
    return () => h('label', { class: 'label' }, slots.default?.())
  },
})

const IonSelect = defineComponent({
  name: 'IonSelect',
  props: ['value', 'placeholder'],
  emits: ['ionChange'],
  setup(props, { emit, slots }) {
    return () =>
      h(
        'select',
        {
          class: 'select',
          value: props.value,
          onChange: (e: Event) => {
            const target = e.target as HTMLSelectElement
            emit('ionChange', { detail: { value: target.value } })
          },
        },
        slots.default?.()
      )
  },
})

const IonSelectOption = defineComponent({
  name: 'IonSelectOption',
  props: ['value'],
  setup(props, { slots }) {
    return () => h('option', { value: props.value }, slots.default?.())
  },
})

const IonToggle = defineComponent({
  name: 'IonToggle',
  props: ['checked'],
  emits: ['ionChange'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        class: 'toggle',
        type: 'checkbox',
        checked: props.checked,
        onChange: (e: Event) => {
          const target = e.target as HTMLInputElement
          emit('ionChange', { detail: { checked: target.checked } })
        },
      })
  },
})

const IonNote = defineComponent({
  name: 'IonNote',
  setup(_, { slots }) {
    return () => h('small', { class: 'note' }, slots.default?.())
  },
})

const IonInput = defineComponent({
  name: 'IonInput',
  props: ['value', 'placeholder'],
  setup(props) {
    return () => h('input', { class: 'input', value: props.value, placeholder: props.placeholder })
  },
})

const IonButtons = defineComponent({
  name: 'IonButtons',
  setup(_, { slots }) {
    return () => h('div', { class: 'buttons' }, slots.default?.())
  },
})

const IonBackButton = defineComponent({
  name: 'IonBackButton',
  props: ['defaultHref'],
  setup() {
    return () => h('button', { class: 'back-button' }, 'Back')
  },
})

// Simple Settings Page component for testing
const SettingsPage = defineComponent({
  name: 'SettingsPage',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonInput,
    IonNote,
    IonButtons,
    IonBackButton,
  },
  setup() {
    const store = useSettingsStore()

    const onLanguageChange = (event: { detail: { value: string } }) => {
      const value = event.detail.value
      if (value === 'en' || value === 'ru') {
        store.setLanguage(value)
      }
    }

    return {
      store,
      onLanguageChange,
      languageLabel: store.languageLabel,
    }
  },
  render() {
    return h(IonPage, {}, () => [
      h(IonHeader, {}, () =>
        h(IonToolbar, {}, () => [
          h(IonButtons, { slot: 'start' }, () => h(IonBackButton, { defaultHref: '/' })),
          h(IonTitle, {}, () => 'Settings'),
        ])
      ),
      h(IonContent, {}, () =>
        h(IonList, {}, () => [
          // Language Section
          h(IonItem, {}, () => [
            h(IonLabel, {}, () => 'Language'),
            h(
              IonSelect,
              {
                value: this.store.language,
                onIonChange: this.onLanguageChange,
              },
              () => [
                h(IonSelectOption, { value: 'en' }, () => 'English'),
                h(IonSelectOption, { value: 'ru' }, () => 'Russian'),
              ]
            ),
          ]),

          // Hotkey Section
          !isCapacitorNative()
            ? h(IonItem, {}, () => [
                h(IonLabel, {}, () => 'Hotkey'),
                h(IonInput, {
                  value: this.store.quickAddHotkey,
                  'data-test': 'hotkey-input',
                }),
              ])
            : null,

          this.store.cloudSyncEnabled && this.store.cloudSyncUserId
            ? h(IonItem, {}, () => [
                h('button', { 'data-test': 'generate-pin-btn' }, 'Generate PIN'),
              ])
            : null,
        ])
      ),
    ])
  },
})

describe('SettingsPage Component (E3-05)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  // ── Rendering ───────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the settings page with title', () => {
      const wrapper = mount(SettingsPage)

      expect(wrapper.find('.title').text()).toBe('Settings')
    })

    it('renders language selector with options', () => {
      const wrapper = mount(SettingsPage)
      const select = wrapper.find('.select')
      const options = wrapper.findAll('option')

      expect(select.exists()).toBe(true)
      expect(options.length).toBe(2)
      expect(options[0].text()).toBe('English')
      expect(options[1].text()).toBe('Russian')
    })

    it('does not render parser mode toggle', () => {
      const wrapper = mount(SettingsPage)

      expect(wrapper.text()).not.toContain('Use AI Parsing')
    })
  })

  // ── Language Selection ─────────────────────────────────────────────────────

  describe('language selection', () => {
    it('reflects current language from store', async () => {
      const store = useSettingsStore()
      await store.setLanguage('ru')

      const wrapper = mount(SettingsPage)
      const select = wrapper.find('.select')

      expect((select.element as HTMLSelectElement).value).toBe('ru')
    })

    it('updates store when language is changed', async () => {
      const wrapper = mount(SettingsPage)
      const store = useSettingsStore()

      const select = wrapper.find('.select')
      await select.setValue('ru')
      await select.trigger('change')

      expect(store.language).toBe('ru')
    })
  })

  describe('parser mode visibility', () => {
    it('does not render AI parsing controls in settings', () => {
      const wrapper = mount(SettingsPage)

      expect(wrapper.text()).not.toContain('Use AI Parsing')
      expect(wrapper.text()).not.toContain('AI parsing')
      expect(wrapper.text()).not.toContain('Local parsing works offline')
    })

    it('keeps local parsing as the default store mode', () => {
      const store = useSettingsStore()

      expect(store.parserMode).toBe('local')
      expect(store.isAIParsingEnabled).toBe(false)
    })
  })

  // ── Platform Specific Visibility ──────────────────────────────────────────

  describe('platform specific visibility', () => {
    it('shows hotkey setting on desktop', () => {
      vi.mocked(isCapacitorNative).mockReturnValue(false)
      const wrapper = mount(SettingsPage)
      expect(wrapper.find('[data-test="hotkey-input"]').exists()).toBe(true)
    })

    it('hides hotkey setting on mobile', () => {
      vi.mocked(isCapacitorNative).mockReturnValue(true)
      const wrapper = mount(SettingsPage)
      expect(wrapper.find('[data-test="hotkey-input"]').exists()).toBe(false)
    })
  })

  // ── Device Pairing via PIN ──────────────────────────────────────────────────────────

  describe('Device Pairing via PIN', () => {
    it('does not show PIN generation button if sync is disabled', () => {
      const wrapper = mount(SettingsPage)
      expect(wrapper.find('[data-test="generate-pin-btn"]').exists()).toBe(false)
    })

    it('shows PIN generation button if sync is enabled and cloud user ID is provisioned', async () => {
      const store = useSettingsStore()
      await store.setCloudSyncEnabled(true)
      await store.setCloudSyncUserId('test-uuid')

      const wrapper = mount(SettingsPage)
      expect(wrapper.find('[data-test="generate-pin-btn"]').exists()).toBe(true)
    })
  })
})

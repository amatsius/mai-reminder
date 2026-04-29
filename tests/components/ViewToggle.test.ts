import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import ViewToggle from '../../src/components/ViewToggle.vue'

const IonSegment = defineComponent({
  name: 'IonSegment',
  props: ['value'],
  emits: ['ionChange'],
  setup(props, { emit, slots, attrs }) {
    return () =>
      h(
        'div',
        {
          ...attrs,
          'data-test': attrs['data-test'],
          'data-value': props.value,
          onClick: () => emit('ionChange', { detail: { value: 'calendar' } }),
        },
        slots.default?.()
      )
  },
})

const IonSegmentButton = defineComponent({
  name: 'IonSegmentButton',
  props: ['value'],
  setup(props, { slots, attrs }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          type: 'button',
          value: props.value,
        },
        slots.default?.()
      )
  },
})

const IonIcon = defineComponent({
  name: 'IonIcon',
  setup() {
    return () => h('span', { class: 'icon' })
  },
})

describe('ViewToggle.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(ViewToggle, {
      global: {
        stubs: {
          IonSegment,
          IonSegmentButton,
          IonIcon,
        },
      },
      props: { modelValue: 'list' },
    })

    expect(wrapper.exists()).toBe(true)
    const segment = wrapper.find('[data-test="view-mode-toggle"]')
    expect(segment.exists()).toBe(true)
  })

  it('emits update:modelValue when changed', async () => {
    const wrapper = mount(ViewToggle, {
      global: {
        stubs: {
          IonSegment,
          IonSegmentButton,
          IonIcon,
        },
      },
      props: { modelValue: 'list' },
    })

    const segment = wrapper.find('[data-test="view-mode-toggle"]')
    await segment.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['calendar'])
  })
})

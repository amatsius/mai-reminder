import { describe, it, expect } from 'vitest'
import { ReminderStatus } from '../../src/types/reminder'
import {
  alignRecurrenceRuleTime,
  getNextScheduledAt,
  resolveReminderDisplayScheduledAt,
  resolveLatestMissedScheduledAt,
  resolveNotificationScheduledAt,
  resolveNotificationWindowedAt,
} from '../../src/services/schedulerService'

describe('schedulerService', () => {
  it('computes the next occurrence for recurring reminders', () => {
    const next = getNextScheduledAt({
      id: 'recurring-1',
      title: 'Stretch',
      scheduledAt: new Date('2026-03-01T10:00:00.000Z'),
      seriesStartAt: new Date('2026-03-01T10:00:00.000Z'),
      status: ReminderStatus.PENDING,
      recurrenceRule: 'FREQ=MINUTELY;INTERVAL=1',
    })

    expect(next?.toISOString()).toBe('2026-03-01T10:01:00.000Z')
  })

  it('resolves Android notification schedule to next valid hourly slot', () => {
    const resolved = resolveNotificationScheduledAt(
      {
        id: 'recurring-hourly',
        title: 'Drink water',
        scheduledAt: new Date('2026-03-01T10:00:00.000Z'),
        status: ReminderStatus.PENDING,
        // Simple RRULE without BYHOUR (new format)
        recurrenceRule: 'FREQ=HOURLY;INTERVAL=2;BYMINUTE=0;BYSECOND=0',
      },
      new Date('2026-03-01T10:15:00.000Z')
    )

    expect(resolved).toBeDefined()
    // Next pure RRULE occurrence: 12:00 UTC
    expect(resolved?.toISOString()).toBe('2026-03-01T12:00:00.000Z')
  })

  it('keeps original future schedule for recurring reminders', () => {
    const original = new Date('2026-03-01T11:00:00.000Z')
    const resolved = resolveNotificationScheduledAt(
      {
        id: 'future-recurring',
        title: 'Focus',
        scheduledAt: original,
        status: ReminderStatus.PENDING,
        recurrenceRule: 'FREQ=HOURLY;INTERVAL=1',
      },
      new Date('2026-03-01T10:15:00.000Z')
    )

    expect(resolved).toBeDefined()
    expect(resolved?.toISOString()).toBe(original.toISOString())
  })

  it('returns undefined when a recurring series has no next occurrence', () => {
    const resolved = resolveNotificationScheduledAt(
      {
        id: 'finished-series',
        title: 'Focus',
        scheduledAt: new Date('2026-03-01T10:00:00.000Z'),
        status: ReminderStatus.PENDING,
        recurrenceRule: 'FREQ=HOURLY;INTERVAL=1;COUNT=1',
      },
      new Date('2026-03-01T10:15:00.000Z')
    )

    expect(resolved).toBeUndefined()
  })

  describe('alignRecurrenceRuleTime', () => {
    it('aligns RRULE time components to edited reminder time (non-hourly)', () => {
      const editedAt = new Date('2026-03-01T10:35:15.000Z')
      const aligned = alignRecurrenceRuleTime(
        'FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=0;BYSECOND=0',
        editedAt
      )

      expect(aligned).toContain('FREQ=WEEKLY')
      expect(aligned).toContain('BYDAY=MO')
      expect(aligned).toContain(`BYHOUR=${editedAt.getUTCHours()}`)
      expect(aligned).toContain(`BYMINUTE=${editedAt.getUTCMinutes()}`)
      expect(aligned).toContain(`BYSECOND=${editedAt.getUTCSeconds()}`)
    })

    it('does NOT overwrite BYHOUR for hourly rules', () => {
      const editedAt = new Date('2026-03-01T10:35:15.000Z')
      const aligned = alignRecurrenceRuleTime(
        'FREQ=HOURLY;INTERVAL=2;BYMINUTE=0;BYSECOND=0',
        editedAt
      )

      expect(aligned).toContain('FREQ=HOURLY')
      expect(aligned).toContain('INTERVAL=2')
      expect(aligned).toContain(`BYMINUTE=${editedAt.getUTCMinutes()}`)
      expect(aligned).toContain(`BYSECOND=${editedAt.getUTCSeconds()}`)
      // Should NOT contain BYHOUR for hourly rules
      expect(aligned).not.toContain('BYHOUR')
    })
  })

  describe('resolveNotificationWindowedAt', () => {
    it('returns standard resolution for non-hourly rules', () => {
      const original = new Date('2026-03-01T11:00:00.000Z')
      const resolved = resolveNotificationWindowedAt(
        {
          id: 'daily',
          title: 'Test',
          scheduledAt: original,
          status: ReminderStatus.PENDING,
          recurrenceRule: 'FREQ=DAILY;INTERVAL=1',
        },
        '09:00',
        '22:00',
        new Date('2026-03-01T10:15:00.000Z')
      )

      expect(resolved?.toISOString()).toBe(original.toISOString())
    })

    it('snaps hourly rule notification to window when outside', () => {
      // Reminder raw scheduledAt is 6am local (outside 9–22 window)
      const earlyMorning = new Date(2026, 2, 1, 6, 30, 0)
      const resolved = resolveNotificationWindowedAt(
        {
          id: 'hourly-early',
          title: 'Test',
          scheduledAt: earlyMorning,
          status: ReminderStatus.PENDING,
          recurrenceRule: 'FREQ=HOURLY;INTERVAL=2;BYMINUTE=30;BYSECOND=0',
        },
        '09:00',
        '22:00',
        new Date(2026, 2, 1, 5, 0, 0) // now is before scheduledAt
      )

      // 6:30 is outside the 9–22 window, should snap forward
      expect(resolved).toBeDefined()
      expect(resolved!.getHours()).toBeGreaterThanOrEqual(9)
      expect(resolved!.getHours()).toBeLessThanOrEqual(22)
    })
  })

  describe('resolveReminderDisplayScheduledAt', () => {
    it('keeps future hourly reminders unchanged when already inside the window', () => {
      const scheduledAt = new Date(2026, 2, 1, 10, 30, 0)
      const resolved = resolveReminderDisplayScheduledAt(
        {
          id: 'hourly-inside-window',
          title: 'Hydrate',
          scheduledAt,
          status: ReminderStatus.PENDING,
          recurrenceRule: 'FREQ=HOURLY;INTERVAL=2;BYMINUTE=30;BYSECOND=0',
        },
        '09:00',
        '22:00',
        new Date(2026, 2, 1, 9, 0, 0)
      )

      expect(resolved.getTime()).toBe(scheduledAt.getTime())
    })

    it('projects future hourly reminders outside the window into the next valid slot', () => {
      const resolved = resolveReminderDisplayScheduledAt(
        {
          id: 'hourly-before-window',
          title: 'Hydrate',
          scheduledAt: new Date(2026, 2, 1, 6, 30, 0),
          status: ReminderStatus.PENDING,
          recurrenceRule: 'FREQ=HOURLY;INTERVAL=2;BYMINUTE=30;BYSECOND=0',
        },
        '09:00',
        '22:00',
        new Date(2026, 2, 1, 5, 0, 0)
      )

      expect(resolved.getTime()).toBe(new Date(2026, 2, 1, 9, 30, 0).getTime())
    })

    it('matches the windowed notification projection for past-due hourly reminders', () => {
      const reminder = {
        id: 'hourly-past-due',
        title: 'Hydrate',
        scheduledAt: new Date(2026, 2, 1, 6, 30, 0),
        status: ReminderStatus.PENDING,
        recurrenceRule: 'FREQ=HOURLY;INTERVAL=2;BYMINUTE=30;BYSECOND=0',
      }
      const now = new Date(2026, 2, 1, 23, 45, 0)

      const displayAt = resolveReminderDisplayScheduledAt(reminder, '09:00', '22:00', now)
      const windowedAt = resolveNotificationWindowedAt(reminder, '09:00', '22:00', now)

      expect(windowedAt).toBeDefined()
      expect(displayAt.getTime()).toBe(windowedAt!.getTime())
    })

    it('keeps non-hourly reminders on their stored scheduledAt', () => {
      const scheduledAt = new Date(2026, 2, 1, 6, 30, 0)
      const resolved = resolveReminderDisplayScheduledAt(
        {
          id: 'daily-reminder',
          title: 'Hydrate',
          scheduledAt,
          status: ReminderStatus.PENDING,
          recurrenceRule: 'FREQ=DAILY;INTERVAL=1',
        },
        '09:00',
        '22:00',
        new Date(2026, 2, 1, 5, 0, 0)
      )

      expect(resolved.getTime()).toBe(scheduledAt.getTime())
    })

    it('keeps non-pending hourly reminders on their stored scheduledAt', () => {
      const scheduledAt = new Date(2026, 2, 1, 6, 30, 0)
      const resolved = resolveReminderDisplayScheduledAt(
        {
          id: 'sent-hourly',
          title: 'Hydrate',
          scheduledAt,
          status: ReminderStatus.SENT,
          recurrenceRule: 'FREQ=HOURLY;INTERVAL=2;BYMINUTE=30;BYSECOND=0',
        },
        '09:00',
        '22:00',
        new Date(2026, 2, 1, 5, 0, 0)
      )

      expect(resolved.getTime()).toBe(scheduledAt.getTime())
    })
  })

  describe('resolveLatestMissedScheduledAt', () => {
    it('returns the most recent daily occurrence at or before now', () => {
      const latest = resolveLatestMissedScheduledAt(
        {
          id: 'daily-missed',
          title: 'Daily',
          scheduledAt: new Date('2026-03-05T10:00:00.000Z'),
          status: ReminderStatus.PENDING,
          recurrenceRule: 'FREQ=DAILY;INTERVAL=1',
        },
        new Date('2026-03-06T10:30:00.000Z')
      )

      expect(latest?.toISOString()).toBe('2026-03-06T10:00:00.000Z')
    })
  })
})

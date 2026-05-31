import { addMinutes, isBefore } from 'date-fns'
import type { AvailableSlot, Booking, EventType } from '../types.js'

export function generateSlots(
  eventType: EventType,
  dateFrom: Date,
  dateTo: Date,
  existingBookings: Booking[],
): AvailableSlot[] {
  const slots: AvailableSlot[] = []
  let current = new Date(dateFrom)

  while (isBefore(current, dateTo)) {
    const slotEnd = addMinutes(current, eventType.durationMinutes)
    if (isBefore(dateTo, slotEnd)) break

    const isOccupied = existingBookings.some((booking) =>
      booking.status === 'confirmed'
      && isBefore(new Date(booking.startTime), slotEnd)
      && isBefore(current, new Date(booking.endTime)),
    )

    if (!isOccupied) {
      slots.push({
        startTime: current.toISOString(),
        endTime: slotEnd.toISOString(),
      })
    }

    current = slotEnd
  }

  return slots
}

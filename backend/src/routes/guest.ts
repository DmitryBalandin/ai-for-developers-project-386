import { addDays, differenceInDays, isBefore } from 'date-fns';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { generateSlots } from '../services/slots.js';
import { store } from '../store.js';

const bookingCreateSchema = z.object({
  eventTypeId: z.string().min(1),
  guestName: z.string().min(1, 'Guest name is required'),
  guestEmail: z.string().email().optional().or(z.literal('')),
  startTime: z.string().min(1, 'Start time is required'),
});

export function registerGuestRoutes(app: FastifyInstance): void {
  app.get('/api/public/event-types', async (_request, reply) => {
    return reply.send(store.listEventTypes());
  });

  app.get('/api/public/event-types/:eventTypeId/slots', async (request, reply) => {
    const { eventTypeId } = request.params as { eventTypeId: string };
    const query = request.query as { dateFrom?: string; dateTo?: string };

    const eventType = store.getEventType(eventTypeId);
    if (!eventType) {
      return reply.status(404).send({ code: 404, message: 'Event type not found' });
    }

    if (!query.dateFrom || !query.dateTo) {
      return reply.status(400).send({
        code: 400,
        message: 'dateFrom and dateTo query parameters are required',
      });
    }

    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);

    if (Number.isNaN(dateFrom.getTime()) || Number.isNaN(dateTo.getTime())) {
      return reply.status(400).send({
        code: 400,
        message: 'Invalid date format. Use ISO 8601.',
      });
    }

    if (isBefore(dateTo, dateFrom)) {
      return reply.status(400).send({
        code: 400,
        message: 'dateTo must be after dateFrom',
      });
    }

    const daysDiff = differenceInDays(dateTo, dateFrom);
    if (daysDiff > 14) {
      return reply.status(400).send({
        code: 400,
        message: 'Date range must not exceed 14 days',
      });
    }

    const existingBookings = store.getBookingsByEventType(eventTypeId);
    const slots = generateSlots(eventType, dateFrom, dateTo, existingBookings);
    return reply.send(slots);
  });

  app.post('/api/bookings', async (request, reply) => {
    const parsed = bookingCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        code: 400,
        message: parsed.error.issues.map((i) => i.message).join('; '),
      });
    }

    const { eventTypeId, guestName, guestEmail, startTime } = parsed.data;

    const eventType = store.getEventType(eventTypeId);
    if (!eventType) {
      return reply.status(404).send({ code: 404, message: 'Event type not found' });
    }

    const startDate = new Date(startTime);
    if (Number.isNaN(startDate.getTime())) {
      return reply.status(400).send({
        code: 400,
        message: 'Invalid startTime format',
      });
    }

    if (isBefore(startDate, new Date())) {
      return reply.status(400).send({
        code: 400,
        message: 'Cannot book in the past',
      });
    }

    const endDate = addDays(startDate, 0);
    endDate.setMinutes(endDate.getMinutes() + eventType.durationMinutes);
    const endTime = endDate.toISOString();

    const existing = store.getBookingsByEventType(eventTypeId);
    const hasConflict = existing.some(
      (b) =>
        b.status === 'confirmed' &&
        isBefore(new Date(b.startTime), endDate) &&
        isBefore(startDate, new Date(b.endTime)),
    );

    if (hasConflict) {
      return reply.status(409).send({ code: 409, message: 'This time slot is already booked' });
    }

    const booking = store.createBooking(
      { eventTypeId, guestName, guestEmail: guestEmail || undefined, startTime },
      endTime,
    );
    return reply.status(201).send(booking);
  });
}

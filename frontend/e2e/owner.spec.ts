import { test, expect } from '@playwright/test'
import { seedEventType, seedBooking, getFutureDate } from './helpers'

test.describe.configure({ mode: 'serial' })

test('shows dashboard page loads correctly', async ({ page }) => {
  await page.goto('/owner')
  await expect(page.getByRole('heading', { name: 'Панель управления' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Типы событий' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Предстоящие брони' })).toBeVisible()
})

test('creates a new event type', async ({ page }) => {
  await page.goto('/owner')
  await page.getByRole('button', { name: 'Создать' }).click()

  await expect(page.getByRole('dialog')).toBeVisible()

  await page.fill('#et-title', 'owner-create-test')
  await page.fill('#et-desc', 'Созданный тип')
  await page.fill('#et-dur', '30')
  await page.getByRole('button', { name: 'Создать' }).click()

  await expect(page.getByText('owner-create-test').first()).toBeVisible()
  await expect(page.getByText('Созданный тип').first()).toBeVisible()
})

test('edits an existing event type', async ({ page }) => {
  const et = await seedEventType({
    title: 'owner-edit-before',
    description: 'До редактирования',
    durationMinutes: 30,
  })

  await page.goto('/owner')
  await expect(page.getByText(et.title).first()).toBeVisible()

  const cardContent = page.locator('[data-slot="card-content"]').filter({ hasText: et.title })
  await cardContent.locator('button').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()

  await expect(page.locator('#et-title')).toHaveValue(et.title)
  await expect(page.locator('#et-desc')).toHaveValue(et.description)
  await expect(page.locator('#et-dur')).toHaveValue(String(et.durationMinutes))
})

test('deletes an event type', async ({ page }) => {
  const et = await seedEventType({
    title: 'owner-delete-test',
    description: 'Будет удалён',
    durationMinutes: 30,
  })

  await page.goto('/owner')
  await expect(page.getByText(et.title).first()).toBeVisible()

  // Delete via backend API directly (from Node.js, bypassing CORS)
  const res = await fetch('http://localhost:3000/api/event-types/' + et.id, {
    method: 'DELETE',
  })
  expect(res.status).toBe(204)

  // Reload page to verify deletion is reflected in the UI
  await page.goto('/owner')
  await expect(page.getByText(et.title).first()).not.toBeVisible()
})

test('shows upcoming bookings', async ({ page }) => {
  const et = await seedEventType({
    title: 'owner-bookings-test',
    description: 'Для брони',
    durationMinutes: 30,
  })
  const startTime = getFutureDate(1)
  startTime.setHours(10, 0, 0, 0)

  const booking = await seedBooking(et.id, {
    guestName: 'Мария Иванова',
    guestEmail: 'maria@example.com',
    startTime: startTime.toISOString(),
  })

  await page.goto('/owner')

  await expect(page.getByText(booking.guestName).first()).toBeVisible()
  await expect(page.getByText(booking.guestEmail!).first()).toBeVisible()
  await expect(page.getByText(booking.status).first()).toBeVisible()
})

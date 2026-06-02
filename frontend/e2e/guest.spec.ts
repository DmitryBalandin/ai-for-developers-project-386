import { test, expect } from '@playwright/test'
import { seedEventType, getFutureDate } from './helpers'

test.describe.configure({ mode: 'serial' })

test('homepage displays hero and navigation CTAs', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Планируйте звонки с лёгкостью' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Забронировать звонок' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Управление событиями' }).first()).toBeVisible()
})

test('shows catalog page loads correctly', async ({ page }) => {
  await page.goto('/book')
  await expect(page.getByRole('heading', { name: 'Доступные типы встреч' })).toBeVisible()
})

test('displays event types in catalog', async ({ page }) => {
  const et = await seedEventType({
    title: 'guest-catalog-test',
    description: 'Описание для каталога',
    durationMinutes: 30,
  })

  await page.goto('/book')
  await expect(page.getByText(et.title).first()).toBeVisible()
  await expect(page.getByText(et.description).first()).toBeVisible()
  await expect(page.getByText(`${et.durationMinutes} мин`).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Забронировать' }).first()).toBeVisible()
})

test('shows calendar and slots for a selected date', async ({ page }) => {
  const et = await seedEventType({
    title: 'guest-slots-test',
    description: 'Тест слотов',
    durationMinutes: 30,
  })

  await page.goto(`/book/${et.id}`)
  await expect(page.getByText(et.title).first()).toBeVisible()

  const tomorrow = getFutureDate(1)
  const formattedDate = tomorrow.toLocaleDateString('ru')
  await page.locator(`[data-day="${formattedDate}"]`).click()

  await expect(page.getByText('Доступное время')).toBeVisible()
})

test('completes full booking flow', async ({ page }) => {
  const et = await seedEventType({
    title: 'guest-booking-test',
    description: 'Тест бронирования',
    durationMinutes: 30,
  })

  await page.goto(`/book/${et.id}`)
  await expect(page.getByText(et.title).first()).toBeVisible()

  const tomorrow = getFutureDate(1)
  const formattedDate = tomorrow.toLocaleDateString('ru')
  await page.locator(`[data-day="${formattedDate}"]`).click()
  await expect(page.getByText('Доступное время')).toBeVisible()

  const firstSlot = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first()
  await firstSlot.click()

  await page.fill('#name', 'Иван Петров')
  await page.click('button:has-text("Подтвердить бронь")')

  await expect(page.getByText('Бронь подтверждена!')).toBeVisible()
  await expect(page.getByText(/Номер подтверждения:/)).toBeVisible()
})

test('completes booking with email', async ({ page }) => {
  const et = await seedEventType({
    title: 'guest-email-test',
    description: 'Тест email',
    durationMinutes: 30,
  })

  await page.goto(`/book/${et.id}`)
  await expect(page.getByText(et.title).first()).toBeVisible()

  const tomorrow = getFutureDate(1)
  const formattedDate = tomorrow.toLocaleDateString('ru')
  await page.locator(`[data-day="${formattedDate}"]`).click()
  await expect(page.getByText('Доступное время')).toBeVisible()

  const firstSlot = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first()
  await firstSlot.click()

  await page.fill('#name', 'Иван Петров')
  await page.fill('#email', 'ivan@example.com')
  await page.click('button:has-text("Подтвердить бронь")')

  await expect(page.getByText('Бронь подтверждена!')).toBeVisible()
})

test('shows conflict error when slot is already booked', async ({ page }) => {
  const et = await seedEventType({
    title: 'guest-conflict-test',
    description: 'Тест конфликта',
    durationMinutes: 30,
  })

  await page.goto(`/book/${et.id}`)
  await expect(page.getByText(et.title).first()).toBeVisible()

  const tomorrow = getFutureDate(1)
  const formattedDate = tomorrow.toLocaleDateString('ru')
  await page.locator(`[data-day="${formattedDate}"]`).click()
  await expect(page.getByText('Доступное время')).toBeVisible()

  // Verify conflict via browser's own fetch
  const { firstStatus, secondStatus } = await page.evaluate(async (eventTypeId) => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(15, 0, 0, 0)
    const startTime = d.toISOString()

    const res1 = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventTypeId, guestName: 'Конкурент', startTime }),
    })

    const res2 = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventTypeId, guestName: 'Иван Петров', startTime }),
    })

    return { firstStatus: res1.status, secondStatus: res2.status }
  }, et.id)

  expect(firstStatus).toBe(201)
  expect(secondStatus).toBe(409)
})

test('submit button is disabled when guest name is empty', async ({ page }) => {
  const et = await seedEventType({
    title: 'guest-validation-test',
    description: 'Тест валидации',
    durationMinutes: 30,
  })

  await page.goto(`/book/${et.id}`)
  await expect(page.getByText(et.title).first()).toBeVisible()

  const tomorrow = getFutureDate(1)
  const formattedDate = tomorrow.toLocaleDateString('ru')
  await page.locator(`[data-day="${formattedDate}"]`).click()
  await expect(page.getByText('Доступное время')).toBeVisible()

  const firstSlot = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first()
  await firstSlot.click()

  await expect(page.locator('#name')).toBeEmpty()
  await expect(page.getByRole('button', { name: 'Подтвердить бронь' })).toBeDisabled()

  await page.fill('#name', 'Иван Петров')
  await expect(page.getByRole('button', { name: 'Подтвердить бронь' })).toBeEnabled()
})

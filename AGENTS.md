# AGENTS.md

## О проекте

**«Запись на звонок»** (Calendar of Calls) — упрощённый сервис бронирования времени по мотивам Cal.com. Позволяет владельцу создавать типы событий, а гостям просматривать доступные слоты и бронировать звонок.

## Структура проекта

```
├── AGENTS.md
├── Makefile              # Команды запуска
├── opencode.json         # MCP серверы
├── package.json
├── .opencode/tools/      # chrome-status, chrome-start, chrome-kill, chrome-*-wsl
├── spec/                 # API спецификация (TypeSpec + OpenAPI)
│   ├── main.tsp
│   └── output/@typespec/openapi3/openapi.yaml
├── backend/              # Fastify + TypeScript
│   ├── src/
│   │   ├── routes/       # owner.ts, guest.ts
│   │   ├── services/     # slots.ts — генерация слотов
│   │   ├── store.ts      # In-memory хранилище
│   │   ├── app.ts        # Fastify + CORS
│   │   ├── server.ts     # Точка входа
│   │   └── types.ts      # Интерфейсы
│   ├── package.json
│   └── tsconfig.json
└── frontend/             # React + TypeScript + Vite
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── pages/
    │   └── types/
    ├── package.json
    └── vite.config.ts
```

## API Specification

Спецификация API описана на TypeSpec в `spec/main.tsp`. Сгенерированная OpenAPI 3.0 схема: `spec/output/@typespec/openapi3/openapi.yaml`. Сервер работает на `http://localhost:3000`.

### Модели данных

| Модель | Поля |
|--------|------|
| `EventType` | id, title, description, durationMinutes |
| `Booking` | id, eventTypeId, guestName, guestEmail, startTime, endTime, status, createdAt |
| `AvailableSlot` | startTime, endTime |

### Эндпоинты

**Владелец (Owner):**

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/event-types` | Создать тип события |
| GET | `/api/event-types` | Список всех типов |
| GET | `/api/event-types/{id}` | Получить тип по ID |
| PUT | `/api/event-types/{id}` | Обновить тип |
| DELETE | `/api/event-types/{id}` | Удалить тип |
| GET | `/api/bookings` | Все предстоящие брони |

**Гость (Guest):**

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/public/event-types` | Доступные типы событий |
| GET | `/api/public/event-types/{eventTypeId}/slots?dateFrom=&dateTo=` | Свободные слоты (макс 14 дней) |
| POST | `/api/bookings` | Создать бронь (201 — ок, 409 — слот занят) |

### Ошибки

| HTTP | Модель | Когда |
|------|--------|-------|
| 400 | `ValidationError` | Невалидные данные |
| 404 | `NotFoundError` | Ресурс не найден |
| 409 | `ConflictError` | Слот уже занят |

## Бэкенд

Бэкенд реализован на Fastify и реализует все эндпоинты из OpenAPI-спецификации. Хранилище in-memory, данные сбрасываются при перезапуске.

### Технологии

| Технология | Назначение |
|------------|-----------|
| **Fastify** | HTTP-фреймворк |
| **Zod** | Валидация входящих запросов |
| **nanoid** | Генерация ID |
| **date-fns** | Работа с датами и генерация слотов |
| **tsx** | Запуск TypeScript без сборки |

### Бизнес-правила

- Слоты генерируются на основе `durationMinutes` типа события (по умолчанию 30 мин)
- Занятые слоты исключаются из списка доступных
- При создании брони проверяется пересечение с существующими (409 Conflict)
- Валидация: обязательные поля, формат email, корректность дат
- Дата не может быть в прошлом
- Диапазон слотов — не более 14 дней

```bash
make backend        # Запуск бэкенда (tsx watch, порт 3000)
make install-backend
```

## Фронтенд

Фронтенд реализуется как отдельная часть приложения в этом же репозитории (`frontend/`). Получает данные и выполняет действия только через API по контракту. Интерфейс должен корректно работать с отдельно запущенным бэкендом.

### Технологии

| Технология | Назначение |
|------------|-----------|
| **Vite** | Быстрый dev-сервер и сборка фронтенда |
| **shadcn/ui** | Набор UI-компонентов с гибкой настройкой |
| **Prism** | Эмулятор API для изолированного тестирования |
| **shadcn MCP Server** | MCP-сервер для взаимодействия агентов с shadcn-элементами |

### Взаимодействие

```
┌──────────────┐     REST API      ┌──────────────┐
│  Frontend    │ ◄──────────────►  │  Backend     │
│  (Vite)      │  localhost:3000   │  (Fastify)   │
│  localhost   │                   │  localhost   │
│  :5173       │                   │  :3000       │
└──────────────┘                   └──────────────┘
```

Разработка фронтенда ведётся с использованием реального бэкенда на Fastify (`backend/`). Для изолированной проверки контракта можно использовать **Prism** с OpenAPI-спецификацией (`spec/output/@typespec/openapi3/openapi.yaml`).

```bash
make dev        # Запуск Vite dev-server
make backend    # Запуск бэкенда (Fastify)
make prism      # Запуск эмуляции API (Prism)
make build      # Сборка frontend
make install    # Установка зависимостей фронтенда
make install-backend
make dev-all    # Backend + Vite одновременно
```

## MCP Servers

| Сервер | Тип | Описание |
|--------|-----|----------|
| `github` | local (`gh mcp`) | GitHub API — PR, issues, репозитории |
| `chrome-devtools` | local (CDP) | Chrome DevTools Protocol — браузерная автоматизация (Windows Chrome, disabled) |
| `chrome-devtools-wsl` | local (CDP) | Chrome DevTools Protocol — браузерная автоматизация (WSL Chromium, disabled) |
| `playwright` | local (CDP) | Playwright MCP — браузерная автоматизация (WSL Chromium, CDP mode, авто-запуск) |
| `shadcn` | local (`shadcn-mcp`) | shadcn/ui MCP — управление компонентами shadcn |

## Custom Tools

| Инструмент | Описание |
|-----------|----------|
| `chrome-status` | Проверка: Chrome на Windows, CDP, MCP, portproxy, вкладки, dev-сервер |
| `chrome-start` | Запуск Chrome на Windows с `--remote-debugging-port=9222` |
| `chrome-kill` | Убить Chrome на Windows, дождаться освобождения порта |
| `chrome-start-wsl` | Запуск WSL Chromium с `--remote-debugging-port=9224` |
| `chrome-status-wsl` | Проверка WSL Chromium на порту 9224, вкладки, MCP |
| `chrome-kill-wsl` | Убить WSL Chromium на порту 9224 |

## chrome-devtools

### Архитектура

```
Windows                          WSL2
┌──────────────┐                ┌─────────────────────┐
│  Chrome.exe  │  :9222         │  chrome-devtools    │
│  (GUI+CDP)   │────┐           │  -mcp (stdio)       │
│  port 9222   │    │           │       ↑             │
└──────┬───────┘    │           │  OpenCode agent     │
       │            │           └─────────────────────┘
       │ portproxy  │ 172.x.x.x:9223
       │ 9223→9222  │
       └────────────┘
```

### Рабочий процесс

1. **Убедиться, что Chrome запущен:** `chrome-status`
2. **Если не запущен:** `chrome-start` (или двойной клик `C:\Temp\chrome-debug.bat` на Windows)
3. **Проверить:** `chrome-status` — должен показать `✅ Chrome`, `✅ Portproxy`, `✅ MCP chrome-devtools`
4. **Работа через MCP:** `navigate_page`, `take_screenshot`, `take_snapshot`, `click`, `fill`, `fill_form`, `list_console_messages`, `list_network_requests`

### Проверка

```bash
W_IP=$(ip route show default | awk '{print $3}')
curl -s "http://${W_IP}:9223/json/version"   # статус Chrome
curl -s "http://${W_IP}:9223/json"            # список вкладок
```

### Portproxy (однократно на Windows, PowerShell Admin)

```powershell
netsh interface portproxy add v4tov4 listenport=9223 listenaddress=0.0.0.0 connectport=9222 connectaddress=127.0.0.1
New-NetFirewallRule -DisplayName "Allow MCP Chrome Debug" -Direction Inbound -Protocol TCP -LocalPort 9223 -Action Allow
```

### Troubleshooting

| Проблема | Решение |
|----------|---------|
| Chrome не отвечает на порт 9223 | Запустить `chrome-start` или двойной клик по `.bat` |
| `opencode mcp ls` не показывает `chrome-devtools` | Перезапустить OpenCode |
| Порт 9222 занят | `chrome-kill`, затем `chrome-start` |

## chrome-devtools-wsl (WSL Chromium)

Альтернативный MCP сервер для работы с WSL Chromium напрямую (без Windows Chrome).

### Архитектура

```
WSL2
┌────────────────────┐
│  Chromium (snap)   │  :9224
│  (GUI+CDP)         │────┐
│  port 9224         │    │
└────────────────────┘    │
                          │
              chrome-devtools-wsl
              -mcp (stdio, localhost:9224)
                     ↑
              OpenCode agent
```

### Рабочий процесс

1. **Убедиться, что WSL Chromium запущен:** `chrome-status-wsl`
2. **Если не запущен:** `chrome-start-wsl` (запускает Chromium с `--remote-debugging-port=9224`)
3. **Включить MCP сервер:** в `opencode.json` установить `"chrome-devtools-wsl"` → `"enabled": true`, а остальные браузерные MCP (`chrome-devtools`, `playwright`) → `"enabled": false`, затем `opencode mcp restart`
4. **Работа через MCP:** те же инструменты — `navigate_page`, `take_screenshot`, `take_snapshot`, `click`, `fill`, `fill_form`
5. **Выключить:** `chrome-kill-wsl`, затем переключить MCP обратно

### Проверка

```bash
curl -s "http://127.0.0.1:9224/json/version"   # статус Chromium
curl -s "http://127.0.0.1:9224/json"            # список вкладок
```

### Troubleshooting

| Проблема | Решение |
|----------|---------|
| Chromium не отвечает на порт 9224 | Запустить `chrome-start-wsl`. Если скрипт сообщает "уже запущен", но порт недоступен — запустить вручную: `nohup /snap/bin/chromium --remote-debugging-port=9224 about:blank &` |
| `Snapshot`/`Screenshot` возвращают пустоту | Нет DISPLAY — Chromium запущен headless, GUI не отрисовывается |
| `opencode mcp ls` не показывает `chrome-devtools-wsl` | Проверить `"enabled": true` в `opencode.json`, перезапустить OpenCode |

## Playwright MCP

Playwright MCP — альтернатива chrome-devtools, предоставляет браузерную автоматизацию через Playwright.

### Конфигурация

Подключается к тому же WSL Chromium через CDP (`http://127.0.0.1:9224`). При старте автоматически проверяет и запускает Chromium, если он не работает.

### Инструменты

| Инструмент | Назначение |
|-----------|-----------|
| `browser_navigate` | Перейти по URL |
| `browser_click` | Кликнуть на элемент |
| `browser_fill_form` | Заполнить форму |
| `browser_snapshot` | Получить a11y-дерево |
| `browser_screenshot` | Сделать скриншот |
| `browser_console_messages` | Получить консоль |
| `browser_network_requests` | Получить сетевые запросы |
| `browser_evaluate` | Выполнить JavaScript |
| `browser_hover` | Навести на элемент |
| `browser_press_key` | Нажать клавишу |
| `browser_resize` | Изменить размер окна |
| `browser_drag` | Drag and drop |
| `browser_run_code_unsafe` | Выполнить произвольный Playwright код |

### Особенности

- Chromium запускается автоматически при старте MCP сервера (если ещё не запущен)
- Использует тот же профиль (`/tmp/chromium-wsl-profile`), что и chrome-devtools-wsl
- Работает в headed-режиме (с GUI), если доступен DISPLAY
- При остановке MCP сервера Chromium **не убивается** — остаётся работать для других сервисов

### Использование

```bash
# Проверить что Chromium запущен
curl -s http://127.0.0.1:9224/json/version

# Принудительно перезапустить Chromium
chrome-kill-wsl && chrome-start-wsl

# Переключиться на Playwright MCP (если сейчас активен другой MCP)
# В opencode.json: "playwright" → "enabled": true, остальные → false
# Затем перезапустить OpenCode
```

### Troubleshooting

| Проблема | Решение |
|----------|---------|
| `playwright_browser_snapshot` возвращает пустоту | Проверить что Chromium отвечает: `curl -s http://127.0.0.1:9224/json/version` |
| `browser_navigate` не работает | Убедиться что в opencode.json `"playwright"` → `"enabled": true` |
| 404 WebSocket при подключении | `--cdp-endpoint` указан как `ws://...` вместо `http://...` — исправить в `opencode.json` |
| "Cannot connect to browser" в логах | Убить процессы: `chrome-kill-wsl`, затем снова запустить OpenCode |

## Совместимость MCP серверов

| Сервер | Статус | Порт | Браузер |
|--------|--------|------|---------|
| `chrome-devtools` | disabled | 9223 (Windows) | Chrome на Windows |
| `chrome-devtools-wsl` | disabled | 9224 (WSL) | WSL Chromium |
| `playwright` | **enabled** | 9224 (WSL, CDP) | WSL Chromium (через Playwright) |

Для переключения между серверами менять `"enabled"` в `opencode.json` и перезапускать OpenCode. Включённым должен быть **только один** из трёх браузерных MCP серверов, чтобы избежать конфликтов за порт 9224.

**Важно:** Перед включением любого браузерного MCP сервера (`chrome-devtools`, `chrome-devtools-wsl`, `playwright`) я должен проверить, что остальные два выключены (`"enabled": false`). Если включён другой — сначала выключить его, затем включить нужный.

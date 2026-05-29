# AGENTS.md

## О проекте

**«Запись на звонок»** (Calendar of Calls) — упрощённый сервис бронирования времени по мотивам Cal.com. Позволяет владельцу создавать типы событий, а гостям просматривать доступные слоты и бронировать звонок.

## Структура проекта

```
├── AGENTS.md
├── Makefile              # Команды запуска
├── opencode.json         # MCP серверы
├── package.json
├── .opencode/tools/      # chrome-status, chrome-start, chrome-kill
├── spec/                 # API спецификация (TypeSpec + OpenAPI)
│   ├── main.tsp
│   └── output/@typespec/openapi3/openapi.yaml
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

## Фронтенд

Фронтенд реализуется как отдельная часть приложения в этом же репозитории (`frontend/`). Получает данные и выполняет действия только через API по контракту. Интерфейс должен корректно работать с отдельно запущенным бэкендом.

### Технологии

| Технология | Назначение |
|------------|-----------|
| **Vite** | Быстрый dev-сервер и сборка фронтенда |
| **shadcn/ui** | Набор UI-компонентов с гибкой настройкой |
| **Mantine** | Готовая UI-библиотека для быстрого старта |
| **Prism** | Эмулятор API по контракту для разработки и проверки |
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

Разработка фронтенда ведётся с использованием **Prism** для эмуляции API по OpenAPI-спецификации (`spec/output/@typespec/openapi3/openapi.yaml`).

```bash
make dev     # Запуск Vite dev-server
make prism   # Запуск эмуляции API (Prism)
make build   # Сборка frontend
make install # Установка зависимостей
make dev-all # Prism + Vite одновременно
```

## MCP Servers

| Сервер | Тип | Описание |
|--------|-----|----------|
| `github` | local (`gh mcp`) | GitHub API — PR, issues, репозитории |
| `chrome-devtools` | local (CDP) | Chrome DevTools Protocol — браузерная автоматизация |
| `shadcn` | local (`shadcn-mcp`) | shadcn/ui MCP — управление компонентами shadcn |

## Custom Tools

| Инструмент | Описание |
|-----------|----------|
| `chrome-status` | Проверка: Chrome на Windows, CDP, MCP, portproxy, вкладки, dev-сервер |
| `chrome-start` | Запуск Chrome на Windows с `--remote-debugging-port=9222` |
| `chrome-kill` | Убить Chrome на Windows, дождаться освобождения порта |

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

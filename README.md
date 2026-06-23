# Fintrack

Мобильное PWA для совместного учёта расходов. React + Vercel Serverless + JSON-база в Vercel Blob.

## Возможности

- Регистрация и вход (токен сессии в httpOnly cookie)
- Создание групп и присоединение по invite-коду
- Добавление расходов с категориями
- Расчёт баланса и «кто кому должен» (равный split)

## Стек

- **Frontend:** Vite, React, TypeScript, Tailwind CSS, PWA
- **Backend:** Vercel Serverless Functions (`/api`)
- **БД:** единый `db.json` в Vercel Blob (prod) или `data/db.json` (локально)

## Локальная разработка

### Только фронтенд

```bash
npm install
npm run dev
```

### Фронтенд + API

Установите [Vercel CLI](https://vercel.com/docs/cli):

```bash
npm i -g vercel
vercel dev
```

Приложение откроется на `http://localhost:3000`. API использует локальный файл `data/db.json` (переменная `BLOB_READ_WRITE_TOKEN` не нужна).

Альтернатива: в одном терминале `vercel dev`, в другом `npm run dev` — Vite проксирует `/api` на порт 3000.

## Деплой на Vercel

1. Запушьте код в репозиторий [github.com/Deltvenga/fintrack](https://github.com/Deltvenga/fintrack)

   ```bash
   git init
   git remote add origin https://github.com/Deltvenga/fintrack.git
   git add .
   git commit -m "Initial fintrack app"
   git push -u origin main
   ```

2. Зайдите на [vercel.com](https://vercel.com) → **Add New Project** → импортируйте репозиторий `fintrack`

3. Vercel определит Vite автоматически. Нажмите **Deploy**

4. После первого деплоя: **Project → Storage → Create Database → Blob** → привяжите к проекту. Переменная `BLOB_READ_WRITE_TOKEN` подставится автоматически

5. Передеплойте проект (Redeploy). Приложение будет доступно по адресу `https://fintrack-*.vercel.app`

### Установка на телефон

- **Android:** Chrome → меню → «Установить приложение»
- **iOS:** Safari → «Поделиться» → «На экран Домой»

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `BLOB_READ_WRITE_TOKEN` | Токен Vercel Blob (авто при подключении Storage) |

Скопируйте `.env.example` в `.env` для локальной разработки с Blob (опционально).

## API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/logout` | Выход |
| GET | `/api/auth/me` | Текущий пользователь |
| GET/POST | `/api/groups` | Список / создать группу |
| POST | `/api/groups/join` | Войти по invite-коду |
| GET/POST | `/api/expenses?groupId=` | Список / добавить расход |
| GET | `/api/groups/:id/balance` | Баланс группы |

## Структура проекта

```
api/           # Vercel Serverless Functions
src/           # React frontend
data/db.json   # Локальная БД для разработки
public/        # Статика и PWA-иконки
vercel.json    # Конфигурация деплоя
```

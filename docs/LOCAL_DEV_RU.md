# Локальный запуск Nota

## 1. Зависимости (если ещё не ставили)

В **корне** проекта:

```bash
pnpm install
```

Этого достаточно для всех пакетов (apps + packages) в монорепозитории.

---

## 2. Docker-контейнеры (БД, Redis, MinIO)

Запуск только инфраструктуры (приложение вы запускаете отдельно на хосте):

```bash
docker compose up -d
```

Проверка, что контейнеры работают:

```bash
docker compose ps
```

Должны быть в статусе `running`:

- **nota-postgres** — порт 5432 (логин/пароль/БД: `nota` / `nota_dev_password` / `nota`)
- **nota-redis** — порт 6379
- **nota-minio** — порты 9000 (API), 9001 (веб-консоль)

Остановить:

```bash
docker compose down
```

---

## 3. Переменные окружения

- В **корне**: скопировать `.env.example` в `.env`.
- В **packages/database**: тоже должен быть `.env` с теми же `DATABASE_URL` и `DIRECT_DATABASE_URL` (для Prisma CLI).

В обоих файлах должны быть **реальные** URL, без плейсхолдера `db.prisma.io`:

```env
DATABASE_URL="postgresql://nota:nota_dev_password@localhost:5432/nota?schema=public"
DIRECT_DATABASE_URL="postgresql://nota:nota_dev_password@localhost:5432/nota?schema=public"
```

---

## 4. Схема БД

После запуска Docker и настройки `.env`:

```bash
pnpm db:generate
pnpm db:push
```

`db:push` подтянет схему Prisma к базе в Docker.

---

## 5. Запуск приложения

Два процесса (два терминала):

```bash
# Терминал 1 — API (порт 4000)
pnpm dev:api

# Терминал 2 — фронт (порт 3001)
pnpm dev:web
```

Или одной командой из корня (запустит и API, и веб):

```bash
pnpm dev
```

- Сайт: http://localhost:3001  
- API: http://localhost:4000  
- Swagger: http://localhost:4000/api/docs  

---

## 6. Шеринг сайта (например, на порт 4040)

Если вы «шерите» приложение через туннель (Cursor, ngrok и т.п.) и снаружи оно открывается по **порту 4040**:

1. Запустить **веб** именно на 4040:
   ```bash
   cd apps/web
   pnpm exec next dev -p 4040
   ```
   API по-прежнему в другом терминале: `pnpm dev:api` (порт 4000).

2. В **корневом `.env`** указать публичный URL туннеля, чтобы CORS и запросы к API работали:
   ```env
   CORS_ORIGIN="https://ваш-туннель.ngrok.io"
   NEXT_PUBLIC_API_URL="https://ваш-туннель.ngrok.io"
   ```
   Если API и фронт идут через один и тот же туннель (один хост, разные порты или пути), подставьте тот URL, по которому браузер открывает сайт.

3. Открывать шеринг по тому адресу, который выдаёт туннель (например, `https://xxx.ngrok.io` или `http://localhost:4040`, если туннель слушает 4040).

---

## Краткий чеклист

- [ ] `pnpm install` в корне
- [ ] `cp .env.example .env` и при необходимости `cp .env packages/database/.env`
- [ ] В `.env` нет `db.prisma.io`, указан `localhost:5432`
- [ ] `docker compose up -d`
- [ ] `pnpm db:generate` и `pnpm db:push`
- [ ] `pnpm dev` (или отдельно `dev:api` и `dev:web`; при шеринге — веб на 4040 и правки CORS/API URL в `.env`)

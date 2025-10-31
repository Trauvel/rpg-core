FROM node:20-slim

WORKDIR /app

# Устанавливаем необходимые зависимости для Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем prisma схему
COPY prisma ./prisma/

# Генерируем Prisma client
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]


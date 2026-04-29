# Dockerfile для сборки SferaLLM на Linux
FROM node:22-bullseye

# Установка зависимостей для electron-builder (без wine)
RUN apt-get update && apt-get install -y \
    rpm \
    fakeroot \
    dpkg \
    libarchive-tools \
    && rm -rf /var/lib/apt/lists/*

# Рабочая директория
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем исходники
COPY . .

# Сборка для Linux (используем build:linux вместо build)
RUN npm run build:linux

# Команда по умолчанию - сборка для Linux
CMD ["npm", "run", "dist:linux"]

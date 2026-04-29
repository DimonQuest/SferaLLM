#!/bin/bash
# Скрипт для сборки SferaLLM на удалённом Linux сервере

SERVER="dima@192.168.0.136"
REMOTE_DIR="/home/dima/sferallm-build"
LOCAL_DIR="D:/ii/omniroute/SferaLLM-Production/SferaLLM"

echo "=== Сборка SferaLLM на удалённом сервере ==="

# 1. Создаём директорию на сервере
echo "1. Создание директории на сервере..."
ssh $SERVER "mkdir -p $REMOTE_DIR"

# 2. Копируем файлы на сервер (исключая node_modules и release)
echo "2. Копирование файлов на сервер..."
rsync -avz --exclude 'node_modules' --exclude 'release' --exclude 'dist' --exclude '.git' \
  "$LOCAL_DIR/" "$SERVER:$REMOTE_DIR/"

# 3. Запускаем сборку в Docker на сервере
echo "3. Запуск сборки в Docker..."
ssh $SERVER "cd $REMOTE_DIR && docker build -f Dockerfile.builder -t sferallm-builder . && docker run --rm -v \$(pwd)/release:/app/release sferallm-builder npm run dist:linux"

# 4. Скачиваем готовые файлы обратно
echo "4. Скачивание готовых файлов..."
rsync -avz "$SERVER:$REMOTE_DIR/release/" "$LOCAL_DIR/release/"

echo "=== Готово! ==="
echo "Файлы находятся в: $LOCAL_DIR/release/"

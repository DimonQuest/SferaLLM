# Сборка macOS версии SferaLLM

## Вариант 1: GitHub Actions (Рекомендуется) ✅

### Автоматическая сборка при создании тега

1. Создайте и запушьте тег:
```bash
git tag v2.1.1
git push origin v2.1.1
```

2. GitHub автоматически соберёт все платформы (Windows, Linux, macOS)
3. Готовые файлы появятся в релизе

### Ручной запуск сборки

1. Перейдите на https://github.com/DimonQuest/SferaLLM/actions
2. Выберите workflow **"Build macOS Release"** или **"Build All Platforms"**
3. Нажмите **"Run workflow"**
4. Выберите ветку **main**
5. Нажмите **"Run workflow"**
6. Дождитесь завершения (~10-15 минут)
7. Скачайте артефакты (файлы) из завершённой сборки

## Вариант 2: Локальная сборка на Mac

Если у вас есть доступ к Mac:

```bash
# Клонируйте репозиторий
git clone https://github.com/DimonQuest/SferaLLM.git
cd SferaLLM

# Установите зависимости
npm install

# Соберите для macOS
npm run dist:mac
```

Готовые файлы будут в папке `release/`:
- `SferaLLM-2.1.0.dmg` - установщик
- `SferaLLM-2.1.0-mac.zip` - архив

## Вариант 3: Облачный macOS сервер (Платно)

### MacStadium
- https://www.macstadium.com
- От $79/месяц
- Полноценный Mac в облаке

### AWS EC2 Mac Instances
- https://aws.amazon.com/ec2/instance-types/mac/
- От $1.08/час (минимум 24 часа)
- Требуется AWS аккаунт

### MacinCloud
- https://www.macincloud.com
- От $1/час
- Доступ через VNC

## Вариант 4: Виртуальная машина (Нарушает EULA Apple)

⚠️ **Не рекомендуется** - нарушает лицензионное соглашение Apple

## Рекомендация

**Используйте GitHub Actions** - это:
- ✅ Бесплатно
- ✅ Легко настроить
- ✅ Автоматически
- ✅ Официально поддерживается

## Что уже сделано

✅ Создан workflow файл `.github/workflows/build-macos.yml`
✅ Создан workflow файл `.github/workflows/build-all.yml` (все платформы)

## Следующие шаги

1. Закоммитьте и запушьте workflow файлы:
```bash
git add .github/workflows/
git commit -m "Add GitHub Actions workflows for macOS and all platforms"
git push origin main
```

2. Запустите сборку вручную или создайте новый тег

## Результат

После сборки получите:
- **SferaLLM-2.1.0.dmg** (~90 MB) - установщик для macOS
- **SferaLLM-2.1.0-mac.zip** - архив приложения

## Примечание

Без подписи кода (Apple Developer Certificate за $99/год):
- Пользователи увидят предупреждение при первом запуске
- Нужно будет разрешить запуск в System Preferences → Security & Privacy
- Это нормально для open-source проектов

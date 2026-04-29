# Настройка GitHub для SferaLLM

## ✅ Уже настроено в коде
- package.json: `DimonQuest/SferaLLM`
- README.md: обновлены все ссылки
- Автообновление: готово к работе

## 📋 Пошаговая инструкция

### Шаг 1: Создайте репозиторий на GitHub

1. Перейдите на https://github.com/new
2. Заполните:
   - **Repository name:** `SferaLLM`
   - **Description:** `Multi-model AI chat application with proxy support`
   - **Public** (для автообновлений нужен публичный репозиторий)
   - ✅ Add a README file (можно не ставить, мы загрузим свой)
   - **License:** MIT
3. Нажмите **Create repository**

### Шаг 2: Инициализируйте Git локально

```bash
cd D:/ii/omniroute/SferaLLM-Production/SferaLLM

# Инициализация (если еще не сделано)
git init

# Добавьте все файлы
git add .

# Первый коммит
git commit -m "Initial commit: SferaLLM v2.1.0 with proxy and auto-update"

# Добавьте remote
git remote add origin https://github.com/DimonQuest/SferaLLM.git

# Переименуйте ветку в main (если нужно)
git branch -M main

# Загрузите на GitHub
git push -u origin main
```

### Шаг 3: Создайте GitHub Personal Access Token

1. Перейдите на https://github.com/settings/tokens
2. Нажмите **Generate new token** → **Generate new token (classic)**
3. Заполните:
   - **Note:** `SferaLLM Auto-Update`
   - **Expiration:** `No expiration` (или выберите срок)
   - **Select scopes:**
     - ✅ `repo` (полный доступ к репозиториям)
4. Нажмите **Generate token**
5. **ВАЖНО:** Скопируйте токен сразу! Он больше не будет показан.

### Шаг 4: Сохраните токен в переменную окружения

**Windows (PowerShell):**
```powershell
# Временно (до перезагрузки)
$env:GH_TOKEN = "ваш_токен_здесь"

# Постоянно
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'ваш_токен_здесь', 'User')

# Проверка
echo $env:GH_TOKEN
```

**Windows (CMD):**
```cmd
setx GH_TOKEN "ваш_токен_здесь"

# Перезапустите терминал и проверьте
echo %GH_TOKEN%
```

### Шаг 5: Создайте первый Release

**Вариант A: Автоматически при сборке**
```bash
# Соберите и опубликуйте
npm run dist:win -- --publish always
```

**Вариант B: Вручную**
```bash
# 1. Соберите
npm run dist:win

# 2. Создайте Release на GitHub
# Перейдите на https://github.com/DimonQuest/SferaLLM/releases/new

# 3. Заполните:
# - Tag: v2.1.0
# - Release title: v2.1.0
# - Description: (скопируйте из CHANGELOG ниже)

# 4. Загрузите файлы из release/:
# - SferaLLM-Setup-2.1.0.exe
# - SferaLLM-2.1.0-portable.exe
# - latest.yml (ОБЯЗАТЕЛЬНО!)

# 5. Нажмите "Publish release"
```

### CHANGELOG для первого релиза

```markdown
# SferaLLM v2.1.0

## ✨ Основные возможности

### 🤖 AI Провайдеры
- Поддержка 13+ провайдеров (OpenAI, Anthropic, Google, Mistral, и др.)
- Локальные модели (Ollama, LM Studio, LocalAI)
- Custom провайдер для любого OpenAI-совместимого API

### 🌐 Система прокси
- 3 режима: без прокси, автоматический, ручной
- 21 страна для автоматического выбора
- 7 источников публичных прокси
- Поддержка авторизации

### 👥 Мультиагентная коллаборация
- Normal Mode - параллельная работа
- Collaborative Mode - 3 раунда обсуждения
- Orchestrator Mode - координация задач

### 💬 Продвинутый чат
- Параллельная работа с несколькими моделями
- История с закладками и версионированием
- Экспорт в Markdown, JSON, PDF
- Поиск и сравнение ответов

### 🎨 Интерфейс
- Темная и светлая темы
- Настраиваемые раскладки
- Голосовой ввод
- Прикрепление файлов

### 🔄 Автообновление
- Автоматическая проверка обновлений
- Фоновая загрузка
- Уведомления о готовности

## 📦 Установка

**Installer:** Скачайте `SferaLLM-Setup-2.1.0.exe` и запустите

**Portable:** Скачайте `SferaLLM-2.1.0-portable.exe` и запустите без установки

## 📝 Требования

- Windows 10/11 (64-bit)
- 4 GB RAM
- 500 MB свободного места

## 🔗 Ссылки

- [Документация](https://github.com/DimonQuest/SferaLLM#readme)
- [Issues](https://github.com/DimonQuest/SferaLLM/issues)
- [Discussions](https://github.com/DimonQuest/SferaLLM/discussions)
```

## 🧪 Тестирование автообновления

### После публикации первого релиза:

1. Установите SferaLLM из релиза
2. Измените версию в package.json на `2.1.1`
3. Внесите небольшое изменение
4. Соберите и опубликуйте v2.1.1
5. Запустите установленную v2.1.0
6. Через несколько секунд должно появиться уведомление об обновлении

## 📊 Проверка настройки

### Проверьте что всё готово:

```bash
# 1. Git настроен
git remote -v
# Должно показать: https://github.com/DimonQuest/SferaLLM.git

# 2. Токен установлен
echo %GH_TOKEN%  # Windows CMD
echo $env:GH_TOKEN  # PowerShell
# Должен показать ваш токен

# 3. package.json правильный
cat package.json | grep -A 3 "publish"
# Должно показать DimonQuest/SferaLLM
```

## 🎯 Следующие шаги

1. ✅ Создайте репозиторий на GitHub
2. ✅ Загрузите код (`git push`)
3. ✅ Создайте GitHub Token
4. ✅ Сохраните в GH_TOKEN
5. ✅ Соберите и опубликуйте первый релиз
6. ✅ Протестируйте автообновление

## 💡 Полезные команды

```bash
# Проверить статус git
git status

# Создать новый релиз
git tag v2.1.1
git push origin v2.1.1
npm run dist:win -- --publish always

# Посмотреть все релизы
git tag -l

# Удалить тег (если ошиблись)
git tag -d v2.1.0
git push origin :refs/tags/v2.1.0
```

## ❓ FAQ

**Q: Нужно ли платить за GitHub?**
A: Нет, публичные репозитории бесплатны.

**Q: Можно ли сделать репозиторий приватным?**
A: Нет, для автообновлений нужен публичный репозиторий.

**Q: Как часто проверяются обновления?**
A: При запуске приложения и каждые 4 часа.

**Q: Можно ли отключить автообновление?**
A: Да, в коде `src/main/main.ts` закомментируйте `setupAutoUpdater()`.

**Q: Что делать если токен истек?**
A: Создайте новый токен и обновите переменную GH_TOKEN.

---

**Всё готово для публикации на GitHub!** 🚀

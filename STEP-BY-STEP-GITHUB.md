# Пошаговая инструкция по публикации SferaLLM на GitHub
## С подробными командами и объяснениями

**Дата:** 2026-04-29
**Проект:** SferaLLM v2.1.0
**GitHub:** DimonQuest/SferaLLM

---

## ШАГ 1: Создание репозитория на GitHub (в браузере)

### 1.1 Откройте браузер и войдите в GitHub
```
URL: https://github.com/login
Логин: DimonQuest
Пароль: [ваш пароль]
```

### 1.2 Создайте новый репозиторий
```
URL: https://github.com/new

Заполните форму:
┌─────────────────────────────────────────┐
│ Repository name: SferaLLM               │
│                                         │
│ Description:                            │
│ Multi-model AI chat application with   │
│ proxy support, multi-agent             │
│ collaboration, and auto-update         │
│                                         │
│ ○ Public  ○ Private                    │
│ [x] Public (ОБЯЗАТЕЛЬНО для автообновл.)│
│                                         │
│ Initialize this repository with:       │
│ [ ] Add a README file (НЕ СТАВИТЬ)     │
│ [ ] Add .gitignore                     │
│ [x] Choose a license: MIT              │
│                                         │
│ [Create repository]                    │
└─────────────────────────────────────────┘
```

**Результат:** Репозиторий создан
**URL:** https://github.com/DimonQuest/SferaLLM

---

## ШАГ 2: Создание GitHub Personal Access Token

### 2.1 Откройте настройки токенов
```
URL: https://github.com/settings/tokens
```

### 2.2 Создайте новый токен
```
Нажмите: [Generate new token] → [Generate new token (classic)]

Заполните форму:
┌─────────────────────────────────────────┐
│ Note: SferaLLM Auto-Update              │
│                                         │
│ Expiration: No expiration               │
│ (или выберите 90 days для безопасности) │
│                                         │
│ Select scopes:                          │
│ [x] repo                                │
│     [x] repo:status                     │
│     [x] repo_deployment                 │
│     [x] public_repo                     │
│     [x] repo:invite                     │
│     [x] security_events                 │
│                                         │
│ [Generate token]                        │
└─────────────────────────────────────────┘
```

### 2.3 Скопируйте токен
```
ВАЖНО! Токен показывается только один раз!

Пример токена:
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Скопируйте его в блокнот!
```

---

## ШАГ 3: Сохранение токена в систему

### 3.1 Откройте PowerShell от имени администратора
```
Windows + X → Windows PowerShell (Admin)
```

### 3.2 Выполните команду
```powershell
# Замените YOUR_TOKEN на ваш токен из шага 2.3
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'User')
```

**Пример:**
```powershell
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'ghp_1234567890abcdefghijklmnopqrstuvwxyz', 'User')
```

### 3.3 Проверьте что токен сохранен
```powershell
# Закройте и откройте PowerShell заново, затем:
echo $env:GH_TOKEN
```

**Ожидаемый результат:**
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## ШАГ 4: Инициализация Git в проекте

### 4.1 Откройте PowerShell в папке проекта
```powershell
cd D:\ii\omniroute\SferaLLM-Production\SferaLLM
```

### 4.2 Проверьте что вы в правильной папке
```powershell
ls
```

**Ожидаемый результат:**
```
Directory: D:\ii\omniroute\SferaLLM-Production\SferaLLM

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        29.04.2026     10:00                dist
d-----        29.04.2026     10:00                node_modules
d-----        29.04.2026     10:00                public
d-----        29.04.2026     10:00                src
-a----        29.04.2026     10:00           2401 package.json
-a----        29.04.2026     10:00         366334 package-lock.json
-a----        29.04.2026     10:00          12075 README.md
...
```

### 4.3 Инициализируйте Git
```powershell
git init
```

**Ожидаемый результат:**
```
Initialized empty Git repository in D:/ii/omniroute/SferaLLM-Production/SferaLLM/.git/
```

### 4.4 Настройте Git (если еще не настроено)
```powershell
git config --global user.name "DimonQuest"
git config --global user.email "your-email@example.com"
```

**Замените** `your-email@example.com` на ваш email от GitHub

---

## ШАГ 5: Добавление файлов в Git

### 5.1 Добавьте все файлы
```powershell
git add .
```

**Что происходит:** Git добавляет все файлы проекта в staging area

### 5.2 Проверьте статус
```powershell
git status
```

**Ожидаемый результат:**
```
On branch master

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
        new file:   .gitignore
        new file:   package.json
        new file:   README.md
        new file:   src/main/main.ts
        ... (много файлов)
```

### 5.3 Создайте первый коммит
```powershell
git commit -m "Initial commit: SferaLLM v2.1.0 with proxy and auto-update"
```

**Ожидаемый результат:**
```
[master (root-commit) abc1234] Initial commit: SferaLLM v2.1.0 with proxy and auto-update
 150 files changed, 25000 insertions(+)
 create mode 100644 package.json
 create mode 100644 README.md
 ...
```

---

## ШАГ 6: Подключение к GitHub

### 6.1 Добавьте remote репозиторий
```powershell
git remote add origin https://github.com/DimonQuest/SferaLLM.git
```

### 6.2 Проверьте remote
```powershell
git remote -v
```

**Ожидаемый результат:**
```
origin  https://github.com/DimonQuest/SferaLLM.git (fetch)
origin  https://github.com/DimonQuest/SferaLLM.git (push)
```

### 6.3 Переименуйте ветку в main
```powershell
git branch -M main
```

---

## ШАГ 7: Загрузка кода на GitHub

### 7.1 Загрузите код
```powershell
git push -u origin main
```

**Что происходит:**
```
Enumerating objects: 200, done.
Counting objects: 100% (200/200), done.
Delta compression using up to 8 threads
Compressing objects: 100% (150/150), done.
Writing objects: 100% (200/200), 500.00 KiB | 5.00 MiB/s, done.
Total 200 (delta 50), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (50/50), done.
To https://github.com/DimonQuest/SferaLLM.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

### 7.2 Проверьте на GitHub
```
Откройте в браузере:
https://github.com/DimonQuest/SferaLLM

Вы должны увидеть все файлы проекта!
```

---

## ШАГ 8: Сборка production версии

### 8.1 Убедитесь что зависимости установлены
```powershell
npm install
```

### 8.2 Соберите production версию
```powershell
npm run dist:win -- --publish always
```

**Что происходит:**
```
> sferallm@2.1.0 dist:win
> npm run build && electron-builder --win --publish always

Building TypeScript...
✔ TypeScript compiled successfully

Building webpack...
✔ Webpack build completed

Building Electron app...
  • electron-builder  version=25.1.8
  • loaded configuration  file=package.json ("build" field)
  • writing effective config  file=release\builder-effective-config.yaml
  • packaging       platform=win32 arch=x64 electron=33.2.0 appOutDir=release\win-unpacked
  • building        target=nsis file=release\SferaLLM-Setup-2.1.0.exe
  • building        target=portable file=release\SferaLLM-2.1.0-portable.exe
  • publishing      publisher=Github (owner: DimonQuest, project: SferaLLM)
  • uploading       file=SferaLLM-Setup-2.1.0.exe
  • uploaded        file=SferaLLM-Setup-2.1.0.exe
  • uploading       file=SferaLLM-2.1.0-portable.exe
  • uploaded        file=SferaLLM-2.1.0-portable.exe
  • uploading       file=latest.yml
  • uploaded        file=latest.yml
```

**Время сборки:** ~5-10 минут

---

## ШАГ 9: Проверка Release на GitHub

### 9.1 Откройте страницу релизов
```
URL: https://github.com/DimonQuest/SferaLLM/releases
```

### 9.2 Вы должны увидеть:
```
┌─────────────────────────────────────────┐
│ v2.1.0                                  │
│ Latest                                  │
│                                         │
│ Assets:                                 │
│ • SferaLLM-Setup-2.1.0.exe (150 MB)    │
│ • SferaLLM-2.1.0-portable.exe (150 MB) │
│ • latest.yml (1 KB)                    │
│                                         │
│ Downloads: 0                            │
└─────────────────────────────────────────┘
```

### 9.3 Добавьте описание релиза
```
Нажмите: [Edit release]

Добавьте описание из FINAL-CHECKLIST.md:

# SferaLLM v2.1.0

## ✨ Основные возможности
- 13+ AI провайдеров
- Система прокси (3 режима, 21 страна)
- Мультиагентная коллаборация
- Автообновление
...

Нажмите: [Update release]
```

---

## ШАГ 10: Тестирование автообновления

### 10.1 Установите текущую версию
```
1. Скачайте SferaLLM-Setup-2.1.0.exe из релиза
2. Запустите установщик
3. Установите приложение
4. Запустите SferaLLM
```

### 10.2 Создайте тестовое обновление

**В PowerShell:**
```powershell
# 1. Измените версию
# Откройте package.json и измените:
# "version": "2.1.0" → "version": "2.1.1"

# 2. Создайте коммит
git add package.json
git commit -m "Bump version to 2.1.1"
git push

# 3. Создайте тег
git tag v2.1.1
git push origin v2.1.1

# 4. Соберите и опубликуйте
npm run dist:win -- --publish always
```

### 10.3 Проверьте автообновление
```
1. Запустите установленную версию 2.1.0
2. Подождите 10-30 секунд
3. Должно появиться уведомление:
   ┌─────────────────────────────────┐
   │ ⬇️ Загрузка обновления...       │
   │ ████████░░░░░░░░░░░░ 45%       │
   │ 45% (67MB / 150MB)             │
   └─────────────────────────────────┘

4. После загрузки:
   ┌─────────────────────────────────┐
   │ ✅ Обновление готово!           │
   │ Версия 2.1.1 загружена          │
   │                                 │
   │ [Перезапустить и установить]   │
   │ [Позже]                         │
   └─────────────────────────────────┘

5. Нажмите "Перезапустить и установить"
6. Приложение перезапустится с версией 2.1.1
```

---

## РЕЗУЛЬТАТ

### ✅ Что вы получили:

1. **GitHub репозиторий:** https://github.com/DimonQuest/SferaLLM
2. **Первый релиз:** v2.1.0 с установщиком и portable версией
3. **Автообновление:** работает и протестировано
4. **Публичный проект:** доступен всем пользователям

### 📊 Статистика:

- Файлов в репозитории: ~150
- Размер кода: ~500 KB
- Размер установщика: ~150 MB
- Время сборки: ~5-10 минут
- Время загрузки на GitHub: ~2-5 минут

### 🎯 Следующие шаги:

1. Поделитесь проектом в соцсетях
2. Добавьте скриншоты в README
3. Создайте Wiki на GitHub
4. Соберите feedback от пользователей
5. Выпустите v2.1.1 с улучшениями

---

## TROUBLESHOOTING

### Проблема: "Permission denied" при git push
**Решение:**
```powershell
# Проверьте токен
echo $env:GH_TOKEN

# Если пустой - установите заново
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'ваш_токен', 'User')

# Перезапустите PowerShell
```

### Проблема: "Failed to publish" при сборке
**Решение:**
```powershell
# Проверьте что релиз не существует
# Удалите тег если нужно:
git tag -d v2.1.0
git push origin :refs/tags/v2.1.0

# Соберите заново
npm run dist:win -- --publish always
```

### Проблема: Автообновление не работает
**Решение:**
1. Проверьте что latest.yml загружен в релиз
2. Проверьте что релиз опубликован (не draft)
3. Проверьте версию в package.json
4. Откройте DevTools (F12) и посмотрите логи

---

## КОМАНДЫ ДЛЯ КОПИРОВАНИЯ

### Быстрая публикация обновления:
```powershell
# Измените версию в package.json на 2.1.X
git add .
git commit -m "Release v2.1.X"
git tag v2.1.X
git push origin main
git push origin v2.1.X
npm run dist:win -- --publish always
```

### Проверка статуса:
```powershell
git status
git log --oneline -5
git remote -v
echo $env:GH_TOKEN
```

---

**Инструкция завершена!** 🎉

Все команды готовы к копированию и выполнению.
Следуйте шагам по порядку и всё получится!

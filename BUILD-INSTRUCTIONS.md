# Инструкция по сборке SferaLLM на разных платформах

## 🖥️ Windows (локально) ✅

```bash
npm run dist:win
```

**Результат:**
- `release/SferaLLM Setup 2.1.0.exe` - установщик (~78 MB)
- `release/SferaLLM 2.1.0.exe` - portable версия (~78 MB)

---

## 🐧 Linux (на удалённом сервере через Docker)

### Автоматический скрипт:

```bash
bash build-on-server.sh
```

### Вручную:

1. Скопируйте файлы на сервер:
```bash
scp -r D:/ii/omniroute/SferaLLM-Production/SferaLLM/* dima@192.168.0.136:~/sferallm-build/
```

2. На сервере соберите в Docker:
```bash
ssh dima@192.168.0.136
cd ~/sferallm-build
docker build -f Dockerfile.builder -t sferallm-builder .
docker run --rm -v $(pwd)/release:/app/release sferallm-builder
```

3. Скачайте готовые файлы:
```bash
scp -r dima@192.168.0.136:~/sferallm-build/release/* D:/ii/omniroute/SferaLLM-Production/SferaLLM/release/
```

**Результат:**
- `SferaLLM-2.1.0.AppImage` - универсальный Linux файл
- `sferallm_2.1.0_amd64.deb` - пакет для Debian/Ubuntu

---

## 🍎 macOS (через GitHub Actions)

macOS сборка требует macOS систему. Лучшее решение - GitHub Actions (бесплатно).

Создайте `.github/workflows/release.yml` и запушьте тег:
```bash
git tag v2.1.0
git push origin v2.1.0
```

GitHub автоматически соберёт все платформы!

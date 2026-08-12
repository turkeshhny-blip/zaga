# Как добавлять контент на сайт ZAGA GAME

## Фотографии клуба

Положи файлы в папку:

```
assets/club/
```

Поддерживаются: `.jpg` `.jpeg` `.png` `.webp` (любой регистр).

Имя файла — любое (кириллица, пробелы ок).

**Главное фото Hero (по желанию):**
назови файл `hero.jpg` (или `.png` / `.webp`).

После добавления файлов локально запусти:

```
npm run assets
```

И закоммить обновлённый `js/generated/club-images.js` вместе с картинками на GitHub.

## Обложки игр

Положи файлы в:

```
assets/games/
```

Имя файла ≈ название игры:

| Игра | Примеры имени файла |
|------|---------------------|
| Beat Saber | `beat saber.png`, `beat-saber.jpg` |
| Arizona Sunshine | `arizona.jpg`, `arizona-sunshine.png` |
| Half-Life: Alyx | `half life.jpg`, `half-life.png` |
| Pavlov VR | `pavlov.jpg` |
| GORN | `Gorn.png`, `gorn.jpg` |

Регистр и пробелы не важны. **Редактировать `games.js` не нужно.**

Если файл не найден — на сайте будет fallback с названием игры.

## Отзывы

Открой `js/reviews.js` и добавь объекты в массив `ZAGA_REVIEWS`.
Пустой массив = секция скрыта.

## Цены и телефон

Меняются только в коде (`js/main.js` / HTML) — это не картинки.

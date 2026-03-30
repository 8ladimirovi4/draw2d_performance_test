# draw2d_performance_test

Тестовый стенд для замеров отрисовки схем в браузере с библиотекой [draw2d](https://github.com/freegroup/draw2d) (см. `test_plan.md`).

## Требования

- [Node.js](https://nodejs.org/) 18+ (с поддержкой ES modules)

## Запуск

1. Установите зависимости сервера:

   ```bash
   cd server
   npm install
   ```
2. Запустите HTTP-сервер (Fastify раздаёт статику из каталога `client/`):

   ```bash
   npm start
   ```

   По умолчанию сервер слушает **http://127.0.0.1:3000** .
3. Откройте в браузере корень приложения, например:

   - http://127.0.0.1:3000/

## Параметры окружения


| Переменная | Назначение        | По умолчанию |
| ---------------------- | ----------------------------- | ------------------------- |
| `PORT`               | Порт сервера     | `3000`                  |
| `HOST`               | Адрес привязки | `0.0.0.0`               |

Пример для PowerShell:

```powershell
$env:PORT=8080; npm start
```

## Выбор фикстуры схемы

JSON-файлы лежат в `client/fixtures/`. Имя файла (без `.json`) задаётся query-параметром:

- http://127.0.0.1:3000/?fixture=sample

Если параметр не указан, подгружается `sample`.

Фикстура **`buttons`** (`client/fixtures/buttons.json`) получена из mxGraph-XML `test_schemes/mxGraph(xml)/buttons.xml` конвертером в `tools/mxgraph-to-draw2d/` (геометрия в абсолютных координатах, цвета из `style` / `mxBindings`, подписи для swimlane, кнопок и строк таблицы). Пиксель-в-пиксель как в mxGraph (HTML-разметка таблиц, градиенты и т.п.) не повторяется — используются стандартные фигуры draw2d.

Пример:

- http://127.0.0.1:3000/?fixture=buttons

### Конвертация mxGraph → draw2d JSON

```bash
cd tools/mxgraph-to-draw2d
npm install
node convert.mjs path/to/schema.xml path/to/output.json
node convert.mjs path/to/schema.xml path/to/output_dir
```

Второй аргумент может быть **каталогом** (уже существующим или новым без суффикса `.json`): тогда результат пишется в `<каталог>/<имя_входного_xml>.json`, родительские папки создаются автоматически.

Без аргументов скрипт читает `../../test_schemes/mxGraph(xml)/buttons.xml` и пишет `../../client/fixtures/buttons.json`.

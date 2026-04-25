# Берём официальный Python образ
FROM python:3.12-slim

# Рабочая директория внутри контейнера
WORKDIR /app

# Сначала копируем зависимости (для кэша Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь код
COPY . .

# Применяем миграции и запускаем gunicorn
CMD ["sh", "-c", "python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:8000"]

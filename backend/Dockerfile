FROM python:3.9

WORKDIR /app

# Install requirements
COPY requirements.txt /app
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

EXPOSE 5000
CMD exec gunicorn --bind :5000 --workers 1 --threads 2 --timeout 60 app:app

#!/bin/sh
set -eu

cd /var/www/html

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache

if [ "${WAIT_FOR_DB:-true}" = "true" ]; then
  php -r '
  $host = getenv("DB_HOST") ?: "db";
  $port = getenv("DB_PORT") ?: "3306";
  $database = getenv("DB_DATABASE") ?: "openbk";
  $username = getenv("DB_USERNAME") ?: "openbk";
  $password = getenv("DB_PASSWORD") ?: "openbk";
  $attempts = 30;
  while ($attempts-- > 0) {
      try {
          new PDO("mysql:host={$host};port={$port};dbname={$database}", $username, $password, [
              PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
          ]);
          exit(0);
      } catch (Throwable $e) {
          sleep(2);
      }
  }
  fwrite(STDERR, "Database is not ready.\n");
  exit(1);
  '
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  php artisan migrate --force
fi

if [ "${RUN_DB_SEED:-true}" = "true" ]; then
  php artisan db:seed --force
fi

exec php artisan serve --host=0.0.0.0 --port=8000

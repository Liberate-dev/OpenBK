FROM composer:2 AS composer

FROM php:8.3-cli-alpine

RUN apk add --no-cache bash oniguruma-dev \
    && docker-php-ext-install pdo_mysql mbstring bcmath

COPY --from=composer /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev --no-scripts

COPY . .

RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod +x /var/www/html/docker/entrypoint.sh

USER www-data

EXPOSE 8000

ENTRYPOINT ["/var/www/html/docker/entrypoint.sh"]

# Frontend API Guide

Base URL for all requests: /api

Use this as a simple reference for the frontend app.

## 1) Authentication

Most protected endpoints require a JWT token in the Authorization header.

```http
Authorization: Bearer <token>
```

### Login

POST /api/auth/login

Request body:

```json
{
  "username": "admin",
  "password": "secret"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "token": "<jwt-token>"
  }
}
```

### Logout

POST /api/auth/logout

Success response:

```json
{
  "success": true,
  "data": {
    "message": "Tizimdan muvaffaqiyatli chiqildi"
  }
}
```

---

## 2) Admin endpoints

These endpoints are protected and require login plus main-admin rights.

### Get all admins

GET /api/admins

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "password": "hashed-password",
      "admin_status": "super"
    }
  ]
}
```

### Get one admin

GET /api/admins/:id

### Create admin

POST /api/admins

Body:

```json
{
  "username": "new-admin",
  "password": "secret123",
  "admin_status": "admin"
}
```

### Update username

PUT /api/admins/:id/username

Body:

```json
{
  "username": "new-name"
}
```

### Update password

PUT /api/admins/:id/password

Body:

```json
{
  "password": "new-password"
}
```

### Delete admin

DELETE /api/admins/:id

---

## 3) Categories

### Get all categories

GET /api/categories

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": {
        "uz": "Pitsa",
        "ru": "Пицца",
        "en": "Pizza"
      },
      "order": 1,
      "sectionId": 1
    }
  ]
}
```

### Get one category

GET /api/categories/:id

### Create category

POST /api/categories

Body:

```json
{
  "name": {
    "uz": "Pitsa",
    "ru": "Пицца",
    "en": "Pizza"
  },
  "order": 1,
  "sectionId": 1
}
```

### Update category

PUT /api/categories/:id

Body:

```json
{
  "name": {
    "uz": "Yangilangan pitsa",
    "ru": "Обновлённая пицца",
    "en": "Updated pizza"
  },
  "order": 2
}
```

### Delete category

DELETE /api/categories/:id

---

## 4) Menu items

### Get all menu items

GET /api/menu-items

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category_id": 1,
      "title": {
        "uz": "Margherita",
        "ru": "Маргарита",
        "en": "Margherita"
      },
      "photo": "https://example.com/image.jpg",
      "weight": "320g",
      "price": 35000
    }
  ]
}
```

### Get one menu item

GET /api/menu-items/:id

### Create menu item

POST /api/menu-items

Body:

```json
{
  "category_id": 1,
  "title": {
    "uz": "Margherita",
    "ru": "Маргарита",
    "en": "Margherita"
  },
  "photo": "https://example.com/image.jpg",
  "weight": "320g",
  "price": 35000
}
```

You can also send an image directly:

```json
{
  "category_id": 1,
  "title": {
    "uz": "Margherita",
    "ru": "Маргарита",
    "en": "Margherita"
  },
  "photo": "data:image/jpeg;base64,...",
  "weight": "320g",
  "price": 35000
}
```

The backend uploads the image to Cloudinary when a base64 or remote image is provided and saves the returned URL.

### Update menu item

PUT /api/menu-items/:id

Body example:

```json
{
  "title": {
    "uz": "Yangilangan Margherita",
    "ru": "Обновлённая Маргарита",
    "en": "Updated Margherita"
  },
  "photo": "data:image/jpeg;base64,..."
}
```

### Delete menu item

DELETE /api/menu-items/:id

> Note: Reads are public, while create/update/delete require authentication.

---

## 5) Sections

### Get all sections

GET /api/sections

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": {
        "uz": "Pitsa",
        "ru": "Пицца",
        "en": "Pizza"
      },
      "sort_order": 1
    }
  ]
}
```

### Get one section

GET /api/sections/:id

### Create section

POST /api/sections

Body:

```json
{
  "name": {
    "uz": "Pitsa",
    "ru": "Пицца",
    "en": "Pizza"
  },
  "sort_order": 1
}
```

### Update section

PUT /api/sections/:id

Body:

```json
{
  "name": {
    "uz": "Yangilangan bo'lim",
    "ru": "Обновлённый раздел",
    "en": "Updated section"
  },
  "sort_order": 2
}
```

### Delete section

DELETE /api/sections/:id

---

## 6) Health check

### GET /api/health

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-08-02T00:00:00.000Z"
}
```

---

## 7) Error shape

All failed requests return:

```json
{
  "success": false,
  "error": "Xabar matni"
}
```

Common Uzbek error messages:

- Foydalanuvchi nomi va parol kiritilishi shart
- Foydalanuvchi nomi yoki parol noto'g'ri
- Avtorizatsiya talab qilinadi
- Ruxsat yo'q
- Kategoriya topilmadi
- Menyu elementi topilmadi
- Bo'lim topilmadi
- Resurs topilmadi
- Majburiy maydon to'ldirilmagan
- Bunday yozuv allaqachon mavjud

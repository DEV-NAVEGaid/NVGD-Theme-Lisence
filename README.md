# license-backend

API kode aktivasi theme Shopify. **1 kode = 1 toko.**

Node.js 20+, Express 5, PostgreSQL (`pg`, tanpa ORM). Halaman adminnya ada di repo terpisah: `license-admin`.

## Jalankan

```bash
npm ci
cp .env.example .env     # isi DATABASE_URL + ADMIN_TOKEN
npm run migrate          # membuat tabel, aman diulang
npm start                # default port 3000
```

Deploy di **Coolify** (API + PostgreSQL sekaligus):

1. New Resource → repo ini → Build Pack **Docker Compose**.
2. Deploy. Password DB dan `ADMIN_TOKEN` dibuat otomatis oleh Coolify (lihat tab Environment Variables, `SERVICE_PASSWORD_64_ADMIN` = token admin). Domain juga otomatis, bisa diganti di service `app`.

Migration jalan otomatis saat start, data DB di volume `pgdata`.

Docker saja, DB eksternal (port 8080, migration otomatis saat start):

```bash
docker build -t license-backend .
docker run -d --restart unless-stopped --env-file .env -p 8080:8080 license-backend
```

Health check: `GET /health` → `{"ok":true}`

## Environment

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | connection string PostgreSQL |
| `DATABASE_SSL` | `true` kalau DB butuh SSL |
| `ADMIN_TOKEN` | `openssl rand -hex 32` |
| `ADMIN_ALLOWED_ORIGINS` | domain tempat repo `license-admin` di-hosting, pisahkan dengan koma. Kosong = semua origin boleh (tetap butuh token) |
| `PORT` | default `3000` (Docker `8080`) |
| `TRUST_PROXY` | `1` di belakang nginx/LB |

## Database

Satu tabel `licenses` (`migrations/001_init.sql`):

| Kolom | Isi |
|---|---|
| `license_code` | kode untuk merchant, contoh `NAVEGAID-3456789012-KWR36` |
| `order_id` | nomor order Etsy (wajib) |
| `email` | email pembeli (opsional) |
| `theme_id` | harus sama dengan `THEME_ID` di file theme |
| `store_id` | domain myshopify, NULL sampai kode dipakai pertama kali |
| `status` | `active` / `revoked` |

## Endpoint

**Publik** — dipanggil JS di theme, 60 request/menit per IP:

`POST /api/licenses/verify`
```json
{ "license_key": "NAVEGAID-3456789012-KWR36", "shop": "tokoabc.myshopify.com", "theme": "navegaid-beauty" }
```
Selalu HTTP 200: `{"valid":true}`, `{"valid":true,"activated":true}`, atau `{"valid":false,"reason":"..."}` (`missing_key`, `invalid_shop`, `not_found`, `wrong_theme`, `revoked`, `wrong_shop`).

**Admin** — header `Authorization: Bearer ADMIN_TOKEN`:

| Endpoint | Fungsi |
|---|---|
| `POST /api/admin/licenses` `{theme_id, order_id, email?, note?}` | buat kode |
| `GET /api/admin/licenses?q=&status=&theme=` | cari kode |
| `GET /api/admin/licenses/:code` | detail |
| `POST /api/admin/licenses/:code/reset` | lepas dari toko |
| `POST /api/admin/licenses/:code/revoke` / `restore` | matikan / hidupkan |
| `GET /api/admin/themes` | daftar theme id |

Tes cepat: import `postman_collection.json` ke Postman, isi `base_url` + `admin_token`, lalu Run collection.

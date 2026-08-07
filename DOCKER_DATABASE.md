# PostgreSQL database

ฐานข้อมูลของ Weaponeering ทำงานผ่าน Docker Compose โดยอ่านรหัสผ่านจากไฟล์
`.env.docker` ซึ่งไม่ถูกเก็บใน Git

สร้างไฟล์ตั้งค่าจากตัวอย่างก่อนเปิดระบบครั้งแรก:

```powershell
Copy-Item .env.docker.example .env.docker
```

จากนั้นแก้ `POSTGRES_PASSWORD` ใน `.env.docker` ให้เป็นรหัสผ่านที่ต้องการ

เปิดระบบ:

```powershell
docker compose --env-file .env.docker up -d --build
docker compose --env-file .env.docker ps
```

บริการที่เปิดใช้งาน:

| Service | Address |
| --- | --- |
| Vue API | `http://127.0.0.1:3000/api` |
| PostgreSQL/PostGIS | `127.0.0.1:5433` |
| Adminer | `http://127.0.0.1:8081` |

## เข้าใช้งาน Adminer

เปิด `http://127.0.0.1:8081` แล้วกรอกข้อมูลดังนี้:

| ค่า | ข้อมูล |
| --- | --- |
| System | `PostgreSQL` |
| Server | `postgres` |
| Username | `weaponeering_app` |
| Password | ค่า `POSTGRES_PASSWORD` ใน `.env.docker` |
| Database | `weaponeering_db` |

ตารางของระบบอยู่ที่ schema `app` ได้แก่ `analysis_records`, `app_users`,
`attachments`, `reports` และ `audit_logs`

เปิด `psql` ภายใน container ได้ด้วย:

```powershell
docker compose --env-file .env.docker exec postgres psql -U weaponeering_app -d weaponeering_db
```

คำสั่งพื้นฐานภายใน `psql`:

```sql
-- ดูตารางทั้งหมดใน schema app
\dt app.*

-- ดูคอลัมน์ ชนิดข้อมูล และ Primary Key
\d app.analysis_records

-- ดูข้อมูลหน้าวิเคราะห์ทั้งหมด
SELECT *
FROM app.analysis_records
ORDER BY record_code;

-- ดูเฉพาะข้อมูลที่ยังไม่ถูกลบ
SELECT record_code, target_name, target_type, latitude, longitude,
       recorder_name, created_at
FROM app.analysis_records
WHERE deleted_at IS NULL
ORDER BY record_code;

-- ดูรายการเดียว
SELECT *
FROM app.analysis_records
WHERE record_code = 'TGT - 001';

-- ออกจาก psql
\q
```

เรียกดูข้อมูลจาก PowerShell โดยไม่ต้องเข้า `psql` ก่อน:

```powershell
docker compose --env-file .env.docker exec -T postgres `
  psql -U weaponeering_app -d weaponeering_db `
  -c "SELECT record_code, target_name, target_type, latitude, longitude, recorder_name, created_at FROM app.analysis_records WHERE deleted_at IS NULL ORDER BY record_code;"
```

ฐานข้อมูลมี 5 ตาราง ไม่ใช่ 5 คอลัมน์ โดย `app.analysis_records` มี 23 คอลัมน์
และใช้ `id` เป็น Primary Key

คู่มือฉบับเต็มอยู่ที่ [`docs/database-guide.md`](docs/database-guide.md)

# คู่มือใช้งาน PostgreSQL และ PostGIS

คู่มือนี้อธิบายการใช้งานฐานข้อมูลของโปรเจกต์ Weaponeering UI ตั้งแต่การเปิดระบบ
ตรวจสอบข้อมูล เชื่อมต่อด้วยโปรแกรมภายนอก สำรองข้อมูล และแก้ปัญหาเบื้องต้น

## ภาพรวมระบบ

ระบบประกอบด้วยสาม container:

| Service | หน้าที่ | Address จากเครื่องผู้ใช้ |
| --- | --- | --- |
| `postgres` | PostgreSQL และ PostGIS | `127.0.0.1:5433` |
| `api` | รับคำขอจาก Vue และบันทึกลง PostgreSQL | `http://127.0.0.1:3000/api` |
| `adminer` | เปิดดูและจัดการฐานข้อมูลผ่านเว็บ | `http://127.0.0.1:8081` |

ระบบมี named volumes สองชุด:

| Volume | Mount point | หน้าที่ |
| --- | --- | --- |
| `postgres_data` | `/var/lib/postgresql/data` | เก็บข้อมูล PostgreSQL |
| `media_data` | `/app/server_media` | เก็บไฟล์รูปจากหน้าวิเคราะห์แบบถาวร |

เมื่อบันทึกหน้าวิเคราะห์ ระบบจะเก็บรูปเป้าหมายและสร้างภาพแผนที่ 1200×675 จาก
พิกัดที่กรอก พร้อมฝัง LAT/LON ลงบนภาพ API จะแปลงรูปทั้งสองเป็นไฟล์ใน media
volume และเก็บ metadata ใน `app.attachments` ได้แก่ประเภท ชื่อเดิม ชนิดไฟล์
ขนาด checksum และ record เจ้าของ รองรับ PNG, JPEG, GIF และ BMP ขนาดไม่เกิน
8 MB ต่อรูป

ค่า `attachment_type` แบ่งไฟล์เป็นสองประเภท:

- `target_image` — รูปเป้าหมายที่ผู้ใช้เลือก
- `coordinate_map` — ภาพแผนที่ 1200×675 ที่ระบบสร้างพร้อม LAT/LON

หน้า Vue ไม่เชื่อม PostgreSQL โดยตรง แต่ส่งข้อมูลผ่าน API:

```text
Vue → /api → Node API → PostgreSQL/PostGIS
```

ชื่อฐานข้อมูลและชื่อผู้ใช้กำหนดใน `compose.yaml`

## 1. เปิดระบบ

เปิด Docker Desktop แล้วเปิด PowerShell ที่โฟลเดอร์โปรเจกต์:

```powershell
cd C:\Users\panup\Documents\GitHub\weaponeering_ui
Copy-Item .env.docker.example .env.docker
docker compose --env-file .env.docker up -d --build
```

ก่อนเปิดระบบ ให้แก้ `POSTGRES_PASSWORD` ใน `.env.docker` เป็นรหัสผ่านที่ต้องการ

ตรวจสถานะ:

```powershell
docker compose --env-file .env.docker ps
```

`api` และ `postgres` ควรแสดงสถานะ `healthy` ส่วน `adminer` ควรแสดงสถานะ `Up`

ตรวจ API:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

ผลลัพธ์ที่ถูกต้องคือ `status` เท่ากับ `ok`

จากนั้นเปิดหน้า Vue:

```powershell
npm run dev
```

เข้าใช้งานที่ `http://localhost:5173`

## 2. หยุดและเปิดใหม่

หยุด container โดยไม่ลบข้อมูล:

```powershell
docker compose --env-file .env.docker down
```

เปิดใหม่โดยไม่ต้อง build image ซ้ำ:

```powershell
docker compose --env-file .env.docker up -d
```

รีสตาร์ตเฉพาะ API:

```powershell
docker compose --env-file .env.docker restart api
```

รีสตาร์ตเฉพาะ PostgreSQL:

```powershell
docker compose --env-file .env.docker restart postgres
```

ข้อมูลยังอยู่หลัง `down` หรือ restart เพราะเก็บใน Docker volume ชื่อ
`weaponeering_postgres_data`

## 3. เข้า PostgreSQL ผ่าน Terminal

```powershell
docker compose --env-file .env.docker exec postgres psql -U weaponeering_app -d weaponeering_db
```

คำสั่งพื้นฐานภายใน `psql`:

```text
\dn                 แสดง schema
\dt app.*           แสดงตารางใน schema app
\d app.analysis_records
                    แสดงโครงสร้างตาราง analysis_records
\dx                 แสดง extensions รวมถึง PostGIS
\q                  ออกจาก psql
```

คำสั่งที่ขึ้นต้นด้วย `\` เป็นคำสั่งของ `psql` จึงไม่ต้องใส่ semicolon ส่วน SQL
ปกติต้องปิดท้ายด้วย `;`

## 4. เชื่อมต่อด้วยโปรแกรม GUI

ใช้ DBeaver, pgAdmin หรือ DataGrip แล้วสร้าง PostgreSQL connection ด้วยค่าต่อไปนี้:

| ค่า | ตัวอย่าง |
| --- | --- |
| Host | `127.0.0.1` |
| Port | `5433` |
| Database | `weaponeering_db` |
| Username | `weaponeering_app` |
| Password | ค่า `POSTGRES_PASSWORD` ใน `.env.docker` |
| SSL | ปิดสำหรับ local development |

หลังเชื่อมต่อ ให้เปิด `Schemas → app → Tables`

หรือเปิด Adminer ที่ `http://127.0.0.1:8081` แล้วกรอก:

| ค่า | ข้อมูล |
| --- | --- |
| System | `PostgreSQL` |
| Server | `postgres` |
| Username | `weaponeering_app` |
| Password | ค่า `POSTGRES_PASSWORD` ใน `.env.docker` |
| Database | `weaponeering_db` |

## 5. ตารางหลัก

เลข 5 หมายถึงมี 5 ตาราง ไม่ใช่ 5 คอลัมน์ โครงสร้างปัจจุบันเป็นดังนี้:

| ตาราง | จำนวนคอลัมน์ | Primary Key | หน้าที่ |
| --- | ---: | --- | --- |
| `app.analysis_records` | 23 | `id` | ข้อมูลที่บันทึกจากหน้าวิเคราะห์ |
| `app.app_users` | 7 | `id` | ผู้ใช้งานและบทบาท `viewer`, `analyst`, `admin` |
| `app.attachments` | 9 | `id` | metadata ของรูปเป้าหมายและภาพพิกัด |
| `app.audit_logs` | 8 | `id` | ประวัติ insert, update และ delete |
| `app.reports` | 6 | `id` | metadata ของ PDF หรือ DOCX ที่สร้างแล้ว |



## 6. ตรวจข้อมูลที่บันทึกจากหน้าวิเคราะห์

ดูข้อมูลทั้งหมดโดยเรียงตามรหัส TGT:

```sql
SELECT *
FROM app.analysis_records
ORDER BY record_code;
```

ดูเฉพาะรายการเดียว:

```sql
SELECT *
FROM app.analysis_records
WHERE record_code = 'TGT - 001';
```

หากผลลัพธ์กว้างเกินหน้าจอ ให้ใช้ `\x` ใน `psql` เพื่อสลับเป็นการแสดงผลแนวตั้ง

ดูรายการล่าสุด:

```sql
SELECT
    id,
    record_code,
    target_name,
    recorder_name,
    latitude,
    longitude,
    created_at
FROM app.analysis_records
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

ดูพิกัด PostGIS:

```sql
SELECT
    record_code,
    ST_AsText(location::geometry) AS location
FROM app.analysis_records
WHERE location IS NOT NULL;
```

นับจำนวนข้อมูล ซึ่งควรตรงกับตัวเลข “บันทึกในระบบแล้ว” บนหน้าเว็บ:

```sql
SELECT count(*)
FROM app.analysis_records
WHERE deleted_at IS NULL;
```

เรียกดูจาก PowerShell โดยไม่ต้องเข้า `psql` ก่อน:

```powershell
docker compose --env-file .env.docker exec -T postgres `
  psql -U weaponeering_app -d weaponeering_db `
  -c "SELECT record_code, target_name, target_type, latitude, longitude, recorder_name, created_at FROM app.analysis_records WHERE deleted_at IS NULL ORDER BY record_code;"
```

ดูชื่อคอลัมน์และชนิดข้อมูลทุกตาราง:

```powershell
docker compose --env-file .env.docker exec -T postgres `
  psql -U weaponeering_app -d weaponeering_db `
  -c "SELECT table_name, column_name, data_type, character_maximum_length, is_nullable FROM information_schema.columns WHERE table_schema = 'app' ORDER BY table_name, ordinal_position;"
```

ดู audit log ล่าสุด:

```sql
SELECT table_name, row_id, operation, actor, occurred_at
FROM app.audit_logs
ORDER BY occurred_at DESC
LIMIT 20;
```

ดู metadata ของรูปพร้อมรหัส TGT:

```sql
SELECT
    r.record_code,
    a.attachment_type,
    a.original_filename,
    a.content_type,
    a.size_bytes,
    a.checksum_sha256,
    a.created_at
FROM app.attachments AS a
JOIN app.analysis_records AS r ON r.id = a.analysis_record_id
ORDER BY a.created_at DESC;
```

## 7. ตัวอย่างการค้นหาเชิงพื้นที่

ค้นหารายการภายในระยะ 5 กิโลเมตรจากจุดตัวอย่าง:

```sql
SELECT
    record_code,
    target_name,
    round(
        ST_Distance(
            location,
            ST_SetSRID(ST_MakePoint(100.5018, 13.7563), 4326)::geography
        )::numeric,
        2
    ) AS distance_meters
FROM app.analysis_records
WHERE location IS NOT NULL
  AND ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(100.5018, 13.7563), 4326)::geography,
      5000
  )
ORDER BY distance_meters;
```

PostGIS ใช้ลำดับพิกัด `longitude, latitude` เมื่อสร้าง `Point`

## 8. API ที่มีในปัจจุบัน

ตรวจสุขภาพระบบ:

```text
GET /api/health
```

นับข้อมูลที่ยังไม่ถูก soft delete:

```text
GET /api/analysis-records/count
```

อ่านรายการล่าสุด สูงสุด 500 รายการ:

```text
GET /api/analysis-records
```

เปิดการเชื่อมต่อ realtime สำหรับหน้า Reports:

```text
GET /api/analysis-records/events
Content-Type: text/event-stream
```

API ส่ง event ชื่อ `changed` เมื่อมีการสร้าง แก้ไข หรือลบข้อมูล และ browser จะ
เชื่อมต่อใหม่อัตโนมัติหากการเชื่อมต่อ SSE หลุดชั่วคราว

บันทึกข้อมูลจากหน้าวิเคราะห์:

```text
POST /api/analysis-records
Content-Type: application/json
```

ไม่ต้องส่ง `tgt` เมื่อสร้างรายการ เพราะ PostgreSQL จะกำหนดรหัส TGT ถัดไปให้
อัตโนมัติ และ API จะไม่อนุญาตให้เปลี่ยนรหัสนี้ภายหลัง

หากมีรูป ให้ส่ง `imagePreview` เป็น image data URL และ `imageName` เป็นชื่อไฟล์
API จะตรวจชนิดไฟล์ ลายเซ็นของไฟล์ และขนาดก่อนบันทึก

หน้า Analysis จะสร้าง `coordinateImagePreview` และ `coordinateImageName`
อัตโนมัติจาก Cesium map และพิกัดที่กรอกก่อนเรียก API

เรียกไฟล์รูปที่ API ส่งกลับมาใน `imagePreview`:

```text
GET /api/media/:objectKey
```

แก้ไขรายการ:

```text
PATCH /api/analysis-records/:id
Content-Type: application/json
```

เมื่อแก้ Latitude/Longitude จากหน้า Reports ระบบจะสร้างภาพ `coordinate_map`
จากพิกัดใหม่ แทนที่ metadata ใน `app.attachments` และลบไฟล์ภาพพิกัดเดิมหลัง
transaction สำเร็จ

ลบรายการพร้อมข้อมูล attachments/reports และไฟล์รูปที่อ้างอิงรายการนั้น:

```text
DELETE /api/analysis-records/:id
```

หลังลบสำเร็จ API จะจัดหมายเลข `TGT` ของรายการที่เหลือให้ต่อเนื่องภายใน
transaction เดียวกัน และรายการใหม่จะได้รับหมายเลขถัดจากรายการสุดท้าย
ตัวอย่างเช่น เมื่อลบ `TGT - 003` รายการเดิม `TGT - 004` จะเลื่อนเป็น
`TGT - 003` แต่ `id` ชนิด UUID จะไม่เปลี่ยน จึงไม่ทำให้รูปภาพหรือข้อมูลที่
เชื่อมโยงกับรายการสลับกัน

ตัวอย่างทดสอบ count จาก PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/analysis-records/count
```

API ตรวจช่วงของ latitude, longitude, Pk และ CEP ก่อนส่งข้อมูลเข้า PostgreSQL

## 9. สำรองข้อมูล

สร้างโฟลเดอร์ backup หากยังไม่มี:

```powershell
New-Item -ItemType Directory -Force database\backups
```

สร้าง backup ภายใน container:

```powershell
docker compose --env-file .env.docker exec postgres pg_dump `
  -U weaponeering_app `
  -d weaponeering_db `
  -Fc `
  -f /tmp/weaponeering_db.dump
```

คัดลอก backup ออกมายังเครื่อง:

```powershell
docker compose --env-file .env.docker cp `
  postgres:/tmp/weaponeering_db.dump `
  database/backups/weaponeering_db.dump
```

ไฟล์ใน `database/backups/` ถูก Git ignore ควรคัดลอก backup สำคัญไปยังพื้นที่
สำรองที่เข้ารหัสและควบคุมสิทธิ์อีกแห่งหนึ่ง

### สำรองไฟล์รูปใน media volume

สร้างไฟล์ archive ภายใน API container:

```powershell
docker compose --env-file .env.docker exec api `
  tar -czf /tmp/weaponeering_media.tar.gz -C /app/server_media .
```

คัดลอก archive ออกมายังเครื่อง:

```powershell
docker compose --env-file .env.docker cp `
  api:/tmp/weaponeering_media.tar.gz `
  database/backups/weaponeering_media.tar.gz
```

ควรสำรองทั้ง PostgreSQL dump และ media archive ในรอบเดียวกัน เพื่อให้ metadata
ใน `app.attachments` ตรงกับไฟล์รูปจริง

### ทดสอบ restore โดยไม่เขียนทับฐานข้อมูลหลัก

คัดลอกไฟล์กลับเข้า container:

```powershell
docker compose --env-file .env.docker cp `
  database/backups/weaponeering_db.dump `
  postgres:/tmp/weaponeering_db.dump
```

สร้างฐานข้อมูลทดสอบและ restore:

```powershell
docker compose --env-file .env.docker exec postgres createdb `
  -U weaponeering_app `
  weaponeering_restore_test

docker compose --env-file .env.docker exec postgres pg_restore `
  -U weaponeering_app `
  -d weaponeering_restore_test `
  --no-owner `
  --no-acl `
  /tmp/weaponeering_db.dump
```

ควรทดสอบ restore เป็นระยะ เพราะ backup ที่ไม่เคยทดสอบอาจใช้งานไม่ได้เมื่อจำเป็น

## 10. การแก้ schema

ไฟล์ใน `database/init/` ทำงานอัตโนมัติเฉพาะตอนสร้าง Docker volume ครั้งแรก
การแก้ไฟล์ init จะไม่เปลี่ยนฐานข้อมูลที่ทำงานอยู่โดยอัตโนมัติ

สำหรับฐานข้อมูลที่มีข้อมูลแล้ว ให้สร้าง migration ใหม่และรันด้วย:

```powershell
docker compose --env-file .env.docker exec -T postgres psql `
  -U weaponeering_app `
  -d weaponeering_db `
  -v ON_ERROR_STOP=1 `
  -f /docker-entrypoint-initdb.d/ชื่อไฟล์.sql
```

สำรองข้อมูลก่อน migration ทุกครั้ง และควรทดสอบ migration กับฐานข้อมูลสำเนาก่อน

## 11. เปลี่ยนรหัสผ่านฐานข้อมูล

การแก้ `POSTGRES_PASSWORD` ใน `.env.docker` เพียงอย่างเดียวจะไม่เปลี่ยนรหัสผ่าน
ใน PostgreSQL หาก volume ถูกสร้างไปแล้ว ต้องเปลี่ยนทั้งสองจุดให้ตรงกัน

เข้า `psql` แล้วสั่ง:

```sql
ALTER ROLE weaponeering_app WITH PASSWORD 'ใส่รหัสผ่านใหม่ที่ยาวและคาดเดายาก';
```

จากนั้นแก้ `POSTGRES_PASSWORD` ใน `.env.docker` ให้เป็นค่าเดียวกัน แล้วสร้าง API
container ใหม่:

```powershell
docker compose --env-file .env.docker up -d --force-recreate api
```

สำหรับ production ให้ย้ายรหัสผ่านออกจาก Compose ไปใช้ Docker Secrets หรือ secret
manager และห้ามใช้ development password ชุดนี้

## 12. แก้ปัญหาเบื้องต้น

### Docker engine ไม่ทำงาน

เปิด Docker Desktop รอให้ engine พร้อม แล้วรัน:

```powershell
docker info
docker compose --env-file .env.docker up -d
```

### Port 5433 ถูกใช้งานอยู่

เปลี่ยน published port ใน `compose.yaml` เช่น:

```yaml
ports:
  - "127.0.0.1:5434:5432"
```

จากนั้นรัน `docker compose --env-file .env.docker up -d` ใหม่ โปรแกรม GUI ต้องเชื่อมต่อด้วย port ใหม่
แต่ API container ยังคงเชื่อม PostgreSQL ภายใน Docker network ที่ port 5432

### ปุ่มบันทึกแจ้งว่า API ใช้งานไม่ได้

ตรวจสถานะและ log:

```powershell
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs api --tail 100
docker compose --env-file .env.docker logs postgres --tail 100
```

ตรวจ API โดยตรง:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
```

### แก้ init SQL แล้วไม่เกิดผล

เป็นพฤติกรรมปกติ เพราะ init scripts ทำงานเฉพาะ volume ใหม่ ให้ใช้ migration
ตามหัวข้อ “การแก้ schema” ห้ามลบ volume เพื่อแก้ปัญหานี้หากยังไม่ได้สำรองข้อมูล

## 13. รีเซ็ตฐานข้อมูลสำหรับเครื่องพัฒนาเท่านั้น

> คำเตือน: ขั้นตอนนี้ลบฐานข้อมูลและ Docker volume ทั้งหมดอย่างถาวร
> ใช้เฉพาะเมื่อยืนยันแล้วว่าไม่มีข้อมูลที่ต้องเก็บและมี backup ที่กู้คืนได้

```powershell
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker up -d --build
```

หลังสร้าง volume ใหม่ สคริปต์ใน `database/init/` จะทำงานอีกครั้ง

## 14. แนวทางความปลอดภัย

- เปิด port ฐานข้อมูลเฉพาะ `127.0.0.1` ตาม Compose ปัจจุบัน
- ไม่ให้ Vue หรือ browser ถือรหัสผ่าน PostgreSQL
- ไม่ commit backup หรือข้อมูลจริง
- ใช้ API validation และ parameterized SQL เท่านั้น
- เพิ่ม authentication และ authorization ก่อนเปิดระบบให้ผู้ใช้งานหลายคน
- สำรองข้อมูลแบบเข้ารหัสและทดสอบ restore เป็นประจำ
- ตรวจ `app.audit_logs` เมื่อต้องติดตามการเปลี่ยนแปลงข้อมูล
- ไม่ใช้ development password ใน production และย้าย password ไป secret manager

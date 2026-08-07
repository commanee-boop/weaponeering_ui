# Weaponeering Analysis System UI

Vue 3 application for target analysis, Cesium map visualization, AI-assisted recommendations, report management, and document export.

## Technology Stack

- Vue 3 with Vite
- Bootstrap 5 and Bootstrap Icons
- Vue Router 4
- Cesium
- Axios
- `docx`, jsPDF, and html2canvas for document export
- Local storage and mock data for the current prototype

## Main Features

### Target Analysis

1. เลือกแหล่งที่มาและระดับความสำคัญของเป้าหมาย
2. เลือกประเภทเป้าหมาย ลักษณะสิ่งก่อสร้าง และระดับความแข็งแรง
3. กรอกพิกัด Latitude/Longitude
4. อัปโหลดรูปภาพเป้าหมายและกรอกรายละเอียด
5. กรอกค่า Pk และ CEP โดยการส่งออก CEP จะไม่ต่อท้ายหน่วย
6. วิเคราะห์ข้อมูลและแสดงคำแนะนำ
7. บันทึกข้อมูลในเครื่อง

### Map

- Cesium geographic visualization
- แสดงตำแหน่งเป้าหมายและเขตผลกระทบ
- อัปเดตตามพิกัดจากแบบฟอร์ม

### Results and Export

- แสดงคำแนะนำ ผลการวิเคราะห์ และ AI Assistant
- ส่งออกเฉพาะ PDF และ Word
- เอกสาร A4 แนวนอน พร้อมรูปภาพอยู่เหนือตารางสรุป
- Word ใช้ฟอนต์ TH Sarabun New ขนาด 16 pt

### Reports

- รายการและสถิติข้อมูลเป้าหมาย
- Edit Data สำหรับแก้ไขข้อมูลเป้าหมาย PRI พิกัด ความสูง ระดับความแข็งแรง ผลกระทบ และอาวุธที่ใช้
- ส่งออก PDF/Word และลบรายการ

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

Development server: `http://localhost:5173`

## PostgreSQL + PostGIS

คู่มือฉบับเต็ม: [`docs/database-guide.md`](docs/database-guide.md)

The local database runs in Docker and listens only on `127.0.0.1`.

```bash
docker compose --env-file .env.docker up -d --build
docker compose --env-file .env.docker ps
```

PostgreSQL is available to host-side database tools at `127.0.0.1:5433`.
Adminer is available at `http://127.0.0.1:8081`.

Connection settings are defined directly in `compose.yaml`. This is intended for
local development only because the database password is stored as plain text. The
initialization scripts in `database/init/` create the PostGIS extensions and the
initial `app` schema when the Docker volume is created for the first time.

Connect with `psql` inside the container:

```bash
docker compose --env-file .env.docker exec postgres psql -U weaponeering_app -d weaponeering_db
```

Stop the database without deleting its data:

```bash
docker compose --env-file .env.docker down
```

The API is available at `http://127.0.0.1:3000/api`. During local development,
Vite proxies `/api` requests to this service. Start the Vue application after the
Docker services are healthy:

```bash
npm run dev
```

Images saved from the Analysis page are stored as files in the persistent
`weaponeering_media_data` Docker volume. PostgreSQL stores their filename,
content type, size, checksum, and owning analysis record in `app.attachments`.
Supported image formats are PNG, JPEG, GIF, and BMP, up to 8 MB per image.
When coordinates are analyzed and saved, the UI also captures a 1200x675 map
image with the latitude and longitude overlay. Reports display the target photo
and coordinate map side by side, and include both in PDF/Word exports.

To intentionally recreate an empty local database, remove the Compose volume and
start the service again. This permanently deletes the local database, so export a
backup first.

## Project Structure

```text
src/
|-- components/       # Reusable Vue components
|-- views/            # Page components
|-- services/         # Mock API and export services
|-- router/           # Vue Router configuration
|-- App.vue           # Root component
`-- main.js           # Entry point
```

## Browser Support

Latest Chrome, Firefox, Safari, and Edge.

## License

Proprietary - Weaponeering System

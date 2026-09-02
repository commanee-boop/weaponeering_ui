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

การติดตั้ง เชื่อมต่อ ตรวจสอบ สำรอง กู้คืน และแก้ปัญหาฐานข้อมูลรวมอยู่ใน
[`docs/database-guide.md`](docs/database-guide.md) 

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

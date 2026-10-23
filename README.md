# เว็บสำรวจอุปกรณ์สาขา — GitHub Pages

หน้า index.html จะเปิดต่อไปยังเว็บสำรวจ Google Apps Script ที่เชื่อม Google Sheets เดิม โดยใช้การนำทางทั้งหน้า ไม่ฝัง iframe

## นำขึ้น GitHub Pages
1. สร้าง repository ใหม่ หรือเปิด repository ที่ต้องการใช้
2. อัปโหลด index.html และ .nojekyll จากโฟลเดอร์นี้ไปที่รากของ repository โดยชื่อ index.html ต้องเป็นตัวพิมพ์เล็ก
3. บันทึกการอัปโหลดด้วย Commit changes
4. ไปที่ Settings > Pages
5. ใน Build and deployment เลือก Source เป็น Deploy from a branch
6. เลือก branch ที่มีไฟล์ เช่น main และเลือก /(root) แล้วกด Save
7. รอ GitHub แสดงลิงก์เว็บ แล้วเปิดลิงก์นั้น หน้าเว็บจะเปิดต่อไปยัง Google Apps Script

หาก repository มีเว็บไซต์เดิมอยู่แล้ว ให้วางไฟล์ในโฟลเดอร์ย่อยแทนการเขียนทับ index.html เดิม แล้วเปิด URL ของโฟลเดอร์นั้น

## การเข้าถึงข้อมูล
- GitHub Pages เป็นหน้าเปิดต่อเท่านั้น ตารางและการอ่าน/บันทึกทำงานบน Google Apps Script
- ไม่ต้องใส่ API key รหัสผ่าน หรือข้อมูลสาขาใน repository
- เว็บ Google ที่เผยแพร่ไว้ปัจจุบันตั้งให้เข้าถึงเฉพาะบัญชีเจ้าของ การนำขึ้น GitHub ไม่ได้เพิ่มสิทธิ์ให้บุคคลอื่น
- การเปลี่ยนฟอร์มทำที่ Apps Script แล้วเผยแพร่เวอร์ชันใหม่โดยคง deployment เดิม
- หากเปลี่ยน deployment URL ต้องแก้ URL ใน index.html ทั้งตำแหน่ง meta refresh และปุ่มเปิดเว็บ

ยังไม่ได้อัปโหลดไฟล์ไปยัง GitHub เพราะยังไม่ได้ระบุ repository ปลายทาง

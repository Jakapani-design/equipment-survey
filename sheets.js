/* GitHub Pages -> Google Identity Services -> Google Sheets API.
   Access tokens remain in memory. No proxy, API key or client secret. */
window.SheetConnection = (() => {
  const config = window.SURVEY_CONFIG;
  const scope = 'https://www.googleapis.com/auth/spreadsheets';
  const tabs = ['01 PC1','02 PC2','03 PC3','04 Cash Drawer','05 IPAD SR','06 IPAD SALE','07 IPAD DOCTOR','08 IPAD SP','09 IPAD NURSE','10 Webcam','11 Fingerprint Scanner','12 ReceiptPrinter','13 ID Card Reader1','14 ID Card Reader2','15 Passport Reader','16 Credit Card Reader','17 QR Code Reader-Barcode Reade'];
  let token = '', expiry = 0, client = null, sheetIds = null;
  const root = 'https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(config.spreadsheetId);
  const quote = s => "'" + s.replaceAll("'", "''") + "'";
  const normalized = row => Array.from({length:5}, (_,i) => row[i] ?? '');
  const version = row => JSON.stringify(normalized(row));
  const dateText = v => typeof v === 'number' ? new Date(Math.round((v-25569)*86400000)).toISOString().slice(0,10) : String(v || '');
  function connected() { return !!token && Date.now() < expiry; }
  function forget() { token='';expiry=0;sheetIds=null; }
  async function request(path, options={}) {
    if (!connected()) throw Error('กรุณากดเชื่อมต่อ Google ก่อน หรือเชื่อมต่อใหม่เมื่อสิทธิ์หมดอายุ');
    let response;
    try { response=await fetch(root+path,{...options,cache:'no-store',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...(options.headers||{})}}); }
    catch (_) {throw Error('การเชื่อมต่อขัดข้อง หากกำลังบันทึกให้โหลดข้อมูลใหม่และตรวจชีตก่อนส่งซ้ำ');}
    let result;try{result=await response.json();}catch(_){throw Error('Google ส่งผลลัพธ์ไม่สมบูรณ์ กรุณาตรวจชีตก่อนส่งซ้ำ');}
    if(!response.ok){if(response.status===401)forget();throw Error(response.status===401?'สิทธิ์หมดอายุ กรุณาเชื่อมต่อ Google ใหม่':response.status===403?'ไม่มีสิทธิ์เข้าถึงชีต หรือยังไม่ได้เปิด Google Sheets API ในโปรเจกต์ OAuth':response.status===429?'Google จำกัดจำนวนคำขอ กรุณารอสักครู่แล้วโหลดข้อมูลใหม่':result.error?.message||'Google Sheets ตอบกลับ '+response.status);}
    return result;
  }
  async function ranges(list) {
    const query=new URLSearchParams({valueRenderOption:'UNFORMATTED_VALUE',dateTimeRenderOption:'SERIAL_NUMBER'});
    list.forEach(r=>query.append('ranges',r));return (await request('/values:batchGet?'+query)).valueRanges||[];
  }
  function record(row,index) {
    const cells=Array.from({length:8},(_,i)=>row[i]??'');
    return {row:index,branch:String(cells[1]),quantity:cells[2],reason:String(cells[3]),surveyor:String(cells[4]),date:dateText(cells[5]),note:String(cells[6]),status:String(cells[7]),version:version(cells.slice(2,7))};
  }
  async function getSurvey() {
    if(!sheetIds){const m=await request('?fields=sheets.properties(sheetId,title)');sheetIds=new Map(m.sheets.map(s=>[s.properties.title,s.properties.sheetId]));}
    tabs.forEach(t=>{if(!sheetIds.has(t))throw Error('ไม่พบแท็บ '+t);});
    const blocks=await ranges([quote('สรุปและผู้สำรวจ')+'!B8:B24',...tabs.map(t=>quote(t)+'!A6:H98')]);
    const owners=blocks[0]?.values||[];
    return {equipment:tabs.map((t,i)=>({id:i,name:i===16?'QR Code Reader/Barcode Reader':t.slice(3),owner:String(owners[i]?.[0]||''),records:Array.from({length:93},(_,j)=>record(blocks[i+1]?.values?.[j]||[],j+6))})),loadedAt:new Date().toISOString()};
  }
  function validate(p) {
    if(!p||!Number.isInteger(p.equipment)||p.equipment<0||p.equipment>=tabs.length||!Number.isInteger(p.row)||p.row<6||p.row>98)throw Error('รายการไม่ถูกต้อง');
    if(typeof p.quantity!=='number'||!Number.isSafeInteger(p.quantity)||p.quantity<0)throw Error('กรอกจำนวนเต็มตั้งแต่ 0 ขึ้นไป');
    if(p.quantity>1&&!String(p.reason||'').trim())throw Error('กรุณาระบุเหตุผลเมื่อจำนวนมากกว่า 1');
    if(!String(p.surveyor||'').trim())throw Error('กรุณาระบุผู้สำรวจ');
    for(const [k,max]of [['reason',2000],['surveyor',200],['note',2000]])if(String(p[k]||'').length>max)throw Error('ข้อความยาวเกินกำหนด');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date||'')||!Number.isFinite(Date.parse(p.date+'T00:00:00Z'))||new Date(p.date+'T00:00:00Z').toISOString().slice(0,10)!==p.date)throw Error('วันที่ไม่ถูกต้อง');
  }
  async function saveMany(items) {
    if(!Array.isArray(items)||items.length<1||items.length>93)throw Error('จำนวนแถวไม่ถูกต้อง');
    items.forEach(validate);const keys=items.map(p=>p.equipment+':'+p.row);if(new Set(keys).size!==items.length)throw Error('มีแถวซ้ำ');
    if(!sheetIds)await getSurvey();
    const before=await ranges(items.map(p=>quote(tabs[p.equipment])+'!C'+p.row+':G'+p.row));
    items.forEach((p,i)=>{if(version(before[i]?.values?.[0]||[])!==p.version)throw Error('ข้อมูลสาขาแถว '+p.row+' เปลี่ยนแล้ว กรุณาโหลดใหม่ก่อนบันทึก');});
    const requests=items.map(p=>({updateCells:{range:{sheetId:sheetIds.get(tabs[p.equipment]),startRowIndex:p.row-1,endRowIndex:p.row,startColumnIndex:2,endColumnIndex:7},rows:[{values:[
      {userEnteredValue:{numberValue:p.quantity}},
      {userEnteredValue:{stringValue:String(p.reason||'').trim()}},
      {userEnteredValue:{stringValue:String(p.surveyor).trim()}},
      {userEnteredValue:{numberValue:Date.parse(p.date+'T00:00:00Z')/86400000+25569}},
      {userEnteredValue:{stringValue:String(p.note||'').trim()}}
    ]}],fields:'userEnteredValue'}}));
    await request(':batchUpdate',{method:'POST',body:JSON.stringify({requests})});
    const after=await ranges(items.map(p=>quote(tabs[p.equipment])+'!A'+p.row+':H'+p.row));
    return items.map((p,i)=>record(after[i]?.values?.[0]||[],p.row));
  }
  function connect() {
    if(!config.clientId||!config.clientId.endsWith('.apps.googleusercontent.com'))return Promise.reject(Error('ยังไม่ได้ตั้งค่า Google OAuth Client ID ใน config.js'));
    if(!window.google?.accounts?.oauth2)return Promise.reject(Error('กำลังโหลด Google Sign-In กรุณาลองใหม่ หรือตรวจว่าบราวเซอร์ไม่ได้บล็อก accounts.google.com'));
    return new Promise((resolve,reject)=>{
      client=google.accounts.oauth2.initTokenClient({client_id:config.clientId,scope,callback:r=>{if(r.error){reject(Error(r.error_description||r.error));return;}token=r.access_token;expiry=Date.now()+Math.max(0,Number(r.expires_in)-60)*1000;resolve();},error_callback:e=>reject(Error(e.type==='popup_closed'?'ปิดหน้าลงชื่อเข้าใช้แล้ว กรุณากดเชื่อมต่อใหม่':e.type||'เปิดหน้าลงชื่อเข้าใช้ไม่ได้'))});
      client.requestAccessToken({prompt:''});
    });
  }
  async function disconnect(){const current=token;forget();if(current&&window.google?.accounts?.oauth2)await new Promise(resolve=>google.accounts.oauth2.revoke(current,resolve));}
  return {connect,disconnect,connected,getSurvey,saveMany,saveSurvey:async p=>(await saveMany([p]))[0]};
})();

// --- scriptkaset.js : Logic สำหรับพืชเศรษฐกิจและปศุสัตว์ (General Agriculture) ---
// อัปเดตล่าสุด: บูรณาการยุทธศาสตร์สวนทุเรียนสมัยใหม่ (Modern Durian Orchard Management) & ข้าวโพดเลี้ยงสัตว์

// 1. ข้อมูลพืชและสัตว์เศรษฐกิจ (Kaset Presets)
const KASET_PRESETS = {
    // --- พืชสวน (Orchards) ---
    'durian': {
        name: 'ทุเรียนหมอนทอง (Modern Farm - Mock)',
        category: 'premium_durian', 
        price: 150, // ราคาเกรดส่งออก A
        yield: 2500, // กก./ไร่ (เป้าหมาย 2.5 ตัน)
        lifespan: 25,
        wait_years: 6, // แก้ไข: ระยะเวลาเริ่มให้ผลผลิตจริงตามสรีรวิทยา (ไม่ใช่ 3 ปี)
        cost_init: 85000, // รวมค่าปรับที่ดิน ยกโคก ระบบน้ำอัจฉริยะ
        cost_maint: 45000, // รวมค่าปุ๋ย ยา IPM และแรงงานฝีมือปัดดอก/แต่งลูก
        risk: 'High',
        desc: 'ราชาทุเรียนส่งออกจีน (90%) ต้องได้มาตรฐาน GACC/GAP Zero Tolerance สารตกค้าง',
        marketData: {
            exportDestinations: "จีน (ขยายสู่เมืองรอง), ตลาดพรีเมียม",
            globalDemand: "High (Buyer's Market)",
            trend: "การแข่งขันสูงจากเวียดนาม ต้องเน้นคุณภาพ",
            analysis: "ทำสวนทุเรียนคือการทำธุรกิจความเสี่ยงสูง ผลตอบแทนสูง ต้องมีความรู้เรื่องสรีรวิทยาพืชอย่างลึกซึ้ง"
        }
    },
    'mango': {
        name: 'มะม่วงน้ำดอกไม้สีทอง',
        category: 'tree',
        price: 45,
        yield: 1500,
        lifespan: 20,
        wait_years: 3,
        cost_init: 15000,
        cost_maint: 8000,
        risk: 'Medium',
        desc: 'ตลาดส่งออกญี่ปุ่น/เกาหลี (ต้องอบไอน้ำ VHT) และตลาดในประเทศ',
        marketData: {
            demand: "Medium-High",
            trend: "แปรรูปและส่งออกผลสด",
            analysis: "ควรทำนอกฤดูเพื่อเลี่ยงรากาตกต่ำช่วงเมษา-พฤษภา"
        }
    },
    // --- พืชไร่ (Field Crops) ---
    'cassava': {
        name: 'มันสำปะหลัง (Cassava)',
        category: 'field_crop',
        price: 2.80, // ราคาหัวมันสด เชื้อแป้ง 25%
        yield: 4000, // กก./ไร่ (เป้าหมาย 4-5 ตัน)
        lifespan: 1, // พืชล้มลุก
        cycles_per_year: 1,
        cost_init: 5500, // ค่าเตรียมดิน ท่อนพันธุ์ ปุ๋ย
        cost_maint: 2000, // ค่ากำจัดวัชพืช
        risk: 'Medium',
        desc: 'พืชพลังงานและอุตสาหกรรมแป้ง ทนแล้งได้ดี แต่ราคาผันผวนตามตลาดโลก',
        marketData: {
            demand: "High (Industrial)",
            trend: "เอทานอลและแป้งมันส่งออกจีน",
            analysis: "ควรระวังโรคใบด่างมันสำปะหลัง (CMD) ที่ระบาดหนัก"
        }
    },
    // *** NEW: Maize (ข้าวโพดเลี้ยงสัตว์) ***
    'maize': {
        name: 'ข้าวโพดเลี้ยงสัตว์ (Maize)',
        category: 'field_crop',
        price: 9.50, // ราคาหน้าโรงงาน (ความชื้น 14.5%)
        yield: 1200, // กก./ไร่ (พันธุ์ลูกผสม)
        lifespan: 1,
        cycles_per_year: 2, // ปลูกได้ 2 รอบ (ข้าวโพดหลังนา/ข้าวโพดฝน)
        cost_init: 4500, // ค่าเมล็ด ปุ๋ย เตรียมดิน
        cost_maint: 1500, // ค่าฉีดพ่นหนอนกระทู้
        risk: 'Medium',
        desc: 'วัตถุดิบหลักอาหารสัตว์ ตลาดต้องการสูง แต่ต้นทุนปุ๋ยยาและหนอนกระทู้ลายจุดคือปัญหาหลัก',
        marketData: {
            demand: "Very High (Domestic Feed)",
            trend: "ขาดแคลนในประเทศ ต้องนำเข้า",
            analysis: "โรงงานอาหารสัตว์ประกันราคาขั้นต่ำ เหมาะปลูกหลังนาเพื่อตัดวงจรเพลี้ยในนาข้าว"
        }
    },
    // --- ปศุสัตว์ (Livestock) ---
    'cow_ponyangkham': {
        name: 'โคขุนโพนยางคำ (Premium Beef)',
        category: 'animal',
        price: 110, // ราคาเนื้อแดง/กก. หรือ ขายตัว (คิดเฉลี่ยกำไรต่อตัว) -> Profit calc logic adjust needed or use simpler yield
        yield: 1, // ต่อตัว
        lifespan: 2, // ระยะขุน
        cycles_per_year: 0.5,
        cost_init: 35000, // ค่าลูกวัว + โรงเรือน
        cost_maint: 25000, // ค่าอาหารข้น/หยาบ
        risk: 'Medium',
        desc: 'เนื้อโคเกรดพรีเมียม ไขมันแทรก ยางโพนยางคำสกลนคร',
        marketData: {
            demand: "Niche Market",
            trend: "ร้านสเต็กและปิ้งย่างขยายตัว",
            analysis: "ต้องเป็นสมาชิกสหกรณ์และปฏิบัติตามมาตรฐานการขุนอย่างเคร่งครัด"
        }
    },
    'pig_farming': {
        name: 'สุกรขุน (Fattening Pig)',
        category: 'animal',
        price: 80, // ราคาหน้าฟาร์ม (บาท/กก.)
        yield: 100, // น้ำหนักจับ (กก./ตัว)
        lifespan: 0.5, // 5-6 เดือน
        cycles_per_year: 2,
        cost_init: 2500, // ค่าลูกหมู
        cost_maint: 4500, // ค่าอาหารและวัคซีน
        risk: 'High', // โรคระบาด ASF
        desc: 'เลี้ยงขุน 5-6 เดือน ระวังโรค ASF ต้องมีระบบ Biosecurity',
        marketData: {
            demand: "High",
            trend: "ราคาผันผวนตามโรคระบาดและต้นทุนอาหารสัตว์",
            analysis: "ความเสี่ยงเรื่องโรคสูงมาก รายย่อยควรระวังเรื่องระบบป้องกันโรค"
        }
    },
    // --- ธุรกิจเกษตร (Agri-Business) ---
    'farm_cafe': {
        name: 'Farm Cafe & Bistro',
        category: 'business',
        price: 500, // รายได้เฉลี่ยต่อหัว
        yield: 5000, // ลูกค้าต่อปี (สมมติ)
        lifespan: 10,
        cost_init: 1500000, // ลงทุนก่อสร้าง
        cost_maint: 500000, // ค่าจ้าง/วัตถุดิบ/น้ำไฟ ต่อปี
        risk: 'High',
        desc: 'ธุรกิจท่องเที่ยวเชิงเกษตร จุดเช็คอิน ถ่ายรูป อาหารเครื่องดื่ม',
        marketData: {
            demand: "Variable (Tourism)",
            trend: "Cafe Hopping, Agrotourism",
            analysis: "Location และ Storytelling สำคัญที่สุด ต้องมีจุดขายที่แตกต่าง"
        }
    }
};

// 2. ฟังก์ชัน Helper (ถ้าจำเป็น)
const getKasetPreset = (name) => {
    if (!name) return null;
    if (name.includes('ทุเรียน')) return KASET_PRESETS['durian'];
    if (name.includes('มะม่วง')) return KASET_PRESETS['mango'];
    if (name.includes('มันสำปะหลัง')) return KASET_PRESETS['cassava'];
    if (name.includes('ข้าวโพด')) return KASET_PRESETS['maize']; // Added Maize
    if (name.includes('โคขุน') || name.includes('โพนยางคำ')) return KASET_PRESETS['cow_ponyangkham'];
    if (name.includes('หมู') || name.includes('สุกร')) return KASET_PRESETS['pig_farming'];
    if (name.includes('Cafe') || name.includes('คาเฟ่')) return KASET_PRESETS['farm_cafe'];
    return null;
};

// 3. ฟังก์ชันสร้าง Steps (สำหรับแสดงใน UI)
const getKasetSteps = (category) => {
    switch (category) {
        case 'premium_durian':
        case 'tree': // พืชสวน
            return [
                { id: 'prep', label: '1. เตรียมดิน/ยกโคก', val: 5000, desc: 'ปรับสภาพดิน/ระบบน้ำ' },
                { id: 'plant', label: '2. ค่ากล้า/ปลูก', val: 3000, desc: 'พันธุ์ดี' },
                { id: 'care_pre', label: '3. ดูแลก่อนให้ผล', val: 4000, desc: 'ปุ๋ย/ยา/ตัดแต่ง (ต่อปี)' },
                { id: 'care_post', label: '4. ดูแลระยะให้ผล', val: 8000, desc: 'บำรุงผล/ทำสาว (ต่อปี)' }
            ];
        case 'field_crop': // พืชไร่
            return [
                { id: 'plow', label: '1. เตรียมดิน', val: 600, desc: 'ไถดะ/ไถแปร' },
                { id: 'seed', label: '2. เมล็ด/ท่อนพันธุ์', val: 800, desc: 'ต่อไร่' },
                { id: 'care', label: '3. ปุ๋ย/ยา/กำจัดหญ้า', val: 2500, desc: 'ตลอดฤดู' },
                { id: 'harvest', label: '4. เก็บเกี่ยว', val: 800, desc: 'ค่ารถเกี่ยว/ขุด' }
            ];
        case 'animal': // ปศุสัตว์
            return [
                { id: 'breed', label: '1. ซื้อพ่อ/แม่พันธุ์', val: 20000, desc: 'ลูกวัวหย่านม' },
                { id: 'feed', label: '2. ค่าอาหารข้น/หยาบ', val: 10000, desc: 'ต่อตัว/ปี' },
                { id: 'med', label: '3. วัคซีน/ยา', val: 1000, desc: 'ถ่ายพยาธิ/ปากเท้าเปื่อย' },
                { id: 'labor', label: '4. ค่าแรง/โรงเรือน', val: 4000, desc: 'เฉลี่ยต่อตัว' }
            ];
        case 'business': // ธุรกิจ
            return [
                { id: 'construct', label: '1. ก่อสร้าง/ตกแต่ง', val: 800000, desc: 'อาคาร/สวน' },
                { id: 'equip', label: '2. อุปกรณ์/เครื่องครัว', val: 300000, desc: 'เครื่องชงกาแฟ/ครัว' },
                { id: 'marketing', label: '3. การตลาด/โปรโมท', val: 50000, desc: 'Ads/Social Media' },
                { id: 'staff', label: '4. ค่าจ้างพนักงาน', val: 200000, desc: 'ต่อปี' }
            ];
        default:
            return [];
    }
};

// Global Exposure
if (typeof window !== 'undefined') {
    window.KASET_PRESETS = KASET_PRESETS;
    window.getKasetPreset = getKasetPreset;
    window.getKasetSteps = getKasetSteps;
}
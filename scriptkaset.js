// --- scriptkaset.js : Logic สำหรับพืชเศรษฐกิจและปศุสัตว์ (General Agriculture) ---
// อัปเดตล่าสุด: บูรณาการยุทธศาสตร์สวนทุเรียนสมัยใหม่ (Modern Durian Orchard Management)

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
            trend: "ตลาดเน้นคุณภาพและความปลอดภัย (No Cadmium/BY2) แข่งขันสูงกับเวียดนาม",
            analysis: "กำไรสูงแต่ต้องทำเกษตรปราณีต (Precision Farming) เพื่อสู้คู่แข่ง"
        }
    },
    'palm': {
        name: 'ปาล์มน้ำมัน (Oil Palm)',
        category: 'tree',
        price: 5.5,
        yield: 3200, // กก./ไร่/ปี
        lifespan: 25,
        wait_years: 3,
        cost_init: 8000,
        cost_maint: 4000,
        risk: 'Low',
        desc: 'พืชพลังงาน ดูแลง่าย ต้องการน้ำสม่ำเสมอ เก็บเกี่ยวได้ทุก 15 วัน',
        marketData: {
            demand: "High",
            trend: "ผันผวนตามราคาน้ำมันดิบโลกและ B100",
            analysis: "เหมาะสำหรับพื้นที่ฝนชุก รายได้สม่ำเสมอรายเดือน"
        }
    },
    'mango': {
        name: 'มะม่วงน้ำดอกไม้สีทอง',
        category: 'tree',
        price: 45,
        yield: 1500,
        lifespan: 15,
        wait_years: 3,
        cost_init: 7000,
        cost_maint: 5000,
        risk: 'Medium',
        desc: 'ผลไม้ส่งออกยอดนิยม (ญี่ปุ่น/เกาหลี) ต้องห่อผลและทำนอกฤดู',
        marketData: {
            demand: "Medium",
            trend: "เติบโตในตลาดเอเชียตะวันออก",
            analysis: "ต้องทำคุณภาพผิวสวย (เกรด A) ถึงจะได้ราคาดี"
        }
    },
    // --- พืชไร่ (Field Crops) ---
    'corn': {
        name: 'ข้าวโพดเลี้ยงสัตว์ (Maize)',
        category: 'annual',
        price: 9.5,
        yield: 1200,
        lifespan: 1, // 4 เดือน
        cycles_per_year: 2,
        cost_init: 4500, // ไถ+เมล็ด+ปุ๋ย
        cost_maint: 0, // รวมใน init แล้ว
        risk: 'Medium',
        desc: 'พืชอายุสั้น รอบหมุนเร็ว ตลาดต้องการสูงสำหรับอุตสาหกรรมอาหารสัตว์',
        marketData: {
            demand: "High",
            trend: "ขาดแคลนในประเทศ ต้องนำเข้า",
            analysis: "ราคาดีแต่ต้นทุนปุ๋ยเคมีสูง ควรปลูกหลังนา"
        }
    },
    'cassava': {
        name: 'มันสำปะหลัง (Cassava)',
        category: 'annual',
        price: 2.8,
        yield: 4000, // ตัน/ไร่
        lifespan: 1, // 10-12 เดือน
        cycles_per_year: 1,
        cost_init: 3500,
        cost_maint: 1000, // กำจัดวัชพืช
        risk: 'Low',
        desc: 'ทนแล้ง ปลูกง่าย แปรรูปได้หลากหลาย (แป้ง, เอทานอล)',
        marketData: {
            demand: "High",
            trend: "ต้องการสูงในอุตสาหกรรมพลังงานและอาหาร",
            analysis: "ระวังโรคใบด่างมันสำปะหลัง"
        }
    },
    'sugarcane': {
        name: 'อ้อยโรงงาน (Sugarcane)',
        category: 'annual',
        price: 1100, // บาท/ตัน
        yield: 12, // ตัน/ไร่
        lifespan: 1, 
        cycles_per_year: 1,
        cost_init: 5000,
        cost_maint: 2000,
        risk: 'Medium',
        desc: 'พืชตระกูลหญ้า ต้องการน้ำและปุ๋ย ตัดตอได้ 3-4 ปี',
        marketData: {
            demand: "Stable",
            trend: "ราคาประกันตามระบบโควตา",
            analysis: "ต้องมีโควตากับโรงงานน้ำตาล"
        }
    },
    // --- ปศุสัตว์ (Livestock) ---
    'cow': {
        name: 'โคขุน (Beef Cattle)',
        category: 'animal',
        price: 105, // บาท/กก. (Live weight)
        yield: 500, // นน.ขาย
        lifespan: 2, // ขุน 1-2 ปี
        cost_init: 25000, // ค่าลูกวัว
        cost_maint: 15000, // อาหาร/ยา
        risk: 'Medium',
        desc: 'เลี้ยงขุนระยะสั้น-กลาง อาหารหยาบ/ข้น ตลาดเนื้อคุณภาพ',
        marketData: {
            demand: "Growing",
            trend: "นิยมบริโภคเนื้อเกรดพรีเมียมมากขึ้น",
            analysis: "ต้นทุนอาหารสัตว์คือตัวแปรสำคัญ"
        }
    },
    'buffalo': {
        name: 'กระบือ (Buffalo)',
        category: 'animal',
        price: 100000, // ขายตัวสวยงาม/พ่อพันธุ์ (เฉลี่ย)
        yield: 1, 
        lifespan: 3,
        cost_init: 40000,
        cost_maint: 5000, // กินหญ้าเก่ง
        risk: 'Low',
        desc: 'เลี้ยงง่าย ทนโรค ตลาดอนุรักษ์/สวยงามกำลังมาแรง',
        marketData: {
            demand: "Niche",
            trend: "ควายงามราคาพุ่งสูงมาก",
            analysis: "ตลาดเฉพาะกลุ่ม แต่กำไรสูงหากได้ลูกสวย"
        }
    },
    // --- ธุรกิจเกษตร (Agri-Business) ---
    'cafe': {
        name: 'Farm Cafe (ท่องเที่ยวเชิงเกษตร)',
        category: 'business',
        price: 250, // เฉลี่ยต่อหัว
        yield: 5000, // ลูกค้า/ปี
        lifespan: 10,
        wait_years: 1,
        cost_init: 800000, // ก่อสร้าง/ตกแต่ง
        cost_maint: 300000, // ค่าจ้าง/วัตถุดิบ/น้ำไฟ
        risk: 'High',
        desc: 'ขายบรรยากาศและสตอรี่ ต้องมีจุดเช็คอินและสินค้าแปรรูป',
        marketData: {
            demand: "Trend",
            trend: "ท่องเที่ยววิถีชุมชน/ธรรมชาติ",
            analysis: "ต้องทำการตลาดออนไลน์เก่งๆ จุดคุ้มทุน 2-3 ปี"
        }
    }
};

// 2. ฟังก์ชันดึงข้อมูล Preset (Helper)
const getKasetPreset = (key) => {
    // Search by key first
    if (KASET_PRESETS[key]) return KASET_PRESETS[key];
    
    // Search by matching name string
    const foundKey = Object.keys(KASET_PRESETS).find(k => 
        KASET_PRESETS[k].name === key || KASET_PRESETS[k].name.includes(key)
    );
    return foundKey ? KASET_PRESETS[foundKey] : null;
};

// 3. ข้อมูลขั้นตอนการผลิตทั่วไป (General Steps)
const getKasetSteps = (category) => {
    switch (category) {
        case 'tree': // พืชสวน
        case 'premium_durian':
            return [
                { id: 'prep', label: '1. เตรียมดิน/ระบบน้ำ', val: 5000, desc: 'ขุดหลุม/วางท่อ' },
                { id: 'seed', label: '2. ค่าพันธุ์', val: 3000, desc: 'ต้นพันธุ์ดี' },
                { id: 'care', label: '3. ปุ๋ย/ยา/ตัดหญ้า', val: 4000, desc: 'ต่อปี' },
                { id: 'harvest', label: '4. เก็บเกี่ยว', val: 2000, desc: 'ค่าแรง' }
            ];
        case 'annual': // พืชไร่
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
                { id: 'construct', label: '1. ก่อสร้าง/ตกแต่ง', val: 800000, desc: 'ลงทุนครั้งแรก' },
                { id: 'staff', label: '2. พนักงาน', val: 180000, desc: 'ต่อปี' },
                { id: 'mat', label: '3. วัตถุดิบ', val: 100000, desc: 'ต่อปี' },
                { id: 'util', label: '4. น้ำ/ไฟ/เน็ต', val: 20000, desc: 'ต่อปี' }
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
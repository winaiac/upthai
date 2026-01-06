// --- scriptkaset.js : Logic สำหรับพืชเศรษฐกิจและปศุสัตว์ (General Agriculture) ---
// อัปเดตล่าสุด: ตรวจสอบความถูกต้องของ Key 'date_palm' เพื่อให้เชื่อมโยงกับ Dashboard ได้

// 1. ข้อมูลพืชและสัตว์เศรษฐกิจ (Kaset Presets)
const KASET_PRESETS = {
    // --- พืชสวน (Orchards) ---
    'durian': {
        name: 'ทุเรียนหมอนทอง (Modern Farm)',
        category: 'premium_durian', 
        price: 150, 
        yield: 2500, 
        lifespan: 25,
        wait_years: 6, 
        cost_init: 85000, 
        cost_maint: 45000, 
        risk: 'High',
        desc: 'ราชาทุเรียนส่งออกจีน (90%) ต้องได้มาตรฐาน GACC/GAP Zero Tolerance',
        marketData: {
            exportDestinations: "จีน (ขยายสู่เมืองรอง), ตลาดพรีเมียม",
            globalDemand: "High (Buyer's Market)",
            trend: "การแข่งขันสูงจากเวียดนาม ต้องเน้นคุณภาพ",
            analysis: "ความเสี่ยงสูง ผลตอบแทนสูง ต้องมีความรู้เรื่องสรีรวิทยาพืช"
        }
    },
    // *** อินทผาลัม (ต้องมีรายการนี้) ***
    'date_palm': {
        name: 'อินทผาลัม (Barhi - เนื้อเยื่อ)',
        category: 'premium_fruit', 
        price: 150, // ราคาเฉลี่ยหน้าสวน
        yield: 2000, // กก./ไร่
        lifespan: 30,
        wait_years: 4, 
        cost_init: 95000, 
        cost_maint: 35000, 
        risk: 'High',
        desc: 'พืชเศรษฐกิจใหม่ ทนแล้ง/ดินเค็ม ผลสดหวานกรอบ ต้องการการดูแลประณีต (ผสมเกสร)',
        marketData: {
            exportDestinations: "ตลาดสุขภาพ, CLMV",
            globalDemand: "Medium",
            localDemand: "High (Health Trend)",
            trend: "เน้นการท่องเที่ยวเชิงเกษตรและการแปรรูป",
            analysis: "ระวังฝนช่วงเก็บเกี่ยว (ก.ค.-ส.ค.) ทำให้ผลแตกเสียหาย"
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
            analysis: "ควรทำนอกฤดูเพื่อเลี่ยงราคาตกต่ำช่วงเมษา-พฤษภา"
        }
    },
    // --- พืชไร่ (Field Crops) ---
    'cassava': {
        name: 'มันสำปะหลัง (Cassava)',
        category: 'field_crop',
        price: 2.80, 
        yield: 4500, 
        lifespan: 1, 
        cycles_per_year: 1,
        cost_init: 5500, 
        cost_maint: 2000, 
        risk: 'Medium',
        desc: 'พืชพลังงานและอุตสาหกรรมแป้ง ทนแล้งได้ดี แต่ราคาผันผวนตามตลาดโลก',
        marketData: {
            demand: "High (Industrial)",
            trend: "เอทานอลและแป้งมันส่งออกจีน",
            analysis: "ควรระวังโรคใบด่างมันสำปะหลัง (CMD)"
        }
    },
    'maize': {
        name: 'ข้าวโพดเลี้ยงสัตว์ (Maize)',
        category: 'field_crop',
        price: 9.50, 
        yield: 1200, 
        lifespan: 1,
        cycles_per_year: 2, 
        cost_init: 4500, 
        cost_maint: 1500, 
        risk: 'Medium',
        desc: 'วัตถุดิบหลักอาหารสัตว์ ตลาดต้องการสูง แต่ต้นทุนปุ๋ยยาและหนอนกระทู้ลายจุดคือปัญหาหลัก',
        marketData: {
            demand: "Very High (Domestic Feed)",
            trend: "ขาดแคลนในประเทศ ต้องนำเข้า",
            analysis: "โรงงานอาหารสัตว์ประกันราคาขั้นต่ำ เหมาะปลูกหลังนา"
        }
    },
    'sugarcane': {
        name: 'อ้อยโรงงาน (Sugarcane)',
        category: 'field_crop',
        price: 1100, 
        yield: 12000, 
        lifespan: 1,
        cycles_per_year: 1,
        cost_init: 8000,
        cost_maint: 3000,
        risk: 'Medium',
        desc: 'พืชไร่ส่งโรงงานน้ำตาล ระบบโควตา',
        marketData: {
            demand: "Stable",
            trend: "Bio-Complex",
            analysis: "ต้องมีโควตากับโรงงาน"
        }
    },
    // --- ปศุสัตว์ (Livestock) ---
    'cow_ponyangkham': {
        name: 'โคขุนโพนยางคำ (Premium Beef)',
        category: 'animal',
        price: 105, 
        yield: 500, 
        lifespan: 2, 
        cycles_per_year: 0.5,
        cost_init: 35000, 
        cost_maint: 25000, 
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
        price: 75, 
        yield: 100, 
        lifespan: 0.5, 
        cycles_per_year: 2,
        cost_init: 2500, 
        cost_maint: 4500, 
        risk: 'High', 
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
        price: 300, 
        yield: 3000, 
        lifespan: 10,
        cost_init: 1000000, 
        cost_maint: 400000, 
        risk: 'High',
        desc: 'ธุรกิจท่องเที่ยวเชิงเกษตร จุดเช็คอิน ถ่ายรูป อาหารเครื่องดื่ม',
        marketData: {
            demand: "Variable (Tourism)",
            trend: "Cafe Hopping, Agrotourism",
            analysis: "Location และ Storytelling สำคัญที่สุด ต้องมีจุดขายที่แตกต่าง"
        }
    }
};

// 2. ฟังก์ชัน Helper
const getKasetPreset = (name) => {
    if (!name) return null;
    const n = name.toLowerCase();
    
    if (n.includes('ทุเรียน')) return KASET_PRESETS['durian'];
    if (n.includes('อินทผาลัม')) return KASET_PRESETS['date_palm']; // สำคัญ: ต้องมีบรรทัดนี้
    if (n.includes('มะม่วง')) return KASET_PRESETS['mango'];
    if (n.includes('มันสำปะหลัง')) return KASET_PRESETS['cassava'];
    if (n.includes('ข้าวโพด')) return KASET_PRESETS['maize'];
    if (n.includes('อ้อย')) return KASET_PRESETS['sugarcane'];
    
    if (n.includes('โค') || n.includes('วัว') || n.includes('โพนยางคำ')) return KASET_PRESETS['cow_ponyangkham'];
    if (n.includes('หมู') || n.includes('สุกร')) return KASET_PRESETS['pig_farming'];
    
    if (n.includes('cafe') || n.includes('คาเฟ่')) return KASET_PRESETS['farm_cafe'];
    
    return null;
};

// 3. ฟังก์ชันสร้าง Steps (Cost Breakdown)
const getKasetSteps = (category) => {
    switch (category) {
        case 'premium_durian':
        case 'premium_fruit': // ใช้กับอินทผาลัม
        case 'tree': 
            return [
                { id: 'prep', label: '1. เตรียมดิน/ยกโคก', val: 10000, desc: 'ปรับสภาพดิน/ระบบน้ำ' },
                { id: 'plant', label: '2. ค่ากล้า/ปลูก', val: 40000, desc: 'พันธุ์ดี (เนื้อเยื่อ/เสียบยอด)' },
                { id: 'care_pre', label: '3. ดูแลก่อนให้ผล', val: 15000, desc: 'ปุ๋ย/ยา/ตัดแต่ง (ต่อปี)' },
                { id: 'care_post', label: '4. ดูแลระยะให้ผล', val: 25000, desc: 'บำรุงผล/ผสมเกสร/ห่อผล' }
            ];
        case 'field_crop': // พืชไร่
            return [
                { id: 'plow', label: '1. เตรียมดิน', val: 800, desc: 'ไถดะ/ไถแปร/ยกร่อง' },
                { id: 'seed', label: '2. เมล็ด/ท่อนพันธุ์', val: 1200, desc: 'ต่อไร่ (ลูกผสม)' },
                { id: 'care', label: '3. ปุ๋ย/ยา/กำจัดหญ้า', val: 3000, desc: 'ตลอดฤดู' },
                { id: 'harvest', label: '4. เก็บเกี่ยว', val: 1000, desc: 'ค่ารถเกี่ยว/ขุด' }
            ];
        case 'animal': // ปศุสัตว์
            return [
                { id: 'breed', label: '1. ซื้อพ่อ/แม่พันธุ์', val: 20000, desc: 'ลูกสัตว์ตั้งต้น' },
                { id: 'feed', label: '2. ค่าอาหารข้น/หยาบ', val: 12000, desc: 'ต่อตัว/รอบ' },
                { id: 'med', label: '3. วัคซีน/ยา', val: 1500, desc: 'ป้องกันโรค' },
                { id: 'labor', label: '4. ค่าแรง/โรงเรือน', val: 5000, desc: 'เฉลี่ยต่อตัว' }
            ];
        case 'business': // ธุรกิจ
            return [
                { id: 'construct', label: '1. ก่อสร้าง/ตกแต่ง', val: 800000, desc: 'อาคาร/สวน' },
                { id: 'equip', label: '2. อุปกรณ์/เครื่องครัว', val: 200000, desc: 'เครื่องชงกาแฟ/ครัว' },
                { id: 'marketing', label: '3. การตลาด/โปรโมท', val: 50000, desc: 'Ads/Social Media' },
                { id: 'staff', label: '4. ค่าจ้างพนักงาน', val: 150000, desc: 'ต่อปี' }
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
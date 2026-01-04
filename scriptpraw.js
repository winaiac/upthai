// --- scriptpraw.js : Logic สำหรับกระทรวงมะพร้าว (Ministry of Coconut) ---
// อ้างอิง: คู่มือยุทธศาสตร์การจัดการสวนมะพร้าวแบบครบวงจรเพื่อความยั่งยืน

// 1. ข้อมูลสายพันธุ์มะพร้าว (Coconut Variety Presets)
const COCONUT_PRESETS = {
    'namhom': {
        name: 'มะพร้าวน้ำหอม (ก้นจีบ GI)',
        type: 'Aromatic',
        price: 18.0, // ราคาหน้าสวนเฉลี่ย (บาท/ผล)
        yield_per_tree: 130, // ผล/ต้น/ปี (เฉลี่ย 120-150)
        trees_per_rai: 45, // ระยะ 6x6 เมตร
        wait_years: 3, // เริ่มให้ผลผลิตเร็ว
        peak_start: 5,
        risk: 'Medium',
        desc: 'ราชินีผลไม้ส่งออก กลิ่นหอม 2-AP ต้องการน้ำสม่ำเสมอและอากาศชื้น',
        marketData: {
            demand: "Very High",
            trend: "ตลาดจีนและสุขภาพเติบโตสูง (ต้อง GAP/GMP)",
            analysis: "รายได้ดีสม่ำเสมอ แต่ต้องจัดการน้ำและศัตรูพืช (ด้วง) อย่างเคร่งครัด"
        }
    },
    'industry_chumphon2': {
        name: 'ลูกผสมชุมพร 2 (อุตสาหกรรม)',
        type: 'Industrial',
        price: 12.0, // ราคาผลแก่/โรงงาน (บาท/ผล)
        yield_per_tree: 110, // หรือประมาณ 2,500 ผล/ไร่
        trees_per_rai: 22, // ระยะ 9x9 เมตร (ทรงพุ่มกว้าง)
        wait_years: 4.5,
        peak_start: 7,
        risk: 'Low',
        desc: 'เนื้อมะพร้าวหนา เปอร์เซ็นต์น้ำมันสูง (66%) ทนแล้งกว่าน้ำหอม',
        marketData: {
            demand: "High",
            trend: "ขาดแคลนวัตถุดิบกะทิ/น้ำมันมะพร้าว",
            analysis: "ความเสี่ยงต่ำ ดูแลรักษาง่ายกว่า เหมาะกับพื้นที่ดอนหรือภาคใต้"
        }
    },
    'sawi_hybrid1': {
        name: 'สวีลูกผสม 1 (น้ำมันสูง)',
        type: 'Industrial',
        price: 13.0,
        yield_per_tree: 100, // เน้นคุณภาพน้ำมัน
        trees_per_rai: 22,
        wait_years: 4.5,
        peak_start: 7,
        risk: 'Low',
        desc: 'เปอร์เซ็นต์น้ำมันสูงสุด (68%) เหมาะสำหรับแปรรูปน้ำมันบีบเย็น',
        marketData: {
            demand: "Niche High Value",
            trend: "ตลาดน้ำมันเพื่อสุขภาพและเครื่องสำอาง",
            analysis: "เป็นที่ต้องการเฉพาะกลุ่มโรงงานแปรรูปขั้นสูง"
        }
    }
};

// 2. โครงสร้างต้นทุนการจัดการสวนมะพร้าว (Coconut Cost Steps)
const COCONUT_STEPS = [
    {
        id: 'land_prep',
        label: '1. วิศวกรรมเตรียมดิน/ยกร่อง',
        val: 5000,
        type: 'init',
        desc: 'ขุดร่องสวน (ที่ลุ่ม) หรือระเบิดดินดาน (ที่ดอน) + ปรับ pH'
    },
    {
        id: 'water_system',
        label: '2. ระบบชลประทานแม่นยำ',
        val: 8000, // ลงทุนสูงแต่คุ้มค่า
        type: 'init',
        desc: 'มินิสปริงเกอร์/เรือรดน้ำ (150-200 ลิตร/ต้น/วัน)'
    },
    {
        id: 'planting',
        label: '3. ค่าพันธุ์และปลูก (รองก้นหลุม)',
        val: 3500,
        type: 'init',
        desc: 'พันธุ์คัดพิเศษ + ปุ๋ยคอก + เกลือแกงรองก้นหลุม'
    },
    {
        id: 'maint_young',
        label: '4. ดูแลยางเล็ก (ปี 1-3)',
        val: 4000, // บาท/ไร่/ปี
        type: 'maint_pre',
        desc: 'ปุ๋ยสูตรเสมอ + แมกนีเซียม + กำจัดวัชพืช'
    },
    {
        id: 'fertilizer_adult',
        label: '5. ปุ๋ยบำรุงผลผลิต (ปี 4+)',
        val: 6000,
        type: 'maint_post',
        desc: '13-13-21 + เกลือแกง (Cl) + โบรอน (B) ป้องกันผลร่วง'
    },
    {
        id: 'ipm_pest',
        label: '6. อารักขาพืช (IPM)',
        val: 1500,
        type: 'maint_post',
        desc: 'จัดการด้วงแรด/ด้วงงวง (ฟีโรโมน/เชื้อราเขียว) + ตัดแต่งทางใบ'
    },
    {
        id: 'harvest_labor',
        label: '7. ค่าแรงเก็บเกี่ยว',
        val: 3000, // หรือคิดเป็นผล
        type: 'maint_post',
        desc: 'ค่าจ้างสอย/ตัด (ทุก 20 วันสำหรับน้ำหอม)'
    }
];

// 3. ฟังก์ชันคำนวณรายได้มะพร้าว (Coconut Calculation Logic)
const calculateCoconutEconomics = (presetKey, area, years) => {
    // Fallback to 'namhom' if presetKey is invalid
    const preset = COCONUT_PRESETS[presetKey] || COCONUT_PRESETS['namhom'];
    
    if (!preset) return null;

    // คำนวณผลผลิตรวม (Total Yield)
    // ผลผลิตต่อไร่ = ต้นต่อไร่ x ผลต่อต้น
    const yieldPerRai = preset.yield_per_tree * preset.trees_per_rai;
    const price = preset.price;

    const grossIncomePerYear = yieldPerRai * price * area;

    // คำนวณต้นทุน
    let initialCost = 0;
    COCONUT_STEPS.filter(s => s.type === 'init').forEach(s => initialCost += s.val * area);

    let maintCostPre = 0; // ช่วงยังไม่ให้ผล
    COCONUT_STEPS.filter(s => s.type === 'maint_pre').forEach(s => maintCostPre += s.val * area);

    let maintCostPost = 0; // ช่วงให้ผลผลิตแล้ว
    COCONUT_STEPS.filter(s => s.type === 'maint_post').forEach(s => maintCostPost += s.val * area);

    return {
        presetName: preset.name,
        grossIncomeYear: grossIncomePerYear,
        initialCost: initialCost,
        maintCostPre: maintCostPre,
        maintCostPost: maintCostPost,
        waitYears: preset.wait_years,
        yieldPerRai: yieldPerRai,
        unit: 'ผล', // หน่วยนับ
        yieldPerTree: preset.yield_per_tree,
        treesPerRai: preset.trees_per_rai
    };
};

// Export to Global (Window)
if (typeof window !== 'undefined') {
    window.COCONUT_PRESETS = COCONUT_PRESETS;
    window.COCONUT_STEPS = COCONUT_STEPS;
    window.calculateCoconutEconomics = calculateCoconutEconomics;
}
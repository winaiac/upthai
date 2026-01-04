// --- scripttr.js : Logic สำหรับกระทรวงทุเรียน (Ministry of Durian) ---
// ฉบับปรับปรุง: บูรณาการสรีรวิทยา เทคโนโลยี และมาตรฐานสากล (Comprehensive Handbook 2025)

// 1. ข้อมูลสายพันธุ์ทุเรียน (Durian Variety Presets)
const DURIAN_PRESETS = {
    'monthong': {
        name: 'หมอนทอง (Monthong - Export King)',
        type: 'Strategic Commodity', // สินค้าเชิงยุทธศาสตร์
        price: 150, 
        yield_per_rai: 2500, // เป้าหมายที่ปีที่ 10+
        trees_per_rai: 20, // ระยะ 9x9 หรือ 8x10 เมตร (เหมาะสมกว่า 8x8 เพื่อลดโรค)
        wait_years: 6, // เริ่มติดผลตามธรรมชาติ (ไม่บังคับสารเร็วเกินไป)
        peak_start: 9, // ระยะให้ผลผลิตเต็มที่ (Economic Bearing Age)
        risk: 'High', 
        desc: 'ราชาตลาดจีน ต้องการการจัดการน้ำแม่นยำ (ค่า Kc 0.85 ช่วงขยายผล) ระวังทุเรียนอ่อน',
        harvestIndices: {
            days: '110-120 วันหลังดอกบาน (DAA)',
            dryMatter: '>32% (มาตรฐาน มกษ.)',
            signs: 'ปากปลิงบวม, ก้านสาก, ปลายหนามไหม้, เคาะเสียงโปร่ง (Loose Sound)'
        },
        marketData: {
            exportDestinations: "จีน (Zero Tolerance สารตกค้าง), Modern Trade",
            globalDemand: "High but Strict",
            trend: "ตลาดของผู้ซื้อ (Buyer's Market) เน้นคุณภาพและความปลอดภัย (Cadmium < 0.05 mg/kg)",
            analysis: "ต้องทำ GAP/GMP และระวังสาร Basic Yellow 2 อย่างเคร่งครัด"
        }
    },
    'chanee': {
        name: 'ชะนี (Chanee - Processing)',
        type: 'Processing/Local',
        price: 100,
        yield_per_rai: 2200,
        trees_per_rai: 20, // ทรงพุ่มกว้าง
        wait_years: 5,
        peak_start: 8,
        risk: 'Medium', // ทนรากเน่าดีกว่าหมอนทองเล็กน้อย
        desc: 'เนื้อสีสวย กลิ่นแรง เหมาะแปรรูป (ไอศกรีม/ขนม) ทนโรคดีกว่า',
        harvestIndices: {
            days: '100-110 วันหลังดอกบาน',
            dryMatter: '>30%',
            signs: 'สุกเร็วมาก (Climacteric fruit) ต้องตัดที่ 80-85% ก่อนร่วง'
        },
        marketData: {
            exportDestinations: "โรงงานแปรรูป, ตลาดท้องถิ่น",
            globalDemand: "Stable",
            trend: "ราคานิ่งแต่มีความต้องการต่อเนื่องจากอุตสาหกรรมอาหาร",
            analysis: "ทางเลือกความเสี่ยงต่ำสำหรับพื้นที่ฝนชุกภาคใต้"
        }
    },
    'kanyao': {
        name: 'ก้านยาว (Kanyao - Luxury)',
        type: 'Super Premium',
        price: 250, 
        yield_per_rai: 1500, // ไว้ลูกมากไม่ได้ ต้นโทรมง่าย
        trees_per_rai: 16, // ระยะ 10x10 เมตร (ทรงพุ่มใหญ่มาก)
        wait_years: 7, // โตช้ากว่า
        peak_start: 10,
        risk: 'Very High', // เปลือกบาง อ่อนไหวน้ำสุดๆ
        desc: 'ทุเรียนไฮโซ ก้านยาวเปลือกบาง ต้องห่อผลและคุมน้ำเป๊ะ (Tensiometer -30 kPa)',
        harvestIndices: {
            days: '120-135 วันหลังดอกบาน',
            dryMatter: '>32%',
            signs: 'ขั้วเหนียว หนามถี่ละเอียด'
        },
        marketData: {
            exportDestinations: "ตลาดบน (Niche), จีน (Gift Market)",
            globalDemand: "Niche",
            trend: "สินค้าพรีเมียมราคาสูง ขายเรื่องราว (Storytelling)",
            analysis: "เหมาะสำหรับชาวสวนมืออาชีพที่มีเงินทุนหมุนเวียนสายป่านยาว"
        }
    },
    'kradum': {
        name: 'กระดุมทอง (Kradum - Early Bird)',
        type: 'Early Season',
        price: 110,
        yield_per_rai: 2000,
        trees_per_rai: 25, // ต้นเล็ก ปลูกถี่ได้
        wait_years: 4, // เร็วสุดในกลุ่ม
        peak_start: 7,
        risk: 'Low', // เก็บก่อนโรคระบาดหน้าฝน
        desc: 'ทุเรียนเบา ออกไว เก็บเกี่ยวได้ก่อนใครเพื่อชิงราคาต้นฤดู',
        harvestIndices: {
            days: '90-100 วันหลังดอกบาน',
            dryMatter: '>27%',
            signs: 'ผลเล็ก ก้นป้าน สุกง่าย'
        },
        marketData: {
            exportDestinations: "จีน (ช่วงต้นฤดู), เวียดนาม",
            globalDemand: "Seasonal High",
            trend: "ทำราคาได้ดีช่วงสั้นๆ ก่อนหมอนทองออก",
            analysis: "พืชกระแสเงินสด (Cash Crop) สำหรับสวนผสมผสาน"
        }
    }
};

// 2. ขั้นตอนการดูแลทุเรียนแบบ "เกษตรแม่นยำ" (Precision & Engineering)
const BASE_DURIAN_STEPS = [
    { 
        id: 'engineering', 
        label: '1. วิศวกรรมแปลง (Mounding)', 
        val: 25000, 
        type: 'init', 
        desc: 'ยกโคกสูง 80-100 ซม. (ป้องกันรากเน่า/Hypoxia) + ระบบมินิสปริงเกอร์ (รัศมี 3ม.)' 
    },
    { 
        id: 'seedling_prep', 
        label: '2. กล้าพันธุ์และการจัดการราก', 
        val: 5000, 
        type: 'init', 
        desc: 'คัดกล้าอายุ 1 ปี "ตัดรากขด" ก้นถุงทิ้งทันที (ป้องกันต้นแคระแกร็น) + Trichoderma รองก้นหลุม' 
    },
    { 
        id: 'formative_pruning', 
        label: '3. แต่งกิ่งสร้างทรง (ปี 1-4)', 
        val: 12000, // ค่าแรง + ปุ๋ย
        type: 'maint_pre', 
        desc: 'สร้างทรงฉัตร (Single Leader) ตัดกิ่งประธานซ้อน/กิ่งมุมแคบออก เน้นใบ 2-3 ชุดต่อปี' 
    },
    { 
        id: 'nutrient_precision', 
        label: '4. จัดการธาตุอาหาร (ปี 5+)', 
        val: 35000, // ปุ๋ยแพงขึ้นตามราคาท้องตลาด
        type: 'maint_post', 
        desc: 'สะสมอาหาร (8-24-24), บำรุงผล (12-12-17+Ca/B), ขยายพู (0-0-50/13-13-24)' 
    },
    { 
        id: 'water_management', 
        label: '5. จัดการน้ำตามค่า ETc', 
        val: 8000, 
        type: 'maint_post', 
        desc: 'วัดความชื้นดิน (Tensiometer) ช่วงวิกฤตห้ามขาดน้ำ (-30 kPa) ระวังผลร่วง/หนามจีบ' 
    },
    { 
        id: 'ipm_health', 
        label: '6. อารักขาพืชผสมผสาน (IPM)', 
        val: 15000, 
        type: 'maint_post', 
        desc: 'ฝังเข็ม Phosphonic (กันรากเน่า), กับดักแสงไฟ (หนอนเจาะเมล็ด), Zero Cadmium/BY2' 
    },
    { 
        id: 'harvest_qa', 
        label: '7. เก็บเกี่ยวคุณภาพ (QC)', 
        val: 7000, 
        type: 'maint_post', 
        desc: 'ตัดที่ความแก่ 80%+, ตรวจ Dry Matter, ห้ามวางผลสัมผัสพื้น (กันเชื้อรา)' 
    }
];

// 3. ฟังก์ชันคำนวณความคุ้มค่า (Economics Calculation)
const calculateDurianEconomics = (presetKey, area, years) => {
    const preset = DURIAN_PRESETS[presetKey] || DURIAN_PRESETS['monthong'];
    if (!preset) return null;

    // รายได้ต่อปี (เมื่อให้ผลผลิตเต็มที่)
    const grossIncomePerYear = preset.yield_per_rai * preset.price * area;

    // ต้นทุนเริ่มแรก
    let initialCost = 0;
    BASE_DURIAN_STEPS.filter(s => s.type === 'init').forEach(s => initialCost += s.val * area);

    // ต้นทุนดูแลช่วงยังไม่ให้ผล
    let maintCostPre = 0;
    BASE_DURIAN_STEPS.filter(s => s.type === 'maint_pre').forEach(s => maintCostPre += s.val * area);

    // ต้นทุนดูแลช่วงให้ผล
    let maintCostPost = 0;
    BASE_DURIAN_STEPS.filter(s => s.type === 'maint_post').forEach(s => maintCostPost += s.val * area);

    return {
        presetName: preset.name,
        grossIncomeYear: grossIncomePerYear,
        initialCost: initialCost,
        maintCostPre: maintCostPre,
        maintCostPost: maintCostPost,
        waitYears: preset.wait_years, // อัปเดตตามสรีรวิทยาจริง (5-7 ปี)
        yieldPerRai: preset.yield_per_rai,
        treesPerRai: preset.trees_per_rai,
        price: preset.price,
        harvestIndices: preset.harvestIndices,
        marketData: preset.marketData
    };
};

// Global Exposure
if (typeof window !== 'undefined') {
    window.DURIAN_PRESETS = DURIAN_PRESETS;
    window.BASE_DURIAN_STEPS = BASE_DURIAN_STEPS;
    window.calculateDurianEconomics = calculateDurianEconomics;
}
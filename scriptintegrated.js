// --- scriptintegrated.js : Logic สำหรับเกษตรผสมผสาน & โคกหนองนา (Integrated Farming) ---
// อ้างอิง: รายงานวิจัยการบูรณาการเกษตรทฤษฎีใหม่ โคกหนองนาโมเดล และวนเกษตร (ป่า 3 อย่าง ประโยชน์ 4 อย่าง)

// 1. ชุดข้อมูลโมเดล (Integrated Presets)
const INTEGRATED_PRESETS = {
    'khoknongna_general': {
        name: 'โคก หนอง นา (มาตรฐาน)',
        type: 'Standard Model',
        desc: 'จัดการน้ำเพื่อความมั่นคงทางอาหาร ปลูกป่า 3 อย่าง ประโยชน์ 4 อย่าง (พอกิน พอใช้ พออยู่ พอร่มเย็น)',
        risk: 'Low',
        cost_structure: {
            excavation: 35000, // ค่าขุดปรับพื้นที่/ไร่ (หนอง+คลองไส้ไก่)
            planting: 5000,    // ค่ากล้าไม้/เมล็ดพันธุ์
            structure: 10000   // โรงเรือน/คอกสัตว์เล็ก
        },
        revenue_stream: {
            daily: 200,    // พืชผักสวนครัว (บาท/วัน)
            monthly: 2000, // กล้วย/ไข่/ปลา (บาท/เดือน)
            yearly: 5000   // ข้าว/ไม้ผล (บาท/ปี/ไร่)
        },
        marketData: {
            trend: "Sustainability",
            analysis: "เน้นการพึ่งพาตนเอง ลดรายจ่าย สร้างแหล่งอาหารปลอดภัยในครัวเรือน"
        }
    },
    'khoknongna_saline': {
        name: 'โคก หนอง นา (แก้ดินเค็ม-อีสาน)',
        type: 'Saline Soil Solution',
        desc: 'โมเดลฟื้นฟูดินเค็ม ขุดหนองตื้น ยกคันดินสูง(โคก) ปลูกไม้ยืนต้นลดระดับน้ำเค็ม (Bio-drainage)',
        risk: 'Medium', // มีความเสี่ยงเรื่องดิน
        cost_structure: {
            excavation: 45000, // ค่าขุดต้องระวังดินดาน/ชั้นเกลือ + ยกคันสูงพิเศษ
            planting: 8000,    // ค่ากล้าไม้ทนเค็ม/หญ้าแฝก/ปุ๋ยอินทรีย์ปรับปรุงดิน
            structure: 10000
        },
        revenue_stream: {
            daily: 150,    // พืชผักทนเค็ม (พริก/มะเขือ)
            monthly: 1500, // เป็ด/ปลาทนเค็ม (ปลานิลจิตรลดา)
            yearly: 8000   // พืชเศรษฐกิจทนเค็ม (มะพร้าว/พุทรา/น้อยหน่า) + ไม้เศรษฐกิจระยะยาว
        },
        special_plants: [
            'ยูคาลิปตัส (บนคัน/แนวรั้ว เพื่อดูดน้ำเค็ม)', 
            'กระถินณรงค์', 'สะเดา', 'ขี้เหล็ก', 
            'มันเทศพันธุ์พิจิตร 3 (คลุมดิน)', 
            'แก่นตะวัน (พืชหัวมูลค่าสูง)'
        ],
        marketData: {
            trend: "Land Rehabilitation",
            analysis: "เปลี่ยนพื้นที่รกร้างดินเค็มเป็นพื้นที่ผลิตอาหารและไม้มีค่า (ธนาคารต้นไม้)"
        }
    }
};

// 2. ฟังก์ชันคำนวณผลตอบแทน (Integrated Economics)
const calculateIntegratedEconomics = (presetKey, area, years) => {
    const preset = INTEGRATED_PRESETS[presetKey] || INTEGRATED_PRESETS['khoknongna_general'];
    if (!preset) return null;

    // รายจ่าย (Cost)
    // - ปีแรก: ลงทุนขุดปรับพื้นที่หนัก
    const initialCost = (preset.cost_structure.excavation + preset.cost_structure.planting + preset.cost_structure.structure) * area;
    
    // - ปีต่อไป: ค่าดูแลรักษาต่ำ (พึ่งพาตนเอง ทำปุ๋ยหมัก)
    const maintCostPerYear = 2000 * area; // ต่ำกว่าพืชเชิงเดี่ยวมาก

    // รายรับ (Revenue) - มาจาก 3 ระยะ
    let totalRevenue = 0;
    let totalCost = 0;
    
    // มูลค่าไม้เศรษฐกิจ (Asset Value) - ไม่ใช่ Cash Flow แต่เป็นมูลค่าทรัพย์สินที่เพิ่มขึ้น
    // ป่า 3 อย่าง: ไม้ใช้สอย/ไม้เศรษฐกิจ เริ่มมีมูลค่าสูงในปีที่ 10+
    const timberValuePerRaiPerYear = 10000; // มูลค่าเพิ่มของต้นไม้ต่อปี (เฉลี่ย)

    for (let i = 0; i < years; i++) {
        const age = i + 1;
        let yearlyRev = 0;
        let yearlyExp = (i === 0) ? initialCost : maintCostPerYear;

        // 1. รายได้รายวัน (พืชผัก) - เริ่มได้ตั้งแต่เดือนที่ 2-3
        if (age >= 1) yearlyRev += (preset.revenue_stream.daily * 300) * area; // คิด 300 วัน

        // 2. รายได้รายเดือน/ฤดูกาล (กล้วย/สัตว์) - เริ่มปีที่ 1
        if (age >= 1) yearlyRev += (preset.revenue_stream.monthly * 12) * area;

        // 3. รายได้รายปี (ข้าว/ไม้ผล) - เริ่มปีที่ 2-3
        if (age >= 2) yearlyRev += preset.revenue_stream.yearly * area;

        // 4. มูลค่าไม้เศรษฐกิจ (Asset) - ถือเป็นรายได้ทางอ้อม (Saving)
        if (age >= 5) yearlyRev += timberValuePerRaiPerYear * area;

        totalRevenue += yearlyRev;
        totalCost += yearlyExp;
    }

    const avgProfit = (totalRevenue - totalCost) / years;
    const avgCost = totalCost / years;

    return {
        presetName: preset.name,
        initialCost: initialCost,
        maintCostPre: maintCostPerYear, // ค่าดูแลคงที่
        maintCostPost: maintCostPerYear,
        
        // ข้อมูลจำเพาะ
        waitYears: 0, // มีรายได้รายวันทันที
        yieldPerRai: 0, // ไม่เน้น Yield เชิงเดี่ยว
        price: 0,
        
        avgProfitPerYear: avgProfit,
        avgCostPerYear: avgCost,
        
        marketData: preset.marketData,
        specialPlants: preset.special_plants,
        benefits: [
            'พออยู่: มีไม้สร้างบ้าน/ที่อยู่อาศัย',
            'พอกิน: มีอาหารปลอดภัยตลอดปี',
            'พอใช้: มีสมุนไพร/ของใช้จากไม้',
            'พอร่มเย็น: ฟื้นฟูดินและระบบนิเวศ'
        ]
    };
};

// Global Exposure
if (typeof window !== 'undefined') {
    window.INTEGRATED_PRESETS = INTEGRATED_PRESETS;
    window.calculateIntegratedEconomics = calculateIntegratedEconomics;
}
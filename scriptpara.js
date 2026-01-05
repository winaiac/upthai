// --- scriptpara.js : Logic สำหรับกระทรวงยางพารา (Ministry of Rubber) ---
// อ้างอิง: การยางแห่งประเทศไทย (RAOT) & มาตรฐาน EUDR 2025

// 1. ข้อมูลสายพันธุ์ยางพารา (Rubber Clones Presets)
const RUBBER_PRESETS = {
    'rrim600': {
        name: 'RRIM 600 (พันธุ์ยอดนิยม)',
        type: 'Classic',
        price: 45.0, // ราคาน้ำยางสด (บาท/กก.)
        eudr_price: 48.0, // ราคา EUDR (+3-5 บาท)
        yield: 260, // กก./ไร่/ปี (ค่าเฉลี่ย)
        lifespan: 25,
        wait_years: 7, // เปิดกรีดปีที่ 7-8
        risk: 'Medium',
        desc: 'พันธุ์ครู ปรับตัวได้ทุกสภาพพื้นที่ ทนทาน ปริมาณเนื้อไม้ปานกลาง',
        marketData: {
            demand: "High",
            trend: "ยางมาตรฐาน EUDR เป็นที่ต้องการของตลาดยุโรปและล้อรถยนต์ EV",
            analysis: "ควรทำพิกัดแปลง (Geo-location) เพื่อรองรับการตรวจสอบย้อนกลับ (Traceability)"
        }
    },
    'rrit251': {
        name: 'RRIT 251 (ผลผลิตสูง)',
        type: 'High Yield',
        price: 45.0,
        eudr_price: 48.5,
        yield: 380, // ผลผลิตสูงกว่า 600 ประมาณ 30-40%
        lifespan: 25,
        wait_years: 7,
        risk: 'Medium',
        desc: 'พันธุ์แนะนำชั้น 1 โตเร็ว เปลือกหนา กรีดนิ่ม น้ำยางไหลคล่อง ต้านทานโรคใบร่วง',
        marketData: {
            demand: "Very High",
            trend: "เกษตรกรเริ่มเปลี่ยนมาปลูกมากขึ้นเพื่อเพิ่มผลผลิตต่อไร่",
            analysis: "ตอบโจทย์การลดต้นทุนแรงงาน เพราะได้ปริมาณยางมากในการกรีดเท่าเดิม"
        }
    },
    'jvp80': {
        name: 'JVP 80 (ยาง-ไม้)',
        type: 'Latex & Timber',
        price: 42.0, // ราคายางก้อนถ้วย (มักทำถ้วยเพราะน้ำยางไม่นิ่งเท่า)
        eudr_price: 45.0,
        yield: 220,
        lifespan: 20, // ตัดไม้ขายเร็วขึ้น
        wait_years: 7,
        risk: 'Low',
        desc: 'เน้นขายไม้แปรรูป ลำต้นตรง เปลาตรง เนื้อไม้เยอะ น้ำยางเป็นผลพลอยได้',
        marketData: {
            demand: "Stable",
            trend: "อุตสาหกรรมเฟอร์นิเจอร์และเชื้อเพลิงชีวมวล",
            analysis: "เหมาะสำหรับพื้นที่ลมแรงหรือเน้นการจัดการป่าไม้เศรษฐกิจ"
        }
    }
};

// 2. ขั้นตอนการจัดการสวนยาง (Cost Structure Steps)
const BASE_RUBBER_STEPS = [
    {
        id: 'land_prep',
        label: '1. เตรียมดินและวางผังปลูก',
        val: 4500,
        type: 'init',
        desc: 'ไถพรวน/ขุดหลุม/วางแนว (76 ต้น/ไร่ สำหรับระยะ 3x7ม.)'
    },
    {
        id: 'seedling',
        label: '2. ค่ากล้าพันธุ์และปลูก',
        val: 2500,
        type: 'init',
        desc: 'พันธุ์ดีมีใบรับรอง (30-35 บาท/ต้น) + ค่าแรงปลูก'
    },
    {
        id: 'maint_immature',
        label: '3. การดูแลยางเล็ก (ปี 1-6)',
        val: 3500, // ต่อไร่ ต่อปี
        type: 'maint_pre',
        desc: 'ใส่ปุ๋ยบำรุงต้น (20-8-20) + ตัดแต่งกิ่ง + กำจัดวัชพืช'
    },
    {
        id: 'tapping_equip',
        label: '4. อุปกรณ์กรีดยาง (ปี 7)',
        val: 1000,
        type: 'init_tap', // ลงทุนครั้งเดียวตอนเริ่มกรีด
        desc: 'มีดกรีด/ถ้วย/ลวด/น้ำกรด (เตรียมเปิดกรีด)'
    },
    {
        id: 'fertilizer_mature',
        label: '5. ปุ๋ยยางใหญ่ (ปี 7+)',
        val: 2500,
        type: 'maint_post',
        desc: 'สูตรบำรุงน้ำยาง (30-5-18 หรือ 15-7-18) ปีละ 2 ครั้ง'
    },
    {
        id: 'labor_share',
        label: '6. ค่าแรงกรีด (กรณีจ้าง)',
        val: 0, // ปกติคิดเป็นส่วนแบ่ง 60:40 หรือ 50:50 (ใน Simulation นี้จะหักจากรายได้แทน หรือใส่ค่าจ้างเหมา)
        type: 'maint_post',
        desc: 'คำนวณหักจากรายได้ (ระบบแบ่งเปอร์เซ็นต์)'
    }
];

// 3. ฟังก์ชันคำนวณผลตอบแทน (Simulation Logic)
const calculateRubberEconomics = (cloneKey, area, years, isEUDR = false, tappingSystem = 'd3') => {
    const preset = RUBBER_PRESETS[cloneKey] || RUBBER_PRESETS['rrim600'];
    if (!preset) return null;

    // เลือกราคา (ปกติ vs EUDR)
    const basePrice = isEUDR ? preset.eudr_price : preset.price;
    // const treesPerRai = 76; // มาตรฐาน RAOT

    // ค่าใช้จ่ายเริ่มแรก (ปี 0)
    let initialCost = 0;
    BASE_RUBBER_STEPS.filter(s => s.type === 'init').forEach(s => initialCost += s.val * area);

    // ค่าดูแลช่วงยางเล็ก (ต่อปี)
    let maintCostPre = 0;
    BASE_RUBBER_STEPS.filter(s => s.type === 'maint_pre').forEach(s => maintCostPre += s.val * area);

    // ค่าดูแลช่วงยางใหญ่ (ต่อปี)
    let maintCostPost = 0;
    BASE_RUBBER_STEPS.filter(s => s.type === 'maint_post').forEach(s => maintCostPost += s.val * area);

    // อุปกรณ์เริ่มกรีด (จ่ายปีที่ wait_years)
    let equipCost = 0;
    BASE_RUBBER_STEPS.filter(s => s.type === 'init_tap').forEach(s => equipCost += s.val * area);

    // คำนวณรายปี
    let totalRevenue = 0;
    let totalCost = 0;

    for (let i = 0; i < years; i++) {
        const age = i + 1;
        let yearlyRevenue = 0;
        let yearlyCost = 0;

        // Cost Calculation
        if (age <= preset.wait_years) {
            yearlyCost = (i === 0) ? initialCost : maintCostPre;
            if (age === preset.wait_years) yearlyCost += equipCost; // จ่ายค่าอุปกรณ์ปีก่อนกรีด
        } else {
            yearlyCost = maintCostPost;
        }

        // Revenue Calculation
        if (age > preset.wait_years) {
            let yieldEfficiency = 1.0;
            // Yield Curve ตามอายุยาง
            if (age <= preset.wait_years + 3) yieldEfficiency = 0.6; // 3 ปีแรกที่เปิดกรีด ผลผลิตยังไม่เต็มที่
            else if (age >= 20) yieldEfficiency = 0.8; // ยางแก่ ผลผลิตเริ่มลด
            
            // Tapping System Efficiency
            // d2 = วันเว้นวัน (100%), d3 = วันเว้นสองวัน (65-75% แต่ยืดอายุ)
            const tapFactor = tappingSystem === 'd3' ? 0.75 : 1.0;

            const yieldKg = preset.yield * yieldEfficiency * tapFactor * area;
            yearlyRevenue = yieldKg * basePrice;
        }

        totalRevenue += yearlyRevenue;
        totalCost += yearlyCost;
    }

    const avgProfit = (totalRevenue - totalCost) / years;
    const avgCost = totalCost / years;

    return {
        presetName: preset.name,
        // FIX: Return Total Cost (not per rai) to match script.js loop logic
        initialCost: initialCost, 
        maintCostPre: maintCostPre,
        maintCostPost: maintCostPost,
        
        waitYears: preset.wait_years,
        yieldPerRai: preset.yield,
        price: basePrice,
        eudr_price: preset.eudr_price,
        
        avgProfitPerYear: avgProfit,
        avgCostPerYear: avgCost, // Total average cost per year
        
        marketData: preset.marketData
    };
};

// Global Exposure
if (typeof window !== 'undefined') {
    window.RUBBER_PRESETS = RUBBER_PRESETS;
    window.BASE_RUBBER_STEPS = BASE_RUBBER_STEPS;
    window.calculateRubberEconomics = calculateRubberEconomics;
}
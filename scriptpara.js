// --- scriptpara.js : Logic สำหรับกระทรวงยางพารา (Ministry of Rubber) ---
// อ้างอิง: คู่มือแม่บทวิชาการการจัดการสวนยางพาราไทยสู่มาตรฐานสากล (2568-2571)

// 1. ข้อมูลสายพันธุ์ยาง (Rubber Clones Presets)
const RUBBER_PRESETS = {
    'rrim600': {
        name: 'RRIM 600 (พันธุ์ยอดนิยม)',
        price: 65.0, // ราคาน้ำยางสด (บาท/กก.) อิงตลาดทั่วไป
        eudr_price: 78.0, // ราคา EUDR (Premium)
        yield: 280, // กก./ไร่/ปี (ค่าเฉลี่ย)
        risk: 'Low',
        desc: 'พันธุ์ชั้น 1 ปรับตัวดีทุกสภาพดิน ผลผลิตสม่ำเสมอ แต่ระวังโรคราสีชมพู',
        lifecycle: { wait_years: 7, economic_years: 25 },
        marketData: {
            demand: "Stable",
            trend: "เป็นที่ต้องการตลาดทั่วไปและยางแท่ง",
            analysis: "ความเสี่ยงต่ำสุด เหมาะสำหรับเกษตรกรทั่วไปที่เน้นความชัวร์"
        }
    },
    'rrit251': {
        name: 'RRIT 251 (สถาบันวิจัยยาง 251)',
        price: 65.0,
        eudr_price: 78.0,
        yield: 350, // ผลผลิตสูงกว่า RRIM 600 ประมาณ 20-30%
        risk: 'Medium',
        desc: 'โตเร็ว เปิดกรีดไว (6 ปีเศษ) น้ำยางมาก เหมาะกับพื้นที่ปลูกยางใหม่',
        lifecycle: { wait_years: 6.5, economic_years: 25 },
        marketData: {
            demand: "High",
            trend: "กยท. ส่งเสริมเพื่อเพิ่มผลผลิตต่อไร่",
            analysis: "กำไรสูงสุดหากมีการจัดการปุ๋ยที่ดี"
        }
    },
    'pb235': {
        name: 'PB 235 (พันธุ์น้ำยางดก)',
        price: 63.0, // อาจต่ำกว่าเล็กน้อยถ้า DRC ต่ำ
        eudr_price: 76.0,
        yield: 380, // สูงมากในช่วงแรก
        risk: 'High',
        desc: 'ให้น้ำยางดกมากช่วงแรก แต่ลำต้นเปราะ หักง่าย ไม่ต้านทานลม/โรคใบร่วง',
        lifecycle: { wait_years: 7, economic_years: 20 },
        marketData: {
            demand: "Specific",
            trend: "เหมาะสำหรับพื้นที่ไม่มีลมพายุ",
            analysis: "High Risk, High Return ต้องดูแลประณีต"
        }
    }
};

// 2. โครงสร้างต้นทุนการจัดการสวนยาง (Rubber Cost Steps)
const RUBBER_STEPS = [
    {
        id: 'prep_land',
        label: '1. เตรียมดินและหลุมปลูก (วิศวกรรม)',
        val: 3500,
        type: 'init', // จ่ายครั้งเดียวปีแรก
        desc: 'ขุด 50x50x50cm + ปุ๋ยร็อคฟอสเฟต + ไถระเบิดดินดาน (ถ้ามี)'
    },
    {
        id: 'sapling',
        label: '2. ค่ากล้าพันธุ์และปลูก',
        val: 2500, // (76 ต้น/ไร่ x 35 บาท)
        type: 'init',
        desc: 'ระยะ 3x7 เมตร (76 ต้น/ไร่) หรือ 2.5x7 เมตร'
    },
    {
        id: 'maintenance_immature',
        label: '3. ดูแลรักษาก่อนเปิดกรีด (ปี 1-6)',
        val: 3000, // บาท/ไร่/ปี
        type: 'maint_pre', // จ่ายรายปี ช่วงปี 1-6
        desc: 'ปุ๋ยตามสูตรวัยอ่อน (20-10-12) + ตัดหญ้า + พืชคลุมดิน'
    },
    {
        id: 'fertilizer_mature',
        label: '4. ปุ๋ยบำรุงต่อนยาง (ปี 7+)',
        val: 2500,
        type: 'maint_post', // จ่ายรายปี ช่วงกรีด
        desc: 'ปุ๋ยสูตรผลิต (30-5-18) หรือตามค่าวิเคราะห์ดิน'
    },
    {
        id: 'labor_tapping',
        label: '5. ค่าแรงกรีด (แบ่งปันผลผลิต)',
        val: 0, // ปกติคิดเป็น % แบ่ง 60:40 หรือ 50:50 (คำนวณใน Logic หลัก)
        type: 'variable',
        desc: 'ปกติแบ่ง 40% ของรายได้ให้คนกรีด (หากจ้างกรีด)'
    },
    {
        id: 'chemicals',
        label: '6. ฮอร์โมน/ป้องกันโรค/หมวกกันฝน',
        val: 1200,
        type: 'maint_post',
        desc: 'Ethephon (ระบบกรีด d/3) + Metalaxyl (หน้ายาง) + หมวกกันฝน'
    },
    {
        id: 'transport',
        label: '7. ขนส่งและวัสดุสิ้นเปลือง',
        val: 500,
        type: 'maint_post',
        desc: 'กรดฟอร์มิก (ห้ามใช้ซัลฟูริก) + ค่าขนส่งไปจุดรับซื้อ'
    }
];

// 3. ฟังก์ชันคำนวณรายได้ยางพารา (Advanced Rubber Calculation)
const calculateRubberEconomics = (presetKey, area, years, isEUDR, tappingSystem) => {
    const preset = RUBBER_PRESETS[presetKey] || RUBBER_PRESETS['rrim600'];
    const price = isEUDR ? preset.eudr_price : preset.price;
    const yieldPerRai = preset.yield;
    
    // ปรับผลผลิตตามระบบกรีด (Tapping System Adjustment)
    // d/2 = วันเว้นวัน (100%), d/3 = วันเว้นสองวัน (ลดลงแต่ใช้สารเร่งช่วยได้)
    let yieldFactor = 1.0;
    if (tappingSystem === 'd3') yieldFactor = 0.85; // กรีดน้อยลง ผลผลิตรวมลดเล็กน้อยแต่ต้นโทรมช้า
    
    // คำนวณรายได้
    const grossIncomePerYear = yieldPerRai * yieldFactor * price * area;
    
    // คำนวณต้นทุน
    let initialCost = 0;
    RUBBER_STEPS.filter(s => s.type === 'init').forEach(s => initialCost += s.val * area);
    
    let maintCostPre = 0;
    RUBBER_STEPS.filter(s => s.type === 'maint_pre').forEach(s => maintCostPre += s.val * area);
    
    let maintCostPost = 0;
    RUBBER_STEPS.filter(s => s.type === 'maint_post').forEach(s => maintCostPost += s.val * area);
    
    // ค่าแรง (Labor Cost) - สมมติแบ่ง 40%
    const laborCostPerYear = grossIncomePerYear * 0.40; 

    return {
        presetName: preset.name,
        grossIncomeYear: grossIncomePerYear,
        initialCost: initialCost,
        maintCostPre: maintCostPre, // ต่อปี (ช่วงยังไม่กรีด)
        maintCostPost: maintCostPost + laborCostPerYear, // ต่อปี (ช่วงกรีดแล้ว)
        laborCost: laborCostPerYear,
        waitYears: preset.lifecycle.wait_years,
        isEUDR: isEUDR
    };
};

// Export to Global
if (typeof window !== 'undefined') {
    window.RUBBER_PRESETS = RUBBER_PRESETS;
    window.RUBBER_STEPS = RUBBER_STEPS;
    window.calculateRubberEconomics = calculateRubberEconomics;
}
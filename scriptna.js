// --- scriptna.js : Logic สำหรับกระทรวงชาวนา (Rice Ministry) - ฉบับปรับปรุงตามคู่มือกรมการข้าว & สถานการณ์ส่งออก 2567-2568 ---

// 1. ข้อมูลสายพันธุ์ข้าว (Rice Presets) - อ้างอิงข้อมูลกรมการข้าว + สมาคมผู้ส่งออกข้าวไทย
const RICE_PRESETS = {
    'jasmine': { 
        name: 'ขาวดอกมะลิ 105 (KDML105)', 
        price: 15500, // ปรับราคาขึ้น (เดิม 14500)
        yield: 460,   // ปรับผลผลิตให้สมจริงกับการทำนาประณีต (เดิม 360)
        duration: 120, 
        risk: 'Low', 
        desc: 'ข้าวหอมมะลิคุณภาพดีที่สุดในโลก ทนแล้ง ดินทราย/ดินเค็ม',
        seedCost: 450,  
        careMult: 1.0,   // ต้นทุนดูแลมาตรฐาน
        harvestTime: 'Nov-Dec',
        marketData: {
            exportDestinations: "สหรัฐฯ, จีน, ฮ่องกง, สิงคโปร์ (ตลาดพรีเมียม)",
            globalDemand: "High", 
            localDemand: "High",
            exportPriceTrend: "ทรงตัวในระดับสูง (Premium Price)",
            competitors: "ข้าวหอมผกาลำดวน (กัมพูชา), ข้าวหอมเวียดนาม",
            analysis: "เป็นสินค้า Flagship ของไทย ตลาดต้องการสูงแต่ต้องรักษาคุณภาพความหอม"
        }
    },
    'pathum': { 
        name: 'ปทุมธานี 1 (Pathum Thani 1)', 
        price: 11500, // ปรับราคาเล็กน้อย
        yield: 750,   
        duration: 115, 
        risk: 'Medium', 
        desc: 'ข้าวนุ่ม มีกลิ่นหอมคล้ายมะลิ ปลูกได้ตลอดปี ต้านทานเพลี้ยกระโดด',
        seedCost: 300,  
        careMult: 1.2, // ดูแลยากกว่ามะลิ 20%
        marketData: {
            exportDestinations: "จีน, แอฟริกา, อิรัก (ตลาดข้าวนุ่ม)",
            globalDemand: "High",
            localDemand: "Medium",
            exportPriceTrend: "แนวโน้มดีขึ้น (ใช้แทนหอมมะลิได้ในราคาถูกกว่า)",
            competitors: "ข้าวขาวพื้นนุ่มเวียดนาม (DT8, ST21)",
            analysis: "กำลังเป็นที่นิยมในร้านอาหารต่างประเทศ เพราะนุ่มและถูกกว่ามะลิ"
        }
    },
    'rd43': { 
        name: 'กข43 (RD43) - ข้าวน้ำตาลต่ำ', 
        price: 18000, 
        yield: 600, 
        duration: 95, 
        risk: 'High', 
        desc: 'ข้าวเพื่อสุขภาพ ดัชนีน้ำตาลต่ำ (Low GI) เป็นที่ต้องการของตลาดสุขภาพ',
        seedCost: 500,  
        careMult: 1.3, // ต้องดูแลดีเป็นพิเศษ
        marketData: {
            exportDestinations: "ยุโรป, สหรัฐฯ (Niche Market/Health Conscious)",
            globalDemand: "Growing", 
            localDemand: "Medium",
            exportPriceTrend: "ราคาสูงแต่ตลาดจำกัด",
            competitors: "ข้าวสี/ธัญพืชสุขภาพจากต่างประเทศ",
            analysis: "ตลาดเฉพาะกลุ่ม (Niche) ควรมีตลาดรับซื้อแน่นอนก่อนปลูก"
        }
    },
    'rd79': { 
        name: 'กข79 (RD79) - ข้าวนุ่ม', 
        price: 10500, 
        yield: 800, 
        duration: 118, 
        risk: 'Medium', 
        desc: 'ข้าวนุ่ม ผลผลิตสูง ต้านทานโรคไหม้และขอบใบแห้ง ลำต้นแข็งไม่ล้มง่าย',
        seedCost: 350,  
        careMult: 1.1,
        marketData: {
            exportDestinations: "อิรัก, อินโดนีเซีย, จีน, ฟิลิปปินส์",
            globalDemand: "Very High",
            localDemand: "Medium",
            exportPriceTrend: "แข่งขันได้ดี (สู้ราคาเวียดนามได้)",
            competitors: "ข้าวเวียดนาม (ครองตลาดข้าวนุ่มอยู่)",
            analysis: "ดาวรุ่งดวงใหม่! กรมการข้าวส่งเสริมเพื่อชิงแชมป์ส่งออกคืนจากเวียดนาม"
        }
    },
    'sticky': { 
        name: 'กข6 (RD6) - ข้าวเหนียว', 
        price: 12500, 
        yield: 600, // ปรับให้สมจริง (เดิม 666)
        duration: 130, 
        risk: 'Low', 
        desc: 'ข้าวเหนียวนาปี หอมนุ่ม เป็นที่นิยมสูงสุดในภาคอีสานและเหนือ',
        seedCost: 400, 
        careMult: 0.9, // ดูแลง่ายสุด
        marketData: {
            exportDestinations: "จีน, สหรัฐฯ (ร้านอาหารไทย), ลาว",
            globalDemand: "Stable",
            localDemand: "Very High", 
            exportPriceTrend: "ผันผวนตามภัยแล้ง",
            competitors: "ข้าวเหนียวเวียดนาม/ลาว",
            analysis: "เน้นบริโภคภายในประเทศเป็นหลัก ส่งออกเป็นรอง"
        }
    },
    'berry': { 
        name: 'ไรซ์เบอร์รี่ (Riceberry)', 
        price: 25000, 
        yield: 500, 
        duration: 130, 
        risk: 'High', 
        desc: 'ข้าวสีม่วงเข้ม สารต้านอนุมูลอิสระสูง ตลาดเฉพาะกลุ่ม',
        seedCost: 600, 
        careMult: 1.5, // ต้นทุนสูง
        marketData: {
            exportDestinations: "ทั่วโลก (Superfood Market)",
            globalDemand: "High Growth",
            localDemand: "Medium",
            exportPriceTrend: "ราคาสูงมาก (High Value)",
            competitors: "Black Rice จากจีน/อิตาลี",
            analysis: "กำไรต่อไร่สูงที่สุด แต่ต้องทำเกษตรอินทรีย์ถึงจะได้ราคาดี"
        }
    }
};

// 2. ฟังก์ชันช่วยเลือกสายพันธุ์เริ่มต้นจากชื่อพืช (Helper Function)
const getInitialVariety = (name) => {
    if (!name) return 'jasmine';
    if (name.includes('หอมมะลิ') || name.includes('jasmine') || name.includes('105')) return 'jasmine';
    if (name.includes('ปทุม') || name.includes('pathum')) return 'pathum';
    if (name.includes('43')) return 'rd43';
    if (name.includes('79')) return 'rd79';
    if (name.includes('เหนียว') || name.includes('sticky') || name.includes('กข6') || name.includes('RD6')) return 'sticky';
    if (name.includes('ไรซ์เบอร์รี่') || name.includes('berry')) return 'berry';
    return 'jasmine'; // Default fallback
};

// 3. ข้อมูลขั้นตอนการปลูกพื้นฐาน (Base Steps) - ละเอียดขึ้นตามคู่มือ
const BASE_RICE_STEPS = [
    { 
        id: 'plow', 
        label: '1. เตรียมดิน (ไถดะ/ไถแปร/ลูบเทือก)', 
        val: 500, 
        baseVal: 500, 
        desc: 'ไถดะตากดิน 7 วันฆ่าเชื้อ + ไถแปร + ปรับระดับดิน (Laser leveling ถ้ามี)' 
    },
    { 
        id: 'seed', 
        label: '2. เมล็ดพันธุ์และการเตรียม', 
        val: 400, 
        baseVal: 400, 
        desc: 'แช่ 24 ชม. หุ้ม 24 ชม. (15-25 กก./ไร่)' 
    },
    { 
        id: 'plant', 
        label: '3. ปลูก (หว่าน/ปักดำ/หยอด)', 
        val: 200, 
        baseVal: 200, 
        desc: 'ค่าแรงหว่าน หรือ ค่าจ้างรถดำนา (ช่วยลดวัชพืช)' 
    },
    { 
        id: 'manage_water', 
        label: '4. จัดการน้ำ (เปียกสลับแห้ง)', 
        val: 300, 
        baseVal: 300, 
        desc: 'ค่าน้ำมันสูบน้ำ (ประหยัดน้ำและลดก๊าซมีเทน)' 
    },
    { 
        id: 'maint', 
        label: '5. ปุ๋ยและอารักขาพืช', 
        val: 1800, 
        baseVal: 1800, 
        desc: 'ปุ๋ยสั่งตัดตามค่าดิน + จัดการวัชพืช/โรคแมลง (3-4 ครั้ง)' 
    },
    { 
        id: 'harvest', 
        label: '6. เก็บเกี่ยวและนวด', 
        val: 600, 
        baseVal: 600, 
        desc: 'ค่าจ้างรถเกี่ยวข้าว (รวมนวด)' 
    },
    { 
        id: 'transport', 
        label: '7. ขนส่ง/ลดความชื้น', 
        val: 200, 
        baseVal: 200, 
        desc: 'ค่าบรรทุกไปลานตาก/โรงสี' 
    },
    { 
        id: 'process', 
        label: '8. แปรรูป (Option)', 
        val: 0, 
        baseVal: 2000, 
        desc: 'ค่าสีข้าว + แพ็คถุง (สำหรับขายข้าวสาร)' 
    }
];

// 4. ข้อมูลเสริม: ระยะการเจริญเติบโต (Growth Stages)
const RICE_GROWTH_STAGES = {
    'vegetative': { dayStart: 0, dayEnd: 45, label: 'ระยะแตกกอ', action: 'ใสปุ๋ยครั้งที่ 1, คุมระดับน้ำ' },
    'reproductive': { dayStart: 46, dayEnd: 75, label: 'ระยะตั้งท้อง/ออกรวง', action: 'ใสปุ๋ยรับรวง, ระวังโรครา' },
    'ripening': { dayStart: 76, dayEnd: 105, label: 'ระยะสุกแก่', action: 'ระบายน้ำออกก่อนเกี่ยว 10 วัน' }
};

// ทำให้ตัวแปรเหล่านี้เรียกใช้ได้ทั่วโลก (Global Scope)
if (typeof window !== 'undefined') {
    window.RICE_PRESETS = RICE_PRESETS;
    window.getInitialVariety = getInitialVariety;
    window.BASE_RICE_STEPS = BASE_RICE_STEPS;
    window.RICE_GROWTH_STAGES = RICE_GROWTH_STAGES;
}
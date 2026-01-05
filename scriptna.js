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
            analysis: "เป็นสินค้า Flagship ของไทย ควรรักษาคุณภาพความหอม และทำตลาด Niche Market"
        }
    },
    'riceberry': { 
        name: 'ข้าวไรซ์เบอร์รี่ (Riceberry)', 
        price: 25000, // ราคาสูงกว่าข้าวทั่วไป (Organic Premium)
        yield: 500,   // ปรับผลผลิต (เดิม 450)
        duration: 130, 
        risk: 'Medium', 
        desc: 'ข้าวสีม่วงต้านอนุมูลอิสระสูง ตลาดสุขภาพต้องการมาก',
        seedCost: 600,  
        careMult: 1.5, // การดูแลแบบอินทรีย์ประณีต
        harvestTime: 'Year-round (Best in Winter)',
        marketData: {
            exportDestinations: "ยุโรป, จีน, ตลาดสุขภาพทั่วโลก",
            globalDemand: "Very High", 
            localDemand: "High (Modern Trade)",
            exportPriceTrend: "ขาขึ้น (Health Trend)",
            competitors: "ข้าวสีนิล, ข้าวสังข์หยด",
            analysis: "ทำอินทรีย์จะได้ราคาสูงมาก ควรแปรรูปเป็นข้าวกล้องเพื่อมูลค่าสูงสุด"
        }
    },
    'rd6': { 
        name: 'ข้าวเหนียว กข.6 (RD6)', 
        price: 12500, // ราคาข้าวเปลือกเหนียว (นาปี) เฉลี่ย
        yield: 666,   // ผลผลิตเฉลี่ยภาคอีสาน (กก./ไร่)
        duration: 120, // ข้าวไวต่อช่วงแสง
        risk: 'Low', 
        desc: 'ข้าวเหนียวพันธุ์หลักของอีสาน นุ่มนาน มีกลิ่นหอม ต้านทานโรคใบจุดสีน้ำตาล',
        seedCost: 400,  
        careMult: 0.9, // ดูแลง่ายกว่าข้าวเจ้าหอมมะลิเล็กน้อย
        harvestTime: 'Nov (Late)',
        marketData: {
            exportDestinations: "จีน (แปรรูป), อาเซียน (ลาว/เวียดนาม)",
            globalDemand: "Medium", 
            localDemand: "Very High (ภาคอีสาน/เหนือ)",
            exportPriceTrend: "ผันผวนตามสต็อก",
            competitors: "ข้าวเหนียว กข.22, ข้าวเหนียวเวียดนาม",
            analysis: "ตลาดหลักคือบริโภคภายในประเทศและแปรรูป (ขนม/สุรา) ควรระวังเรื่องโรคไหม้คอรวง"
        }
    },
    'pathum1': { 
        name: 'ปทุมธานี 1 (ข้าวหอมปทุม)', 
        price: 11500, // ปรับราคาตามตลาดปัจจุบัน
        yield: 750,   // ผลผลิตสูงกว่ามะลิ (เฉลี่ย 650-800)
        duration: 115, // ไม่ไวต่อแสง ปลูกได้ตลอดปี
        risk: 'Low', 
        desc: 'ข้าวหอมพื้นนุ่ม ผลผลิตสูง ปลูกได้ตลอดปี ทนเพลี้ยกระโดดระดับหนึ่ง',
        seedCost: 400,  
        careMult: 1.1,
        harvestTime: 'Year-round',
        marketData: {
            exportDestinations: "จีน, แอฟริกา (ตลาดกลาง)",
            globalDemand: "High", 
            localDemand: "High (ร้านอาหาร)",
            exportPriceTrend: "ทรงตัว",
            competitors: "ข้าวหอมเวียดนาม (Jasmine 85)",
            analysis: "เป็นตัวเลือกที่ดีสำหรับนาชลประทาน ทำรอบได้เร็ว ต้นทุนต่อไร่สูงกว่าแต่ผลผลิตคุ้มค่า"
        }
    },
    'rd79': { 
        name: 'กข79 (ข้าวพื้นนุ่ม)', 
        price: 10500, 
        yield: 900,   // ศักยภาพให้ผลผลิตสูงมาก (เฉลี่ย 800-1000)
        duration: 118, 
        risk: 'Low', 
        desc: 'ข้าวนุ่มผลผลิตสูง ต้านทานเพลี้ยกระโดดสีน้ำตาลดี ลำต้นแข็งไม่ล้มง่าย',
        seedCost: 350,  
        careMult: 1.0,
        harvestTime: 'Year-round',
        marketData: {
            exportDestinations: "เอเชีย, ตะวันออกกลาง, อิรัก",
            globalDemand: "Medium", 
            localDemand: "Medium",
            exportPriceTrend: "แข่งขันสูง",
            competitors: "ข้าวขาวพื้นนุ่มเวียดนาม",
            analysis: "เหมาะสำหรับทำตลาดข้าวถุงพื้นนุ่มราคาประหยัด และส่งออกตลาด Mass"
        }
    }
};

// 2. ขั้นตอนการทำนา (Cost Structure Steps)
const BASE_RICE_STEPS = [
    { 
        id: 'prep', 
        label: '1. เตรียมดิน/เลเซอร์', 
        val: 1200, 
        baseVal: 1200, 
        desc: 'ไถดะ/ไถแปร/ปรับระดับ (Laser Leveling)' 
    },
    { 
        id: 'seed', 
        label: '2. เมล็ดพันธุ์', 
        val: 450, 
        baseVal: 450, 
        desc: 'ค่าเมล็ดพันธุ์ (นาหยอด/นาดำ ประหยัดกว่า)' 
    },
    { 
        id: 'water', 
        label: '3. จัดการน้ำ (AWD)', 
        val: 300, 
        baseVal: 300, 
        desc: 'ค่าน้ำมันสูบน้ำ (ประหยัดน้ำและลดก๊าซมีเทน)' 
    },
    { 
        id: 'maint', 
        label: '4. ปุ๋ยและอารักขาพืช', 
        val: 1800, 
        baseVal: 1800, 
        desc: 'ปุ๋ยสั่งตัดตามค่าดิน + จัดการวัชพืช/โรคแมลง (ชีวภัณฑ์)' 
    },
    { 
        id: 'harvest', 
        label: '5. เก็บเกี่ยวและนวด', 
        val: 600, 
        baseVal: 600, 
        desc: 'ค่าจ้างรถเกี่ยวข้าว (รวมนวด)' 
    },
    { 
        id: 'transport', 
        label: '6. ขนส่ง/ลดความชื้น', 
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
const RICE_GROWTH_STAGES = [
    { stage: 'Seedling', days: 20, desc: 'ระยะกล้า (ต้องการน้ำขังตื้นๆ)' },
    { stage: 'Tillering', days: 40, desc: 'ระยะแตกกอ (ทำเปียกสลับแห้งได้)' },
    { stage: 'Panicle Initiation', days: 30, desc: 'ระยะกำเนิดช่อดอก (ห้ามขาดน้ำ)' },
    { stage: 'Flowering', days: 15, desc: 'ระยะออกดอก (ระวังเพลี้ย/โรคไหม้)' },
    { stage: 'Ripening', days: 30, desc: 'ระยะสุกแก่ (ระบายน้ำออกก่อนเกี่ยว 10 วัน)' }
];

// Global Exposure
if (typeof window !== 'undefined') {
    window.RICE_PRESETS = RICE_PRESETS;
    window.BASE_RICE_STEPS = BASE_RICE_STEPS;
    window.RICE_GROWTH_STAGES = RICE_GROWTH_STAGES;
    
    // Helper to guess variety from name
    window.getInitialVariety = (name) => {
        if (!name) return 'jasmine';
        if (name.includes('ไรซ์เบอร์รี่') || name.includes('Riceberry')) return 'riceberry';
        if (name.includes('ปทุม')) return 'pathum1';
        if (name.includes('กข79') || name.includes('79')) return 'rd79';
        if (name.includes('เหนียว') || name.includes('กข6') || name.includes('RD6')) return 'rd6';
        return 'jasmine';
    };
}
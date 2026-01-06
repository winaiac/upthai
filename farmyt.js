// --- farmyt.js : คลังวีดีโอความรู้ YouTube สำหรับการเกษตร ---
// อัปเดต: เพิ่มวิดีโออินทผาลัม

(function(global) {
    
    // รายการวีดีโอแยกตามหมวดหมู่ (YouTube Video IDs)
    const FARMING_VIDEOS = {
        // --- ทุเรียน ---
        'durian': [
            { id: 'O8JwlyS9pFw', title: 'วิธีปลูกทุเรียนหมอนทอง ในเข่ง! ให้รอด 100%' },
            { id: 'eOCdOlRIDc4', title: 'มือใหม่ต้องรู้! ปลูกทุเรียนอย่างไรให้รอด (เกษตรนิวเจน)' },
            { id: 'HE_DzRrRO84', title: 'เทคนิคปลูกทุเรียนให้รอด โตเร็ว ไว้กินเอง' },
            { id: '59n3Hy5_tJY', title: 'ปลูกทุเรียนหมอนทองไม่ถึง 3 ปี มีลูกกิน' }
        ],

        // --- อินทผาลัม (Date Palm) - เพิ่มใหม่ ---
        'date_palm': [
            { id: 'NVAeXg3Y1go', title: 'วิธีปลูกอินทผลัมเพาะเลี้ยงเนื้อเยื่อ สายพันธุ์บาร์ฮี (EP.66)' },
            { id: 'yY909HHWuko', title: 'เปิดเทคนิค "ผสมเกสรอินทผลัม" จากสวนปรีชา (สำคัญมาก!)' },
            { id: 'y4m-S58HQCU', title: 'เทคนิคการปลูกและดูแลอินทผลัม ให้มีรายได้หลักล้าน' },
            { id: 'ji-wKGH8hQA', title: 'วิธีดูแลต้นอินทผาลัมให้โตไว ไม่ยุ่งยาก (1 ปีโตขนาดนี้)' }
        ],

        // --- ข้าว (รวมหอมมะลิ) ---
        'rice_jasmine': [
            { id: 'YZzDw9WHg9c', title: 'ข้าวปีมะลิ 105 ทำไงให้ได้ไร่ละตัน' },
            { id: 'k2ywu6IDI0g', title: 'ข้าวหอมมะลิ 105 หว่านแห้ง ลงทุนน้อยกำไลงาม' },
            { id: 'q8KilhlMPos', title: 'เคล็ด(ไม่)ลับ ฉบับข้าวหอมมะลิ 105' },
            { id: 'kMfiGbJtjpY', title: 'หว่านข้าวมะลิ 105 ไม่มีหญ้า' }
        ],

        // --- ข้าวไรซ์เบอร์รี่ ---
        'rice_riceberry': [
            { id: 'f2spmairsMQ', title: 'เทคนิคเตรียมดินปลูกข้าวไรซ์เบอรี่อินทรีย์' },
            { id: 'ruucugJ_i8I', title: 'เกษตรทำเงิน: ปลูกข้าวไรซ์เบอร์รี่ สร้างกำไรงาม' },
            { id: 'i1wPSAg4LLQ', title: 'ปลูกข้าวไรซ์เบอร์รี่ สร้างรายได้หลังเกษียณ' }
        ],

        // --- ยางพารา ---
        'rubber': [
            { id: 'pvuL5cwb5CY', title: 'เทคนิคการกรีดยาง โดย น้องปุ๋ยขยัน' },
            { id: 'h4t153ttbes', title: 'วิธีการกรีดยางที่ถูกต้อง (รักษามุมกรีด)' },
            { id: 'SVzh-aC4P8Y', title: 'สอนกรีดยางพารา สำหรับมือใหม่' },
            { id: '1449Kj7u8bA', title: 'สิ่งที่ควรรู้เกี่ยวกับการกรีดยางพารา' }
        ],

        // --- มะพร้าวน้ำหอม ---
        'coconut': [
            { id: 'C82x_4Xhp3E', title: 'มือใหม่ปลูกมะพร้าวน้ำหอม เริ่มจากตรงไหนดี (NC Coconut)' },
            { id: 'm0Lz4J28Wdk', title: 'พาชมสวนมะพร้าวน้ำหอมดำเนินสะดวก' },
            { id: 'ZV-gfyT9ZX8', title: 'มะพร้าวดำเนินสะดวก | ที่นี่บ้านเรา' }
        ],

        // --- โคก หนอง นา (Integrated) ---
        'integrated': [
            { id: 'NSdoKkzuHGw', title: 'โคกหนองนาโมเดลกับพื้นที่ 1 ไร่ (เกษตรสัญจร)' },
            { id: 'uNAca_vJnZA', title: 'ความรู้เกี่ยวกับ โคก หนอง นา โมเดล EP.1' },
            { id: 'rEyby0YqGMg', title: 'การออกแบบโคก หนอง นา ด้วยตัวเอง' },
            { id: 'ZMIRRKVhb60', title: 'สร้างความสุขบนพื้นที่ 1 ไร่ ด้วยโคกหนองนา' }
        ],

        // --- โคขุน (โพนยางคำ) ---
        'cow': [
            { id: 'BVMhlS6usJA', title: 'ต้นกำเนิดเนื้อโคขุนโพนยางคำ (อ.ส.ท. ON TV)' },
            { id: 'y1pXecFsRGE', title: 'เส้นทาง "เนื้อโคขุน" แสนอร่อย' },
            { id: 'KlFEd7_byWQ', title: 'คนรุ่นใหม่ใส่ใจการเลี้ยงโคขุนโพนยางคำ' },
            { id: '3dpHdfHqzn0', title: 'เคล็ดลับการเลี้ยงและการชำแหละ โคขุนพรีเมี่ยม' }
        ],

        // --- สุกร/หมู ---
        'pig': [
            { id: 'slTnkAPaJRw', title: 'เลี้ยงหมูขุนขายสร้างรายได้หมุนเวียน' },
            { id: '6Il6JArUiio', title: 'แนะนำโรงเรือนและคอกหมู ลงทุนหลักหมื่น' },
            { id: 'OUnKtAF8PPE', title: 'มือใหม่ห้ามพลาด! ยาประจำคอกหมูขุน' }
        ],

        // --- ข้าวโพดเลี้ยงสัตว์ ---
        'maize': [
            { id: 'ff_fz_Awiqs', title: 'การปลูกข้าวโพดเลี้ยงสัตว์หลังนา' },
            { id: 'Iwn-asUMIQg', title: 'ปลูกข้าวโพดหลังนาถูกวิธี ได้ผลดี' },
            { id: 'KyXXfJir1w0', title: 'ปลูกข้าวโพดเลี้ยงสัตว์ ใช้น้ำน้อย ดูแลง่าย' }
        ],

        // --- มันสำปะหลัง ---
        'cassava': [
            { id: 'OoXYTEJTmFQ', title: 'การปลูกมันสำปะหลังระบบน้ำหยด' },
            { id: 'bCIIO9CHSGg', title: 'การจัดการระบบน้ำหยดในมันสำปะหลัง' },
            { id: '6ggbXLMqMDY', title: 'ปลูกมันสำปะหลังน้ำหยด รายได้ 3-5 หมื่น/ไร่' }
        ]
    };

    // Helper to get video list by key
    const getVideos = (key) => {
        return FARMING_VIDEOS[key] || [];
    };

    // Helper to get video key based on item name/category
    const getVideoKey = (item, config = {}) => {
        const name = item.name || '';
        
        if (name.includes('อินทผาลัม')) return 'date_palm'; // เพิ่มเงื่อนไข
        if (name.includes('ทุเรียน')) return 'durian';
        if (name.includes('ข้าวไรซ์เบอร์รี่') || (config.variety === 'riceberry')) return 'rice_riceberry';
        if (name.includes('ข้าว') && !name.includes('โพด')) return 'rice_jasmine'; 
        if (name.includes('ยางพารา')) return 'rubber';
        if (name.includes('มะพร้าว')) return 'coconut';
        if (name.includes('โคก') || item.category === 'ผสมผสาน') return 'integrated';
        if (name.includes('โค') || name.includes('วัว') || name.includes('โพนยางคำ')) return 'cow';
        if (name.includes('หมู') || name.includes('สุกร')) return 'pig';
        if (name.includes('ข้าวโพด')) return 'maize';
        if (name.includes('มันสำปะหลัง')) return 'cassava';
        
        return null;
    };

    global.AppVideo = {
        getVideos,
        getVideoKey
    };

})(window);
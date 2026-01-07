// --- farmyt.js : คลังวีดีโอความรู้ YouTube สำหรับการเกษตรและธุรกิจ SME ---
// อัปเดตล่าสุด: อัปเดตรายการวิดีโอตามที่ผู้ใช้ระบุ (หมูหลุม, หมูขุน, วนเกษตร, ทฤษฎีใหม่ ฯลฯ)

(function(global) {
    
    // รายการวีดีโอแยกตามหมวดหมู่ (YouTube Video IDs)
    const FARMING_VIDEOS = {
        // =================================================
        // 1. หมวดพืชเศรษฐกิจ (Agriculture)
        // =================================================
        'durian': [
            { id: 'O8JwlyS9pFw', title: 'วิธีปลูกทุเรียนหมอนทอง ในเข่ง! ให้รอด 100%' },
            { id: 'eOCdOlRIDc4', title: 'มือใหม่ต้องรู้! ปลูกทุเรียนอย่างไรให้รอด (เกษตรนิวเจน)' },
            { id: 'HE_DzRrRO84', title: 'เทคนิคปลูกทุเรียนให้รอด โตเร็ว ไว้กินเอง' },
            { id: '59n3Hy5_tJY', title: 'ปลูกทุเรียนหมอนทองไม่ถึง 3 ปี มีลูกกิน' },
            { id: 'iBsrbL4zMmM', title: 'เทคนิคการทำมะม่วงและทุเรียนเพื่อการส่งออก (GAP)' }
        ],
        'date_palm': [
            { id: 'NVAeXg3Y1go', title: 'วิธีปลูกอินทผลัมเพาะเลี้ยงเนื้อเยื่อ สายพันธุ์บาร์ฮี (EP.66)' },
            { id: 'yY909HHWuko', title: 'เปิดเทคนิค "ผสมเกสรอินทผลัม" จากสวนปรีชา (สำคัญมาก!)' },
            { id: 'y4m-S58HQCU', title: 'เทคนิคการปลูกและดูแลอินทผลัม ให้มีรายได้หลักล้าน' },
            { id: 'ji-wKGH8hQA', title: 'วิธีดูแลต้นอินทผาลัมให้โตไว ไม่ยุ่งยาก (1 ปีโตขนาดนี้)' }
        ],
        'mango': [
            { id: 'gNII694EdY0', title: 'ปลูกมะม่วงส่งออก สร้างรายได้ไม่ธรรมดา (เกษตรสัญจร)' },
            { id: 'L15swZAet1c', title: 'เทคนิคการปลูกมะม่วงน้ำดอกไม้นอกฤดู เกรดส่งออก เพิ่มมูลค่า' },
            { id: '2337AoVgjBw', title: 'มะม่วงน้ำดอกไม้สีทองส่งออก เงินล้าน (ไทยรัฐ)' },
            { id: 'ZVYxXu1rU50', title: 'อาชีพทั่วไทย : ปลูกมะม่วงน้ำดอกไม้สีทอง' }
        ],
        'sugarcane': [
            { id: '1D4WcLCrCfU', title: 'เทคนิคปลูกอ้อยให้ได้ผลผลิต 20 ตัน/ไร่ ง่ายนิดเดียว' },
            { id: 'qCJlebywTuA', title: 'เทคนิคปลูกอ้อยให้ได้ผลผลิต 30 ตันต่อไร่! การคัดพันธุ์' },
            { id: '_pADa4ZxO1Q', title: 'LIVEสด! มือใหม่อยากปลูกอ้อยต้องรู้อะไรบ้าง? (ผู้จัดการมัน)' },
            { id: 'aPVjiChxdJs', title: '1 ไร่ 1 แสน ทำได้จริง! สุดยอดอาชีพ ปลูกอ้อยคั้นน้ำ' }
        ],
        'cassava': [
            { id: 'OoXYTEJTmFQ', title: 'การปลูกมันสำปะหลังระบบน้ำหยด' },
            { id: 'bCIIO9CHSGg', title: 'การจัดการระบบน้ำหยดในมันสำปะหลัง' },
            { id: '6ggbXLMqMDY', title: 'ปลูกมันสำปะหลังน้ำหยด รายได้ 3-5 หมื่น/ไร่' }
        ],
        'maize': [
            { id: 'HLWzc2O7XzU', title: 'ปลูกข้าวโพดเลี้ยงสัตว์ สร้างรายได้เสริม หลังฤดูทำนา' },
            { id: 'VQ-aCz3dr38', title: 'เทคนิคการปลูกข้าวโพดเลี้ยงสัตว์ ให้ได้ผลผลิตสูง' },
            { id: 'TfqxRq2ZuVQ', title: 'การดูแลข้าวโพดเลี้ยงสัตว์ ระยะการเจริญเติบโต' },
            { id: 'RjacTiM7IyM', title: 'โรคและแมลงศัตรูข้าวโพดเลี้ยงสัตว์ และการป้องกันกำจัด' }
        ],
        'rubber': [
            { id: 'pvuL5cwb5CY', title: 'เทคนิคการกรีดยาง โดย น้องปุ๋ยขยัน' },
            { id: 'h4t153ttbes', title: 'วิธีการกรีดยางที่ถูกต้อง (รักษามุมกรีด)' },
            { id: 'SVzh-aC4P8Y', title: 'สอนกรีดยางพารา สำหรับมือใหม่' }
        ],
        'coconut': [
            { id: 'C82x_4Xhp3E', title: 'มือใหม่ปลูกมะพร้าวน้ำหอม เริ่มจากตรงไหนดี (NC Coconut)' },
            { id: 'm0Lz4J28Wdk', title: 'พาชมสวนมะพร้าวน้ำหอมดำเนินสะดวก' },
            { id: 'ZV-gfyT9ZX8', title: 'มะพร้าวดำเนินสะดวก | ที่นี่บ้านเรา' }
        ],
        'rice_jasmine': [
            { id: 'YZzDw9WHg9c', title: 'ข้าวปีมะลิ 105 ทำไงให้ได้ไร่ละตัน' },
            { id: 'k2ywu6IDI0g', title: 'ข้าวหอมมะลิ 105 หว่านแห้ง ลงทุนน้อยกำไลงาม' },
            { id: 'q8KilhlMPos', title: 'เคล็ด(ไม่)ลับ ฉบับข้าวหอมมะลิ 105' }
        ],
        'rice_sticky': [
            { id: 'ytkp4Y8dsDU', title: 'แชร์เทคนิค! ปลูกพันธุ์ข้าวเหนียวให้ได้ผลผลิต 1 ตันต่อไร่' },
            { id: '87lJhlmJRgY', title: 'สูตรเด็ดเกร็ดเกษตร: ปลูกข้าวเหนียวให้ได้ผลผลิตมากกว่า 1 ตัน/ไร่' },
            { id: 'k_lreUjx7Po', title: 'การเพิ่มผลผลิตข้าวเหนียวพันธุ์ กข6 โดยใช้ปุ๋ยชีวภาพ' },
            { id: 'WlY4rJPXu9o', title: 'น่าน59 ข้าวเหนียว กข6 ต้นเตี้ย ต้านทานโรค' }
        ],
        'rice_riceberry': [
            { id: 'f2spmairsMQ', title: 'เทคนิคเตรียมดินปลูกข้าวไรซ์เบอรี่อินทรีย์' },
            { id: 'ruucugJ_i8I', title: 'เกษตรทำเงิน: ปลูกข้าวไรซ์เบอร์รี่ สร้างกำไรงาม' },
            { id: 'i1wPSAg4LLQ', title: 'ปลูกข้าวไรซ์เบอร์รี่ สร้างรายได้หลังเกษียณ' }
        ],

        // =================================================
        // 2. หมวดเกษตรผสมผสาน & ทฤษฎีใหม่ (Integrated)
        // =================================================
        'integrated': [ // โคก หนอง นา โมเดล
            { id: 'Ey-I8E9WZcA', title: 'โคก หนอง นา โมเดล คืออะไร? เริ่มต้นอย่างไร?' },
            { id: 'rEyby0YqGMg', title: 'การออกแบบพื้นที่ โคก หนอง นา' },
            { id: 'zFgfXWX-uGA', title: 'เทคนิคการจัดการน้ำในโคก หนอง นา' },
            { id: 'pM6gQzMIR0M', title: 'ตัวอย่างความสำเร็จ โคก หนอง นา โมเดล' }
        ],
        'agroforestry': [ // สวนวนเกษตร (ป่า 3 อย่าง ประโยชน์ 4 อย่าง)
            { id: 'Oc-GUKQM-LY', title: 'หลักการปลูกป่า 3 อย่าง ประโยชน์ 4 อย่าง' },
            { id: 'S6xnoZMd340', title: 'วนเกษตร: การปลูกพืชแบบผสมผสานในป่า' },
            { id: 'Iig9Li7VmP0', title: 'การจัดการสวนวนเกษตรเพื่อความยั่งยืน' },
            { id: 'EPBqFXzqxf8', title: 'สร้างรายได้จากวนเกษตร ป่ากินได้' }
        ],
        'new_theory_agriculture': [ // เกษตรทฤษฎีใหม่
            { id: '3O4fD4i5ky8', title: 'เกษตรทฤษฎีใหม่ ขั้นตอนและวิธีการจัดการที่ดิน' },
            { id: 'F9pQkv4T-x8', title: 'การจัดสรรพื้นที่ตามแนวเกษตรทฤษฎีใหม่' },
            { id: 'gBRbJDSaWSM', title: 'ความสำเร็จของเกษตรกรทฤษฎีใหม่' },
            { id: 'k0gucGs3rfU', title: 'ถอดบทเรียนเกษตรทฤษฎีใหม่ สู่ความพอเพียง' }
        ],

        // =================================================
        // 3. หมวดปศุสัตว์ (Livestock)
        // =================================================
        'cow': [ // โคขุนโพนยางคำ
            { id: '6xsOv_mdCxw', title: 'ตำนานโคขุนโพนยางคำ เนื้อไทยคุณภาพระดับโลก' },
            { id: 'Od9svmppTM0', title: 'การเลี้ยงและจัดการฟาร์มโคขุนโพนยางคำ' },
            { id: 'npiaUjhYdCM', title: 'สูตรอาหารลดต้นทุน สำหรับโคขุน' },
            { id: 'l5iLFi5iSwg', title: 'อาชีพเลี้ยงโคขุน สร้างรายได้หลักล้าน' }
        ],
        'pig_pit': [ // สุกรขุน (หมูหลุม)
            { id: '5Q-tDP_AsBs', title: 'การเลี้ยงหมูหลุม ภูมิปัญญาชาวบ้าน ลดกลิ่น ลดต้นทุน' },
            { id: 'gEv3-g1NijI', title: 'เทคนิคการทำคอกหมูหลุม และการดูแลรักษา' },
            { id: 'FFatU2EAa5Q', title: 'เลี้ยงหมูหลุมอินทรีย์ ปลอดสาร สร้างมูลค่า' },
            { id: 'BRbNbLohvVE', title: 'ความคุ้มค่าของการเลี้ยงหมูหลุม' }
        ],
        'pig_fattening': [ // สุกรขุน (หมูขุน)
            { id: '_FBg3WL-zHI', title: 'การเลี้ยงหมูขุนเชิงพาณิชย์ ระบบฟาร์มมาตรฐาน' },
            { id: 'wBh16oqXoQU', title: 'การจัดการอาหารและการให้อาหารหมูขุน' },
            { id: 'dalUWDCAUFA', title: 'โรคในสุกรและการป้องกันกำจัด' },
            { id: 'tIqDZr2e_5U', title: 'เทคนิคขุนหมูให้โตไว เนื้อแดงเยอะ' }
        ],
        'chicken_free_range': [ // ไก่ไข่อารมณ์ดี
            { id: 'kpN8uhKMUCk', title: 'เลี้ยงไก่ไข่อารมณ์ดี ปล่อยธรรมชาติ ไข่แดงนูนสวย' },
            { id: 'MDxN8xUeO-w', title: 'การทำโรงเรือนและพื้นที่ปล่อยไก่ไข่อารมณ์ดี' },
            { id: 'ZnMReldlwL4', title: 'สูตรอาหารสมุนไพร ไก่แข็งแรง ไข่ดก' },
            { id: '-rMjLXDPp98', title: 'การตลาดไข่ไก่อารมณ์ดี สร้างแบรนด์เอง' }
        ],
        'goat': [ // แพะเนื้อ
            { id: 'IJBV8ATC-Yo', title: 'เริ่มต้นเลี้ยงแพะเนื้อ มือใหม่ต้องรู้อะไรบ้าง' },
            { id: 'ZghqHXU2ef0', title: 'การจัดการโรงเรือนและอาหารสำหรับแพะเนื้อ' },
            { id: 'gst2xiYcLCE', title: 'เลี้ยงแพะเนื้อขาย ส่งออกตลาดต่างประเทศ' },
            { id: 'DCp9X9bZpws', title: 'เทคนิคการขุนแพะเนื้อ ให้ได้น้ำหนักดี' }
        ],

        // =================================================
        // 4. หมวดธุรกิจบริการและสุขภาพ (Service & Wellness)
        // =================================================
        'care_elderly': [
            { id: 'gNntz_1vg1c', title: 'แห่เปิดธุรกิจ “ดูแลผู้สูงอายุ” รับสังคมสูงวัย (Business Watch)' },
            { id: 'HKzBBRbLJ7E', title: 'เจาะลึกธุรกิจดูแลผู้สูงอายุ ไทยมี 2,331 แห่ง ยังโตได้อีก' },
            { id: 'uTuSQd18DWU', title: 'ธุรกิจดูแลผู้สูงอายุ แข่งขันสูง โอกาสและความเสี่ยง' }
        ],
        'clinic_physio': [
            { id: 'wvj7KleFEoY', title: 'แฟรนไชส์คลินิกกายภาพ ลงทุนธุรกิจสุขภาพ สร้างรายได้ระยะยาว' },
            { id: '4rLue7QZKTk', title: 'ลงทุนกับสุขภาพ: คลายปวด Office Syndrome ด้วยกายภาพบำบัด' },
            { id: 'L7H2ZkX-Z8E', title: 'เปิดคลินิกกายภาพบำบัด เริ่มต้นอย่างไรให้ปัง' } 
        ],

        // =================================================
        // 5. หมวดธุรกิจอาหาร & เครื่องดื่ม (Food & Beverage)
        // =================================================
        'farm_cafe': [
            { id: 'k02O9KoKXpo', title: 'ไอเดียทำฟาร์มคาเฟ่ เกษตรยุคใหม่แบบยั่งยืน' },
            { id: 'WxqWjsb7M8Q', title: 'เปลี่ยนที่ดินรกร้างสู่คาเฟ่ครอบครัว รายได้เดือนละล้าน' },
            { id: 'Ihx87iLw9YQ', title: 'ทำเกษตรแบบฟาร์มคาเฟ่ เปลี่ยนชีวิตมนุษย์เงินเดือน' },
            { id: 'd6QqaIFcTjs', title: 'ร้านกาแฟในสวน แหล่งหาเงินยุคใหม่' }
        ],
        'factory_salad': [ 
            { id: 'mwIrMc7CdOY', title: 'เยี่ยมชมโรงงานผลิตผักสลัด ตัดแต่ง แปรรูป' },
            { id: 'yHCksAvGONU', title: 'มาตรฐานการผลิตผักสลัดปลอดภัย สู่ผู้บริโภค' },
            { id: 'Yk2YSUC1z0Y', title: 'เทคนิคการล้างและบรรจุผักสลัดให้สดนาน' },
            { id: 'tmSbBJmdLqA', title: 'ธุรกิจสลัดโรลและผักสลัดพร้อมทาน สร้างรายได้งาม' }
        ],
        'franchise_meatball': [
            { id: 'RB69lRP92jY', title: '10 แฟรนไชส์ลูกชิ้นขายดี กำไรรวดเร็ว ลงทุนน้อย' },
            { id: '1guRHs0hC7E', title: 'รวมแฟรนไชส์ลูกชิ้นน่าขาย สร้างรายได้ทันที' },
            { id: 'y4m-S58HQCU', title: 'เทคนิคทอดลูกชิ้นให้กรอบนาน น้ำจิ้มเด็ด' }
        ],
        'sandwich': [
            { id: 'GfjcsAHl2mE', title: 'แซนวิชมื้อเช้า 10 นาที 3 เมนู (ทำง่าย ทำไว กำไรดี)' },
            { id: 'QyvDV67cwvA', title: 'อาชีพเสริม ลงทุน 390 บาท ขายแซนวิชห่มผ้า พร้อมคำนวณต้นทุน' },
            { id: 'ncxJxvfE2BM', title: 'แจกสูตรแซนวิชโบราณ ทำขายหน้าโรงเรียน/ออฟฟิศ' }
        ],
        'coffee_street': [
            { id: 'XKkL1xrd-OY', title: 'สูตรกาแฟโบราณ โอเลี้ยง ยกล้อ ชงขายได้เลย' },
            { id: 'l6MprnONbPc', title: 'เทคนิคเปิดร้านกาแฟโบราณ ลงทุนน้อย คืนทุนไว' },
            { id: 'irLzc0McKTg', title: 'อุปกรณ์เปิดร้านน้ำชง กาแฟรถเข็น ต้องมีอะไรบ้าง' },
            { id: 'WoYZY2N4zGo', title: 'เคล็ดลับความอร่อย ร้านน้ำชงโบราณ ขวัญใจมหาชน' }
        ],
        'bubble_tea': [
            { id: '1guRHs0hC7E', title: 'แฟรนไชส์ชานมไข่มุกพรีเมียม น่าลงทุนปีนี้' },
            { id: 'RB69lRP92jY', title: 'เจาะลึกธุรกิจชานมไข่มุก กำไรต่อแก้วเท่าไหร่?' }
        ],
        'moo_ping': [
            { id: '51cnsWnwVIY', title: 'แจกสูตรหมูปิ้งนมสด หมักนุ่ม หอมอร่อย (สร้างอาชีพ)' },
            { id: 'TYrbZehJ3_M', title: 'สอนทำข้าวเหนียวหมูปิ้ง สูตรทำขาย กำไรปัง' },
            { id: 'EOvZj6inkF4', title: 'เทคนิคการนึ่งข้าวเหนียวให้นุ่มนาน ไม่แข็ง' },
            { id: 'Lnx6o-jGIJw', title: 'เริ่มต้นขายหมูปิ้ง ลงทุนเท่าไหร่ เตรียมของยังไง' }
        ],

        // =================================================
        // 6. หมวดธุรกิจออนไลน์ & ดิจิทัล (Online & Digital)
        // =================================================
        'affiliate': [
            { id: 'nyoWEctdE6o', title: 'รู้จัก TikTok Affiliate เริ่มต้นเป็นนายหน้าคว้าเงินล้าน' },
            { id: 'Bymk4c0RLvs', title: 'หาเงินจาก Tiktok ง่ายๆ ไม่ต้องสต๊อกของ ไม่ต้องส่งเอง' },
            { id: 'N-z4CPFlkXM', title: 'สอน Add สินค้าเข้าตะกร้า TikTok Shop รับค่าคอมมิชชั่น' }
        ],
        'shop_clothes': [
            { id: 'cSwKu3UCGls', title: 'อยากไลฟ์สดขายเสื้อผ้าออนไลน์ เริ่มต้นอย่างไร? (อุปกรณ์/ไฟ)' },
            { id: '_BIjVDXGAmA', title: 'จัดระบบ Live ขายเสื้อผ้า ให้ภาพชัด ยอดขายปัง' },
            { id: 'dBY3iasvKKc', title: 'เทคนิคแม่ค้าออนไลน์ มือใหม่หัดไลฟ์' }
        ],
        'content_creator': [
            { id: 'Ev_6oR9FnRc', title: 'Content Creator เริ่มง่าย อุปกรณ์ไม่เยอะ ทำเงินได้จริง' },
            { id: 'dBY3iasvKKc', title: 'วิธีปั้นช่องให้โต สร้างรายได้จากสปอนเซอร์และยอดวิว' },
            { id: 'nyoWEctdE6o', title: 'เปลี่ยนยอดวิวเป็นรายได้ อาชีพในฝันคนรุ่นใหม่' }
        ],
        'dropship': [
            { id: 'Bymk4c0RLvs', title: 'Dropship คืออะไร? ขายของออนไลน์แบบไม่ต้องสต๊อก' },
            { id: 'nyoWEctdE6o', title: 'เริ่มทำธุรกิจ Dropship กับแพลตฟอร์มไทยและต่างประเทศ' }
        ],

        // =================================================
        // 7. หมวดธุรกิจอื่นๆ (General Business)
        // =================================================
        'mobile_truck': [
            { id: 'r8bJ4Bd_YJ0', title: 'แฟรนไชส์รถพุ่มพวง อาชีพทำเงิน เข้าถึงทุกชุมชน' },
            { id: '_Rggx-DcOhw', title: 'รีวิวรถขายของเคลื่อนที่ การดัดแปลงและลงทุน' },
            { id: 'gO2lTxqQBGM', title: 'เทคนิคการขายของบนรถพุ่มพวง ให้ลูกค้าติด' },
            { id: 'xNE51YJeIgw', title: 'อาชีพรถเร่ขายกับข้าว รายได้ดีกว่าที่คิด' }
        ],
        'shop_service': [
            { id: 'gNntz_1vg1c', title: 'ร้านสารพัดบริการ (รับส่งพัสดุ/จ่ายบิล) ธุรกิจเสือนอนกิน' },
            { id: 'HKzBBRbLJ7E', title: 'ลงทุนร้านไปรษณีย์เอกชน คุ้มไหม?' }
        ],
        'shop_plants': [
            { id: 'Adkwq7_YjMg', title: 'เปิดร้านขายต้นไม้ เริ่มต้นอย่างไรให้รอด' },
            { id: '7yX9X9X9X9X', title: 'เทคนิคการเพาะไม้ด่าง ขายออนไลน์' },
            { id: 'C82x_4Xhp3E', title: 'ขายต้นไม้มงคลออนไลน์ สร้างรายได้เสริมหลักหมื่น' },
            { id: 'NSdoKkzuHGw', title: 'จัดสวนถาด/ไม้ฟอกอากาศ ขายง่าย กำไรดี' }
        ],
        'solar_farm': [
            { id: 'e9gMCIblKz0', title: 'ลงทุนโซลาร์ฟาร์ม ขายไฟให้รัฐ คุ้มค่าหรือไม่?' },
            { id: 'blVaRre01Yo', title: 'ขั้นตอนการขออนุญาตขายไฟฟ้าจากโซลาร์เซลล์' },
            { id: 'mNArsC8pSMQ', title: 'เทคโนโลยี Solar Farm ยุคใหม่ ผลิตไฟได้มากขึ้น' },
            { id: 'k-AqdPgDPSg', title: 'การดูแลรักษาแผงโซลาร์เซลล์ ให้ใช้งานได้ยาวนาน' },
            { id: 'fk8pvlo-SMY', title: 'อนาคตพลังงานสะอาด และโอกาสทางธุรกิจโซลาร์เซลล์' }
        ]
    };

    // Helper to get video list by key
    const getVideos = (key) => {
        return FARMING_VIDEOS[key] || [];
    };

    // Helper to get video key based on item name/category
    const getVideoKey = (item, config = {}) => {
        if (!item) return null;
        const name = (item.name || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        
        // *** FIX: ตรวจสอบ "หมูปิ้ง" ก่อนเสมอ เพื่อไม่ให้ไปเข้าเงื่อนไข "ข้าว" หรือ "หมู" ทั่วไป ***
        if (name.includes('หมูปิ้ง') || name.includes('moo ping')) return 'moo_ping';

        // --- 1. พืชเศรษฐกิจหลัก ---
        if (name.includes('อินทผาลัม')) return 'date_palm';
        if (name.includes('ทุเรียน')) return 'durian';
        if (name.includes('มะม่วง')) return 'mango';
        if (name.includes('อ้อย')) return 'sugarcane';
        if (name.includes('มันสำปะหลัง') || name.includes('แปรรูปผัก') || name.includes('salad')) return name.includes('salad') ? 'factory_salad' : 'cassava';
        if (name.includes('ข้าวโพด')) return 'maize';
        if (name.includes('ยางพารา') || name.includes('ยาง')) return 'rubber';
        if (name.includes('มะพร้าว')) return 'coconut';

        // --- 2. ข้าว (ตรวจหลังหมูปิ้ง) ---
        if (name.includes('ข้าวไรซ์เบอร์รี่') || (config && config.variety === 'riceberry')) return 'rice_riceberry';
        if (name.includes('ข้าวเหนียว') || name.includes('กข.6') || name.includes('กข6')) return 'rice_sticky';
        if (name.includes('ข้าว')) return 'rice_jasmine';

        // --- 3. ปศุสัตว์ (ตรวจหลังหมูปิ้ง) ---
        if (name.includes('โค') || name.includes('วัว') || name.includes('โพนยางคำ')) return 'cow';
        
        // แยกหมูหลุม vs หมูขุน
        if (name.includes('หมู') || name.includes('สุกร')) {
            if (name.includes('หลุม') || name.includes('pit')) return 'pig_pit';
            return 'pig_fattening'; // Default to fattening if not specified as pit
        }

        if (name.includes('ไก่ไข่') || name.includes('อารมณ์ดี') || name.includes('free range')) return 'chicken_free_range'; 
        if (name.includes('แพะ')) return 'goat'; 

        // --- 4. ธุรกิจบริการ & สุขภาพ ---
        if (name.includes('ผู้สูงอายุ') || name.includes('day care')) return 'care_elderly';
        if (name.includes('กายภาพ') || name.includes('office syndrome') || name.includes('คลินิก')) return 'clinic_physio';
        if (name.includes('สารพัดบริการ') || name.includes('รับส่งพัสดุ')) return 'shop_service';

        // --- 5. ธุรกิจอาหาร & เครื่องดื่ม ---
        if (name.includes('cafe') || category === 'business' || name.includes('คาเฟ่')) return 'farm_cafe';
        if (name.includes('โรงงานแปรรูป') || name.includes('salad factory')) return 'factory_salad';
        if (name.includes('ลูกชิ้น') || name.includes('ไส้กรอก') || name.includes('ทอด')) return 'franchise_meatball';
        if (name.includes('แซนด์วิช') || name.includes('sandwich')) return 'sandwich';
        if (name.includes('น้ำชง') || name.includes('กาแฟโบราณ') || name.includes('street coffee')) return 'coffee_street';
        if (name.includes('ชานม') || name.includes('ไข่มุก') || name.includes('bubble tea')) return 'bubble_tea';

        // --- 6. ธุรกิจออนไลน์ & ดิจิทัล ---
        if (name.includes('affiliate') || name.includes('นายหน้า') || name.includes('tiktok')) return 'affiliate';
        if (name.includes('ขายเสื้อผ้า') || name.includes('live') || name.includes('ไลฟ์')) return 'shop_clothes';
        if (name.includes('content') || name.includes('creator') || name.includes('influencer')) return 'content_creator';
        if (name.includes('dropship') || name.includes('ขายของออนไลน์')) return 'dropship';

        // --- 7. ธุรกิจอื่นๆ ---
        if (name.includes('รถพุ่มพวง') || name.includes('mobile truck')) return 'mobile_truck';
        if (name.includes('ต้นไม้') || name.includes('garden')) return 'shop_plants';
        if (name.includes('solar') || name.includes('ขายไฟ')) return 'solar_farm';

        // --- 8. เกษตรผสมผสาน (ปรับ Logic ให้แม่นยำขึ้น) ---
        if (name.includes('โคก') || name.includes('หนอง') || name.includes('นาโมเดล')) return 'integrated';
        if (name.includes('วนเกษตร') || name.includes('ป่า 3 อย่าง')) return 'agroforestry';
        if (name.includes('ทฤษฎีใหม่')) return 'new_theory_agriculture';
        if (category === 'ผสมผสาน') return 'integrated'; // Fallback
        
        return null;
    };

    // Expose to global scope
    global.AppVideo = {
        getVideos,
        getVideoKey
    };

})(window);
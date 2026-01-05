// --- scriptcore.js : จัดการข้อมูลพื้นฐาน, Supabase และ Custom Hooks ---

(function(global) {
    const { useState, useEffect, useMemo } = React;

    // --- SUPABASE CONFIG ---
    const SUPABASE_URL = 'https://ldsysxczitmkxmukmwri.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkc3lzeGN6aXRta3htdWttd3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNzI4NDAsImV4cCI6MjA4MTc0ODg0MH0.1rHQug1PlhgNE6lsy3RllAQC36k0BoY6KqjeeQvAVhc';

    // --- GLOBAL CONSTANTS ---
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#cbd5e1';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
        Chart.defaults.font.family = 'Sarabun';
    }
    const DON_MUEANG_COORDS = [13.9133, 100.6042];

    // --- HELPER FUNCTIONS ---
    const normalizeThaiName = (name) => {
        if (!name || typeof name !== 'string') return '';
        return name.replace(/^(ตำบล|ต\.|แขวง|อำเภอ|อ\.|เขต|จังหวัด|จ\.|เทศบาล|อบต\.)\s*/g, '').trim();
    };

    const getBearing = (startLat, startLng, destLat, destLng) => {
        const toRad = (deg) => deg * Math.PI / 180;
        const toDeg = (rad) => rad * 180 / Math.PI;
        
        const startLatRad = toRad(startLat);
        const startLngRad = toRad(startLng);
        const destLatRad = toRad(destLat);
        const destLngRad = toRad(destLng);

        const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
        const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
                  Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
        
        let brng = toDeg(Math.atan2(y, x));
        return (brng + 360) % 360; 
    };

    // --- MOCK DATA ---
    const MOCK_FLOOD_ALERTS = [
        { id: '10101', province: 'เชียงราย', amphoe: 'แม่สาย', tambon: 'แม่สาย', risk_level: 'High', description: 'พื้นที่ริมแม่น้ำสาย เสี่ยงน้ำล้นตลิ่งและดินโคลนถล่ม', source: 'ปภ./GISTDA' },
        { id: '10201', province: 'เชียงใหม่', amphoe: 'เมืองเชียงใหม่', tambon: 'ช้างคลาน', risk_level: 'High', description: 'โซนเศรษฐกิจริมน้ำปิง (Night Bazaar) เสี่ยงน้ำล้นตลิ่ง', source: 'กรมชลประทาน' },
        { id: '20301', province: 'อุบลราชธานี', amphoe: 'วารินชำราบ', tambon: 'หนองกินเพล', risk_level: 'High', description: 'ชุมชนหาดสวนยา พื้นที่ลุ่มต่ำริมแม่น้ำมูล', source: 'GISTDA' },
        { id: '30601', province: 'กรุงเทพมหานคร', amphoe: 'ดุสิต', tambon: 'ถนนนครไชยศรี', risk_level: 'High', description: 'จุดฟันหลอริมเจ้าพระยา (เขียวไข่กา) เสี่ยงน้ำหนุน', source: 'กทม.' },
        { id: '50101', province: 'ภูเก็ต', amphoe: 'เมืองภูเก็ต', tambon: 'รัษฎา', risk_level: 'High', description: 'พื้นที่ชุมชนหนาแน่น เสี่ยงน้ำท่วมขังรอระบาย', source: 'ปภ.' }
    ];

    const MOCK_REGIONS = { 
        "กลาง": ["กรุงเทพมหานคร", "พระนครศรีอยุธยา", "ปทุมธานี", "นนทบุรี", "สมุทรปราการ", "สระบุรี", "ลพบุรี", "นครสวรรค์", "ชัยนาท", "สิงห์บุรี", "อ่างทอง"],
        "เหนือ": ["เชียงราย", "เชียงใหม่", "น่าน", "พะเยา", "แพร่", "ลำปาง", "ลำพูน", "แม่ฮ่องสอน", "อุตรดิตถ์", "พิษณุโลก", "สุโขทัย", "เพชรบูรณ์", "พิจิตร", "กำแพงเพชร", "ตาก", "นครสวรรค์", "อุทัยธานี"],
        "ตะวันออกเฉียงเหนือ": ["นครราชสีมา", "กาฬสินธุ์", "ขอนแก่น", "ชัยภูมิ", "นครพนม", "บึงกาฬ", "บุรีรัมย์", "มหาสารคาม", "มุกดาหาร", "ยโสธร", "ร้อยเอ็ด", "เลย", "ศรีสะเกษ", "สกลนคร", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อำนาจเจริญ", "อุดรธานี", "อุบลราชธานี"],
        "ใต้": ["กระบี่", "ชุมพร", "ตรัง", "นครศรีธรรมราช", "นราธิวาส", "ปัตตานี", "พังงา", "พัทลุง", "ภูเก็ต", "ยะลา", "ระนอง", "สงขลา", "สตูล", "สุราษฎร์ธานี"],
        "ตะวันออก": ["จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ตราด", "ปราจีนบุรี", "ระยอง", "สระแก้ว"],
        "ตะวันตก": ["กาญจนบุรี", "ตาก", "ประจวบคีรีขันธ์", "เพชรบุรี", "ราชบุรี"]
    };

    const MOCK_PROVINCE_DATA = {
        "กรุงเทพมหานคร": { lat: 13.9133, lng: 100.6042, ph: 7.0, moisture: 70, soil: "ดินเหนียว", region: "กลาง" },
        "เชียงราย": { lat: 19.9105, lng: 99.8406, ph: 6.5, moisture: 60, soil: "ดินร่วนปนทราย", region: "เหนือ" },
        "เชียงใหม่": { lat: 18.7904, lng: 98.9817, ph: 6.2, moisture: 55, soil: "ดินร่วน", region: "เหนือ" },
        "อุบลราชธานี": { lat: 15.2448, lng: 104.8473, ph: 5.5, moisture: 50, soil: "ดินร่วนปนทราย", region: "ตะวันออกเฉียงเหนือ" },
        "นครราชสีมา": { lat: 14.9751, lng: 102.1000, ph: 6.0, moisture: 45, soil: "ดินร่วนปนทราย", region: "ตะวันออกเฉียงเหนือ" },
        "ภูเก็ต": { lat: 7.8804, lng: 98.3923, ph: 5.8, moisture: 75, soil: "ดินร่วนปนดินเหนียว", region: "ใต้" },
    };

    const MOCK_CROPS = [
        // --- กระทรวงทุเรียน ---
        { name: "ทุเรียนหมอนทอง (Monthong)", category: "พืชสวน", price: 150, yield: 2500, cost: 65000, risk: "High", unit: "kg", yieldUnit: "กิโลกรัม", market: "ส่งออกจีน (Premium)", source: 'Mock (Ministry Presets)' },
        
        // --- กระทรวงชาวนา ---
        { name: "ข้าวหอมมะลิ 105", category: "พืชไร่", price: 15500, yield: 460, cost: 4500, risk: "Low", unit: "ton", yieldUnit: "กิโลกรัม", market: "โรงสี / สหกรณ์", source: 'Mock' },
        { name: "ข้าวไรซ์เบอร์รี่ (Riceberry)", category: "พืชไร่", price: 25000, yield: 500, cost: 6500, risk: "Medium", unit: "ton", yieldUnit: "กิโลกรัม", market: "ตลาดสุขภาพ", source: 'Mock' },
        
        // *** ADDED: New Rice Varieties for Dashboard ***
        { name: "ปทุมธานี 1 (ข้าวหอมปทุม)", category: "พืชไร่", price: 11500, yield: 750, cost: 4500, risk: "Low", unit: "ton", yieldUnit: "กิโลกรัม", market: "ตลาดกลาง/โรงสี", source: 'Mock' },
        { name: "กข79 (ข้าวพื้นนุ่ม)", category: "พืชไร่", price: 10500, yield: 900, cost: 4500, risk: "Low", unit: "ton", yieldUnit: "กิโลกรัม", market: "ตลาดข้าวนุ่ม", source: 'Mock' },
        { name: "ข้าวเหนียว กข.6", category: "พืชไร่", price: 12500, yield: 666, cost: 4000, risk: "Low", unit: "ton", yieldUnit: "กิโลกรัม", market: "ตลาดข้าวเหนียว", source: 'Mock' },
        
        // --- กระทรวงยางพารา ---
        { name: "ยางพารา (น้ำยางสด)", category: "พืชสวน", price: 52.60, yield: 1200, cost: 7500, risk: "Medium", unit: "kg", yieldUnit: "กิโลกรัม", market: "ตลาดกลางยางพารา", source: 'Mock' },
        
        // --- พืชไร่อื่นๆ ---
        { name: "ข้าวโพดเลี้ยงสัตว์", category: "พืชไร่", price: 9.5, yield: 1200, cost: 4500, risk: "Medium", unit: "kg", yieldUnit: "กิโลกรัม", market: "โรงงานอาหารสัตว์", source: 'Mock' },
        { name: "มันสำปะหลัง", category: "พืชไร่", price: 2.8, yield: 4000, cost: 5500, risk: "Medium", unit: "kg", yieldUnit: "กิโลกรัม", market: "ลานมัน / โรงแป้ง", source: 'Mock' },
        
        // --- ปศุสัตว์ ---
        { name: "โคขุนโพนยางคำ", category: "ปศุสัตว์", price: 110, yield: 1, cost: 35000, risk: "Medium", unit: "kg", yieldUnit: "ตัว", market: "สหกรณ์โพนยางคำ", source: 'Mock' },
        { name: "สุกรขุน (หมูขุน)", category: "ปศุสัตว์", price: 80, yield: 100, cost: 4500, risk: "High", unit: "kg", yieldUnit: "ตัว", market: "เขียงหมู/โรงงาน", source: 'Mock' },
        
        // --- กระทรวงมะพร้าว ---
        { name: "มะพร้าวน้ำหอม", category: "พืชสวน", price: 18, yield: 3500, cost: 8000, risk: "Medium", unit: "fruit", yieldUnit: "ผล", market: "ส่งออก/บริโภคสด", source: 'Mock' },
        
        // --- ธุรกิจเกษตร ---
        { name: "Farm Cafe & Bistro", category: "ธุรกิจ", price: 500, yield: 5000, cost: 1500000, risk: "High", unit: "branch", yieldUnit: "ลูกค้า/ปี", market: "นักท่องเที่ยว", source: 'Mock' }
    ];

    // --- HOOK: USE REALTIME DATA ---
    const useRealtimeData = () => {
        const [data, setData] = useState({
            regions: MOCK_REGIONS,
            provinceData: MOCK_PROVINCE_DATA,
            crops: MOCK_CROPS,
            floodAlerts: MOCK_FLOOD_ALERTS, 
            knowledge: [],
            stats: [],
            thaiPop: [],
            isLoading: true,
            isOnline: false,
            error: null
        });

        const client = useMemo(() => {
            if (global.supabase && typeof global.supabase.createClient === 'function') {
                return global.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            }
            return null;
        }, []);

        useEffect(() => {
            if (!client) {
                setData(prev => ({ ...prev, isLoading: false, error: "Supabase library not loaded" }));
                return;
            }

            const fetchData = async () => {
                try {
                    const [provRes, cropRes, floodRes, knowRes, lifeRes, statsRes, popRes] = await Promise.all([
                        client.from('provinces').select('*'),
                        client.from('crops').select('*'),
                        client.from('flood_alerts').select('*'),
                        client.from('crop_knowledge').select('*'),
                        client.from('crop_lifecycle').select('*'),
                        client.from('farmer_stats').select('*'),
                        client.from('thai_provinces_population').select('*')
                    ]);

                    // Process Provinces & Soil Data
                    const newRegions = {};
                    const newProvinceData = {};
                    if (provRes.data && provRes.data.length > 0) {
                        provRes.data.forEach(p => {
                            if (!newRegions[p.region]) newRegions[p.region] = [];
                            newRegions[p.region].push(p.name);
                            newProvinceData[p.name] = {
                                lat: p.lat,
                                lng: p.lng,
                                ph: p.ph,
                                moisture: p.moisture,
                                soil: p.soil_type,
                                region: p.region,
                                slogan: p.slogan || '',
                                population: p.population || '',
                                area: p.area || ''
                            };
                        });
                    } else {
                        Object.assign(newRegions, MOCK_REGIONS);
                        Object.assign(newProvinceData, MOCK_PROVINCE_DATA);
                    }

                    // Process Crops
                    let newCrops = (cropRes.data || []).map(c => {
                        const cycles = (lifeRes.data || []).filter(l => l.crop_id === c.id);
                        let avgCost = c.cost || 0;
                        let peakYield = c.yield || 0;
                        if (cycles.length > 0) {
                            const totalCost = cycles.reduce((s, x) => s + (x.cost_seed + x.cost_fertilizer + x.cost_water + x.cost_labor), 0);
                            avgCost = totalCost / cycles.length;
                            peakYield = Math.max(...cycles.map(x => x.yield_per_rai));
                        }
                        return {
                            ...c,
                            price: c.price_per_unit || c.price || 0,
                            yield: peakYield || c.yield,
                            cost: avgCost || c.cost,
                            lifecycle: c.lifecycle,
                            lifecycleData: cycles,
                            profitTotal: 0, costTotal: 0,
                            source: 'Supabase'
                        };
                    });

                    // รวม Mock Data เฉพาะที่ยังไม่มีใน Supabase
                    const existingNames = new Set(newCrops.map(c => c.name));
                    MOCK_CROPS.forEach(m => {
                        if (!existingNames.has(m.name)) newCrops.push(m);
                    });

                    // Process Flood Alerts
                    let combinedFloodAlerts = [...MOCK_FLOOD_ALERTS];
                    if (floodRes.data && floodRes.data.length > 0) {
                        floodRes.data.forEach(dbAlert => {
                            const index = combinedFloodAlerts.findIndex(a => 
                                a.province === dbAlert.province && 
                                (dbAlert.amphoe ? a.amphoe === dbAlert.amphoe : true) &&
                                (dbAlert.tambon ? a.tambon === dbAlert.tambon : true)
                            );
                            
                            const normalizedAlert = {
                                id: dbAlert.id,
                                province: dbAlert.province,
                                amphoe: dbAlert.amphoe,
                                tambon: dbAlert.tambon,
                                risk_level: dbAlert.risk_level, 
                                description: dbAlert.description,
                                source: 'Supabase (Live)'
                            };

                            if (index !== -1) {
                                combinedFloodAlerts[index] = normalizedAlert;
                            } else {
                                combinedFloodAlerts.push(normalizedAlert);
                            }
                        });
                    }

                    setData({
                        regions: Object.keys(newRegions).length > 0 ? newRegions : MOCK_REGIONS,
                        provinceData: Object.keys(newProvinceData).length > 0 ? newProvinceData : MOCK_PROVINCE_DATA,
                        crops: newCrops.length > 0 ? newCrops : MOCK_CROPS,
                        floodAlerts: combinedFloodAlerts, 
                        knowledge: knowRes.data || [],
                        stats: statsRes.data || [],
                        thaiPop: popRes.data || [],
                        isLoading: false,
                        isOnline: true,
                        error: null
                    });

                } catch (err) {
                    console.error("Fetch failed:", err);
                    setData(prev => ({ ...prev, isLoading: false, isOnline: false, error: err.message }));
                }
            };

            fetchData();

            const channel = client.channel('public-updates')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'flood_alerts' }, (payload) => {
                    setData(prev => {
                        let newAlerts = [...prev.floodAlerts];
                        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                            const newRecord = { ...payload.new, source: 'Supabase (Live Update)' };
                            const idx = newAlerts.findIndex(a => a.id === payload.new.id);
                            if (idx !== -1) newAlerts[idx] = newRecord;
                            else newAlerts.push(newRecord);
                        }
                        else if (payload.eventType === 'DELETE') {
                            newAlerts = newAlerts.filter(a => a.id !== payload.old.id);
                        }
                        return { ...prev, floodAlerts: newAlerts };
                    });
                })
                .subscribe();

            return () => { client.removeChannel(channel); };
        }, [client]);

        return data;
    };

    // Expose to global scope
    global.AppCore = {
        useRealtimeData,
        normalizeThaiName,
        getBearing,
        DON_MUEANG_COORDS,
        MOCK_CROPS
    };

})(window);
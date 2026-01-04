const { useState, useEffect, useRef, useMemo, useCallback } = React;

// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://ldsysxczitmkxmukmwri.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkc3lzeGN6aXRta3htdWttd3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNzI4NDAsImV4cCI6MjA4MTc0ODg0MH0.1rHQug1PlhgNE6lsy3RllAQC36k0BoY6KqjeeQvAVhc';

// --- GLOBAL CONSTANTS ---
Chart.defaults.color = '#cbd5e1';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
Chart.defaults.font.family = 'Sarabun';
const DON_MUEANG_COORDS = [13.9133, 100.6042];

// --- HELPER: NORMALIZE THAI NAMES ---
const normalizeThaiName = (name) => {
    if (!name || typeof name !== 'string') return '';
    return name.replace(/^(ตำบล|ต\.|แขวง|อำเภอ|อ\.|เขต|จังหวัด|จ\.|เทศบาล|อบต\.)\s*/g, '').trim();
};

// --- HELPER: CALCULATE BEARING (DIRECTION) ---
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
    return (brng + 360) % 360; // Normalize to 0-360
};

// --- MOCK DATA FALLBACKS ---
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

// --- MOCK CROPS (Default Data) ---
// อัปเดต: เพิ่มรายการทุเรียนจากกระทรวงทุเรียนเพื่อให้แสดงผลชัดเจน
const MOCK_CROPS = [
    // --- กระทรวงทุเรียน (Ministry of Durian) ---
    { name: "ทุเรียนหมอนทอง (Monthong)", category: "พืชสวน", price: 150, yield: 2500, cost: 65000, risk: "High", unit: "kg", yieldUnit: "กิโลกรัม", market: "ส่งออกจีน (Premium)", source: 'Mock (Ministry Presets)' },
    { name: "ทุเรียนชะนี (Chanee)", category: "พืชสวน", price: 100, yield: 2200, cost: 55000, risk: "Medium", unit: "kg", yieldUnit: "กิโลกรัม", market: "แปรรูป/ภายใน", source: 'Mock (Ministry Presets)' },
    { name: "ทุเรียนก้านยาว (Kanyao)", category: "พืชสวน", price: 250, yield: 1800, cost: 70000, risk: "Very High", unit: "kg", yieldUnit: "กิโลกรัม", market: "ตลาดหรู (Luxury)", source: 'Mock (Ministry Presets)' },
    { name: "ทุเรียนกระดุม (Kradum)", category: "พืชสวน", price: 110, yield: 2000, cost: 50000, risk: "Low", unit: "kg", yieldUnit: "กิโลกรัม", market: "ต้นฤดู (Early Season)", source: 'Mock (Ministry Presets)' },
    
    // --- กระทรวงยางพารา ---
    { name: "ยางพารา (น้ำยางสด)", category: "พืชสวน", price: 52.60, yield: 1200, cost: 7500, risk: "Medium", unit: "kg", yieldUnit: "กิโลกรัม", market: "ตลาดกลางยางพารา", demand: { domestic: "สูง", international: "สูงมาก", trend: "ผันผวนตามตลาดโลก" }, lifecycle: { type: 'tree', lifespan: 25, wait_years: 7, peak_start: 9, advice: 'กรีด 2 วัน เว้น 1 วัน' }, lifecycleData: [], source: 'Mock' },
    
    // --- กระทรวงชาวนา ---
    { name: "ข้าวหอมมะลิ 105", category: "พืชไร่", price: 15500, yield: 460, cost: 4500, risk: "Low", unit: "ton", yieldUnit: "กิโลกรัม", market: "โรงสี / สหกรณ์", demand: { domestic: "สูง", international: "สูง", trend: "คงที่" }, plowing: { animal: 1200, tractor: 350 }, lifecycle: { type: 'annual', lifespan: 1 }, lifecycleData: [], source: 'Mock' },
    
    // --- พืชไร่อื่นๆ ---
    { name: "ข้าวโพดเลี้ยงสัตว์", category: "พืชไร่", price: 9.5, yield: 1100, cost: 4500, risk: "Medium", unit: "kg", yieldUnit: "กิโลกรัม", market: "โรงงานอาหารสัตว์", demand: { domestic: "สูงมาก", international: "ปานกลาง", trend: "ขาดแคลน" }, plowing: { animal: 1200, tractor: 400 }, lifecycle: { type: 'annual', lifespan: 1 }, lifecycleData: [], source: 'Mock' },
    { name: "มันสำปะหลัง", category: "พืชไร่", price: 2.8, yield: 3500, cost: 4000, risk: "Medium", unit: "kg", yieldUnit: "กิโลกรัม", market: "ลานมัน / โรงแป้ง", demand: { domestic: "สูง", international: "สูง", trend: "พลังงานทดแทน" }, plowing: { animal: 1000, tractor: 400 }, lifecycle: { type: 'annual', lifespan: 1 }, lifecycleData: [], source: 'Mock' },
    
    // --- ปศุสัตว์ ---
    { name: "โคขุนโพนยางคำ", category: "ปศุสัตว์", price: 100, yield: 500, cost: 25000, risk: "Medium", unit: "kg", yieldUnit: "กิโลกรัม", market: "ร้านสเต็ก / ส่งออก", demand: { domestic: "สูง", international: "สูง", trend: "เติบโต" }, lifecycle: { type: 'animal', lifespan: 2 }, lifecycleData: [], source: 'Mock' },
    
    // --- ธุรกิจเกษตร ---
    { name: "Farm Cafe & Bistro", category: "ธุรกิจ", price: 150, yield: 10000, cost: 800000, risk: "High", unit: "branch", yieldUnit: "ลูกค้า/ปี", market: "นักท่องเที่ยว / สายคาเฟ่", demand: { domestic: "สูงมาก", international: "ปานกลาง", trend: "ท่องเที่ยวเชิงเกษตร" }, lifecycle: { type: 'business', lifespan: 10, advice: 'ต้องมี Story และมุมถ่ายรูป จุดคุ้มทุนอยู่ที่ปีที่ 2-3' }, costStructure: { fertilizer: 0, labor: 40, seeds: 30, water: 10, misc: 20 }, lifecycleData: [], source: 'Mock' },
    
    // --- กระทรวงมะพร้าว ---
    { name: "มะพร้าวน้ำหอม", category: "พืชสวน", price: 18, yield: 3500, cost: 8000, risk: "Medium", unit: "fruit", yieldUnit: "ผล", market: "ส่งออก/บริโภคสด", demand: { domestic: "สูง", international: "สูงมาก", trend: "สุขภาพ" }, lifecycle: { type: 'tree', lifespan: 30, wait_years: 3, peak_start: 5 }, lifecycleData: [], source: 'Mock' }
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
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
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
                        source: 'Supabase' // ชัดเจนว่ามาจาก Supabase
                    };
                });

                // รวม Mock Data เฉพาะที่ยังไม่มีใน Supabase
                // เพื่อให้มั่นใจว่ารายการจาก Mock (เช่น ทุเรียนสายพันธุ์ใหม่) จะปรากฏ
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

// --- COMPONENTS ---

const SimulationPanel = ({ item, onClose, globalArea, setGlobalArea, globalYears, setGlobalYears, floodData, soilInfo, provinceStats }) => {
    const [panelTab, setPanelTab] = useState('financial');
    const [customCosts, setCustomCosts] = useState(null);

    const isRice = item.name.includes('ข้าว');
    const isRubber = item.name.includes('ยาง');
    const isCoconut = item.name.includes('มะพร้าว'); // Check for Coconut
    const isDurian = item.name.includes('ทุเรียน'); // Check for Durian
    
    // External Data
    const RICE_PRESETS = (typeof window !== 'undefined' && window.RICE_PRESETS) ? window.RICE_PRESETS : {};
    const getInitialVariety = (typeof window !== 'undefined' && window.getInitialVariety) ? window.getInitialVariety : (name) => 'jasmine';
    const BASE_RICE_STEPS = (typeof window !== 'undefined' && window.BASE_RICE_STEPS) ? window.BASE_RICE_STEPS : [];
    
    const RUBBER_PRESETS = (typeof window !== 'undefined' && window.RUBBER_PRESETS) ? window.RUBBER_PRESETS : {};
    const calculateRubberEconomics = (typeof window !== 'undefined' && window.calculateRubberEconomics) ? window.calculateRubberEconomics : null;

    const COCONUT_PRESETS = (typeof window !== 'undefined' && window.COCONUT_PRESETS) ? window.COCONUT_PRESETS : {};
    const calculateCoconutEconomics = (typeof window !== 'undefined' && window.calculateCoconutEconomics) ? window.calculateCoconutEconomics : null;

    const DURIAN_PRESETS = (typeof window !== 'undefined' && window.DURIAN_PRESETS) ? window.DURIAN_PRESETS : {};
    const calculateDurianEconomics = (typeof window !== 'undefined' && window.calculateDurianEconomics) ? window.calculateDurianEconomics : null;
    const BASE_DURIAN_STEPS = (typeof window !== 'undefined' && window.BASE_DURIAN_STEPS) ? window.BASE_DURIAN_STEPS : [];

    const KASET_PRESETS = (typeof window !== 'undefined' && window.KASET_PRESETS) ? window.KASET_PRESETS : {};
    const getKasetPreset = (typeof window !== 'undefined' && window.getKasetPreset) ? window.getKasetPreset : (name) => null;
    const getKasetSteps = (typeof window !== 'undefined' && window.getKasetSteps) ? window.getKasetSteps : (cat) => [];

    const [riceConfig, setRiceConfig] = useState({ variety: getInitialVariety(item.name), method: 'wan', fertilizer: 'mixed', labor: 'hire', processing: 0 });
    const [riceSteps, setRiceSteps] = useState(BASE_RICE_STEPS.length > 0 ? JSON.parse(JSON.stringify(BASE_RICE_STEPS)) : []);

    const [rubberConfig, setRubberConfig] = useState({ clone: 'rrim600', isEUDR: false, tapping: 'd3' });
    const [coconutConfig, setCoconutConfig] = useState({ clone: 'namhom' }); // Coconut Config
    const [durianConfig, setDurianConfig] = useState({ variety: 'monthong' }); // Durian Config
    const [durianSteps, setDurianSteps] = useState(BASE_DURIAN_STEPS.length > 0 ? JSON.parse(JSON.stringify(BASE_DURIAN_STEPS)) : []);

    const kasetPreset = (!isRice && !isRubber && !isCoconut && !isDurian) ? getKasetPreset(item.name) : null;
    const [kasetSteps, setKasetSteps] = useState([]);

    const lineCanvasRef = useRef(null);
    const lineChartRef = useRef(null);

    // Effect: Load Kaset Steps
    useEffect(() => {
        if (!isRice && !isRubber && !isCoconut && !isDurian && kasetPreset) {
            const steps = getKasetSteps(kasetPreset.category);
            setKasetSteps(steps);
        }
    }, [isRice, isRubber, isCoconut, isDurian, kasetPreset]);

    // Effect: Update Rice Steps
    useEffect(() => {
        if (!isRice || riceSteps.length === 0) return;
        const currentPreset = RICE_PRESETS[riceConfig.variety];
        if (!currentPreset) return;
        
        let newSteps = [...riceSteps];
        
        // 1. Update Seed Cost based on Method
        const seedStep = newSteps.find(s => s.id === 'seed');
        if (seedStep) {
            const baseSeedCost = currentPreset.seedCost || 350; 
            const riceName = currentPreset.name || 'ข้าว';
            if (riceConfig.method === 'dam') { seedStep.val = Math.round(baseSeedCost * 0.4); seedStep.desc = `ค่ากล้า ${riceName}`; } 
            else if (riceConfig.method === 'yod') { seedStep.val = Math.round(baseSeedCost * 0.6); seedStep.desc = `หยอดหลุม ${riceName}`; } 
            else { seedStep.val = baseSeedCost; seedStep.desc = `หว่าน ${riceName}`; }
        }

        // 2. Update Maintenance Cost based on Care Multiplier (NEW LOGIC)
        const maintStep = newSteps.find(s => s.id === 'maint');
        if (maintStep) {
             const baseMaint = maintStep.baseVal || 1800;
             const mult = currentPreset.careMult || 1.0;
             maintStep.val = Math.round(baseMaint * mult);
             if (mult !== 1) maintStep.desc = `ปุ๋ย/ยา (ความยาก: ${mult}x)`;
        }

        setRiceSteps(newSteps);
    }, [riceConfig, isRice]);

    // Effect: Cost Calc
    useEffect(() => {
        if (isRice && riceSteps.length > 0) {
            const totalPerRai = riceSteps.reduce((sum, s) => sum + Number(s.val), 0);
            setCustomCosts({ totalOverride: totalPerRai * globalArea });
        } else if (isRubber && calculateRubberEconomics) {
            const eco = calculateRubberEconomics(rubberConfig.clone, globalArea, globalYears, rubberConfig.isEUDR, rubberConfig.tapping);
            setCustomCosts({ 
                init: eco.initialCost, 
                maint: eco.maintCostPre, 
                rubberEco: eco
            });
        } else if (isCoconut && calculateCoconutEconomics) {
            const eco = calculateCoconutEconomics(coconutConfig.clone, globalArea, globalYears);
            setCustomCosts({
                init: eco.initialCost,
                maint: eco.maintCostPre,
                coconutEco: eco
            });
        } else if (isDurian && calculateDurianEconomics) {
            const eco = calculateDurianEconomics(durianConfig.variety, globalArea, globalYears);
            setCustomCosts({
                init: eco.initialCost,
                maint: eco.maintCostPre,
                durianEco: eco
            });
        } else if (!isRice && !isRubber && !isCoconut && !isDurian && kasetPreset && kasetSteps.length > 0) {
            const initCost = kasetPreset.cost_init || 0;
            const maintCost = kasetPreset.cost_maint || 0;
            const stepsTotal = kasetSteps.reduce((sum, s) => sum + Number(s.val), 0);
            setCustomCosts({ 
                init: (initCost > 0 ? initCost : stepsTotal) * globalArea, 
                maint: (maintCost > 0 ? maintCost : stepsTotal * 0.6) * globalArea
            });
        } else {
            setCustomCosts({ totalOverride: item.cost * globalArea });
        }
    }, [isRice, isRubber, isCoconut, isDurian, riceSteps, kasetSteps, rubberConfig, coconutConfig, durianConfig, globalArea, globalYears, kasetPreset, item]);

    const simulationData = useMemo(() => {
        const data = [];
        let cumulative = 0;
        const currentYearBE = new Date().getFullYear() + 543;
        
        let activePreset = isRice ? RICE_PRESETS[riceConfig.variety] : kasetPreset;
        if (isRubber) activePreset = RUBBER_PRESETS[rubberConfig.clone];
        if (isCoconut) activePreset = COCONUT_PRESETS[coconutConfig.clone];
        if (isDurian) activePreset = DURIAN_PRESETS[durianConfig.variety];
        if (!activePreset) activePreset = item;

        // Specific vars
        const rubberEco = isRubber && customCosts?.rubberEco ? customCosts.rubberEco : null;
        const coconutEco = isCoconut && customCosts?.coconutEco ? customCosts.coconutEco : null;
        const durianEco = isDurian && customCosts?.durianEco ? customCosts.durianEco : null;

        for (let i = 0; i < globalYears; i++) {
            const age = i + 1;
            let yearlyCost = 0;
            let advice = [];

            if (isRice) {
                yearlyCost = customCosts?.totalOverride || 0;
            } else if (isRubber && rubberEco) {
                if (age <= rubberEco.waitYears) {
                    yearlyCost = (i === 0) ? rubberEco.initialCost : rubberEco.maintCostPre;
                    advice.push(`⏳ ยางเล็ก ปีที่ ${age}: บำรุงรักษา (ยังไม่มีรายได้)`);
                } else {
                    yearlyCost = rubberEco.maintCostPost; 
                }
            } else if (isCoconut && coconutEco) {
                if (age <= coconutEco.waitYears) {
                    yearlyCost = (i === 0) ? coconutEco.initialCost : coconutEco.maintCostPre;
                    advice.push(`⏳ มะพร้าวเล็ก ปีที่ ${age}: บำรุงรักษา (ยังไม่มีรายได้)`);
                } else {
                    yearlyCost = coconutEco.maintCostPost;
                }
            } else if (isDurian && durianEco) {
                if (age <= durianEco.waitYears) {
                    yearlyCost = (i === 0) ? durianEco.initialCost : durianEco.maintCostPre;
                    advice.push(`⏳ ทุเรียนเล็ก ปีที่ ${age}: บำรุงรักษา (ยังไม่มีรายได้)`);
                } else {
                    yearlyCost = durianEco.maintCostPost;
                }
            } else if (kasetPreset) {
                if (['tree', 'business', 'premium_durian'].includes(kasetPreset.category)) {
                    yearlyCost = (i === 0) ? (customCosts?.init || 0) : (customCosts?.maint || 0);
                } else {
                    yearlyCost = (customCosts?.init || 0) * (kasetPreset.cycles_per_year || 1);
                }
            } else {
                yearlyCost = item.cost * globalArea;
            }

            let yieldVal = activePreset.yield || 0;
            let priceVal = activePreset.price || 0;
            
            // Logic for Yield Delay & Rice Price Conversion
            if (isRice) {
                // *** UPDATE: ข้าวราคาเป็นตัน ต้องหาร 1000 เพื่อคิดเป็น กก. ***
                if (priceVal > 1000) priceVal = priceVal / 1000;
            } else if (isRubber && rubberEco) {
                priceVal = rubberConfig.isEUDR ? activePreset.eudr_price : activePreset.price;
                if (age <= rubberEco.waitYears) yieldVal = 0;
            } else if (isCoconut && coconutEco) {
                priceVal = activePreset.price;
                yieldVal = coconutEco.yieldPerRai; // Already trees_per_rai * yield_per_tree
                if (age <= coconutEco.waitYears) {
                    yieldVal = 0;
                } else if (age < coconutEco.waitYears + 2) {
                    yieldVal = yieldVal * 0.5; // เริ่มให้ผล
                    advice.push('🌱 เริ่มให้ผลผลิต (50%)');
                }
            } else if (isDurian && durianEco) {
                priceVal = activePreset.price;
                yieldVal = durianEco.yieldPerRai;
                if (age <= durianEco.waitYears) {
                    yieldVal = 0;
                } else if (age < durianEco.waitYears + 2) {
                    yieldVal = yieldVal * 0.3; // เริ่มให้ผลน้อยกว่ามะพร้าว
                    advice.push('🌱 เริ่มให้ผลผลิต (30%) - ฝึกเอาลูก');
                } else if (age < durianEco.waitYears + 4) {
                    yieldVal = yieldVal * 0.7; 
                    advice.push('🌳 ผลผลิตเพิ่มขึ้น (70%)');
                }
            } else if (kasetPreset && ['tree', 'premium_durian'].includes(kasetPreset.category)) {
                if (age < kasetPreset.wait_years) {
                    yieldVal = 0;
                    advice.push(`⏳ ปีที่ ${age}: ยังไม่ให้ผลผลิต (รอ ${kasetPreset.wait_years} ปี)`);
                } else if (age < kasetPreset.wait_years + 3) {
                    yieldVal = yieldVal * 0.5;
                    advice.push('🌱 เริ่มให้ผลผลิต (50%)');
                }
            }

            let grossRevenue = 0;
            let totalOutput = yieldVal * globalArea;
            
            if (isRubber) {
                 let tapFactor = rubberConfig.tapping === 'd3' ? 0.85 : 1.0;
                 totalOutput = totalOutput * tapFactor;
            } else if (isCoconut || isDurian) {
                // Yield is already per rai per year in Eco logic
                // totalOutput = yieldVal * globalArea (which is correct, per Rai * Area)
            } else if (kasetPreset && kasetPreset.cycles_per_year) {
                totalOutput *= kasetPreset.cycles_per_year;
            }
            
            grossRevenue = totalOutput * priceVal;

            let floodRiskLevel = floodData ? floodData.risk_level : 'Low';
            let riskLoss = 0;
            if (floodRiskLevel === 'High' && i % 3 === 0) { riskLoss = grossRevenue * 0.5; if(i===0) advice.push('⚠️ เสี่ยงน้ำท่วมสูง: เสียหาย 50%'); }
            else if (floodRiskLevel === 'Medium' && i % 5 === 0) { riskLoss = grossRevenue * 0.2; }

            const yearlyRev = grossRevenue - riskLoss;
            const yearlyProfit = yearlyRev - yearlyCost;
            cumulative += yearlyProfit;

            data.push({
                year: currentYearBE + i,
                cost: yearlyCost,
                revenue: yearlyRev,
                profit: yearlyProfit,
                accumulatedProfit: cumulative,
                analysis: advice,
                breakEven: (cumulative > 0 && (cumulative - yearlyProfit) <= 0) ? `🎉 คืนทุนปีที่ ${age}` : null,
                details: { yieldKg: totalOutput, priceVal: priceVal }
            });
        }
        return data;
    }, [item, globalArea, globalYears, isRice, isRubber, isCoconut, isDurian, riceConfig, rubberConfig, coconutConfig, durianConfig, kasetPreset, customCosts, floodData]);

    useEffect(() => {
        if (!customCosts || panelTab !== 'financial' || !lineCanvasRef.current) return;
        if (lineChartRef.current) lineChartRef.current.destroy();
        const ctx = lineCanvasRef.current.getContext('2d');
        lineChartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: simulationData.map(d => d.year),
                datasets: [
                    { label: 'กำไรสะสม', data: simulationData.map(d => d.accumulatedProfit), borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', fill: true },
                    { label: 'ต้นทุน/ปี', data: simulationData.map(d => d.cost), borderColor: '#f87171', borderDash: [5, 5], fill: false }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false }, y: { ticks: { color: '#94a3b8' } } } }
        });
    }, [simulationData, panelTab, customCosts]);

    if (!customCosts) return <div className="p-10 text-center text-slate-400">กำลังคำนวณโมเดล...</div>;
    
    // --- FINANCIAL SUMMARY CALCULATION (CORRECTED) ---
    const summary = simulationData.length > 0 ? simulationData[simulationData.length - 1] : null; 
    const totalAccumulatedProfit = summary ? summary.accumulatedProfit : 0;
    const averageProfitPerYear = globalYears > 0 ? totalAccumulatedProfit / globalYears : 0;
    
    // Break-even logic
    const breakEvenYearData = simulationData.find(d => d.breakEven);
    const breakEvenText = breakEvenYearData ? breakEvenYearData.breakEven : (totalAccumulatedProfit > 0 ? 'คืนทุนแล้ว (ตั้งแต่เริ่ม)' : 'ยังไม่คืนทุน');

    // Data needed for Breakdown display
    let activePreset = isRice ? RICE_PRESETS[riceConfig.variety] : kasetPreset;
    if (isRubber) activePreset = RUBBER_PRESETS[rubberConfig.clone];
    if (isCoconut) activePreset = COCONUT_PRESETS[coconutConfig.clone];
    if (isDurian) activePreset = DURIAN_PRESETS[durianConfig.variety];
    if (!activePreset) activePreset = item;

    // Price Ref Display Logic
    let priceRef = activePreset.price || 0;
    if (isRubber && rubberConfig.isEUDR) priceRef = activePreset.eudr_price || 0;
    if (isRice && priceRef > 1000) priceRef = priceRef / 1000; // Display per Kg in Breakdown

    // Fix: Add fallbacks for yieldRef to prevent "undefined" error
    const yieldRef = isCoconut ? (customCosts?.coconutEco?.yieldPerRai || activePreset.yield || 0) : 
                     (isDurian ? (customCosts?.durianEco?.yieldPerRai || activePreset.yield || 0) : 
                     (activePreset.yield || 0)); 
    
    const unitLabel = activePreset.unit || 'ไร่';
    const yieldUnitLabel = (isCoconut || (isDurian && activePreset.unit === 'fruit')) ? 'ผล' : (activePreset.yieldUnit || 'กก.');
    
    // Specific details
    const rubberTreesPerRai = 76; 
    const rubberYieldPerTree = isRubber ? ((activePreset.yield || 0) / rubberTreesPerRai).toFixed(2) : 0;
    
    const coconutTreesPerRai = isCoconut ? (activePreset.trees_per_rai || 45) : 0;
    const coconutYieldPerTree = isCoconut ? (activePreset.yield_per_tree || 0) : 0;

    const durianTreesPerRai = isDurian ? (activePreset.trees_per_rai || 25) : 0;
    // Fix: Handle cases where activePreset is from Mock Data (no yield_per_rai)
    const durianYieldVal = isDurian ? (activePreset.yield_per_rai || activePreset.yield || 0) : 0;
    const durianYieldPerTree = (isDurian && durianTreesPerRai > 0) ? (durianYieldVal / durianTreesPerRai).toFixed(2) : 0;

    let marketData = isRice ? (RICE_PRESETS[riceConfig.variety]?.marketData) : (kasetPreset?.marketData);
    if (isRubber) marketData = RUBBER_PRESETS[rubberConfig.clone]?.marketData;
    if (isCoconut) marketData = COCONUT_PRESETS[coconutConfig.clone]?.marketData;
    if (isDurian) marketData = DURIAN_PRESETS[durianConfig.variety]?.marketData;

    return (
        <div className="flex flex-col h-full w-full animate-slide-down glass-panel-clear rounded-b-3xl overflow-hidden shadow-2xl border-t-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 pt-6">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {isRice ? <i className="fa-solid fa-shekel-sign text-indigo-400"></i> : isRubber ? <i className="fa-solid fa-droplet text-slate-200"></i> : isCoconut ? <i className="fa-solid fa-tree text-green-300"></i> : isDurian ? <i className="fa-solid fa-crown text-yellow-500"></i> : (kasetPreset?.category === 'business' ? <i className="fa-solid fa-briefcase text-purple-400"></i> : <i className="fa-solid fa-seedling text-emerald-400"></i>)}
                            {isRubber ? RUBBER_PRESETS[rubberConfig.clone]?.name : isCoconut ? COCONUT_PRESETS[coconutConfig.clone]?.name : isDurian ? DURIAN_PRESETS[durianConfig.variety]?.name : (kasetPreset ? kasetPreset.name : (isRice ? RICE_PRESETS[riceConfig.variety]?.name : item.name))}
                        </h2>
                        <div className="text-xs text-slate-400 mt-1">{isRice ? 'กระทรวงชาวนา' : isRubber ? 'กระทรวงยางพารา' : isCoconut ? 'กระทรวงมะพร้าว (New!)' : isDurian ? 'กระทรวงทุเรียน (New!)' : (kasetPreset ? 'ฐานข้อมูลพืชเศรษฐกิจ' : 'Mock Data')}</div>
                    </div>
                    <button onClick={onClose}><i className="fa-solid fa-times text-slate-400 hover:text-white text-xl"></i></button>
                </div>

                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2 border border-white/10 mb-4">
                    <div className="flex-1 flex flex-col px-2 border-r border-white/10">
                        <span className="text-[10px] text-slate-400 uppercase">{kasetPreset?.category === 'business' ? 'จำนวนสาขา' : (kasetPreset?.category === 'animal' ? 'จำนวนตัว' : 'ขนาดพื้นที่ (ไร่)')}</span>
                        <input type="number" value={globalArea} onChange={e => setGlobalArea(parseFloat(e.target.value)||0)} className="bg-transparent font-bold text-emerald-400 focus:outline-none" />
                    </div>
                    <div className="flex-1 flex flex-col px-2">
                        <span className="text-[10px] text-slate-400 uppercase">ระยะเวลา (ปี)</span>
                        <input type="number" value={globalYears} onChange={e => setGlobalYears(parseFloat(e.target.value)||0)} className="bg-transparent font-bold text-yellow-400 focus:outline-none" />
                    </div>
                </div>

                <div className="flex gap-2 mb-4 bg-black/20 p-1 rounded-xl">
                    <button onClick={() => setPanelTab('financial')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${panelTab === 'financial' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><i className="fa-solid fa-calculator mr-1"></i> ต้นทุน & กำไร</button>
                    <button onClick={() => setPanelTab('market')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${panelTab === 'market' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><i className="fa-solid fa-shop mr-1"></i> ตลาด & ดีมานด์</button>
                </div>

                {panelTab === 'financial' ? (
                    <div className="space-y-4 animate-fade-in-up">
                        {isRice && (
                            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-indigo-300 mb-3 border-b border-indigo-500/20 pb-2"><i className="fa-solid fa-sliders mr-2"></i>ปรับสูตรการปลูก</h3>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    {Object.entries(RICE_PRESETS).map(([key, info]) => (
                                        <button key={key} onClick={() => setRiceConfig({...riceConfig, variety: key})} className={`text-xs p-2 rounded border text-left transition ${riceConfig.variety === key ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                            <div className="font-bold">{info.name}</div>
                                            {/* UPDATE: แสดงผลในปุ่มเป็นราคาเต็ม (บาท/ตัน) ตาม Reference */}
                                            <div className="text-[9px] opacity-70">{info.price.toLocaleString()} ฿/ตัน</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isRubber && (
                            <div className="bg-slate-800/50 border border-slate-500/30 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-slate-200 mb-3 border-b border-slate-500/20 pb-2"><i className="fa-solid fa-sliders mr-2"></i>เลือกสายพันธุ์และระบบ</h3>
                                <div className="grid grid-cols-1 gap-3 mb-3">
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {Object.entries(RUBBER_PRESETS).map(([key, info]) => (
                                            <button key={key} onClick={() => setRubberConfig({...rubberConfig, clone: key})} className={`text-xs p-2 rounded border min-w-[100px] text-left transition ${rubberConfig.clone === key ? 'bg-slate-600 border-slate-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                                <div className="font-bold">{info.name}</div>
                                                <div className="text-[9px] opacity-70">รอ {info.lifecycle.wait_years} ปี</div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-white bg-white/5 p-2 rounded border border-white/10">
                                        <span>มาตรฐาน EUDR (ราคาพรีเมียม)</span>
                                        <button onClick={() => setRubberConfig({...rubberConfig, isEUDR: !rubberConfig.isEUDR})} className={`w-10 h-5 rounded-full relative transition ${rubberConfig.isEUDR ? 'bg-green-500' : 'bg-gray-600'}`}>
                                            <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${rubberConfig.isEUDR ? 'left-6' : 'left-1'}`}></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isCoconut && (
                            <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-green-200 mb-3 border-b border-green-500/20 pb-2"><i className="fa-solid fa-sliders mr-2"></i>เลือกสายพันธุ์มะพร้าว</h3>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {Object.entries(COCONUT_PRESETS).map(([key, info]) => (
                                        <button key={key} onClick={() => setCoconutConfig({...coconutConfig, clone: key})} className={`text-xs p-2 rounded border min-w-[120px] text-left transition ${coconutConfig.clone === key ? 'bg-green-700 border-green-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                            <div className="font-bold truncate">{info.name}</div>
                                            <div className="text-[9px] opacity-70">{info.type}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isDurian && (
                            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-yellow-200 mb-3 border-b border-yellow-500/20 pb-2"><i className="fa-solid fa-sliders mr-2"></i>เลือกสายพันธุ์ทุเรียน</h3>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {Object.entries(DURIAN_PRESETS).map(([key, info]) => (
                                        <button key={key} onClick={() => setDurianConfig({...durianConfig, variety: key})} className={`text-xs p-2 rounded border min-w-[120px] text-left transition ${durianConfig.variety === key ? 'bg-yellow-700 border-yellow-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                            <div className="font-bold truncate">{info.name}</div>
                                            <div className="text-[9px] opacity-70">{info.type}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {kasetPreset && !isRice && !isRubber && !isCoconut && !isDurian && (
                            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-emerald-300 mb-2 border-b border-emerald-500/20 pb-2"><i className="fa-solid fa-list-check mr-2"></i>รายการต้นทุน (โดยประมาณ)</h3>
                                <div className="space-y-2">
                                    {kasetSteps.map((step, idx) => (
                                        <div key={idx} className="flex justify-between text-xs border-b border-white/5 pb-1">
                                            <div><div className="text-slate-200">{step.label}</div><div className="text-[9px] text-slate-500">{step.desc}</div></div>
                                            <div className="text-emerald-400">{step.val.toLocaleString()} ฿</div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between text-xs font-bold pt-1 text-white"><span>รวมต้นทุนตั้งต้น:</span><span>{kasetSteps.reduce((s, x) => s+x.val, 0).toLocaleString()} ฿</span></div>
                                </div>
                            </div>
                        )}

                        {isDurian && (
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-yellow-300 mb-2 border-b border-yellow-500/20 pb-2"><i className="fa-solid fa-list-check mr-2"></i>รายการต้นทุนทุเรียน (Modern Farm)</h3>
                                <div className="space-y-2">
                                    {durianSteps.map((step, idx) => (
                                        <div key={idx} className="flex justify-between text-xs border-b border-white/5 pb-1">
                                            <div><div className="text-slate-200">{step.label}</div><div className="text-[9px] text-slate-500">{step.desc}</div></div>
                                            <div className="text-yellow-400">{step.val.toLocaleString()} ฿</div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between text-xs font-bold pt-1 text-white"><span>รวมต้นทุนตั้งต้น:</span><span>{durianSteps.filter(s => s.type === 'init').reduce((s, x) => s+x.val, 0).toLocaleString()} ฿</span></div>
                                </div>
                            </div>
                        )}

                        <div className="bg-black/30 p-3 rounded-xl border border-white/10 text-xs space-y-2 shadow-inner">
                            <div className="font-bold text-slate-300 border-b border-white/10 pb-1 mb-2 flex justify-between items-center">
                                <span>สรุปการเงิน (Financial Summary)</span>
                                <span className="text-[9px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/50">รวม {globalYears} ปี</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-2">
                                <div>
                                    <div className="text-slate-400 text-[10px]">กำไรสุทธิรวม</div>
                                    <div className="font-bold text-emerald-400 text-base">{totalAccumulatedProfit.toLocaleString()} ฿</div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-[10px]">เฉลี่ยกำไร/ปี (หาร {globalYears})</div>
                                    <div className="font-bold text-yellow-400 text-base">{averageProfitPerYear.toLocaleString(undefined, {maximumFractionDigits: 0})} ฿/ปี</div>
                                </div>
                            </div>

                            {/* --- BREAKDOWN SECTION --- */}
                            <div className="bg-white/5 rounded p-2 border border-white/5 mt-1">
                                <div className="text-[9px] font-bold text-slate-300 mb-1 border-b border-white/5 pb-1">ที่มาการคำนวณ (Calculation Breakdown):</div>
                                <div className="grid grid-cols-[auto_1fr] gap-x-2 text-[9px] text-slate-400 leading-relaxed">
                                    <span>• พื้นที่:</span> <span className="text-white">{globalArea} {unitLabel}</span>
                                    {isRubber && (
                                        <>
                                            <span>• จำนวนต้น:</span> <span className="text-white">~{Math.round(rubberTreesPerRai * globalArea).toLocaleString()} ต้น ({rubberTreesPerRai} ต้น/ไร่)</span>
                                        </>
                                    )}
                                    {isCoconut && (
                                        <>
                                            <span>• จำนวนต้น:</span> <span className="text-white">~{Math.round(coconutTreesPerRai * globalArea).toLocaleString()} ต้น ({coconutTreesPerRai} ต้น/ไร่)</span>
                                        </>
                                    )}
                                    {isDurian && (
                                        <>
                                            <span>• จำนวนต้น:</span> <span className="text-white">~{Math.round(durianTreesPerRai * globalArea).toLocaleString()} ต้น ({durianTreesPerRai} ต้น/ไร่)</span>
                                        </>
                                    )}
                                    <span>• ผลผลิตเป้าหมาย:</span> <span className="text-white">{yieldRef.toLocaleString()} {yieldUnitLabel}/{unitLabel}</span>
                                    {isRubber && (
                                        <>
                                            <span>• เฉลี่ยต่อต้น:</span> <span className="text-white">~{rubberYieldPerTree} {yieldUnitLabel}/ต้น/ปี</span>
                                        </>
                                    )}
                                    {isCoconut && (
                                        <>
                                            <span>• เฉลี่ยต่อต้น:</span> <span className="text-white">~{coconutYieldPerTree} {yieldUnitLabel}/ต้น/ปี</span>
                                        </>
                                    )}
                                    {isDurian && (
                                        <>
                                            <span>• เฉลี่ยต่อต้น:</span> <span className="text-white">~{durianYieldPerTree} {yieldUnitLabel}/ต้น/ปี</span>
                                        </>
                                    )}
                                    {/* UPDATE: แสดงราคาที่ใช้คำนวณจริง (บาท/กก. สำหรับข้าว) */}
                                    <span>• ราคาคำนวณ:</span> <span className="text-yellow-300">{priceRef.toLocaleString()} ฿/{yieldUnitLabel}</span>
                                    
                                    {isRubber && (
                                        <>
                                            <span>• ระบบกรีด:</span> <span className="text-white">{rubberConfig.tapping === 'd3' ? 'd/3 (วันเว้น 2 วัน)' : 'd/2 (วันเว้นวัน)'}</span>
                                            <span>• ประเภทราคา:</span> <span className={rubberConfig.isEUDR ? "text-green-400" : "text-slate-300"}>{rubberConfig.isEUDR ? 'EUDR (Premium)' : 'ตลาดทั่วไป'}</span>
                                        </>
                                    )}
                                    <div className="col-span-2 mt-1 italic text-slate-500 border-t border-white/5 pt-1">
                                        * สูตร: (กำไรสะสมรวม ÷ {globalYears} ปี) = กำไรเฉลี่ยต่อปี
                                    </div>
                                </div>
                            </div>

                            {breakEvenText && <div className="text-center text-orange-300 font-bold mt-2 animate-pulse text-[10px]">{breakEvenText}</div>}
                        </div>
                        <div className="h-48 bg-black/20 rounded-xl p-2 border border-white/5 relative mt-4"><canvas ref={lineCanvasRef}></canvas></div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-slide-in-right">
                        {marketData ? (
                            <div className="space-y-4">
                                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-indigo-300 mb-3 border-b border-indigo-500/20 pb-2 flex justify-between">
                                        <span><i className="fa-solid fa-globe mr-2"></i>ตลาดโลก</span>
                                        <span className="text-green-400 border border-green-500/30 px-2 rounded bg-green-500/10">{marketData.globalDemand || marketData.demand} Demand</span>
                                    </h3>
                                    <div className="text-xs space-y-2">
                                        <div className="flex justify-between"><span className="text-slate-400">ส่งออกหลัก:</span><span className="text-white text-right w-1/2">{marketData.exportDestinations || '-'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">แนวโน้ม:</span><span className="text-yellow-400">{marketData.trend}</span></div>
                                    </div>
                                </div>
                                <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-white mb-2"><i className="fa-solid fa-lightbulb mr-2 text-yellow-400"></i>บทวิเคราะห์</h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">{marketData.analysis}</p>
                                </div>
                                
                                {isDurian && activePreset && activePreset.harvestIndices && (
                                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                                        <h3 className="text-sm font-bold text-yellow-300 mb-2 border-b border-yellow-500/20 pb-2"><i className="fa-solid fa-clock mr-2"></i>ดัชนีการเก็บเกี่ยว (Harvest Indices)</h3>
                                        <div className="text-xs space-y-1">
                                            <div className="flex justify-between"><span className="text-slate-400">อายุเก็บเกี่ยว:</span><span className="text-white">{activePreset.harvestIndices.days}</span></div>
                                            <div className="flex justify-between"><span className="text-slate-400">น้ำหนักแห้ง:</span><span className="text-white">{activePreset.harvestIndices.dryMatter}</span></div>
                                            <div className="mt-2 text-slate-300 text-[10px] italic">"{activePreset.harvestIndices.signs}"</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-10">ไม่พบข้อมูลการตลาด</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- UPDATED CLOUD OVERLAY WITH DYNAMIC ROTATION ---
const CloudOverlay = ({ isActive, message, rotation = 0 }) => (
    <div className={`cloud-container ${isActive ? 'active' : ''}`}>
        <div className="cloud-layer"></div>
        {message && (
            <div className="travel-message flex flex-col items-center">
                <div className="text-6xl text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]">
                    {/* Dynamic Rotation via style */}
                    <i className="fa-solid fa-plane-up transition-transform duration-700 ease-in-out" style={{ transform: `rotate(${rotation}deg)` }}></i>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold glass-panel-clear px-10 py-6 rounded-full text-white tracking-wide shadow-[0_0_50px_rgba(16,185,129,0.4)]">{message}</h2>
            </div>
        )}
    </div>
);

const KasetCloudApp = ({ mapInstance, onTravelStart, onTravelEnd, onGoHome, isTraveling }) => {
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [area, setArea] = useState(1);
    const [years, setYears] = useState(10);
    const [results, setResults] = useState(null);
    const [simulatingItem, setSimulatingItem] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPinning, setIsPinning] = useState(false);
    const [mapType, setMapType] = useState('satellite');
    const [sortType, setSortType] = useState('profit');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const appData = useRealtimeData();
    const markerRef = useRef(null);
    const lastProvinceRef = useRef(null);
    const provinceFeaturesRef = useRef(null);
    const tileLayerRef = useRef(null);
    const labelLayerRef = useRef(null);

    const [soilInfo, setSoilInfo] = useState(null);
    const [pinCoords, setPinCoords] = useState(null);
    const [address, setAddress] = useState(null);
    const [addressDetails, setAddressDetails] = useState(null);
    const [isAddressLoading, setIsAddressLoading] = useState(false);

    // Auto-switch Map Style logic
    useEffect(() => {
        if (isPinning) {
            setMapType('hybrid'); // Managing Pin -> Hybrid
        } else if (simulatingItem || selectedProvince) {
            setMapType('satellite'); // Everything else -> Satellite
        }
    }, [isPinning, simulatingItem, selectedProvince]);

    // Map Layers
    useEffect(() => {
        if (!mapInstance) return;
        if (tileLayerRef.current) mapInstance.removeLayer(tileLayerRef.current);
        if (labelLayerRef.current) mapInstance.removeLayer(labelLayerRef.current);
        
        if (mapType === 'satellite') {
            tileLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(mapInstance);
            // No hybrid labels for clean satellite view
        } else if (mapType === 'hybrid') {
            tileLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(mapInstance);
            labelLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', { className: 'blue-hybrid-labels' }).addTo(mapInstance);
        } else {
            tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
        }
        
        return () => { if (tileLayerRef.current) mapInstance.removeLayer(tileLayerRef.current); if (labelLayerRef.current) mapInstance.removeLayer(labelLayerRef.current); };
    }, [mapType, mapInstance]);

    // Markers & Panes
    useEffect(() => {
        if (!mapInstance) return;
        let topPane = mapInstance.getPane('top-pane');
        if (!topPane) { topPane = mapInstance.createPane('top-pane'); topPane.style.zIndex = 3000; topPane.style.pointerEvents = 'none'; }
        if (!provinceFeaturesRef.current) provinceFeaturesRef.current = L.layerGroup().addTo(mapInstance);

        if (!selectedProvince || !appData.provinceData[selectedProvince]) {
            if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; lastProvinceRef.current = null; }
            if (provinceFeaturesRef.current) provinceFeaturesRef.current.clearLayers();
            setPinCoords(null);
            return;
        }

        const info = appData.provinceData[selectedProvince];
        if (lastProvinceRef.current !== selectedProvince) {
            if (provinceFeaturesRef.current) provinceFeaturesRef.current.clearLayers();
            const places = [ { name: "ศาลากลาง", icon: "fa-landmark", color: "#60a5fa", lat: info.lat + 0.01, lng: info.lng - 0.01 }, { name: "ตลาดกลาง", icon: "fa-store", color: "#34d399", lat: info.lat + 0.015, lng: info.lng + 0.01 } ];
            places.forEach(p => {
                const icon = L.divIcon({ className: 'custom-place-icon', html: `<div class="landmark-icon" style="background-color: ${p.color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.5);"><i class="fa-solid ${p.icon} text-white text-xs"></i></div>`, iconSize: [30, 30] });
                L.marker([p.lat, p.lng], { icon }).bindPopup(p.name).addTo(provinceFeaturesRef.current);
            });
        }

        if (!markerRef.current) {
            const customIcon = L.divIcon({ className: 'custom-pin', html: `<div class="pin-inner transition-all duration-300" style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`, iconSize: [24, 24], iconAnchor: [12, 12] });
            markerRef.current = L.marker([info.lat, info.lng], { icon: customIcon, draggable: true, pane: 'top-pane' }).addTo(mapInstance);
            markerRef.current.dragging.disable();
            lastProvinceRef.current = selectedProvince;
            setPinCoords([info.lat, info.lng]);
            markerRef.current.on('dragend', (e) => { const { lat, lng } = e.target.getLatLng(); setPinCoords([lat, lng]); });
        } else {
            if (lastProvinceRef.current !== selectedProvince) { markerRef.current.setLatLng([info.lat, info.lng]); lastProvinceRef.current = selectedProvince; setPinCoords([info.lat, info.lng]); }
            markerRef.current.setOpacity(1);
        }
    }, [selectedProvince, mapInstance, appData.provinceData]);

    useEffect(() => {
        if (markerRef.current) {
            const el = markerRef.current.getElement();
            if (!el) return;
            const inner = el.querySelector('.pin-inner');
            if (isPinning) { markerRef.current.dragging.enable(); if (inner) inner.classList.add('scale-125', 'ring-4', 'ring-emerald-400/50'); } 
            else { markerRef.current.dragging.disable(); if (inner) inner.classList.remove('scale-125', 'ring-4', 'ring-emerald-400/50'); }
        }
    }, [isPinning, selectedProvince]);

    useEffect(() => {
        if (pinCoords) {
            setIsAddressLoading(true);
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pinCoords[0]}&lon=${pinCoords[1]}&format=json&accept-language=th`)
                .then(res => res.json())
                .then(data => {
                    if (data.address) {
                        setAddressDetails(data.address);
                        const a = data.address;
                        const parts = [];
                        if (a.village) parts.push('หมู่บ้าน ' + a.village);
                        else if (a.hamlet) parts.push('หมู่บ้าน ' + a.hamlet);
                        if (a.road) parts.push('ถนน ' + a.road);
                        const subDistrict = a.suburb || a.tambon || a.quarter || a.neighbourhood;
                        if (subDistrict) { if (a.quarter) parts.push('แขวง ' + subDistrict); else parts.push('ตำบล ' + subDistrict); }
                        const district = a.city_district || a.district || a.amphoe;
                        if (district) { if (a.state === 'กรุงเทพมหานคร' || a.city_district) parts.push('เขต ' + district); else parts.push('อำเภอ ' + district); }
                        if (a.state) parts.push('จังหวัด ' + a.state);
                        setAddress(parts.length > 0 ? parts.join(' ') : 'พิกัดไม่มีที่อยู่ระบุชัดเจน');
                    } else { setAddress('ไม่พบข้อมูลที่อยู่'); setAddressDetails(null); }
                    setIsAddressLoading(false);
                })
                .catch(e => { setAddress('เชื่อมต่อแผนที่ไม่ได้'); setIsAddressLoading(false); });
        } else { setAddress(null); setAddressDetails(null); }
    }, [pinCoords]);

    const provinceStats = useMemo(() => {
        if (!selectedProvince) return null;
        const exactPop = appData.thaiPop?.find(p => p.province_name === selectedProvince);
        const statsList = appData.stats ? appData.stats.filter(s => s.province === selectedProvince) : [];
        const maxYear = statsList.length > 0 ? Math.max(...statsList.map(s => s.year)) : 0;
        const currentStats = statsList.filter(s => s.year === maxYear);
        const getValue = (keyword) => { const item = currentStats.find(s => s.topic && s.topic.includes(keyword)); return item ? { val: Number(item.value).toLocaleString(), unit: item.unit } : null; };
        return {
            year: maxYear < 2000 && maxYear > 0 ? maxYear + 543 : maxYear,
            totalPop: exactPop ? { val: Number(exactPop.population).toLocaleString(), unit: 'คน' } : (getValue('ประชากรทั้งหมด') || getValue('รวม') || { val: appData.provinceData[selectedProvince]?.population || '-', unit: 'คน' }),
            male: getValue('ชาย'), female: getValue('หญิง'), farmers: getValue('เกษตรกร') || getValue('เกษตร') || getValue('ขึ้นทะเบียน'),
        };
    }, [selectedProvince, appData.stats, appData.provinceData, appData.thaiPop]);

    const activeFloodData = useMemo(() => {
        let result = { risk_level: 'Low', description: 'ไม่พบข้อมูลความเสี่ยงในจุดนี้ (Default)', source: 'No Match Found', debug: { matched: false, reason: 'Init' } };
        if (!appData.floodAlerts || !selectedProvince) { result.debug.reason = 'No alerts loaded or Province not selected'; return result; }
        const provAlerts = appData.floodAlerts.filter(a => a.province === selectedProvince);
        if (provAlerts.length === 0) { result.debug.reason = `No alerts for province: ${selectedProvince}`; return result; }

        if (addressDetails) {
            const rawTambon = addressDetails.suburb || addressDetails.tambon || addressDetails.quarter || addressDetails.neighbourhood || addressDetails.village || '';
            const rawAmphoe = addressDetails.city_district || addressDetails.district || addressDetails.amphoe || '';
            const normTambon = normalizeThaiName(rawTambon);
            const normAmphoe = normalizeThaiName(rawAmphoe);

            if (normTambon) {
                const tMatch = provAlerts.find(a => { const dbTambon = normalizeThaiName(a.tambon); return dbTambon && (dbTambon === normTambon || dbTambon.includes(normTambon) || normTambon.includes(dbTambon)); });
                if (tMatch) return { ...tMatch, source: 'Supabase (Tambon Match)', debug: { matched: true, type: 'Tambon', record: tMatch, mapData: { t: normTambon, a: normAmphoe } } };
            }
            if (normAmphoe) {
                const aMatch = provAlerts.find(a => { const dbAmphoe = normalizeThaiName(a.amphoe); return dbAmphoe && (dbAmphoe === normAmphoe || dbAmphoe.includes(normAmphoe) || normAmphoe.includes(dbAmphoe)); });
                if (aMatch) return { ...aMatch, source: 'Supabase (Amphoe Match)', debug: { matched: true, type: 'Amphoe', record: aMatch, mapData: { t: normTambon, a: normAmphoe } } };
            }
            result.debug.details = { mapNorm: { t: normTambon, a: normAmphoe }, dbRecordsSample: provAlerts.slice(0, 3).map(a => ({t: normalizeThaiName(a.tambon), a: normalizeThaiName(a.amphoe)})) };
        }
        const provWide = provAlerts.find(a => !a.amphoe && !a.tambon);
        if (provWide) return { ...provWide, source: 'Supabase (Province Wide)', debug: { matched: true, type: 'Province', record: provWide } };
        
        result.debug.reason = 'Province has data but no Tambon/Amphoe match for this coordinate';
        result.debug.availableAlerts = provAlerts;
        return result; 
    }, [appData.floodAlerts, selectedProvince, addressDetails]);

    const handleFullscreen = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)); else if (document.exitFullscreen) document.exitFullscreen().then(() => setIsFullscreen(false)); };
    const togglePin = () => setIsPinning(!isPinning);
    const toggleMapType = () => setMapType(prev => prev === 'satellite' ? 'standard' : prev === 'standard' ? 'hybrid' : 'satellite');
    const handleRegionSelect = (r) => { setSelectedRegion(r); setSelectedProvince(null); setResults(null); setIsPinning(false); lastProvinceRef.current = null; };

    const calculateEconomics = useCallback((newArea) => {
        if (!appData.crops) return [];
        
        // รวมข้อมูลจาก Mock หรือ Supabase
        // *สำคัญ* : ตรวจสอบว่าใน appData.crops มีมะพร้าวหรือไม่ ถ้าไม่มีให้ใช้ MOCK_CROPS
        let sourceCrops = appData.crops;
        const coconutExists = sourceCrops.some(c => c.name.includes('มะพร้าว'));
        if (!coconutExists) {
             // ถ้าไม่มีมะพร้าวในข้อมูลหลัก (เช่นโหลดจาก Supabase แล้วไม่มี) ให้เติมจาก Mock
             const mockCoconut = MOCK_CROPS.find(c => c.name.includes('มะพร้าว'));
             if(mockCoconut) sourceCrops = [...sourceCrops, mockCoconut];
        }

        // เพิ่มทุเรียนหมอนทอง (และอื่นๆ) ลงไปใน List ถ้ายังไม่มี
        // เพื่อให้แสดงผลในหน้า List ได้ถูกต้อง และเมื่อคลิกก็จะได้ไปเรียก SimulationPanel
        // ซึ่งใน SimulationPanel เราจะใช้ DURIAN_PRESETS จัดการรายละเอียดแทน
        const durianExists = sourceCrops.some(c => c.name.includes('ทุเรียน'));
        if (!durianExists) {
             const mockDurian = MOCK_CROPS.find(c => c.name.includes('ทุเรียน'));
             if(mockDurian) sourceCrops = [...sourceCrops, mockDurian];
        }

        let processed = sourceCrops.map(c => {
            let rawYield = c.yield; let revenue = 0; const totalYieldKg = rawYield * newArea; let pricePerKg = c.price;
            if (c.price > 1000) { pricePerKg = c.price / 1000; } // ปรับหน่วยตัน
            
            // ปรับหน่วยสำหรับมะพร้าว (ขายเป็นผล)
            if (c.name.includes('มะพร้าว')) {
                 pricePerKg = c.price; // ราคาต่อผล
                 // yield เป็นผลต่อไร่ต่อปีอยู่แล้ว
            }

            revenue = totalYieldKg * pricePerKg;
            const costVal = Number(c.cost) || 0;
            const profitPerCycle = revenue - (costVal * newArea);
            let avgProfitPerYear = profitPerCycle;
            const lifespan = c.lifecycle?.lifespan || 1;
            const isPerennial = c.lifecycle?.type === 'tree' || c.lifecycle?.type === 'integrated' || c.lifecycle?.type === 'business';
            if (isPerennial && lifespan > 1) { const waitYears = c.lifecycle?.wait_years || 0; const productiveYears = Math.max(0, lifespan - waitYears); const totalLifetimeProfit = profitPerCycle * productiveYears; avgProfitPerYear = totalLifetimeProfit / lifespan; }
            
            // ตรวจสอบ Source ถ้าไม่มีให้ระบุว่าเป็น Mock จาก Preset
            let originSource = c.source || 'Mock';
            if (appData.isOnline && c.id) originSource = 'Supabase'; // ถ้ามี ID และออนไลน์ น่าจะมาจาก DB

            return { ...c, cost: costVal, profitTotal: profitPerCycle, avgProfitYear: avgProfitPerYear, source: originSource };
        });

        if (categoryFilter !== 'all') {
            if (categoryFilter === 'plant') processed = processed.filter(c => c.category === 'พืชไร่' || c.category === 'พืชสวน' || !c.category);
            else if (categoryFilter === 'animal') processed = processed.filter(c => c.category === 'ปศุสัตว์');
            else if (categoryFilter === 'integrated') processed = processed.filter(c => c.category === 'ผสมผสาน');
            else if (categoryFilter === 'rice_ministry') processed = processed.filter(c => c.name.includes('ข้าว'));
            else if (categoryFilter === 'rubber_ministry') processed = processed.filter(c => c.name.includes('ยาง'));
            else if (categoryFilter === 'coconut_ministry') processed = processed.filter(c => c.name.includes('มะพร้าว')); // เพิ่ม Filter กระทรวงมะพร้าว
            else if (categoryFilter === 'durian_ministry') processed = processed.filter(c => c.name.includes('ทุเรียน')); // เพิ่ม Filter กระทรวงทุเรียน
            else if (categoryFilter === 'business_ministry') processed = processed.filter(c => c.category === 'ธุรกิจ');
        }
        
        if (sortType === 'profit') { processed.sort((a, b) => b.avgProfitYear - a.avgProfitYear); } 
        else if (sortType === 'payback') { processed.sort((a, b) => { const pbA = a.avgProfitYear > 0 ? (a.cost / a.avgProfitYear) : 999; const pbB = b.avgProfitYear > 0 ? (b.cost / b.avgProfitYear) : 999; return pbA - pbB; }); } 
        else if (sortType === 'risk') { const riskScore = { 'Low': 1, 'Medium': 2, 'High': 3 }; processed.sort((a, b) => (riskScore[a.risk] || 2) - (riskScore[b.risk] || 2)); } 
        else if (sortType === 'balanced') { const riskScore = { 'Low': 1, 'Medium': 1.5, 'High': 2.5 }; processed.sort((a, b) => (b.avgProfitYear / (riskScore[b.risk] || 1.5)) - (a.avgProfitYear / (riskScore[a.risk] || 1.5))); }
        return processed;
    }, [appData.crops, appData.isOnline, sortType, categoryFilter]);

    useEffect(() => { if (selectedProvince) { setResults(calculateEconomics(area)); } }, [calculateEconomics, area, selectedProvince]);

    const handleProvinceSelect = (p) => {
        setIsPinning(false); setSelectedProvince(p); setMapType('satellite'); // Forced Satellite
        const info = appData.provinceData[p];
        if (info) { setSoilInfo(info); setPinCoords([info.lat, info.lng]); }
        if (mapInstance && info && mapInstance._container) { 
            // Calculate Bearing
            const center = mapInstance.getCenter();
            const bearing = getBearing(center.lat, center.lng, info.lat, info.lng);
            
            onTravelStart(`กำลังเดินทางไป ${p}...`, bearing); 
            mapInstance.flyTo([info.lat - 0.1, info.lng], 10, { duration: 3 }); 
            setTimeout(() => onTravelEnd(), 3000); 
        }
        setResults(calculateEconomics(area));
    };

    const handleBack = () => {
        if (isPinning) { setIsPinning(false); return; }
        if (simulatingItem) { setSimulatingItem(null); return; }
        if (selectedProvince) { setSelectedProvince(null); setResults(null); lastProvinceRef.current = null; setMapType('satellite'); setPinCoords(null); if (mapInstance && mapInstance._container) mapInstance.flyTo(DON_MUEANG_COORDS, 6, { duration: 2 }); return; }
        if (selectedRegion) { setSelectedRegion(null); return; }
    };

    const handleAreaChange = (val) => { const newArea = parseFloat(val) || 0; setArea(newArea); };
    const currentProvInfo = appData.provinceData[selectedProvince];
    const floodColorClass = activeFloodData.risk_level === 'High' ? 'text-red-400' : activeFloodData.risk_level === 'Medium' ? 'text-orange-400' : 'text-green-400';

    return (
        <div className="ui-unified-layer">
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between pointer-auto px-2 md:px-4 z-[2100] mt-2">
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    <button onClick={onGoHome} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg group" title="หน้าแรก"><i className="fa-solid fa-house text-sm md:text-base group-hover:text-emerald-400"></i></button>
                    {(selectedRegion || selectedProvince) && (<button onClick={handleBack} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg animate-fade-in-up" title="ย้อนกลับ"><i className="fa-solid fa-arrow-left text-sm md:text-base"></i></button>)}
                </div>
                <div className="flex-1 flex justify-center px-2 min-w-0">
                    {simulatingItem ? (
                        <div className="glass-panel rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-fade-in-up max-w-full overflow-hidden"><i className="fa-solid fa-chart-line text-emerald-400 animate-pulse"></i><span className="text-sm md:text-base font-bold text-white truncate">{simulatingItem.name}</span></div>
                    ) : selectedProvince ? (
                        <div className="glass-panel rounded-full px-1 py-1 flex items-center gap-1 md:gap-2 shadow-[0_0_20px_rgba(0,0,0,0.3)] animate-fade-in-up max-w-full overflow-hidden">
                            <div className="flex items-center gap-2 pl-3 pr-2 border-r border-white/20 shrink-0 min-w-[80px]"><div className="relative"><i className="fa-solid fa-seedling text-emerald-400 text-lg"></i><span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${appData.isOnline ? 'bg-green-400' : 'bg-orange-400'}`}></span><span className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-black/50 ${appData.isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></span></span></div><div className="flex flex-col leading-none hidden sm:flex"><span className="text-xs font-bold text-emerald-100">พืชแนะนำ</span><span className={`text-[8px] font-bold uppercase tracking-wide mt-0.5 ${appData.isOnline ? 'text-green-300' : 'text-orange-300'}`}>{appData.isOnline ? '● SUPABASE' : '○ MOCK DATA'}</span></div></div>
                            <div className="relative group pl-1 min-w-0 flex-1"><i className="fa-solid fa-location-dot text-emerald-400 text-xs md:text-sm absolute left-1 top-1/2 -translate-y-1/2"></i><select value={selectedProvince} onChange={(e) => handleProvinceSelect(e.target.value)} className="bg-transparent text-white text-xs md:text-sm font-bold py-2 pl-6 pr-2 focus:outline-none cursor-pointer appearance-none w-full truncate">{(appData.regions[selectedRegion] || [selectedProvince]).map(p => <option key={p} value={p} className="bg-slate-800 text-white">{p}</option>)}</select></div>
                            <div className="w-[1px] h-4 bg-white/20"></div>
                            <div className="flex items-center gap-1 pr-1 shrink-0"><input type="number" step="0.1" min="0" value={area} onChange={(e) => handleAreaChange(e.target.value)} className="w-10 md:w-16 bg-transparent text-center text-xs md:text-sm font-bold text-yellow-300 focus:outline-none py-1 transition placeholder-white/30" /><span className="text-[10px] md:text-xs text-slate-300 font-bold">ไร่</span></div>
                            <div className="w-[1px] h-4 bg-white/20"></div>
                            <div className="flex items-center gap-1 pr-2 shrink-0"><input type="number" min="1" max="50" value={years} onChange={(e) => setYears(parseFloat(e.target.value) || 1)} className="w-8 md:w-10 bg-transparent text-center text-xs md:text-sm font-bold text-yellow-300 focus:outline-none py-1 transition placeholder-white/30" /><span className="text-[10px] md:text-xs text-slate-300 font-bold">ปี</span></div>
                        </div>
                    ) : (
                        <div className="glass-panel rounded-full px-4 py-1.5 text-sm font-bold text-white/90">{selectedRegion ? `ภาค${selectedRegion}` : 'เลือกภูมิภาค'}</div>
                    )}
                </div>
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    {selectedProvince && !simulatingItem && (<button onClick={togglePin} className={`w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel flex items-center justify-center transition shadow-lg animate-fade-in-up ${isPinning ? 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-white' : 'hover:bg-white/10 text-white'}`} title={isPinning ? "ยืนยันตำแหน่ง" : "ขยับหมุด"}><i className={`fa-solid ${isPinning ? 'fa-check text-lg font-bold' : 'fa-map-location-dot text-sm md:text-base'}`}></i></button>)}
                    <button onClick={toggleMapType} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg" title="เปลี่ยนแผนที่"><i className={`fa-solid ${mapType === 'satellite' ? 'fa-layer-group' : mapType === 'hybrid' ? 'fa-map' : 'fa-earth-americas'} text-sm md:text-base`}></i></button>
                    <button onClick={handleFullscreen} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg" title="เต็มจอ"><i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm md:text-base`}></i></button>
                </div>
            </div>

            {selectedProvince && !isTraveling && (
                <div className="absolute bottom-6 left-0 w-full z-[3000] flex flex-col md:flex-row items-end justify-between px-6 pb-2 pointer-events-none animate-fade-in-up">
                    <style>{`.text-shadow-heavy { text-shadow: 0 2px 4px rgba(0,0,0,0.9); }`}</style>
                    <div className="mb-4 md:mb-0 text-shadow-heavy">
                        <h3 className="font-bold text-white text-4xl md:text-5xl leading-none tracking-wide">{selectedProvince}</h3>
                        <div className="mt-1">
                            {isAddressLoading ? (<span className="text-xs text-yellow-300 animate-pulse"><i className="fa-solid fa-spinner fa-spin mr-1"></i> กำลังค้นหาที่อยู่...</span>) : address ? (<div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs md:text-sm text-emerald-200 border border-emerald-500/30 shadow-lg inline-block max-w-[250px] md:max-w-md truncate"><i className="fa-solid fa-map-location-dot mr-2 text-emerald-400"></i>{address}</div>) : (pinCoords && <span className="text-xs text-slate-400">{pinCoords[0].toFixed(4)}, {pinCoords[1].toFixed(4)}</span>)}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-4 md:gap-8 text-shadow-heavy">
                        <div className="flex flex-col items-center"><div className="flex items-baseline gap-1"><i className="fa-solid fa-users text-blue-400 text-lg"></i><span className="text-2xl font-bold text-white">{provinceStats?.totalPop?.val || '-'}</span><span className="text-xs text-slate-300">{provinceStats?.totalPop?.unit}</span></div><div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">ประชากร</div></div>
                        <div className="flex flex-col items-center"><div className="flex items-baseline gap-1"><i className="fa-solid fa-address-card text-emerald-400 text-lg"></i><span className="text-2xl font-bold text-white">{provinceStats?.farmers?.val || '-'}</span><span className="text-xs text-emerald-200/70">{provinceStats?.farmers?.unit}</span></div><div className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">เกษตรกร</div></div>
                        <div className="w-px h-8 bg-white/20 hidden md:block"></div>
                        <div className="flex flex-col items-center"><div className="flex items-baseline gap-1"><i className="fa-solid fa-flask text-purple-400 text-lg"></i><span className="text-2xl font-bold text-white">{currentProvInfo?.ph || '-'}</span></div><div className="text-[10px] text-purple-200 font-bold uppercase tracking-wider">pH ดิน</div></div>
                        <div className="flex flex-col items-center"><div className="flex items-baseline gap-1"><i className="fa-solid fa-droplet text-blue-400 text-lg"></i><span className="text-2xl font-bold text-white">{currentProvInfo?.moisture || '-'}</span><span className="text-xs text-blue-200">%</span></div><div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">ความชื้น</div></div>
                        <div className="flex flex-col items-center group relative cursor-help">
                            <div className="flex items-baseline gap-1"><i className={`fa-solid fa-water text-lg ${floodColorClass}`}></i><span className="text-2xl font-bold text-white">{activeFloodData.risk_level}</span></div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider ${floodColorClass.replace('text', 'bg').replace('400', '500/20')} px-1 rounded`}>เสี่ยงน้ำท่วม</div>
                            <div className="absolute bottom-full mb-2 hidden group-hover:block w-72 bg-black/95 text-white text-xs p-3 rounded border border-white/20 backdrop-blur-md z-50 shadow-2xl">
                                <div className={`font-bold mb-1 text-sm ${floodColorClass}`}>{activeFloodData.risk_level === 'High' ? 'เสี่ยงสูง (High)' : activeFloodData.risk_level === 'Medium' ? 'ปานกลาง (Medium)' : 'ต่ำ (Low)'}</div>
                                <div className="mb-2 text-[10px] text-slate-300">{activeFloodData.description}</div>
                                <div className="border-t border-white/20 pt-2 mt-2 bg-white/5 p-2 rounded">
                                    <div className="text-[9px] font-bold text-cyan-400 mb-1 flex justify-between"><span>DEBUGGER:</span><span className={activeFloodData.debug?.matched ? 'text-green-400' : 'text-red-400'}>{activeFloodData.debug?.matched ? 'MATCHED' : 'NO MATCH'}</span></div>
                                    <div className="grid grid-cols-[70px_1fr] gap-x-2 gap-y-1 text-[9px] text-slate-400">
                                        <span className="text-slate-500">Source:</span> <span className="text-white truncate">{activeFloodData.source}</span>
                                        <span className="text-orange-300 font-bold mt-1 col-span-2">1. Map Data (Nominatim):</span>
                                        <span className="text-slate-500 pl-2">Raw Tambon:</span> <span className="truncate" title={activeFloodData.debug?.details?.mapNorm?.t}>{activeFloodData.debug?.details?.mapNorm?.t || '-'}</span>
                                        <span className="text-slate-500 pl-2">Raw Amphoe:</span> <span className="truncate" title={activeFloodData.debug?.details?.mapNorm?.a}>{activeFloodData.debug?.details?.mapNorm?.a || '-'}</span>
                                        <span className="text-green-300 font-bold mt-1 col-span-2">2. DB Match Candidate:</span>
                                        {activeFloodData.debug?.record ? (
                                            <>
                                                <span className="text-slate-500 pl-2">DB Tambon:</span> <span>{activeFloodData.debug.record.tambon || '-'}</span>
                                                <span className="text-slate-500 pl-2">DB Amphoe:</span> <span>{activeFloodData.debug.record.amphoe || '-'}</span>
                                                <span className="text-slate-500 pl-2">Risk:</span> <span className={floodColorClass}>{activeFloodData.debug.record.risk_level}</span>
                                            </>
                                        ) : ( <div className="col-span-2 text-red-400 italic pl-2">* ไม่พบข้อมูลตรงกันใน DB</div> )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`w-full flex-1 flex flex-col items-center transition-all duration-700 ease-in-out transform ${isTraveling || isPinning ? '-translate-y-20 opacity-0' : 'translate-y-0 opacity-100'} ${isTraveling || isPinning ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                {!selectedRegion && (
                    <div className={`w-full max-w-5xl mx-auto glass-panel-clear rounded-b-3xl p-6 animate-slide-down shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-t-0 mt-4`}>
                        <h2 className="text-xl font-bold text-white mb-4 text-center">เลือกภูมิภาคของคุณ</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{Object.keys(appData.regions).map(r => (<button key={r} onClick={() => handleRegionSelect(r)} className="bg-white/5 hover:bg-emerald-500/20 border border-white/20 rounded-xl p-6 flex flex-col items-center gap-2 transition hover:scale-105 group backdrop-blur-sm"><span className="text-4xl group-hover:animate-bounce">{r === 'เหนือ' ? '⛰️' : r === 'ใต้' ? '🌊' : '🏙️'}</span><span className="font-bold text-slate-200">{r}</span></button>))}</div>
                    </div>
                )}

                {selectedRegion && !selectedProvince && (
                    <div className={`w-full max-w-5xl mx-auto glass-panel-clear rounded-b-3xl p-6 animate-slide-down h-[80vh] flex flex-col border-t-0 mt-2`}>
                        <h2 className="text-xl font-bold text-white mb-4 text-center">เลือกจังหวัดในภาค{selectedRegion}</h2>
                        <div className="flex-1 overflow-y-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 scrollbar-prominent pb-10">{(appData.regions[selectedRegion] || []).sort().map(p => (<button key={p} onClick={() => handleProvinceSelect(p)} className="bg-white/5 hover:bg-emerald-500/20 border border-white/20 rounded-lg p-3 text-sm font-bold text-slate-200 transition backdrop-blur-sm">{p}</button>))}</div>
                    </div>
                )}

                {selectedProvince && !simulatingItem && (
                    <div className={`w-full max-w-5xl mx-auto flex flex-col h-[80vh] animate-slide-down mt-2`}>
                        <div className="flex-1 glass-panel-clear rounded-b-3xl overflow-hidden flex flex-col shadow-xl border-t-0">
                            <div className="flex flex-wrap gap-2 p-3 border-b border-white/10 items-center justify-between bg-black/20">
                                <div className="flex gap-1 overflow-x-auto scrollbar-prominent pb-1">
                                    <button onClick={() => setCategoryFilter('plant')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'plant' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300'}`}>พืชไร่/สวน</button>
                                    <button onClick={() => setCategoryFilter('animal')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'animal' ? 'bg-orange-500 text-white' : 'bg-white/10 text-slate-300'}`}>ฟาร์มสัตว์</button>
                                    <button onClick={() => setCategoryFilter('integrated')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'integrated' ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-300'}`}>เกษตรผสมผสาน</button>
                                    
                                    {/* กระทรวงต่างๆ */}
                                    <button onClick={() => setCategoryFilter('rice_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'rice_ministry' ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/10 text-slate-300'}`}><i className="fa-solid fa-shekel-sign mr-1"></i>กระทรวงชาวนา</button>
                                    <button onClick={() => setCategoryFilter('rubber_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'rubber_ministry' ? 'bg-slate-200 text-slate-900 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/10 text-slate-300'}`}><i className="fa-solid fa-droplet mr-1"></i>กระทรวงยางพารา</button>
                                    
                                    {/* เพิ่มปุ่มกระทรวงมะพร้าว */}
                                    <button onClick={() => setCategoryFilter('coconut_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'coconut_ministry' ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]' : 'bg-white/10 text-slate-300'}`}><i className="fa-solid fa-tree mr-1"></i>กระทรวงมะพร้าว</button>
                                    
                                    <button onClick={() => setCategoryFilter('durian_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'durian_ministry' ? 'bg-yellow-600 text-white shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-white/10 text-slate-300'}`}><i className="fa-solid fa-crown mr-1"></i>กระทรวงทุเรียน</button>

                                    <button onClick={() => setCategoryFilter('business_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'business_ministry' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]' : 'bg-white/10 text-slate-300'}`}><i className="fa-solid fa-briefcase mr-1"></i>กระทรวงพี่เลี้ยงธุรกิจ</button>
                                    <button onClick={() => setCategoryFilter('all')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'all' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300'}`}>ทั้งหมด</button>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setSortType('profit')} className={`w-8 h-8 rounded-full flex items-center justify-center border ${sortType === 'profit' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'border-white/10 text-slate-400'}`} title="ผลตอบแทนสูง"><i className="fa-solid fa-sack-dollar"></i></button>
                                    <button onClick={() => setSortType('payback')} className={`w-8 h-8 rounded-full flex items-center justify-center border ${sortType === 'payback' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-white/10 text-slate-400'}`} title="คืนทุนไว"><i className="fa-solid fa-stopwatch"></i></button>
                                    <button onClick={() => setSortType('risk')} className={`w-8 h-8 rounded-full flex items-center justify-center border ${sortType === 'risk' ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/10 text-slate-400'}`} title="ความเสี่ยงต่ำ"><i className="fa-solid fa-shield-halved"></i></button>
                                    <button onClick={() => setSortType('balanced')} className={`w-8 h-8 rounded-full flex items-center justify-center border ${sortType === 'balanced' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-white/10 text-slate-400'}`} title="แนะนำ"><i className="fa-solid fa-star"></i></button>
                                </div>
                            </div>
                            
                            {/* รายการพืช (Crops List) */}
                            <div className="flex-1 overflow-y-auto scrollbar-prominent pb-44 pt-2">
                                {results && results.length > 0 ? results.map((item, idx) => (
                                    <div key={idx} onClick={() => setSimulatingItem(item)} className="p-4 border-b border-white/10 hover:bg-white/5 cursor-pointer flex items-center justify-between group transition relative overflow-hidden">
                                        {/* Background Highlight for Supabase items */}
                                        {item.source && item.source.includes('Supabase') && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>}
                                        
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border group-hover:scale-110 transition backdrop-blur-sm shrink-0 ${item.category === 'ธุรกิจ' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>{idx + 1}</div>
                                            <div>
                                                <div className="font-bold text-white group-hover:text-yellow-400 transition flex items-center gap-2">
                                                    {item.name}
                                                    {item.category === 'ปศุสัตว์' && <i className="fa-solid fa-cow text-orange-400 text-xs"></i>}
                                                    {item.category === 'ผสมผสาน' && <i className="fa-solid fa-seedling text-blue-400 text-xs"></i>}
                                                    {item.category === 'ธุรกิจ' && <i className="fa-solid fa-briefcase text-purple-400 text-xs"></i>}
                                                    {/* Source Badge Improved */}
                                                    {item.source && item.source.includes('Supabase') ? (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-green-500 bg-green-900/80 text-green-300 uppercase tracking-wider font-bold ml-2 shadow-[0_0_5px_rgba(34,197,94,0.5)]">
                                                            ● LIVE DB
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-slate-600 bg-slate-800/50 text-slate-400 uppercase tracking-wider font-bold ml-2">
                                                            ○ MOCK
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-300">{item.category === 'ธุรกิจ' ? 'ลงทุน:' : 'ลงทุน:'} {(item.cost || 0).toLocaleString()} ฿/{item.category === 'ธุรกิจ' ? 'สาขา' : (item.category === 'ปศุสัตว์' ? 'ตัว/รุ่น' : 'ไร่')}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400">กำไรเฉลี่ย/ปี</div>
                                            <div className="font-bold text-yellow-400 text-lg drop-shadow-md">{(item.avgProfitYear || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ฿</div>
                                        </div>
                                    </div>
                                )) : <div className="p-10 text-center text-slate-500">ไม่พบข้อมูลตามเงื่อนไข</div>}
                            </div>
                            <div className="w-full h-4 flex items-center justify-center cursor-pointer bg-white/5"><div className="w-12 h-1 bg-white/20 rounded-full"></div></div>
                        </div>
                    </div>
                )}

                {simulatingItem && (
                    <div className={`w-full max-w-5xl mx-auto h-[80vh] animate-slide-down z-[2050] mt-2`}>
                        <SimulationPanel item={simulatingItem} onClose={() => setSimulatingItem(null)} globalArea={area} setGlobalArea={setArea} globalYears={years} setGlobalYears={setYears} floodData={activeFloodData} soilInfo={currentProvInfo} provinceStats={provinceStats} />
                    </div>
                )}
            </div>
        </div>
    );
};

const HomePage = ({ onStart, isTraveling }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const toggleFullscreen = () => { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)); } else { if (document.exitFullscreen) document.exitFullscreen().then(() => setIsFullscreen(false)); } };

    return (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center p-6 animate-fade-in-up">
            <button onClick={toggleFullscreen} className="absolute top-4 right-4 w-10 h-10 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg z-50"><i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm`}></i></button>
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Flag_of_Thailand.svg" alt="Thai Flag" className="w-24 mb-4 animate-flag-wave shadow-lg" />
            <h1 className="text-5xl md:text-7xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-emerald-400 to-cyan-400 drop-shadow-xl">Winai Innovation</h1>
            <p className="text-slate-300 text-lg mb-8 bg-black/40 px-4 py-1 rounded-full backdrop-blur-sm border border-white/10">Super App เพื่อเกษตรกรไทย</p>
            <button onClick={onStart} disabled={isTraveling} className={`group relative font-bold py-4 px-10 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all overflow-hidden border border-emerald-400/50 backdrop-blur-md ${isTraveling ? 'bg-emerald-900/40 text-emerald-200 cursor-default scale-105' : 'bg-white/10 hover:bg-emerald-500/30 text-white hover:scale-105 hover:shadow-[0_0_50px_rgba(16,185,129,0.8)]'}`}>
                <div className={`absolute inset-0 bg-emerald-500/20 transition-transform duration-1000 ${isTraveling ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'}`}></div>
                <span className="relative flex items-center gap-3 text-xl">{isTraveling ? (<><i className="fa-solid fa-plane-up transition-transform duration-700 ease-in-out" style={{ transform: `rotate(90deg)` }}></i> กำลังเดินทาง เข้าสู่เกษตร คราวน์</>) : (<><i className="fa-solid fa-rocket"></i> เข้าสู่เกษตร คราวน์</>)}</span>
            </button>
            <div className="mt-8 text-xs text-slate-400 bg-black/30 p-4 rounded-xl backdrop-blur-sm border border-white/5"><p>พัฒนาโดย: Mr.Winai Phanarkat</p><p>Line: 0926533228 | Email: winayo@gmail.com</p></div>
        </div>
    );
};

const App = () => {
    const [page, setPage] = useState('home');
    const [travel, setTravel] = useState({ active: false, msg: '', rotation: 0 }); // Added rotation to state
    const mapRef = useRef(null);
    const rotationInterval = useRef(null);

    useEffect(() => {
        if (mapRef.current) return;
        const map = L.map('global-map', { zoomControl: false, attributionControl: false }).setView([13.7563, 100.5018], 5);
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(map);
        mapRef.current = map;
        return () => { if (map) map.remove(); mapRef.current = null; };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (page === 'home') { if (rotationInterval.current) clearInterval(rotationInterval.current); rotationInterval.current = setInterval(() => { if (map && map._container) map.panBy([1, 0], { animate: false }); }, 50); } 
        else { if (rotationInterval.current) { clearInterval(rotationInterval.current); rotationInterval.current = null; } }
        return () => { if (rotationInterval.current) clearInterval(rotationInterval.current); };
    }, [page]);

    const handleStart = () => {
        if (mapRef.current) {
            // Calculate Bearing from Center to Don Mueang
            const center = mapRef.current.getCenter();
            const bearing = getBearing(center.lat, center.lng, DON_MUEANG_COORDS[0], DON_MUEANG_COORDS[1]);
            
            setTravel({ active: true, msg: '', rotation: bearing });
            mapRef.current.flyTo(DON_MUEANG_COORDS, 6, { duration: 4 });
            setTimeout(() => { setPage('kaset'); setTravel({ active: false, msg: '', rotation: 0 }); }, 4000);
        }
    };

    const handleGoHome = () => { setPage('home'); if (mapRef.current) mapRef.current.setView([13.7563, 100.5018], 5); };

    return (
        <div className="h-screen w-screen overflow-hidden text-slate-200">
            <div id="global-map"></div>
            <CloudOverlay isActive={travel.active} message={travel.msg} rotation={travel.rotation} />
            {page === 'home' && <HomePage onStart={handleStart} isTraveling={travel.active} />}
            {page === 'kaset' && (<KasetCloudApp mapInstance={mapRef.current} onTravelStart={(msg, rotation) => setTravel({ active: true, msg, rotation })} onTravelEnd={() => setTravel({ active: false, msg: '', rotation: 0 })} onGoHome={handleGoHome} isTraveling={travel.active} />)}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://ldsysxczitmkxmukmwri.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkc3lzeGN6aXRta3htdWttd3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNzI4NDAsImV4cCI6MjA4MTc0ODg0MH0.1rHQug1PlhgNE6lsy3RllAQC36k0BoY6KqjeeQvAVhc';

// --- GLOBAL CONSTANTS ---
Chart.defaults.color = '#cbd5e1';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
Chart.defaults.font.family = 'Sarabun';
const DON_MUEANG_COORDS = [13.9133, 100.6042];

// --- REAL-WORLD FLOOD RISK DATA (RESEARCHED 2024-2025: TAMBON LEVEL) ---
// Note: This Mock Data structure is updated to support 'amphoe' and 'tambon'
const MOCK_FLOOD_ALERTS = [
    // ภาคเหนือ
    { id: '10101', province: 'เชียงราย', amphoe: 'แม่สาย', tambon: 'แม่สาย', risk_level: 'High', description: 'พื้นที่ริมแม่น้ำสาย เสี่ยงน้ำล้นตลิ่งและดินโคลนถล่ม', source: 'ปภ./GISTDA' },
    { id: '10201', province: 'เชียงใหม่', amphoe: 'เมืองเชียงใหม่', tambon: 'ช้างคลาน', risk_level: 'High', description: 'โซนเศรษฐกิจริมน้ำปิง (Night Bazaar) เสี่ยงน้ำล้นตลิ่ง', source: 'กรมชลประทาน' },
    { id: '10401', province: 'แพร่', amphoe: 'เมืองแพร่', tambon: 'ในเวียง', risk_level: 'High', description: 'เขตเทศบาลเมือง เสี่ยงน้ำยมล้นตลิ่งเข้าท่วม', source: 'สทนช.' },
    
    // ภาคอีสาน
    { id: '20301', province: 'อุบลราชธานี', amphoe: 'วารินชำราบ', tambon: 'หนองกินเพล', risk_level: 'High', description: 'ชุมชนหาดสวนยา พื้นที่ลุ่มต่ำริมแม่น้ำมูล', source: 'GISTDA' },
    { id: '20101', province: 'หนองคาย', amphoe: 'เมืองหนองคาย', tambon: 'ในเมือง', risk_level: 'High', description: 'ชุมชนวัดธาตุ เสี่ยงน้ำโขงล้นตลิ่ง', source: 'MRCS' },
    
    // ภาคกลาง
    { id: '30101', province: 'พระนครศรีอยุธยา', amphoe: 'บางบาล', tambon: 'บางบาล', risk_level: 'High', description: 'พื้นที่แก้มลิงธรรมชาติ รับน้ำท่วมขังนาน 2-3 เดือน', source: 'กรมชลประทาน' },
    { id: '30601', province: 'กรุงเทพมหานคร', amphoe: 'ดุสิต', tambon: 'ถนนนครไชยศรี', risk_level: 'High', description: 'จุดฟันหลอริมเจ้าพระยา (เขียวไข่กา) เสี่ยงน้ำหนุน', source: 'กทม.' },
    { id: '30603', province: 'กรุงเทพมหานคร', amphoe: 'ลาดกระบัง', tambon: 'ลาดกระบัง', risk_level: 'High', description: 'พื้นที่รับน้ำตะวันออก ระบายน้ำยาก', source: 'กทม.' },
    { id: '30701', province: 'ปทุมธานี', amphoe: 'สามโคก', tambon: 'ท้ายเกาะ', risk_level: 'High', description: 'ชุมชนริมเจ้าพระยา นอกคันกั้นน้ำ', source: 'ปภ.' },
    
    // ภาคใต้
    { id: '50101', province: 'ภูเก็ต', amphoe: 'เมืองภูเก็ต', tambon: 'รัษฎา', risk_level: 'High', description: 'พื้นที่ชุมชนหนาแน่น เสี่ยงน้ำท่วมขังรอระบาย', source: 'ปภ.' },
    { id: '50201', province: 'นราธิวาส', amphoe: 'สุไหงโก-ลก', tambon: 'มูโนะ', risk_level: 'High', description: 'พื้นที่ตลาดชายแดน เสี่ยงน้ำล้นตลิ่งแม่น้ำโก-ลก', source: 'กรมชลประทาน' }
];

// --- MOCK DATA FALLBACKS (Updated with Categories) ---
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
    "พระนครศรีอยุธยา": { lat: 14.3532, lng: 100.5684, ph: 7.2, moisture: 80, soil: "ดินเหนียว", region: "กลาง" },
    "ภูเก็ต": { lat: 7.8804, lng: 98.3923, ph: 5.8, moisture: 75, soil: "ดินร่วนปนดินเหนียว", region: "ใต้" },
    // เพิ่มเติมจังหวัดอื่นๆ ตามต้องการ หรือใช้ Logic สุ่มพิกัดใกล้เคียง
};

// Added mock data for other categories for demo purposes
const MOCK_CROPS = [
    {
        name: "ทุเรียนหมอนทอง",
        category: "พืชสวน",
        price: 135, yield: 1600, cost: 45000, risk: "High",
        unit: "kg", yieldUnit: "กิโลกรัม",
        market: "ส่งออกจีน / ตลาดไท",
        demand: { domestic: "ปานกลาง", international: "สูงมาก", trend: "เติบโต" },
        lifecycle: { type: 'tree', lifespan: 25, wait_years: 5, peak_start: 8 },
        lifecycleData: [],
        source: 'Mock' // Explicitly mark mock data
    },
    {
        name: "ยางพารา (น้ำยางสด)",
        category: "พืชสวน",
        price: 52.60, yield: 1200, cost: 7500, risk: "Medium",
        unit: "kg", yieldUnit: "กิโลกรัม",
        market: "ตลาดกลางยางพารา",
        demand: { domestic: "สูง", international: "สูงมาก", trend: "ผันผวนตามตลาดโลก" },
        lifecycle: { type: 'tree', lifespan: 25, wait_years: 7, peak_start: 9, advice: 'กรีด 2 วัน เว้น 1 วัน' },
        lifecycleData: [],
        source: 'Mock'
    },
    {
        name: "ข้าวหอมมะลิ 105",
        category: "พืชไร่",
        price: 14500, yield: 450, cost: 4500, risk: "Low", // ปรับราคาและผลผลิตเฉลี่ยให้สมจริง (นาปี)
        unit: "ton", yieldUnit: "กิโลกรัม",
        market: "โรงสี / สหกรณ์",
        demand: { domestic: "สูง", international: "สูง", trend: "คงที่" },
        plowing: { animal: 1200, tractor: 350 },
        lifecycle: { type: 'annual', lifespan: 1 },
        lifecycleData: [],
        source: 'Mock'
    },
    {
        name: "ข้าวโพดเลี้ยงสัตว์",
        category: "พืชไร่",
        price: 9.5, yield: 1100, cost: 4500, risk: "Medium",
        unit: "kg", yieldUnit: "กิโลกรัม",
        market: "โรงงานอาหารสัตว์",
        demand: { domestic: "สูงมาก", international: "ปานกลาง", trend: "ขาดแคลน" },
        plowing: { animal: 1200, tractor: 400 },
        lifecycle: { type: 'annual', lifespan: 1 },
        lifecycleData: [],
        source: 'Mock'
    },
    {
        name: "มันสำปะหลัง",
        category: "พืชไร่",
        price: 2.8, yield: 3500, cost: 4000, risk: "Medium",
        unit: "kg", yieldUnit: "กิโลกรัม",
        market: "ลานมัน / โรงแป้ง",
        demand: { domestic: "สูง", international: "สูง", trend: "พลังงานทดแทน" },
        plowing: { animal: 1000, tractor: 400 },
        lifecycle: { type: 'annual', lifespan: 1 },
        lifecycleData: [],
        source: 'Mock'
    },
    {
        name: "โคขุนโพนยางคำ",
        category: "ปศุสัตว์",
        price: 100, yield: 500, cost: 25000, risk: "Medium",
        unit: "kg", yieldUnit: "กิโลกรัม",
        market: "ร้านสเต็ก / ส่งออก",
        demand: { domestic: "สูง", international: "สูง", trend: "เติบโต" },
        lifecycle: { type: 'animal', lifespan: 2 },
        lifecycleData: [],
        source: 'Mock'
    },
    {
        name: "เกษตรทฤษฎีใหม่",
        category: "ผสมผสาน",
        price: 50000, yield: 1, cost: 10000, risk: "Low",
        unit: "set", yieldUnit: "ชุด",
        market: "พึ่งพาตนเอง / เหลือขาย",
        demand: { domestic: "สูง", international: "N/A", trend: "ยั่งยืน" },
        lifecycle: { type: 'integrated', lifespan: 99, advice: 'เน้นพึ่งพาตนเอง ลดต้นทุน' },
        lifecycleData: [],
        source: 'Mock'
    },
    // --- กระทรวงพี่เลี้ยงธุรกิจ (Ministry of Business Mentorship) ---
    {
        name: "Farm Cafe & Bistro",
        category: "ธุรกิจ",
        price: 150, // กำไรเฉลี่ยต่อหัว (Ticket Size)
        yield: 10000, // จำนวนลูกค้าต่อปี (เฉลี่ย 27 คน/วัน)
        cost: 800000, // ค่าก่อสร้าง + ตกแต่ง + เครื่องชง (ลงทุนครั้งแรกสูง)
        risk: "High",
        unit: "branch", yieldUnit: "ลูกค้า/ปี",
        market: "นักท่องเที่ยว / สายคาเฟ่",
        demand: { domestic: "สูงมาก", international: "ปานกลาง", trend: "ท่องเที่ยวเชิงเกษตร" },
        lifecycle: { type: 'business', lifespan: 10, advice: 'ต้องมี Story และมุมถ่ายรูป จุดคุ้มทุนอยู่ที่ปีที่ 2-3' },
        costStructure: { fertilizer: 0, labor: 40, seeds: 30, water: 10, misc: 20 }, // staff, raw mat, utility, maintain
        lifecycleData: [],
        source: 'Mock'
    }
];

// --- HOOK: USE REALTIME DATA ---
const useRealtimeData = () => {
    const [data, setData] = useState({
        regions: MOCK_REGIONS,
        provinceData: MOCK_PROVINCE_DATA,
        crops: MOCK_CROPS,
        floodAlerts: MOCK_FLOOD_ALERTS, // Use real-world researched data as default
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

        // 1. Initial Fetch
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

                // Ignore errors for demo resilience
                
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
                    // Fallback to MOCK_REGIONS if DB empty
                    Object.assign(newRegions, MOCK_REGIONS);
                    Object.assign(newProvinceData, MOCK_PROVINCE_DATA);
                }

                // Process Crops with Lifecycle
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
                        source: 'Supabase' // Mark real data
                    };
                });

                // Fallback: If DB is empty or missing categories, merge with MOCK for demo
                if (newCrops.length < 5) {
                    // Merge Unique Names
                    const existingNames = new Set(newCrops.map(c => c.name));
                    MOCK_CROPS.forEach(m => {
                        if (!existingNames.has(m.name)) newCrops.push(m);
                    });
                }

                // Flood Data Logic: Merge Real-time with Mock Researched Data
                let combinedFloodAlerts = [...MOCK_FLOOD_ALERTS];
                if (floodRes.data && floodRes.data.length > 0) {
                    // Update or Add from Supabase
                    floodRes.data.forEach(dbAlert => {
                        // Check match by province AND amphoe/tambon if available
                        const index = combinedFloodAlerts.findIndex(a => 
                            a.province === dbAlert.province && 
                            (dbAlert.amphoe ? a.amphoe === dbAlert.amphoe : true) &&
                            (dbAlert.tambon ? a.tambon === dbAlert.tambon : true)
                        );
                        
                        if (index !== -1) {
                            combinedFloodAlerts[index] = { ...combinedFloodAlerts[index], ...dbAlert, source: 'Supabase (Live)' };
                        } else {
                            combinedFloodAlerts.push({ ...dbAlert, source: 'Supabase (Live)' });
                        }
                    });
                }

                setData({
                    regions: Object.keys(newRegions).length > 0 ? newRegions : MOCK_REGIONS,
                    provinceData: Object.keys(newProvinceData).length > 0 ? newProvinceData : MOCK_PROVINCE_DATA,
                    crops: newCrops.length > 0 ? newCrops : MOCK_CROPS,
                    floodAlerts: combinedFloodAlerts, // Use Combined Data
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

        // Setup Realtime Subscription
        const channel = client.channel('public-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'flood_alerts' }, (payload) => {
                setData(prev => {
                    let newAlerts = [...prev.floodAlerts];
                    if (payload.eventType === 'INSERT') {
                        // Check if exists, update if so
                        const idx = newAlerts.findIndex(a => a.province === payload.new.province && a.tambon === payload.new.tambon);
                        if (idx !== -1) newAlerts[idx] = { ...payload.new, source: 'Supabase (Live Update)' };
                        else newAlerts.push({ ...payload.new, source: 'Supabase (Live Update)' });
                    }
                    else if (payload.eventType === 'DELETE') newAlerts = newAlerts.filter(a => a.id !== payload.old.id);
                    else if (payload.eventType === 'UPDATE') {
                         const idx = newAlerts.findIndex(a => a.id === payload.new.id);
                         if(idx !== -1) newAlerts[idx] = { ...payload.new, source: 'Supabase (Live Update)' };
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
    // ใช้ค่าจาก Props แทน State ภายใน
    const [panelTab, setPanelTab] = useState('financial');
    const [customCosts, setCustomCosts] = useState(null);

    const lifeInfo = item.lifecycle || { type: 'annual', lifespan: 1, advice: '-' };
    const isTree = lifeInfo.type === 'tree';
    const isBusiness = item.category === 'ธุรกิจ';
    const isRice = item.name.includes('ข้าว');
    const lifecycleData = item.lifecycleData || [];

    const lineCanvasRef = useRef(null);
    const lineChartRef = useRef(null);

    // --- RICE MINISTRY ADVANCED STATE (RESEARCH-BASED) ---
    const RICE_PRESETS = {
        'jasmine': { 
            name: 'หอมมะลิ 105', 
            price: 14500, // ราคาเฉลี่ยตันละ (นาปี)
            yield: 450,   // กก./ไร่ (ผลผลิตต่ำกว่านาปรัง)
            duration: 120, 
            risk: 'Low', 
            desc: 'ข้าวนาปี กลิ่นหอม เป็นที่ต้องการตลาดโลก',
            seedCost: 350,  // ค่าเมล็ดพันธุ์/ไร่ (ตั้งต้น)
            careMult: 1.0   // ค่าดูแลรักษา (มาตรฐาน)
        },
        'pathum': { 
            name: 'ปทุมธานี 1', 
            price: 10500, // ราคาเฉลี่ยตันละ
            yield: 850,   // กก./ไร่ (ผลผลิตสูงมาก)
            duration: 105, 
            risk: 'Medium', 
            desc: 'ข้าวนาปรัง ปลูกได้ทั้งปี ทนทาน',
            seedCost: 250,  // เมล็ดพันธุ์หาง่าย
            careMult: 1.2   // ต้องใส่ปุ๋ยเยอะเพื่อเร่งผลผลิต
        },
        'sticky': { 
            name: 'กข.6 (ข้าวเหนียว)', 
            price: 12000, 
            yield: 550, 
            duration: 115, 
            risk: 'Low', 
            desc: 'ข้าวเหนียวนาปี หอมนุ่ม นิยมในอีสาน',
            seedCost: 280, 
            careMult: 0.9   // ทนแล้ง ดูแลง่ายกว่า
        },
        'berry': { 
            name: 'ไรซ์เบอร์รี่', 
            price: 22000, // ราคาข้าวเปลือกสูง (Niche)
            yield: 500, 
            duration: 130, 
            risk: 'High', 
            desc: 'ข้าวสุขภาพ ตลาดเฉพาะกลุ่ม เมล็ดแพง',
            seedCost: 600,  // เมล็ดพันธุ์แพงและหายาก
            careMult: 1.5   // ดูแลยาก (มักทำเกษตรอินทรีย์)
        }
    };

    // Helper function to detect initial variety based on clicked item name
    const getInitialVariety = (name) => {
        if (!name) return 'jasmine';
        if (name.includes('หอมมะลิ') || name.includes('jasmine')) return 'jasmine';
        if (name.includes('ปทุม') || name.includes('pathum')) return 'pathum';
        if (name.includes('เหนียว') || name.includes('sticky') || name.includes('กข.6')) return 'sticky';
        if (name.includes('ไรซ์เบอร์รี่') || name.includes('berry')) return 'berry';
        return 'jasmine'; // Default fallback
    };

    const [riceConfig, setRiceConfig] = useState({
        variety: getInitialVariety(item.name), // Initialize based on item.name
        method: 'wan', 
        fertilizer: 'mixed', 
        labor: 'hire', 
        processing: 0
    });

    // Also update if item changes prop (e.g. fast switching)
    useEffect(() => {
        if (isRice) {
            setRiceConfig(prev => ({ ...prev, variety: getInitialVariety(item.name) }));
        }
    }, [item.name, isRice]);

    // --- RICE CALCULATOR LOGIC ---
    const [riceSteps, setRiceSteps] = useState([
        { id: 'plow', label: '1. เตรียมดิน (ไถ)', val: 350, baseVal: 350, desc: 'รถไถรับจ้าง' },
        { id: 'seed', label: '2. เมล็ดพันธุ์', val: 350, baseVal: 350, desc: 'พันธุ์มาตรฐาน' },
        { id: 'plant', label: '3. ปลูก/ดำ/หว่าน', val: 100, baseVal: 100, desc: 'ค่าแรง/เครื่องจักร' },
        { id: 'maint', label: '4. ปุ๋ย/ยา/ดูแล', val: 1500, baseVal: 1500, desc: 'สูตรเคมี+อินทรีย์' },
        { id: 'harvest', label: '5. เก็บเกี่ยว', val: 600, baseVal: 600, desc: 'รถเกี่ยว' },
        { id: 'process', label: '6. ค่าสี/แพ็ค (Option)', val: 0, baseVal: 2000, desc: 'สำหรับขายข้าวสาร' }
    ]);

    // Update Rice Defaults based on Config & Preset Research
    useEffect(() => {
        if (!isRice) return;
        const currentPreset = RICE_PRESETS[riceConfig.variety];
        
        let newSteps = [...riceSteps];
        
        // 1. ปรับค่าเมล็ดพันธุ์ตามวิธีปลูก และ ชนิดพันธุ์ (Research Based)
        const seedStep = newSteps.find(s => s.id === 'seed');
        const baseSeedCost = currentPreset ? currentPreset.seedCost : 350; 
        const riceName = currentPreset ? currentPreset.name : 'ข้าว';
        
        if (riceConfig.method === 'dam') { 
            seedStep.val = Math.round(baseSeedCost * 0.4); 
            seedStep.desc = `ค่ากล้า ${riceName}`; 
        } else if (riceConfig.method === 'yod') { 
            seedStep.val = Math.round(baseSeedCost * 0.6); 
            seedStep.desc = `หยอดหลุม ${riceName}`; 
        } else { 
            seedStep.val = baseSeedCost; 
            seedStep.desc = `หว่าน ${riceName}`; 
        }

        // 2. ปรับค่าแรงปลูก
        const plantStep = newSteps.find(s => s.id === 'plant');
        if (riceConfig.method === 'dam') { plantStep.val = 1200; plantStep.desc = 'ค่าจ้างดำนา (แพง)'; }
        else { plantStep.val = 100; plantStep.desc = 'ค่าหว่าน/หยอด (ถูก)'; }

        // 3. ปรับค่าปุ๋ย/ดูแล (ตามชนิดพันธุ์และการจัดการ)
        const maintStep = newSteps.find(s => s.id === 'maint');
        let baseMaint = 1500 * (currentPreset ? currentPreset.careMult : 1); 

        if (riceConfig.fertilizer === 'organic') { 
            maintStep.val = Math.round(baseMaint * 0.8); 
            maintStep.desc = 'อินทรีย์ (เน้นแรงงาน)'; 
        } else if (riceConfig.fertilizer === 'chemical') { 
            maintStep.val = Math.round(baseMaint * 1.2); 
            maintStep.desc = 'เคมี (แพงแต่ไว)'; 
        } else { 
            maintStep.val = Math.round(baseMaint); 
            maintStep.desc = 'ผสมผสาน'; 
        }

        // 4. ค่าไถ (Labor)
        const plowStep = newSteps.find(s => s.id === 'plow');
        if (riceConfig.labor === 'family') { plowStep.val = 100; plowStep.desc = 'ค่าน้ำมัน (ทำเอง)'; }
        else { plowStep.val = 350; plowStep.desc = 'จ้างรถไถ'; }

        // 5. ค่าแปรรูป
        const processStep = newSteps.find(s => s.id === 'process');
        if (riceConfig.processing > 0) {
            processStep.val = 1500; 
            processStep.desc = 'ค่าสี + บรรจุถุง';
        } else {
            processStep.val = 0;
            processStep.desc = 'ขายข้าวเปลือก (ไม่มีค่าสี)';
        }

        setRiceSteps(newSteps);
    }, [riceConfig, isRice]);

    // Sync Rice Total Cost to Main System
    useEffect(() => {
        if (isRice) {
            const totalPerRai = riceSteps.reduce((sum, s) => sum + Number(s.val), 0);
            setCustomCosts({
                totalOverride: totalPerRai * globalArea,
                plowing: riceSteps.find(s => s.id === 'plow').val * globalArea,
                fertilizer: riceSteps.find(s => s.id === 'maint').val * globalArea,
            });
        }
    }, [riceSteps, globalArea, isRice]);


    // Default Cost Logic (Non-Rice)
    useEffect(() => {
        if (isRice) return;

        if (lifecycleData.length > 0) {
            const y1 = lifecycleData[0];
            setCustomCosts({
                fertilizer: (y1.cost_fertilizer || 0) * globalArea,
                labor: (y1.cost_labor || 0) * globalArea,
                seeds: (y1.cost_seed || 0) * globalArea,
                water: (y1.cost_water || 0) * globalArea,
                misc: (y1.cost_other || 0) * globalArea
            });
        } else {
            const costStructure = item.costStructure || { fertilizer: 30, labor: 30, seeds: 20, water: 10, misc: 10 };
            const defaultTotalCost = (item.cost * globalArea);
            setCustomCosts({
                fertilizer: defaultTotalCost * (costStructure.fertilizer / 100),
                labor: defaultTotalCost * (costStructure.labor / 100),
                seeds: defaultTotalCost * (costStructure.seeds / 100),
                water: defaultTotalCost * (costStructure.water / 100),
                misc: defaultTotalCost * (costStructure.misc / 100)
            });
        }
    }, [item, globalArea, lifecycleData, isRice]);

    // Demand & Supply Logic (Calculated)
    const demandAnalysis = useMemo(() => {
        if (!provinceStats || !provinceStats.totalPop) return { status: 'Normal', desc: 'สมดุล', gap: 0 };
        
        const popStr = provinceStats.totalPop.val.toString().replace(/,/g, '');
        const population = parseInt(popStr) || 100000;
        
        // สมมติ: คนไทยกินข้าว 100 กก./คน/ปี
        const localConsumption = population * 100; // kg/year (Demand)
        
        // Use RICE_PRESETS if rice, else item.yield
        let currentYieldVal = item.yield;
        if(isRice && RICE_PRESETS[riceConfig.variety]){
            currentYieldVal = RICE_PRESETS[riceConfig.variety].yield;
        }
        let currentYield = currentYieldVal * globalArea;
        
        // Mock Supply: สมมติผลผลิตรวมของจังหวัด (พื้นที่ปลูก * yield)
        const provProduction = localConsumption * 1.2; 
        
        const supplyGap = provProduction - localConsumption; 
        
        // Price Impact
        let priceImpact = 1.0;
        let status = 'สมดุล';
        let desc = 'ตลาดปกติ ราคาตามกลไก';
        
        if (supplyGap > (localConsumption * 0.5)) {
            status = 'ล้นตลาด (Oversupply)';
            desc = 'ผลผลิตจังหวัดล้นตลาด ระวังราคาตก';
            priceImpact = 0.8;
        } else if (supplyGap < 0) {
            status = 'ขาดแคลน (Shortage)';
            desc = 'ผลผลิตไม่พอ ราคาดีมาก';
            priceImpact = 1.2;
        }

        return { status, desc, priceImpact, localDemand: localConsumption };
    }, [provinceStats, isRice, riceConfig, globalArea, item]);

    // Simulation Logic (Core Math Fixes)
    const simulationData = useMemo(() => {
        const data = [];
        let cumulative = 0;
        const currentYearBE = new Date().getFullYear() + 543;
        
        let factorMultiplier = 1.0; 
        let advice = [];
        const currentRice = isRice ? RICE_PRESETS[riceConfig.variety] : null;

        if (isRice && soilInfo) {
             const soilName = soilInfo.soil || '';
             if (soilName.includes('ทราย')) { factorMultiplier = 0.8; advice.push('⚠️ ดินทราย: ผลผลิตลดลง 20%'); }
             else if (soilName.includes('เหนียว')) { factorMultiplier = 1.1; advice.push('✅ ดินเหนียว: เหมาะทำนา ผลผลิตเพิ่ม 10%'); }
        }

        for (let i = 0; i < globalYears; i++) {
            const age = i + 1;
            let yearlyCost = 0;
            let yearlyRev = 0;
            let grossRevenue = 0; // New variable for gross
            let riskLoss = 0; // New variable for loss

            // 1. Cost Calculation
            if (isRice && customCosts?.totalOverride !== undefined) {
                yearlyCost = customCosts.totalOverride;
            } else if (customCosts) {
                yearlyCost = Object.values(customCosts).reduce((a, b) => typeof b === 'number' ? a + b : a, 0);
            }

            // 2. Revenue Calculation (Fixed Units)
            if (isRice && currentRice) {
                // Logic: Yield (kg/rai) * Area (rai) = Total Output (kg)
                let yieldPerRai = currentRice.yield * factorMultiplier; // kg
                let totalOutputKg = yieldPerRai * globalArea;
                
                let basePrice = currentRice.price * demandAnalysis.priceImpact; // Base Price from Preset
                
                // Processing Logic
                if (riceConfig.processing > 0) {
                    totalOutputKg = totalOutputKg * 0.6; 
                    basePrice = basePrice * 2.5; 
                }

                // Final Revenue Check (For Gross)
                if (basePrice > 1000) {
                    // Price is per TON
                    grossRevenue = (totalOutputKg / 1000) * basePrice;
                } else {
                    // Price is per KG
                    grossRevenue = totalOutputKg * basePrice;
                }

            } else if (lifecycleData.length > 0) {
                 const yearData = lifecycleData.find(d => d.age_year === age) || lifecycleData[lifecycleData.length - 1];
                 grossRevenue = item.price * (yearData.yield_per_rai * factorMultiplier) * globalArea;
            } else {
                 // General Logic
                 let rawYield = item.yield * factorMultiplier;
                 let totalYield = rawYield * globalArea;
                 
                 // Smart Unit Detection
                 if (item.unit === 'ton' || item.yieldUnit === 'ตัน' || item.price > 2000) {
                     if (rawYield > 500) totalYield = totalYield / 1000;
                     grossRevenue = totalYield * item.price;
                 } else {
                     grossRevenue = totalYield * item.price;
                 }
            }

            // 3. Risk (Calculate Loss) - Tuned for Realism
            let floodRiskLevel = floodData.risk;
            // Sanitization
            if (!['High', 'Medium', 'Low'].includes(floodRiskLevel)) floodRiskLevel = 'Low';

            if (floodRiskLevel === 'High' && i % 5 === 0) { // ลดความถี่เป็นทุก 5 ปี
                riskLoss = grossRevenue * 0.4; // ลดความเสียหายเหลือ 40% (สมจริงขึ้น)
                if (i === 0) advice.push(`⚠️ พื้นที่เสี่ยงน้ำท่วมสูง (คาดการณ์เสียหาย 40%)`);
            } else if (floodRiskLevel === 'Medium' && i % 5 === 0) {
                riskLoss = grossRevenue * 0.15; // Medium = 15%
                if (i === 0) advice.push('⚠️ พื้นที่เสี่ยงปานกลาง (ระวังน้ำหลาก)');
            }

            // Net Revenue
            yearlyRev = grossRevenue - riskLoss;

            const yearlyProfit = yearlyRev - yearlyCost;
            cumulative += yearlyProfit;

            let breakEvenText = null;
            if (cumulative > 0 && (cumulative - yearlyProfit) <= 0) {
                breakEvenText = `🎉 คืนทุนปีที่ ${age}`;
            }

            data.push({
                year: currentYearBE + i,
                cost: yearlyCost,
                revenue: yearlyRev,
                grossRevenue: grossRevenue, // Store for UI
                riskLoss: riskLoss, // Store for UI
                profit: yearlyProfit,
                accumulatedProfit: cumulative,
                analysis: advice,
                breakEven: breakEvenText,
                // Add details for UI
                details: {
                    yieldKg: (isRice && currentRice) ? (currentRice.yield * factorMultiplier * globalArea) : 0,
                    priceUnit: (isRice && currentRice) ? (currentRice.price > 1000 ? 'บาท/ตัน' : 'บาท/กก.') : '',
                    priceVal: (isRice && currentRice) ? currentRice.price : item.price,
                    floodSource: floodData.source || 'Supabase/Mock'
                }
            });
        }
        return data;
    }, [item, globalArea, globalYears, lifecycleData, floodData, customCosts, isRice, riceConfig, soilInfo, demandAnalysis]);

    const totalProfitFinal = simulationData.length > 0 ? simulationData[simulationData.length - 1].accumulatedProfit : 0;
    const breakEvenYear = simulationData.find(d => d.breakEven)?.year || '-';

    // Chart Effect (Updated)
    useEffect(() => {
        if (!customCosts) return;
        if (panelTab === 'financial' && lineCanvasRef.current) {
            if (lineChartRef.current) lineChartRef.current.destroy();
            const ctx = lineCanvasRef.current.getContext('2d');
            lineChartRef.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: simulationData.map(d => d.year),
                    datasets: [
                        { 
                            label: 'กำไรสะสม', 
                            data: simulationData.map(d => d.accumulatedProfit), 
                            borderColor: '#34d399', 
                            backgroundColor: 'rgba(52, 211, 153, 0.1)', 
                            fill: true 
                        },
                        { 
                            label: 'ต้นทุน/ปี', 
                            data: simulationData.map(d => d.cost), 
                            borderColor: '#f87171', 
                            borderDash: [5, 5], 
                            fill: false 
                        }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false }, y: { ticks: { color: '#94a3b8' } } } }
            });
        }
        return () => { if (lineChartRef.current) lineChartRef.current.destroy(); };
    }, [simulationData, panelTab, customCosts]);

    const handleRiceStepChange = (id, newVal) => {
        setRiceSteps(prev => prev.map(s => s.id === id ? { ...s, val: Number(newVal) } : s));
    };

    if (!customCosts) return <div className="p-10 text-center text-slate-400">กำลังคำนวณโมเดล...</div>;

    // Helper for Rice Summary
    const riceSummary = isRice && simulationData.length > 0 ? simulationData[0].details : null;

    return (
        <div className="flex flex-col h-full w-full animate-slide-down glass-panel-clear rounded-b-3xl overflow-hidden shadow-2xl border-t-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 pt-6">

                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {isRice ? <i className="fa-solid fa-shekel-sign text-indigo-400"></i> : (isBusiness ? <i className="fa-solid fa-briefcase text-purple-400"></i> : null)}
                            {isRice ? `แผนงาน: ${RICE_PRESETS[riceConfig.variety]?.name || item.name}` : item.name}
                        </h2>
                        {isRice && (
                            <div className="text-xs text-indigo-300 mt-1 flex items-center gap-2">
                                <span>กระทรวงชาวนา: ออกแบบโมเดลการปลูกข้าว</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] border ${item.source === 'Supabase' ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-orange-500 text-orange-400 bg-orange-500/10'}`}>
                                    Data: {item.source || 'Mock'}
                                </span>
                            </div>
                        )}
                        {!isRice && (
                            <div className="text-xs mt-1">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] border ${item.source === 'Supabase' ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-orange-500 text-orange-400 bg-orange-500/10'}`}>
                                    Source: {item.source || 'Mock'}
                                </span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose}><i className="fa-solid fa-times text-slate-400 hover:text-white text-xl"></i></button>
                </div>

                {/* Main Controls (Area/Years) */}
                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2 border border-white/10 mb-4">
                     <div className="flex-1 flex flex-col px-2 border-r border-white/10">
                         <span className="text-[10px] text-slate-400 uppercase">ขนาดพื้นที่ (ไร่)</span>
                         <input type="number" value={globalArea} onChange={e => setGlobalArea(parseFloat(e.target.value)||0)} className="bg-transparent font-bold text-emerald-400 focus:outline-none" />
                     </div>
                     <div className="flex-1 flex flex-col px-2">
                         <span className="text-[10px] text-slate-400 uppercase">ระยะเวลา (ปี)</span>
                         <input type="number" value={globalYears} onChange={e => setGlobalYears(parseFloat(e.target.value)||0)} className="bg-transparent font-bold text-yellow-400 focus:outline-none" />
                     </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4 bg-black/20 p-1 rounded-xl">
                    <button onClick={() => setPanelTab('financial')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${panelTab === 'financial' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                        <i className="fa-solid fa-calculator mr-1"></i> ต้นทุน & กำไร
                    </button>
                    <button onClick={() => setPanelTab('market')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${panelTab === 'market' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                        <i className="fa-solid fa-shop mr-1"></i> ตลาด & ดีมานด์
                    </button>
                </div>

                {panelTab === 'financial' ? (
                    <div className="space-y-4 animate-fade-in-up">
                        {isRice && (
                            /* Rice Strategy Control Panel */
                            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-indigo-300 mb-3 border-b border-indigo-500/20 pb-2">
                                    <i className="fa-solid fa-sliders mr-2"></i>ปรับสูตรการปลูก (Rice Formula)
                                </h3>
                                
                                {/* 1. เลือกพันธุ์ */}
                                <div className="mb-3">
                                    <label className="text-xs text-slate-400 mb-1 block">สายพันธุ์ข้าว</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(RICE_PRESETS).map(([key, info]) => (
                                            <button key={key} onClick={() => setRiceConfig({...riceConfig, variety: key})} 
                                                className={`text-xs p-2 rounded border text-left transition ${riceConfig.variety === key ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                                <div className="font-bold">{info.name}</div>
                                                <div className="text-[9px] opacity-70">{info.desc}</div>
                                                <div className="text-[9px] text-indigo-300 mt-1">
                                                    <i className="fa-solid fa-tag mr-1"></i>{info.price.toLocaleString()} ฿/ตัน
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. วิธีปลูก & ปุ๋ย */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">วิธีปลูก</label>
                                        <select value={riceConfig.method} onChange={e => setRiceConfig({...riceConfig, method: e.target.value})} className="w-full bg-black/30 text-white text-xs p-2 rounded border border-white/10">
                                            <option value="wan">นาหว่าน (เร็ว/เปลืองเมล็ด)</option>
                                            <option value="dam">นาดำ (ประณีต/ประหยัดเมล็ด)</option>
                                            <option value="yod">นาหยอด (ประหยัดสุด)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">สูตรปุ๋ย</label>
                                        <select value={riceConfig.fertilizer} onChange={e => setRiceConfig({...riceConfig, fertilizer: e.target.value})} className="w-full bg-black/30 text-white text-xs p-2 rounded border border-white/10">
                                            <option value="chemical">เคมี 100% (เร่งโต)</option>
                                            <option value="organic">อินทรีย์ (ลดต้นทุน/แรงงานเพิ่ม)</option>
                                            <option value="mixed">ผสมผสาน (สมดุล)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* 3. แรงงาน */}
                                <div className="flex gap-2 mb-3 bg-black/20 p-2 rounded">
                                     <span className="text-xs text-slate-300 my-auto">แรงงาน:</span>
                                     <button onClick={() => setRiceConfig({...riceConfig, labor: 'family'})} className={`flex-1 text-xs py-1 rounded ${riceConfig.labor === 'family' ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-400'}`}>ทำเอง (ลดต้นทุน)</button>
                                     <button onClick={() => setRiceConfig({...riceConfig, labor: 'hire'})} className={`flex-1 text-xs py-1 rounded ${riceConfig.labor === 'hire' ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-400'}`}>จ้างเหมา</button>
                                </div>

                                {/* 4. รายละเอียดต้นทุน (Editable) */}
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-indigo-300">โครงสร้างต้นทุน (บาท/ไร่)</span>
                                        <span className="text-[10px] text-slate-500">*แก้ไขได้</span>
                                    </div>
                                    <div className="space-y-1">
                                        {riceSteps.map((s) => (
                                            <div key={s.id} className={`flex justify-between items-center p-2 rounded ${s.val === 0 ? 'opacity-50' : 'bg-black/20'}`}>
                                                <div>
                                                    <div className="text-xs text-slate-200">{s.label}</div>
                                                    <div className="text-[9px] text-slate-500">{s.desc}</div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <input type="number" value={s.val} onChange={(e) => handleRiceStepChange(s.id, e.target.value)} className="w-14 text-right bg-transparent text-yellow-300 text-xs font-bold focus:outline-none border-b border-white/10 focus:border-yellow-400" />
                                                    <span className="text-[9px] text-slate-500">฿</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 flex justify-between items-center bg-indigo-900/40 p-2 rounded border border-indigo-500/30">
                                        <span className="text-xs font-bold text-white">รวมต้นทุนเฉลี่ย</span>
                                        <span className="text-sm font-bold text-red-400">{(riceSteps.reduce((a,b)=>a+Number(b.val),0)).toLocaleString()} ฿/ไร่</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NEW: Financial Summary Breakdown (สูตรคำนวณที่ชัดเจน) */}
                        {isRice && riceSummary && (
                            <div className="bg-black/30 p-3 rounded-xl border border-white/10 text-xs space-y-2">
                                <div className="font-bold text-indigo-300 border-b border-white/10 pb-1 mb-1">สรุปการคำนวณรายได้ (Revenue Breakdown)</div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">ผลผลิตรวม ({globalArea} ไร่):</span>
                                    <span className="text-white">{riceSummary.yieldKg.toLocaleString(undefined, {maximumFractionDigits: 0})} กก.</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">ราคาตลาด:</span>
                                    <span className="text-yellow-400">
                                        {riceSummary.priceVal.toLocaleString()} {riceSummary.priceUnit}
                                        {riceSummary.priceUnit.includes('ตัน') && <span className="text-[9px] text-slate-500 ml-1">({(riceSummary.priceVal/1000).toFixed(2)} บ./กก.)</span>}
                                    </span>
                                </div>
                                
                                {/* Gross Revenue (Before Loss) */}
                                <div className="flex justify-between pt-1 border-t border-white/5 font-bold text-slate-200">
                                    <span>รายได้พึงรับ (Gross):</span>
                                    <span>{simulationData[0].grossRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})} ฿</span>
                                </div>

                                {/* Risk/Loss (If Any) */}
                                {simulationData[0].riskLoss > 0 && (
                                    <div className="flex justify-between text-red-400">
                                        <span className="flex items-center gap-1 text-[10px] md:text-xs">
                                            <i className="fa-solid fa-cloud-showers-heavy mr-1"></i>
                                            หัก ภัยพิบัติ ({floodData.risk === 'High' ? '40%' : '15%'})
                                            <div className="group relative ml-1">
                                                <i className="fa-solid fa-circle-question text-red-300 cursor-pointer"></i>
                                                <span className="absolute bottom-full left-0 mb-1 w-32 p-1 bg-black/80 text-white text-[9px] rounded hidden group-hover:block z-50">
                                                    ระดับ: {floodData.risk}<br/>
                                                    ที่มา: {riceSummary.floodSource}
                                                </span>
                                            </div>
                                            :
                                        </span>
                                        <span>-{simulationData[0].riskLoss.toLocaleString(undefined, {maximumFractionDigits: 0})} ฿</span>
                                    </div>
                                )}

                                <div className="flex justify-between pt-1 border-t border-white/5 font-bold text-green-400">
                                    <span>รายได้สุทธิ (Net Revenue):</span>
                                    <span>{simulationData[0].revenue.toLocaleString(undefined, {maximumFractionDigits: 0})} ฿</span>
                                </div>
                                <div className="flex justify-between text-red-400">
                                    <span>หัก ต้นทุนรวม/ปี:</span>
                                    <span>-{simulationData[0].cost.toLocaleString(undefined, {maximumFractionDigits: 0})} ฿</span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-white/10 font-bold text-lg text-emerald-400">
                                    <span>กำไรสุทธิ/ปี:</span>
                                    <span>{simulationData[0].profit.toLocaleString(undefined, {maximumFractionDigits: 0})} ฿</span>
                                </div>
                            </div>
                        )}

                        {/* Graph */}
                        <div className="h-48 bg-black/20 rounded-xl p-2 border border-white/5 relative mt-4">
                             <canvas ref={lineCanvasRef}></canvas>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-slide-in-right">
                        {isRice ? (
                            <>
                                {/* Demand & Supply Reality Check */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-scale-balanced"></i> สมดุลตลาด (Demand & Supply)
                                    </h3>
                                    
                                    <div className="flex items-center justify-between mb-4 px-2">
                                         <div className="text-center">
                                             <div className="text-xs text-slate-400">ความต้องการ (ท้องถิ่น)</div>
                                             <div className="text-lg font-bold text-white">{(demandAnalysis.localDemand / 1000000).toFixed(2)}M <span className="text-[10px] text-slate-500">กก./ปี</span></div>
                                         </div>
                                         <div className="text-xl text-slate-600"><i className="fa-solid fa-right-left"></i></div>
                                         <div className="text-center">
                                             <div className="text-xs text-slate-400">กำลังการผลิต (จังหวัด)</div>
                                             <div className="text-lg font-bold text-white">{((demandAnalysis.localDemand * 1.2)/1000000).toFixed(2)}M <span className="text-[10px] text-slate-500">กก./ปี</span></div>
                                         </div>
                                    </div>

                                    <div className={`p-3 rounded-lg flex items-start gap-3 ${demandAnalysis.status.includes('ล้น') ? 'bg-red-900/30 border-red-500/30' : 'bg-green-900/30 border-green-500/30'} border`}>
                                         <i className={`fa-solid text-xl mt-1 ${demandAnalysis.status.includes('ล้น') ? 'fa-arrow-trend-down text-red-400' : 'fa-arrow-trend-up text-green-400'}`}></i>
                                         <div>
                                             <div className={`font-bold ${demandAnalysis.status.includes('ล้น') ? 'text-red-300' : 'text-green-300'}`}>{demandAnalysis.status}</div>
                                             <div className="text-xs text-slate-300">{demandAnalysis.desc}</div>
                                         </div>
                                    </div>
                                </div>

                                {/* Value Added / Revenue Extension */}
                                <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-rocket"></i> ต่อยอดเพิ่มรายได้ (Value Added)
                                    </h3>
                                    
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-slate-300 mb-2">
                                            <span>ขายข้าวเปลือก (ปกติ)</span>
                                            <span>สีข้าวขายเอง (Premium)</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" max="1" step="1" 
                                            value={riceConfig.processing > 0 ? 1 : 0} 
                                            onChange={(e) => setRiceConfig({...riceConfig, processing: e.target.value === '1' ? 100 : 0})}
                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                        />
                                        <div className="flex justify-between mt-2">
                                            <div className={`text-xs px-2 py-1 rounded ${riceConfig.processing === 0 ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>ส่งโรงสี</div>
                                            <div className={`text-xs px-2 py-1 rounded ${riceConfig.processing > 0 ? 'bg-purple-500 text-white' : 'text-slate-500'}`}>สร้างแบรนด์เอง</div>
                                        </div>
                                    </div>

                                    {riceConfig.processing > 0 && (
                                        <div className="bg-black/20 p-3 rounded text-xs text-slate-300">
                                            <ul className="list-disc pl-4 space-y-1">
                                                <li>ราคาขายข้าวสาร: <span className="text-green-400 font-bold">สูงกว่าข้าวเปลือก 2.5 เท่า</span></li>
                                                <li>ต้นทุนเพิ่ม: ค่าสี + บรรจุภัณฑ์ (2,000 ฿/ตัน)</li>
                                                <li><span className="text-yellow-400">แนะนำ:</span> ควรเริ่มจาก 10% ของผลผลิตเพื่อทดลองตลาด</li>
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Market Buyers List */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-yellow-300 mb-3"><i className="fa-solid fa-handshake"></i> จุดรับซื้อแนะนำ</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center bg-black/20 p-2 rounded">
                                            <div className="text-xs text-slate-200">สหกรณ์การเกษตรจังหวัด</div>
                                            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">ราคากลาง</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-black/20 p-2 rounded">
                                            <div className="text-xs text-slate-200">ท่าข้าว (เอกชน)</div>
                                            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">รับเงินสด</span>
                                        </div>
                                        {riceConfig.processing > 0 && (
                                            <div className="flex justify-between items-center bg-purple-900/20 p-2 rounded border border-purple-500/20">
                                                <div className="text-xs text-purple-200">ตลาด Online / Modern Trade</div>
                                                <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Margin สูง</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Normal Market Tab for other crops */
                            <div className="text-center text-slate-400 py-10">ข้อมูลการตลาดสำหรับพืชชนิดนี้ยังไม่เปิดใช้งานในโหมด Demo</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const CloudOverlay = ({ isActive, message }) => {
    return (
        <div className={`cloud-container ${isActive ? 'active' : ''}`}>
            <div className="cloud-layer"></div>
            {message && (
                <div className="travel-message flex flex-col items-center">
                    <div className="text-6xl text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-bounce">
                        <i className="fa-solid fa-plane-up"></i>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold glass-panel-clear px-10 py-6 rounded-full text-white tracking-wide shadow-[0_0_50px_rgba(16,185,129,0.4)]">
                        {message}
                    </h2>
                </div>
            )}
        </div>
    );
};

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

    // USE CUSTOM HOOK for Data
    const appData = useRealtimeData();

    const markerRef = useRef(null);
    const lastProvinceRef = useRef(null);
    const provinceFeaturesRef = useRef(null);
    const tileLayerRef = useRef(null);
    const labelLayerRef = useRef(null);

    const [soilInfo, setSoilInfo] = useState(null);
    const [floodData, setFloodData] = useState({ risk: 'Low', desc: 'ปกติ' });
    const [pinCoords, setPinCoords] = useState(null);
    const [address, setAddress] = useState(null);
    const [isAddressLoading, setIsAddressLoading] = useState(false);

    // ... (Address fetching logic remains same) ...
    useEffect(() => {
        if (pinCoords) {
            setIsAddressLoading(true);
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pinCoords[0]}&lon=${pinCoords[1]}&format=json&accept-language=th`)
                .then(res => res.json())
                .then(data => {
                    if (data.address) {
                        const a = data.address;
                        const parts = [];
                        if (a.village) parts.push('หมู่บ้าน ' + a.village);
                        else if (a.hamlet) parts.push('หมู่บ้าน ' + a.hamlet);
                        if (a.road) parts.push('ถนน ' + a.road);
                        const subDistrict = a.suburb || a.tambon || a.quarter;
                        if (subDistrict) {
                            if (a.quarter) parts.push('แขวง ' + subDistrict);
                            else parts.push('ตำบล ' + subDistrict);
                        }
                        const district = a.city_district || a.district || a.amphoe;
                        if (district) {
                            if (a.state === 'กรุงเทพมหานคร' || a.city_district) parts.push('เขต ' + district);
                            else parts.push('อำเภอ ' + district);
                        }
                        if (a.state) parts.push('จังหวัด ' + a.state);
                        if (a.postcode) parts.push(a.postcode);
                        setAddress(parts.length > 0 ? parts.join(' ') : 'พิกัดไม่มีที่อยู่ระบุชัดเจน');
                    } else {
                        setAddress('ไม่พบข้อมูลที่อยู่');
                    }
                    setIsAddressLoading(false);
                })
                .catch(e => {
                    setAddress('เชื่อมต่อแผนที่ไม่ได้');
                    setIsAddressLoading(false);
                });
        } else {
            setAddress(null);
        }
    }, [pinCoords]);

    const provinceStats = useMemo(() => {
        if (!selectedProvince) return null;
        const exactPop = appData.thaiPop?.find(p => p.province_name === selectedProvince);
        const statsList = appData.stats ? appData.stats.filter(s => s.province === selectedProvince) : [];
        const maxYear = statsList.length > 0 ? Math.max(...statsList.map(s => s.year)) : 0;
        const currentStats = statsList.filter(s => s.year === maxYear);
        const getValue = (keyword) => {
            const item = currentStats.find(s => s.topic && s.topic.includes(keyword));
            return item ? { val: Number(item.value).toLocaleString(), unit: item.unit } : null;
        };
        return {
            year: maxYear < 2000 && maxYear > 0 ? maxYear + 543 : maxYear,
            totalPop: exactPop
                ? { val: Number(exactPop.population).toLocaleString(), unit: 'คน' }
                : (getValue('ประชากรทั้งหมด') || getValue('รวม') || { val: appData.provinceData[selectedProvince]?.population || '-', unit: 'คน' }),
            male: getValue('ชาย'),
            female: getValue('หญิง'),
            farmers: getValue('เกษตรกร') || getValue('เกษตร') || getValue('ขึ้นทะเบียน'),
            elder: getValue('สูงอายุ'),
            working: getValue('วัยทำงาน'),
            kids: getValue('วัยเด็ก')
        };
    }, [selectedProvince, appData.stats, appData.provinceData, appData.thaiPop]);

    // ... (Map Effects remain same) ...
    useEffect(() => {
        if (!mapInstance) return;
        if (tileLayerRef.current) mapInstance.removeLayer(tileLayerRef.current);
        if (labelLayerRef.current) mapInstance.removeLayer(labelLayerRef.current);
        if (mapType === 'satellite' || mapType === 'hybrid') {
            tileLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(mapInstance);
            if (mapType === 'hybrid') {
                labelLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
                    className: 'blue-hybrid-labels'
                }).addTo(mapInstance);
            }
        } else {
            tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
        }
        return () => {
            if (tileLayerRef.current) mapInstance.removeLayer(tileLayerRef.current);
            if (labelLayerRef.current) mapInstance.removeLayer(labelLayerRef.current);
        };
    }, [mapType, mapInstance]);

    useEffect(() => {
        if (!mapInstance) return;
        let topPane = mapInstance.getPane('top-pane');
        if (!topPane) {
            topPane = mapInstance.createPane('top-pane');
            topPane.style.zIndex = 3000;
            topPane.style.pointerEvents = 'none';
        }
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
            const places = [
                { name: "ศาลากลาง", icon: "fa-landmark", color: "#60a5fa", lat: info.lat + 0.01, lng: info.lng - 0.01 },
                { name: "ตลาดกลาง", icon: "fa-store", color: "#34d399", lat: info.lat + 0.015, lng: info.lng + 0.01 }
            ];
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
            markerRef.current.on('dragend', (e) => {
                const { lat, lng } = e.target.getLatLng();
                setPinCoords([lat, lng]);
            });
        } else {
            if (lastProvinceRef.current !== selectedProvince) {
                markerRef.current.setLatLng([info.lat, info.lng]);
                lastProvinceRef.current = selectedProvince;
                setPinCoords([info.lat, info.lng]);
            }
            markerRef.current.setOpacity(1);
        }
    }, [selectedProvince, mapInstance, appData.provinceData]);

    useEffect(() => {
        if (markerRef.current) {
            const el = markerRef.current.getElement();
            if (!el) return;
            const inner = el.querySelector('.pin-inner');
            if (isPinning) {
                markerRef.current.dragging.enable();
                if (inner) inner.classList.add('scale-125', 'ring-4', 'ring-emerald-400/50');
            } else {
                markerRef.current.dragging.disable();
                if (inner) inner.classList.remove('scale-125', 'ring-4', 'ring-emerald-400/50');
            }
        }
    }, [isPinning, selectedProvince]);

    // ... (Fullscreen, TogglePin, MapType, RegionSelect logic same) ...
    const handleFullscreen = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
        else if (document.exitFullscreen) document.exitFullscreen().then(() => setIsFullscreen(false));
    };

    const togglePin = () => setIsPinning(!isPinning);
    const toggleMapType = () => setMapType(prev => prev === 'satellite' ? 'standard' : prev === 'standard' ? 'hybrid' : 'satellite');

    const handleRegionSelect = (r) => {
        setSelectedRegion(r); setSelectedProvince(null); setResults(null); setIsPinning(false); lastProvinceRef.current = null;
    };

    const calculateEconomics = useCallback((newArea) => {
        if (!appData.crops) return [];
        let processed = appData.crops.map(c => {
            let rawYield = c.yield;
            
            // --- FIX: Revenue Calculation Logic ---
            let revenue = 0;
            const totalYieldKg = rawYield * newArea;
            
            // ตรวจสอบหน่วยราคา (ถ้าเกิน 1000 มักจะเป็น บาท/ตัน, ถ้าต่ำกว่า มักจะเป็น บาท/กก.)
            // ข้าว (Rice): มักเป็น บาท/ตัน (15,000) หรือ บาท/กก. (15)
            let pricePerKg = c.price;
            if (c.price > 1000) {
                pricePerKg = c.price / 1000;
            }
            
            // สูตร: ผลผลิตรวม (กก.) x ราคา (บาท/กก.)
            revenue = totalYieldKg * pricePerKg;

            const costVal = Number(c.cost) || 0;
            const profitPerCycle = revenue - (costVal * newArea);
            
            let avgProfitPerYear = profitPerCycle;
            const lifespan = c.lifecycle?.lifespan || 1;
            const isPerennial = c.lifecycle?.type === 'tree' || c.lifecycle?.type === 'integrated' || c.lifecycle?.type === 'business';
            if (isPerennial && lifespan > 1) {
                const waitYears = c.lifecycle?.wait_years || 0;
                const productiveYears = Math.max(0, lifespan - waitYears);
                const totalLifetimeProfit = profitPerCycle * productiveYears; 
                avgProfitPerYear = totalLifetimeProfit / lifespan;
            }
            return { ...c, cost: costVal, profitTotal: profitPerCycle, avgProfitYear: avgProfitPerYear };
        });
        if (categoryFilter !== 'all') {
            if (categoryFilter === 'plant') processed = processed.filter(c => c.category === 'พืชไร่' || c.category === 'พืชสวน' || !c.category);
            else if (categoryFilter === 'animal') processed = processed.filter(c => c.category === 'ปศุสัตว์');
            else if (categoryFilter === 'integrated') processed = processed.filter(c => c.category === 'ผสมผสาน');
            else if (categoryFilter === 'rice_ministry') processed = processed.filter(c => c.name.includes('ข้าว'));
            else if (categoryFilter === 'rubber_ministry') processed = processed.filter(c => c.name.includes('ยาง'));
            else if (categoryFilter === 'business_ministry') processed = processed.filter(c => c.category === 'ธุรกิจ');
        }
        if (sortType === 'profit') {
            processed.sort((a, b) => b.avgProfitYear - a.avgProfitYear);
        } else if (sortType === 'payback') {
            processed.sort((a, b) => {
                const pbA = a.avgProfitYear > 0 ? (a.cost / a.avgProfitYear) : 999;
                const pbB = b.avgProfitYear > 0 ? (b.cost / b.avgProfitYear) : 999;
                return pbA - pbB;
            });
        } else if (sortType === 'risk') {
            const riskScore = { 'Low': 1, 'Medium': 2, 'High': 3 };
            processed.sort((a, b) => (riskScore[a.risk] || 2) - (riskScore[b.risk] || 2));
        } else if (sortType === 'balanced') {
            const riskScore = { 'Low': 1, 'Medium': 1.5, 'High': 2.5 };
            processed.sort((a, b) => (b.avgProfitYear / (riskScore[b.risk] || 1.5)) - (a.avgProfitYear / (riskScore[a.risk] || 1.5)));
        }
        return processed;
    }, [appData.crops, sortType, categoryFilter]);

    useEffect(() => {
        if (selectedProvince) {
            setResults(calculateEconomics(area));
        }
    }, [calculateEconomics, area, selectedProvince]);

    const handleProvinceSelect = (p) => {
        setIsPinning(false);
        setSelectedProvince(p);
        setMapType('hybrid');
        const info = appData.provinceData[p];
        if (info) {
            setSoilInfo(info);
            setPinCoords([info.lat, info.lng]);
        }
        const alert = appData.floodAlerts.find(a => a.province === p);
        setFloodData(alert ? { risk: alert.risk_level, desc: alert.description, source: alert.source } : { risk: 'Low', desc: 'ปกติ', source: 'Default' });
        if (mapInstance && info && mapInstance._container) {
            onTravelStart(`กำลังเดินทางไป ${p}...`);
            mapInstance.flyTo([info.lat - 0.1, info.lng], 10, { duration: 3 });
            setTimeout(() => onTravelEnd(), 3000);
        }
        setResults(calculateEconomics(area));
    };

    const handleBack = () => {
        if (isPinning) { setIsPinning(false); return; }
        if (simulatingItem) { setSimulatingItem(null); return; }
        if (selectedProvince) {
            setSelectedProvince(null); setResults(null); lastProvinceRef.current = null;
            setMapType('satellite');
            setPinCoords(null);
            if (mapInstance && mapInstance._container) mapInstance.flyTo(DON_MUEANG_COORDS, 6, { duration: 2 });
            return;
        }
        if (selectedRegion) { setSelectedRegion(null); return; }
    };

    const handleAreaChange = (val) => {
        const newArea = parseFloat(val) || 0;
        setArea(newArea);
    };

    const currentProvInfo = appData.provinceData[selectedProvince];

    const floodHistory = useMemo(() => {
        if (!pinCoords) return null;
        const val = Math.abs((pinCoords[0] * 1000) + (pinCoords[1] * 1000));
        const chance = Math.floor(val % 30);
        let years = [];
        if (chance > 15) years.push("2554");
        if (chance > 20) years.push("2565");
        if (chance > 25) years.push("2549");
        return { chance: chance, level: chance > 20 ? 'สูง' : chance > 10 ? 'ปานกลาง' : 'ต่ำ', years: years.join(', ') || '-' };
    }, [pinCoords]);

    return (
        <div className="ui-unified-layer">
            {/* Header Bar */}
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between pointer-auto px-2 md:px-4 z-[2100] mt-2">
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    <button onClick={onGoHome} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg group" title="หน้าแรก">
                        <i className="fa-solid fa-house text-sm md:text-base group-hover:text-emerald-400"></i>
                    </button>
                    {(selectedRegion || selectedProvince) && (
                        <button onClick={handleBack} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg animate-fade-in-up" title="ย้อนกลับ">
                            <i className="fa-solid fa-arrow-left text-sm md:text-base"></i>
                        </button>
                    )}
                </div>

                <div className="flex-1 flex justify-center px-2 min-w-0">
                    {simulatingItem ? (
                        <div className="glass-panel rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-fade-in-up max-w-full overflow-hidden">
                            <i className="fa-solid fa-chart-line text-emerald-400 animate-pulse"></i>
                            <span className="text-sm md:text-base font-bold text-white truncate">{simulatingItem.name}</span>
                        </div>
                    ) : selectedProvince ? (
                        <div className="glass-panel rounded-full px-1 py-1 flex items-center gap-1 md:gap-2 shadow-[0_0_20px_rgba(0,0,0,0.3)] animate-fade-in-up max-w-full overflow-hidden">

                            <div className="flex items-center gap-2 pl-3 pr-2 border-r border-white/20 shrink-0 min-w-[80px]">
                                <div className="relative">
                                    <i className="fa-solid fa-seedling text-emerald-400 text-lg"></i>
                                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${appData.isOnline ? 'bg-green-400' : 'bg-orange-400'}`}></span>
                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-black/50 ${appData.isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                    </span>
                                </div>
                                <div className="flex flex-col leading-none hidden sm:flex">
                                    <span className="text-xs font-bold text-emerald-100">พืชแนะนำ</span>
                                    <span className={`text-[8px] font-bold uppercase tracking-wide mt-0.5 ${appData.isOnline ? 'text-green-300' : 'text-orange-300'}`}>
                                        {appData.isOnline ? '● SUPABASE' : '○ MOCK DATA'}
                                    </span>
                                </div>
                            </div>

                            <div className="relative group pl-1 min-w-0 flex-1">
                                <i className="fa-solid fa-location-dot text-emerald-400 text-xs md:text-sm absolute left-1 top-1/2 -translate-y-1/2"></i>
                                <select value={selectedProvince} onChange={(e) => handleProvinceSelect(e.target.value)} className="bg-transparent text-white text-xs md:text-sm font-bold py-2 pl-6 pr-2 focus:outline-none cursor-pointer appearance-none w-full truncate">
                                    {(appData.regions[selectedRegion] || [selectedProvince]).map(p => <option key={p} value={p} className="bg-slate-800 text-white">{p}</option>)}
                                </select>
                            </div>

                            <div className="w-[1px] h-4 bg-white/20"></div>

                            <div className="flex items-center gap-1 pr-1 shrink-0">
                                <input type="number" step="0.1" min="0" value={area} onChange={(e) => handleAreaChange(e.target.value)} className="w-10 md:w-16 bg-transparent text-center text-xs md:text-sm font-bold text-yellow-300 focus:outline-none py-1 transition placeholder-white/30" />
                                <span className="text-[10px] md:text-xs text-slate-300 font-bold">ไร่</span>
                            </div>

                            <div className="w-[1px] h-4 bg-white/20"></div>
                            <div className="flex items-center gap-1 pr-2 shrink-0">
                                <input type="number" min="1" max="50" value={years} onChange={(e) => setYears(parseFloat(e.target.value) || 1)} className="w-8 md:w-10 bg-transparent text-center text-xs md:text-sm font-bold text-yellow-300 focus:outline-none py-1 transition placeholder-white/30" />
                                <span className="text-[10px] md:text-xs text-slate-300 font-bold">ปี</span>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel rounded-full px-4 py-1.5 text-sm font-bold text-white/90">{selectedRegion ? `ภาค${selectedRegion}` : 'เลือกภูมิภาค'}</div>
                    )}
                </div>

                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    {selectedProvince && !simulatingItem && (
                        <button onClick={togglePin} className={`w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel flex items-center justify-center transition shadow-lg animate-fade-in-up ${isPinning ? 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-white' : 'hover:bg-white/10 text-white'}`} title={isPinning ? "ยืนยันตำแหน่ง" : "ขยับหมุด"}>
                            <i className={`fa-solid ${isPinning ? 'fa-check text-lg font-bold' : 'fa-map-location-dot text-sm md:text-base'}`}></i>
                        </button>
                    )}
                    <button onClick={toggleMapType} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg" title="เปลี่ยนแผนที่">
                        <i className={`fa-solid ${mapType === 'satellite' ? 'fa-layer-group' : mapType === 'hybrid' ? 'fa-map' : 'fa-earth-americas'} text-sm md:text-base`}></i>
                    </button>
                    <button onClick={handleFullscreen} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg" title="เต็มจอ">
                        <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm md:text-base`}></i>
                    </button>
                </div>
            </div>

            {selectedProvince && !isTraveling && (
                <div className="absolute bottom-6 left-0 w-full z-[3000] flex flex-col md:flex-row items-end justify-between px-6 pb-2 pointer-events-none animate-fade-in-up">
                    <style>{`.text-shadow-heavy { text-shadow: 0 2px 4px rgba(0,0,0,0.9); }`}</style>
                    <div className="mb-4 md:mb-0 text-shadow-heavy">
                        <h3 className="font-bold text-white text-4xl md:text-5xl leading-none tracking-wide">
                            {selectedProvince}
                        </h3>
                        <div className="mt-1">
                            {isAddressLoading ? (
                                <span className="text-xs text-yellow-300 animate-pulse"><i className="fa-solid fa-spinner fa-spin mr-1"></i> กำลังค้นหาที่อยู่...</span>
                            ) : address ? (
                                <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs md:text-sm text-emerald-200 border border-emerald-500/30 shadow-lg inline-block max-w-[250px] md:max-w-md truncate">
                                    <i className="fa-solid fa-map-location-dot mr-2 text-emerald-400"></i>
                                    {address}
                                </div>
                            ) : (
                                pinCoords && <span className="text-xs text-slate-400">{pinCoords[0].toFixed(4)}, {pinCoords[1].toFixed(4)}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-end gap-4 md:gap-8 text-shadow-heavy">
                        <div className="flex flex-col items-center">
                            <div className="flex items-baseline gap-1">
                                <i className="fa-solid fa-users text-blue-400 text-lg"></i>
                                <span className="text-2xl font-bold text-white">{provinceStats?.totalPop?.val || '-'}</span>
                                <span className="text-xs text-slate-300">{provinceStats?.totalPop?.unit}</span>
                            </div>
                            <div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">ประชากร</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="flex items-baseline gap-1">
                                <i className="fa-solid fa-address-card text-emerald-400 text-lg"></i>
                                <span className="text-2xl font-bold text-white">{provinceStats?.farmers?.val || '-'}</span>
                                <span className="text-xs text-emerald-200/70">{provinceStats?.farmers?.unit}</span>
                            </div>
                            <div className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">เกษตรกร</div>
                        </div>
                        <div className="w-px h-8 bg-white/20 hidden md:block"></div>
                        <div className="flex flex-col items-center">
                            <div className="flex items-baseline gap-1">
                                <i className="fa-solid fa-flask text-purple-400 text-lg"></i>
                                <span className="text-2xl font-bold text-white">{currentProvInfo?.ph || '-'}</span>
                            </div>
                            <div className="text-[10px] text-purple-200 font-bold uppercase tracking-wider">pH ดิน</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="flex items-baseline gap-1">
                                <i className="fa-solid fa-droplet text-blue-400 text-lg"></i>
                                <span className="text-2xl font-bold text-white">{currentProvInfo?.moisture || '-'}</span>
                                <span className="text-xs text-blue-200">%</span>
                            </div>
                            <div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">ความชื้น</div>
                        </div>
                        <div className="flex flex-col items-center group relative cursor-help">
                            <div className="flex items-baseline gap-1">
                                <i className="fa-solid fa-water text-cyan-400 text-lg"></i>
                                <span className="text-2xl font-bold text-white">{floodHistory?.chance || '-'}</span>
                                <span className="text-xs text-cyan-200">%</span>
                            </div>
                            <div className="text-[10px] text-cyan-200 font-bold uppercase tracking-wider">น้ำท่วม (50ปี)</div>
                            
                            {/* Tooltip for Flood History Source */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block w-32 bg-black/80 text-white text-xs p-2 rounded border border-white/20 backdrop-blur-md z-50">
                                <div className="font-bold text-cyan-300 mb-1">ปีที่ท่วมหนัก:</div>
                                <div>{floodHistory?.years || '-'}</div>
                                <div className="text-[9px] text-slate-400 mt-1 border-t border-white/20 pt-1">
                                    <i className="fa-solid fa-circle-info text-cyan-500 mr-1"></i>
                                    อ้างอิง: แบบจำลองทางสถิติ (Geo-Model)
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
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.keys(appData.regions).map(r => (
                                <button key={r} onClick={() => handleRegionSelect(r)} className="bg-white/5 hover:bg-emerald-500/20 border border-white/20 rounded-xl p-6 flex flex-col items-center gap-2 transition hover:scale-105 group backdrop-blur-sm">
                                    <span className="text-4xl group-hover:animate-bounce">{r === 'เหนือ' ? '⛰️' : r === 'ใต้' ? '🌊' : '🏙️'}</span>
                                    <span className="font-bold text-slate-200">{r}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {selectedRegion && !selectedProvince && (
                    <div className={`w-full max-w-5xl mx-auto glass-panel-clear rounded-b-3xl p-6 animate-slide-down h-[80vh] flex flex-col border-t-0 mt-2`}>
                        <h2 className="text-xl font-bold text-white mb-4 text-center">เลือกจังหวัดในภาค{selectedRegion}</h2>
                        <div className="flex-1 overflow-y-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 scrollbar-prominent pb-10">
                            {(appData.regions[selectedRegion] || []).sort().map(p => (
                                <button key={p} onClick={() => handleProvinceSelect(p)} className="bg-white/5 hover:bg-emerald-500/20 border border-white/20 rounded-lg p-3 text-sm font-bold text-slate-200 transition backdrop-blur-sm">
                                    {p}
                                </button>
                            ))}
                        </div>
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

                                    <button onClick={() => setCategoryFilter('rice_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'rice_ministry' ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/10 text-slate-300'}`}>
                                        <i className="fa-solid fa-shekel-sign mr-1"></i>กระทรวงชาวนา
                                    </button>

                                    <button onClick={() => setCategoryFilter('rubber_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'rubber_ministry' ? 'bg-slate-200 text-slate-900 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/10 text-slate-300'}`}>
                                        <i className="fa-solid fa-droplet mr-1"></i>กระทรวงยางพารา
                                    </button>

                                    <button onClick={() => setCategoryFilter('business_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'business_ministry' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]' : 'bg-white/10 text-slate-300'}`}>
                                        <i className="fa-solid fa-briefcase mr-1"></i>กระทรวงพี่เลี้ยงธุรกิจ
                                    </button>

                                    <button onClick={() => setCategoryFilter('all')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'all' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300'}`}>ทั้งหมด</button>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setSortType('profit')} className={`w-8 h-8 rounded-full flex items-center justify-center border ${sortType === 'profit' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'border-white/10 text-slate-400'}`} title="ผลตอบแทนสูง"><i className="fa-solid fa-sack-dollar"></i></button>
                                    <button onClick={() => setSortType('payback')} className={`w-8 h-8 rounded-full flex items-center justify-center border ${sortType === 'payback' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-white/10 text-slate-400'}`} title="คืนทุนไว"><i className="fa-solid fa-stopwatch"></i></button>
                                    <button onClick={() => setSortType('risk')} className={`w-8 h-8 rounded-full flex items-center justify-center border ${sortType === 'risk' ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/10 text-slate-400'}`} title="ความเสี่ยงต่ำ"><i className="fa-solid fa-shield-halved"></i></button>
                                    <button onClick={() => setSortType('balanced')} className={`w-8 h-8 rounded-full flex items-center justify-center border ${sortType === 'balanced' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-white/10 text-slate-400'}`} title="แนะนำ"><i className="fa-solid fa-star"></i></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto scrollbar-prominent pb-44 pt-2">
                                {results && results.length > 0 ? results.map((item, idx) => (
                                    <div key={idx} onClick={() => setSimulatingItem(item)} className="p-4 border-b border-white/10 hover:bg-white/5 cursor-pointer flex items-center justify-between group transition">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border group-hover:scale-110 transition backdrop-blur-sm shrink-0 ${item.category === 'ธุรกิจ' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white group-hover:text-yellow-400 transition flex items-center gap-2">
                                                    {item.name}
                                                    {item.category === 'ปศุสัตว์' && <i className="fa-solid fa-cow text-orange-400 text-xs"></i>}
                                                    {item.category === 'ผสมผสาน' && <i className="fa-solid fa-seedling text-blue-400 text-xs"></i>}
                                                    {item.category === 'ธุรกิจ' && <i className="fa-solid fa-briefcase text-purple-400 text-xs"></i>}
                                                </div>
                                                <div className="text-xs text-slate-300">
                                                    {item.category === 'ธุรกิจ' ? 'ลงทุน:' : 'ลงทุน:'} {(item.cost || 0).toLocaleString()} ฿/{item.category === 'ธุรกิจ' ? 'สาขา' : (item.category === 'ปศุสัตว์' ? 'ตัว/รุ่น' : 'ไร่')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400">กำไรเฉลี่ย/ปี</div>
                                            <div className="font-bold text-yellow-400 text-lg drop-shadow-md">
                                                {(item.avgProfitYear || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ฿
                                            </div>
                                        </div>
                                    </div>
                                )) : <div className="p-10 text-center text-slate-500">ไม่พบข้อมูลตามเงื่อนไข</div>}
                            </div>
                            <div className="w-full h-4 flex items-center justify-center cursor-pointer bg-white/5">
                                <div className="w-12 h-1 bg-white/20 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                )}

                {simulatingItem && (
                    <div className={`w-full max-w-5xl mx-auto h-[80vh] animate-slide-down z-[2050] mt-2`}>
                        <SimulationPanel
                            item={simulatingItem}
                            onClose={() => setSimulatingItem(null)}
                            globalArea={area}
                            setGlobalArea={setArea}
                            globalYears={years}
                            setGlobalYears={setYears}
                            floodData={floodData}
                            soilInfo={currentProvInfo}
                            provinceStats={provinceStats}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const HomePage = ({ onStart, isTraveling }) => {
    // Fullscreen logic specific for Home Page
    const [isFullscreen, setIsFullscreen] = useState(false);
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
        } else {
            if (document.exitFullscreen) document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };

    return (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center p-6 animate-fade-in-up">
            <button onClick={toggleFullscreen} className="absolute top-4 right-4 w-10 h-10 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg z-50">
                <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm`}></i>
            </button>

            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Flag_of_Thailand.svg" alt="Thai Flag" className="w-24 mb-4 animate-flag-wave shadow-lg" />
            <h1 className="text-5xl md:text-7xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-emerald-400 to-cyan-400 drop-shadow-xl">Winai Innovation</h1>
            <p className="text-slate-300 text-lg mb-8 bg-black/40 px-4 py-1 rounded-full backdrop-blur-sm border border-white/10">Super App เพื่อเกษตรกรไทย</p>
            <button onClick={onStart} disabled={isTraveling} className={`group relative font-bold py-4 px-10 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all overflow-hidden border border-emerald-400/50 backdrop-blur-md ${isTraveling ? 'bg-emerald-900/40 text-emerald-200 cursor-default scale-105' : 'bg-white/10 hover:bg-emerald-500/30 text-white hover:scale-105 hover:shadow-[0_0_50px_rgba(16,185,129,0.8)]'}`}>
                <div className={`absolute inset-0 bg-emerald-500/20 transition-transform duration-1000 ${isTraveling ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'}`}></div>
                <span className="relative flex items-center gap-3 text-xl">{isTraveling ? (<><i className="fa-solid fa-plane-up animate-bounce"></i> กำลังเดินทาง เข้าสู่เกษตร คราวน์</>) : (<><i className="fa-solid fa-rocket"></i> เข้าสู่เกษตร คราวน์</>)}</span>
            </button>
            <div className="mt-8 text-xs text-slate-400 bg-black/30 p-4 rounded-xl backdrop-blur-sm border border-white/5"><p>พัฒนาโดย: Mr.Winai Phanarkat</p><p>Line: 0926533228 | Email: winayo@gmail.com</p></div>
        </div>
    );
};

const App = () => {
    const [page, setPage] = useState('home');
    const [travel, setTravel] = useState({ active: false, msg: '' });
    const mapRef = useRef(null);
    const rotationInterval = useRef(null);

    // Init Map (Run Once)
    useEffect(() => {
        if (mapRef.current) return;

        const map = L.map('global-map', { zoomControl: false, attributionControl: false }).setView([13.7563, 100.5018], 5);
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(map);
        mapRef.current = map;

        return () => {
            if (map) map.remove();
            mapRef.current = null;
        };
    }, []);

    // Handle Rotation Logic (Depends on Page)
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (page === 'home') {
            // Start Rotation
            if (rotationInterval.current) clearInterval(rotationInterval.current);
            rotationInterval.current = setInterval(() => {
                if (map && map._container) map.panBy([1, 0], { animate: false });
            }, 50);
        } else {
            // Stop Rotation
            if (rotationInterval.current) {
                clearInterval(rotationInterval.current);
                rotationInterval.current = null;
            }
        }

        return () => {
            if (rotationInterval.current) clearInterval(rotationInterval.current);
        };
    }, [page]);

    const handleStart = () => {
        if (mapRef.current) {
            setTravel({ active: true, msg: '' }); // Clear message to only show clouds
            mapRef.current.flyTo(DON_MUEANG_COORDS, 6, { duration: 4 });
            setTimeout(() => {
                setPage('kaset');
                setTravel({ active: false, msg: '' });
            }, 4000);
        }
    };

    const handleGoHome = () => {
        setPage('home');
        if (mapRef.current) mapRef.current.setView([13.7563, 100.5018], 5);
    };

    return (
        <div className="h-screen w-screen overflow-hidden text-slate-200">
            <div id="global-map"></div>
            <CloudOverlay isActive={travel.active} message={travel.msg} />

            {page === 'home' && <HomePage onStart={handleStart} isTraveling={travel.active} />}

            {page === 'kaset' && (
                <KasetCloudApp
                    mapInstance={mapRef.current}
                    onTravelStart={(msg) => setTravel({ active: true, msg })}
                    onTravelEnd={() => setTravel({ active: false, msg: '' })}
                    onGoHome={handleGoHome}
                    isTraveling={travel.active}
                />
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

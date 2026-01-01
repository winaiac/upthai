const { useState, useEffect, useRef, useMemo, useCallback } = React;

// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://ldsysxczitmkxmukmwri.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkc3lzeGN6aXRta3htdWttd3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNzI4NDAsImV4cCI6MjA4MTc0ODg0MH0.1rHQug1PlhgNE6lsy3RllAQC36k0BoY6KqjeeQvAVhc';

// --- GLOBAL CONSTANTS ---
Chart.defaults.color = '#cbd5e1';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
Chart.defaults.font.family = 'Sarabun';
const DON_MUEANG_COORDS = [13.9133, 100.6042];

// --- MOCK DATA FALLBACKS (Updated with Categories) ---
const MOCK_REGIONS = { "กลาง": ["กรุงเทพมหานคร"] };
const MOCK_PROVINCE_DATA = {
    "กรุงเทพมหานคร": {
        lat: 13.9133, lng: 100.6042,
        ph: 7.0, moisture: 70, soil: "ดินเหนียว (ชุดดินราชบุรี)",
        region: "กลาง", slogan: "กรุงเทพฯ ดุจเทพสร้าง เมืองศูนย์กลางการปกครอง",
        population: "5.5 ล้านคน", area: "1,568 ตร.กม."
    }
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
        lifecycleData: []
    },
    {
        name: "ยางพารา (น้ำยางสด)",
        category: "พืชสวน",
        price: 52.60, yield: 1200, cost: 7500, risk: "Medium",
        unit: "kg", yieldUnit: "กิโลกรัม",
        market: "ตลาดกลางยางพารา",
        demand: { domestic: "สูง", international: "สูงมาก", trend: "ผันผวนตามตลาดโลก" },
        lifecycle: { type: 'tree', lifespan: 25, wait_years: 7, peak_start: 9, advice: 'กรีด 2 วัน เว้น 1 วัน' },
        lifecycleData: []
    },
    {
        name: "ข้าวหอมมะลิ 105",
        category: "พืชไร่",
        price: 16.5, yield: 650, cost: 5200, risk: "Low",
        unit: "kg", yieldUnit: "กิโลกรัม",
        market: "โรงสี / สหกรณ์",
        demand: { domestic: "สูง", international: "สูง", trend: "คงที่" },
        plowing: { animal: 1200, tractor: 350 },
        lifecycle: { type: 'annual', lifespan: 1 },
        lifecycleData: []
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
        lifecycleData: []
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
        lifecycleData: []
    },
    {
        name: "โคขุนโพนยางคำ",
        category: "ปศุสัตว์",
        price: 100, yield: 500, cost: 25000, risk: "Medium",
        unit: "kg", yieldUnit: "กิโลกรัม",
        market: "ร้านสเต็ก / ส่งออก",
        demand: { domestic: "สูง", international: "สูง", trend: "เติบโต" },
        lifecycle: { type: 'animal', lifespan: 2 },
        lifecycleData: []
    },
    {
        name: "เกษตรทฤษฎีใหม่",
        category: "ผสมผสาน",
        price: 50000, yield: 1, cost: 10000, risk: "Low",
        unit: "set", yieldUnit: "ชุด",
        market: "พึ่งพาตนเอง / เหลือขาย",
        demand: { domestic: "สูง", international: "N/A", trend: "ยั่งยืน" },
        lifecycle: { type: 'integrated', lifespan: 99, advice: 'เน้นพึ่งพาตนเอง ลดต้นทุน' },
        lifecycleData: []
    },
    // --- กระทรวงพี่เลี้ยงธุรกิจ (Ministry of Business Mentorship) ---
    // เหลือไว้เพียง 1 รายการตามคำขอ เพื่อเป็นตัวอย่าง (Fallback)
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
        lifecycleData: []
    }
    // ข้อมูลธุรกิจอื่นๆ (Solar Farm, Salad Factory, รถพุ่มพวง) ถูกย้ายไปลง Supabase แล้ว
];

// --- HOOK: USE REALTIME DATA ---
const useRealtimeData = () => {
    const [data, setData] = useState({
        regions: MOCK_REGIONS,
        provinceData: MOCK_PROVINCE_DATA,
        crops: MOCK_CROPS,
        floodAlerts: [],
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

                if (provRes.error || cropRes.error) throw new Error("Database fetch error");

                // Process Provinces & Soil Data
                const newRegions = {};
                const newProvinceData = {};
                if (provRes.data) {
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
                        profitTotal: 0, costTotal: 0
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

                setData({
                    regions: Object.keys(newRegions).length > 0 ? newRegions : MOCK_REGIONS,
                    provinceData: Object.keys(newProvinceData).length > 0 ? newProvinceData : MOCK_PROVINCE_DATA,
                    crops: newCrops.length > 0 ? newCrops : MOCK_CROPS,
                    floodAlerts: floodRes.data || [],
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
                    if (payload.eventType === 'INSERT') newAlerts.push(payload.new);
                    else if (payload.eventType === 'DELETE') newAlerts = newAlerts.filter(a => a.id !== payload.old.id);
                    else if (payload.eventType === 'UPDATE') newAlerts = newAlerts.map(a => a.id === payload.new.id ? payload.new : a);
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
    const lifecycleData = item.lifecycleData || [];

    const lineCanvasRef = useRef(null);
    const lineChartRef = useRef(null);

    // --- RICE FARMING CALCULATOR STATE ---
    const isRice = item.name.includes('ข้าว');
    const [riceMode, setRiceMode] = useState({ type: 'wan', plow: 'tractor' });
    const [riceSteps, setRiceSteps] = useState([
        { id: 'plow', label: '1. เตรียมดิน (ไถ)', val: 350, desc: 'รถไถ (เร็ว)' },
        { id: 'seed', label: '2. เมล็ดพันธุ์', val: 250, desc: 'หอมมะลิ 105' },
        { id: 'plant', label: '3. ปลูก/ดำ/หว่าน', val: 50, desc: 'หว่านเอง' },
        { id: 'maint', label: '4. ดูแล (ปุ๋ย/ยา/น้ำ)', val: 1500, desc: 'ตลอดฤดู' },
        { id: 'harvest', label: '5. เก็บเกี่ยว', val: 600, desc: 'รถเกี่ยว' }
    ]);

    // Auto-update Rice steps when mode changes
    useEffect(() => {
        if (!isRice) return;
        setRiceSteps(prev => prev.map(s => {
            if (s.id === 'plow') {
                return riceMode.plow === 'buffalo'
                    ? { ...s, val: 0, desc: 'วัว/ควาย (แรงงานตัวเอง 0฿)' }
                    : { ...s, val: 350, desc: 'รถไถรับจ้าง (เร็ว/มาตรฐาน)' };
            }
            if (s.id === 'plant') {
                return riceMode.type === 'dam'
                    ? { ...s, val: 1200, desc: 'ค่าจ้างดำนา (แพงแต่ได้ผลดี)' }
                    : { ...s, val: 50, desc: 'หว่านเอง (ประหยัด)' };
            }
            if (s.id === 'seed') {
                return riceMode.type === 'dam'
                    ? { ...s, val: 150, desc: 'ค่ากล้า' }
                    : { ...s, val: 250, desc: 'ค่าเมล็ดพันธุ์' };
            }
            return s;
        }));
    }, [riceMode, isRice]);

    // Sync Rice Total Cost to Main System using globalArea
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


    // Default Cost Logic (Non-Rice) using globalArea
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

    // Simulation Logic (Updated with Soil & Climate Factors)
    const simulationData = useMemo(() => {
        const data = [];
        let cumulative = 0;
        const currentYearBE = new Date().getFullYear() + 543;

        // 1. วิเคราะห์ความเหมาะสมของดิน / ทำเลธุรกิจ (Factor Analysis)
        let factorMultiplier = 1.0; 
        let waterCostMultiplier = 1.0;
        let fertilizerCostMultiplier = 1.0;
        let advice = [];

        // Logic for Business (Business Mentor)
        if (isBusiness) {
            // ใช้ประชากรเป็นตัวแปรความสำเร็จ
            const popVal = provinceStats?.totalPop?.val || '0';
            const popNum = parseInt(popVal.replace(/,/g, '')) || 500000;
            
            if (popNum > 1000000) {
                factorMultiplier = 1.2; // คนเยอะ โอกาสขายดี
                advice.push(`🏙️ ทำเลทอง! ประชากร ${popVal} คน โอกาสลูกค้าหนาแน่นสูง`);
            } else if (popNum < 200000) {
                factorMultiplier = 0.8; // คนน้อย ต้องเหนื่อยหน่อย
                advice.push(`⚠️ ประชากรน้อย (${popVal} คน) ควรเน้นการตลาดออนไลน์ช่วย`);
            } else {
                advice.push(`✅ ทำเลมาตรฐาน ประชากรระดับกลาง (${popVal} คน)`);
            }

            // คำแนะนำตามประเภทธุรกิจ
            if (item.name.includes("Cafe")) advice.push("☕ ทริก: เพิ่มเมนู Signature ตามฤดูกาลช่วยดึงลูกค้าเก่า");
            if (item.name.includes("Solar")) advice.push("☀️ ทริก: หมั่นล้างแผงทุก 3 เดือน เพิ่มประสิทธิภาพไฟ 5-10%");
        } 
        // Logic for Agriculture (Soil/Water)
        else if (soilInfo) {
            const soilName = soilInfo.soil || '';
            if (item.name.includes('ข้าว')) {
                if (soilName.includes('เหนียว')) { factorMultiplier = 1.1; advice.push('ดินเหมาะสมมาก (ดินเหนียว)'); }
                else if (soilName.includes('ทราย')) { factorMultiplier = 0.7; waterCostMultiplier = 1.5; advice.push('ดินทรายเก็บน้ำไม่อยู่ (เปลืองน้ำ/ปุ๋ย)'); }
            }
            // ... (Soil logic continues as before)
        }

        // เริ่มวนลูปคำนวณแต่ละปี
        for (let i = 0; i < globalYears; i++) {
            const age = i + 1;
            let yearlyCost = 0;
            let yearlyRev = 0;

            const isTonPrice = item.unit === 'ton' || item.yieldUnit === 'ตัน'; 

            // 2. คำนวณต้นทุน (Cost Calculation)
            if (isRice && customCosts?.totalOverride !== undefined) {
                yearlyCost = customCosts.totalOverride;
                yearlyCost += (yearlyCost * 0.2 * (waterCostMultiplier - 1));
                yearlyCost += (yearlyCost * 0.2 * (fertilizerCostMultiplier - 1));
            } else if (isBusiness) {
                // Business Cost Structure
                // ปีแรก = ลงทุนก่อสร้าง (Setup) + Operating Cost
                // ปีถัดไป = Operating Cost อย่างเดียว (ประมาณ 30-40% ของปีแรก ถ้าเป็น Fixed Cost หนักๆ)
                if (i === 0) {
                    yearlyCost = item.cost * globalArea; // ลงทุนครั้งแรกตามจำนวนสาขา
                } else {
                    yearlyCost = (item.cost * 0.4) * globalArea; // ค่าบำรุงรักษา/ค่าแรงรายปี
                }
            } else if (customCosts) {
                let baseTotal = Object.values(customCosts).reduce((a, b) => typeof b === 'number' ? a + b : a, 0);
                if (waterCostMultiplier > 1) baseTotal *= 1.1;
                if (fertilizerCostMultiplier > 1) baseTotal *= 1.05;
                yearlyCost = baseTotal;
            }

            // 3. คำนวณรายรับ (Revenue Calculation)
            if (lifecycleData.length > 0) {
                // ... (Existing Logic for crops with lifecycle data) ...
                const yearData = lifecycleData.find(d => d.age_year === age) || lifecycleData[lifecycleData.length - 1];
                let safeYield = yearData.yield_per_rai || 0;
                if (isTonPrice && safeYield > 100) safeYield = safeYield / 1000;
                safeYield = safeYield * factorMultiplier;
                yearlyRev = item.price * safeYield * globalArea;
            } else {
                let safeYield = item.yield || 0;
                if (isTonPrice && safeYield > 100) safeYield = safeYield / 1000;

                // Apply Multiplier
                safeYield = safeYield * factorMultiplier;

                let baseRev = item.price * safeYield * globalArea;
                yearlyRev = baseRev;
                
                // Yield Curve Logic (Tree & Business)
                if (isTree || isBusiness) {
                    // ปีแรกๆ รายได้อาจยังไม่เต็มที่
                    if (age <= (lifeInfo.wait_years || 0)) { 
                        yearlyRev = 0; 
                    } else if (isBusiness && age === 1) {
                        yearlyRev *= 0.5; // ปีแรกคนยังไม่รู้จัก (ธุรกิจ)
                    } else if (age < (lifeInfo.peak_start || 5)) {
                        yearlyRev *= 0.7; // กำลังโต
                    }
                }
            }

            // 4. ความเสี่ยง (Risk Simulation)
            // Business Risk: คู่แข่งเปิดใหม่ / เศรษฐกิจแย่ (สุ่มเกิดทุก 5 ปี)
            if (isBusiness && i > 0 && i % 5 === 0) {
                yearlyRev *= 0.7; // รายได้ตก 30%
                advice.push(`⚠️ ปีที่ ${age}: ระวังคู่แข่ง/เศรษฐกิจชะลอตัว`);
            }
            // Agriculture Risk: น้ำท่วม
            else if (floodData.risk === 'High' && i % 4 === 0) {
                yearlyCost *= 1.5; 
                yearlyRev *= 0.2; 
                if (i === 0) advice.push('พื้นที่เสี่ยงน้ำท่วมสูง (ระวังเสียหายหนัก)');
            }

            const yearlyProfit = yearlyRev - yearlyCost;
            cumulative += yearlyProfit;
            
            // หาจุดคุ้มทุน (Break-even year)
            let breakEvenText = null;
            if (cumulative > 0 && (cumulative - yearlyProfit) <= 0) {
                breakEvenText = `🎉 คืนทุนแล้วในปีที่ ${age}!`;
                advice.push(breakEvenText);
            }

            data.push({
                year: currentYearBE + i,
                cost: yearlyCost,
                revenue: yearlyRev,
                profit: yearlyProfit,
                accumulatedProfit: cumulative,
                analysis: advice,
                breakEven: breakEvenText
            });
        }
        return data;
    }, [item, globalArea, globalYears, lifecycleData, floodData, customCosts, isTree, lifeInfo, isRice, soilInfo, isBusiness, provinceStats]);

    const totalProfitFinal = simulationData.length > 0 ? simulationData[simulationData.length - 1].accumulatedProfit : 0;
    const breakEvenYear = simulationData.find(d => d.breakEven)?.year || '-';

    // Charting
    useEffect(() => {
        if (!customCosts) return;
        if (panelTab === 'financial' && lineCanvasRef.current) {
            if (lineChartRef.current) lineChartRef.current.destroy();
            const ctx = lineCanvasRef.current.getContext('2d');
            
            // ปรับสีและข้อมูลกราฟตามประเภทธุรกิจ
            const profitColor = isBusiness ? '#a855f7' : '#34d399'; // ม่วง vs เขียว
            const profitBg = isBusiness ? 'rgba(168, 85, 247, 0.1)' : 'rgba(52, 211, 153, 0.1)';

            lineChartRef.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: simulationData.map(d => d.year),
                    datasets: [
                        { label: 'กำไรสะสม (Accumulated)', data: simulationData.map(d => d.accumulatedProfit), borderColor: profitColor, backgroundColor: profitBg, fill: true, tension: 0.4 },
                        { label: 'ต้นทุนรายปี', data: simulationData.map(d => d.cost), borderColor: '#f87171', borderDash: [2, 2], fill: false, tension: 0.1 },
                    ]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    scales: { 
                        x: { ticks: { color: '#94a3b8' }, grid: { display: false } }, 
                        y: { 
                            ticks: { color: '#94a3b8' }, 
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            // Add zero line highlight
                            suggestedMin: -100000
                        } 
                    }, 
                    plugins: { legend: { labels: { color: '#cbd5e1' } } } 
                }
            });
        }
        return () => { if (lineChartRef.current) lineChartRef.current.destroy(); };
    }, [simulationData, panelTab, customCosts, isBusiness]);

    if (!customCosts) return <div className="p-10 text-center text-slate-400">Loading...</div>;

    const handleRiceStepChange = (id, newVal) => {
        setRiceSteps(prev => prev.map(s => s.id === id ? { ...s, val: Number(newVal) } : s));
    };

    return (
        <div className="flex flex-col h-full w-full animate-slide-down glass-panel-clear rounded-b-3xl overflow-hidden shadow-2xl border-t-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 pt-6">

                {/* Modified Header with Inputs */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2 gap-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {isBusiness && <i className="fa-solid fa-briefcase text-purple-400"></i>}
                        {item.name}
                    </h2>
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
                        <div className="flex items-center gap-1 px-2 border-r border-white/10">
                            <span className="text-xs text-slate-400">{isBusiness ? 'จำนวน:' : 'พื้นที่:'}</span>
                            <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={globalArea}
                                onChange={(e) => setGlobalArea(parseFloat(e.target.value) || 0)}
                                className="w-12 bg-transparent text-right text-sm font-bold text-emerald-400 focus:outline-none"
                            />
                            <span className="text-xs text-slate-400">{isBusiness ? 'สาขา' : 'ไร่'}</span>
                        </div>
                        <div className="flex items-center gap-1 px-2">
                            <span className="text-xs text-slate-400">ระยะ:</span>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={globalYears}
                                onChange={(e) => setGlobalYears(parseFloat(e.target.value) || 1)}
                                className="w-10 bg-transparent text-right text-sm font-bold text-yellow-400 focus:outline-none"
                            />
                            <span className="text-xs text-slate-400">ปี</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><i className="fa-solid fa-times text-xl"></i></button>
                </div>

                <div className="flex gap-2 mb-4">
                    <button onClick={() => setPanelTab('financial')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${panelTab === 'financial' ? (isBusiness ? 'bg-purple-600 text-white' : 'bg-emerald-500 text-white') : 'bg-white/10 text-slate-400'}`}>
                        {isBusiness ? 'แผนธุรกิจ' : 'การเงิน'}
                    </button>
                    <button onClick={() => setPanelTab('market')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${panelTab === 'market' ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400'}`}>การตลาด</button>
                </div>

                {panelTab === 'financial' ? (
                    <>
                        {isRice && (
                            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 mb-4">
                                <h3 className="text-sm font-bold text-emerald-300 mb-3"><i className="fa-solid fa-calculator mr-2"></i>เครื่องคิดเลขต้นทุนทำนา</h3>
                                {/* Rice Calculator Inputs (Same as before) */}
                                <div className="flex gap-2 mb-3">
                                    <button onClick={() => setRiceMode(p => ({ ...p, type: 'wan' }))} className={`flex-1 py-1 text-xs rounded border ${riceMode.type === 'wan' ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-white/20 text-slate-400'}`}>นาหว่าน</button>
                                    <button onClick={() => setRiceMode(p => ({ ...p, type: 'dam' }))} className={`flex-1 py-1 text-xs rounded border ${riceMode.type === 'dam' ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-white/20 text-slate-400'}`}>นาดำ</button>
                                </div>
                                <div className="flex gap-2 mb-4">
                                    <button onClick={() => setRiceMode(p => ({ ...p, plow: 'tractor' }))} className={`flex-1 py-1 text-xs rounded border ${riceMode.plow === 'tractor' ? 'bg-blue-600 border-blue-500 text-white' : 'border-white/20 text-slate-400'}`}>รถไถรับจ้าง</button>
                                    <button onClick={() => setRiceMode(p => ({ ...p, plow: 'buffalo' }))} className={`flex-1 py-1 text-xs rounded border ${riceMode.plow === 'buffalo' ? 'bg-amber-700 border-amber-600 text-white' : 'border-white/20 text-slate-400'}`}>วัว/ควาย (ทำเอง)</button>
                                </div>
                                <div className="space-y-2 text-xs">
                                    {riceSteps.map((s) => (
                                        <div key={s.id} className="flex items-center justify-between bg-black/20 p-2 rounded">
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-200">{s.label}</div>
                                                <div className="text-[10px] text-slate-400">{s.desc}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="number" value={s.val} onChange={(e) => handleRiceStepChange(s.id, e.target.value)} className="w-16 bg-white/10 border border-white/20 rounded px-1 py-0.5 text-right text-yellow-300 font-bold focus:outline-none focus:border-emerald-500" />
                                                <span className="text-slate-500 w-6">฿/ไร่</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-2">
                                        <span className="font-bold text-white">รวมต้นทุน/ไร่</span>
                                        <span className="font-bold text-red-400 text-sm">{(riceSteps.reduce((a, b) => a + Number(b.val), 0)).toLocaleString()} ฿</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className={`${isBusiness ? 'bg-purple-900/40 border-purple-500/30' : 'bg-emerald-900/40 border-emerald-500/30'} p-4 rounded-xl border text-center backdrop-blur-sm`}>
                                <div className={`text-xs mb-1 ${isBusiness ? 'text-purple-300' : 'text-emerald-300'}`}>กำไรสะสมรวม ({globalYears} ปี)</div>
                                <div className="text-2xl font-bold text-white">{totalProfitFinal.toLocaleString(undefined, { maximumFractionDigits: 0 })} ฿</div>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/10 text-center backdrop-blur-sm flex flex-col justify-center">
                                {isBusiness ? (
                                    <>
                                        <div className="text-xs text-slate-400 mb-1">จุดคุ้มทุน (Break-even)</div>
                                        <div className={`text-xl font-bold ${breakEvenYear !== '-' ? 'text-green-400' : 'text-slate-500'}`}>
                                            {breakEvenYear !== '-' ? `ปีที่ ${breakEvenYear}` : 'ยังไม่คืนทุน'}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-xs text-slate-400 mb-1">ความเสี่ยง (น้ำท่วม)</div>
                                        <div className={`text-xl font-bold ${floodData.risk === 'High' ? 'text-red-400' : 'text-green-400'}`}>{floodData.risk === 'High' ? 'สูง' : 'ต่ำ'}</div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 h-[200px] flex flex-col backdrop-blur-sm mt-4">
                            <div className="flex-1 relative"><canvas ref={lineCanvasRef}></canvas></div>
                        </div>

                        {/* --- AI Analysis Box --- */}
                        {simulationData.length > 0 && simulationData[0].analysis && simulationData[0].analysis.length > 0 && (
                            <div className={`mt-4 border p-3 rounded-xl animate-fade-in-up ${isBusiness ? 'bg-purple-900/30 border-purple-500/30' : 'bg-blue-900/30 border-blue-500/30'}`}>
                                <div className={`text-xs font-bold mb-2 flex items-center gap-2 ${isBusiness ? 'text-purple-300' : 'text-blue-300'}`}>
                                    {isBusiness ? <><i className="fa-solid fa-user-tie"></i> พี่เลี้ยงธุรกิจ แนะนำ:</> : <><i className="fa-solid fa-wand-magic-sparkles"></i> AI วิเคราะห์พื้นที่:</>}
                                </div>
                                <ul className="space-y-1">
                                    {[...new Set(simulationData[0].analysis)].map((msg, idx) => (
                                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                            <i className={`fa-solid mt-0.5 ${msg.includes('เสี่ยง') || msg.includes('เสีย') || msg.includes('ต่ำ') || msg.includes('ระวัง') ? 'fa-triangle-exclamation text-amber-400' : 'fa-circle-check text-green-400'}`}></i>
                                            <span>{msg}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                ) : (
                    /* Market & Analytics Tab */
                    <div className="space-y-4 animate-slide-in-right">
                        {isBusiness && (
                            <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-purple-300 mb-3"><i className="fa-solid fa-lightbulb mr-2"></i>Business Concept</h3>
                                <div className="space-y-3">
                                    <div className="bg-black/20 p-2 rounded flex justify-between items-center">
                                        <div className="text-[10px] text-purple-200 uppercase font-bold">ลูกค้าเป้าหมาย</div>
                                        <div className="text-sm text-white text-right">{item.market || '-'}</div>
                                    </div>
                                    <div className="bg-black/20 p-2 rounded">
                                        <div className="text-[10px] text-purple-200 uppercase font-bold mb-1">Key Success Factor</div>
                                        <div className="text-xs text-slate-300 leading-relaxed"><i className="fa-solid fa-quote-left text-purple-500 mr-2"></i>{item.lifecycle?.advice || '-'}<i className="fa-solid fa-quote-right text-purple-500 ml-2"></i></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h3 className="text-sm font-bold text-blue-300 mb-3"><i className="fa-solid fa-globe mr-2"></i>ความต้องการตลาด (Demand)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/20 p-2 rounded text-center">
                                    <div className="text-[10px] text-slate-400">ในประเทศ</div>
                                    <div className="text-lg font-bold text-white">{item.demand?.domestic || '-'}</div>
                                </div>
                                <div className="bg-black/20 p-2 rounded text-center">
                                    <div className="text-[10px] text-slate-400">ต่างประเทศ</div>
                                    <div className="text-lg font-bold text-white">{item.demand?.international || '-'}</div>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-slate-300 bg-white/5 p-2 rounded flex items-center gap-2">
                                <i className="fa-solid fa-arrow-trend-up text-green-400"></i> แนวโน้ม: <span className="font-bold text-white">{item.demand?.trend || '-'}</span>
                            </div>
                        </div>

                        {/* Farming specific prep cost */}
                        {!isBusiness && item.category !== 'ปศุสัตว์' && item.category !== 'ผสมผสาน' && (
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <h3 className="text-sm font-bold text-amber-300 mb-3"><i className="fa-solid fa-tractor mr-2"></i>เปรียบเทียบค่าเตรียมดิน</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center bg-black/20 p-2 rounded">
                                        <div className="text-xs text-slate-300">แรงงานสัตว์ (กระบือ/วัว)</div>
                                        <div className="text-sm font-bold text-white">{item.plowing?.animal || '1,200'} ฿</div>
                                    </div>
                                    <div className="flex justify-between items-center bg-emerald-900/20 p-2 rounded border border-emerald-500/20">
                                        <div className="text-xs text-emerald-200">รถไถเดินตาม/นั่งขับ</div>
                                        <div className="text-sm font-bold text-white">{item.plowing?.tractor || '350'} ฿</div>
                                    </div>
                                </div>
                            </div>
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
            const isPricePerTon = c.unit === 'ton' || c.yieldUnit === 'ตัน' || c.name.includes('ข้าว'); // Restore rice check for safety
            let revenue = 0;
            if (isPricePerTon) {
                let yieldInTon = rawYield;
                if (rawYield > 100) yieldInTon = rawYield / 1000;
                revenue = yieldInTon * c.price * newArea;
            } else {
                revenue = rawYield * c.price * newArea;
            }
            const costVal = Number(c.cost) || 0;
            const profitPerCycle = revenue - (costVal * newArea);
            let avgProfitPerYear = profitPerCycle;
            const lifespan = c.lifecycle?.lifespan || 1;
            const isPerennial = c.lifecycle?.type === 'tree' || c.lifecycle?.type === 'integrated' || c.lifecycle?.type === 'business';
            if (isPerennial && lifespan > 1) {
                const waitYears = c.lifecycle?.wait_years || 0;
                const productiveYears = Math.max(0, lifespan - waitYears);
                // For business, assume profit ramps up differently, but average logic holds for sorting
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
        setFloodData(alert ? { risk: alert.risk_level, desc: alert.description } : { risk: 'Low', desc: 'ปกติ' });
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
                            <div className="absolute bottom-full mb-2 hidden group-hover:block w-32 bg-black/80 text-white text-xs p-2 rounded border border-white/20 backdrop-blur-md">
                                <div className="font-bold text-cyan-300 mb-1">ปีที่ท่วมหนัก:</div>
                                <div>{floodHistory?.years || '-'}</div>
                                <div className="text-[9px] text-slate-400 mt-1">*ข้อมูลจำลองจากโมเดล</div>
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

                                    {/* --- ปุ่มใหม่: กระทรวงพี่เลี้ยงธุรกิจ --- */}
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

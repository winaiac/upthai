// --- script.js : Main Entry Point & Map Logic ---
// อัปเดตล่าสุด: FULL CODE 100% (ปรับสไตล์คำขวัญโปร่งใส ไม่เป็นฝ้า ค่อยๆ มา/จาง)

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// Import helpers & components from split files
const AppCore = window.AppCore || {};
const AppUI = window.AppUI || {};
const AppVideo = window.AppVideo || {}; 

const { useRealtimeData, normalizeThaiName, getBearing, DON_MUEANG_COORDS, MOCK_CROPS } = AppCore;
const { SimulationPanel, CloudOverlay, KnowledgeCenterModal, VideoGalleryModal } = AppUI;
const { getVideoKey, getVideos } = AppVideo;

// --- 1. KASET CLOUD APP COMPONENT ---
const KasetCloudApp = ({ mapInstance, onTravelStart, onTravelEnd, onGoHome, isTraveling, initialAction, initialConfig, onLocate }) => {
    // ... (State definitions)
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedProvince, setSelectedProvince] = useState(initialConfig?.province || null);
    const [area, setArea] = useState(initialConfig?.area || 1); 
    const [years, setYears] = useState(initialConfig?.years || 25); 
    const [results, setResults] = useState(null);
    const [simulatingItem, setSimulatingItem] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPinning, setIsPinning] = useState(false);
    const [mapType, setMapType] = useState('satellite');
    const [sortType, setSortType] = useState('profit');
    
    const [categoryFilter, setCategoryFilter] = useState(initialConfig?.category || 'rice_ministry');
    
    // States for Knowledge/Video Panels
    const [showKnowledgeCenter, setShowKnowledgeCenter] = useState(false);
    const [videoCategory, setVideoCategory] = useState(null); 
    const [isBlinking, setIsBlinking] = useState(false);
    const [isReadingBook, setIsReadingBook] = useState(false);

    // State สำหรับสภาพอากาศ
    const [weatherData, setWeatherData] = useState(null);
    const [expandWeather, setExpandWeather] = useState(false);

    // State สำหรับคำขวัญ (ควบคุม Animation ด้วย class)
    const [showSlogan, setShowSlogan] = useState(false);
    const [sloganClass, setSloganClass] = useState('opacity-0 translate-y-10'); // เริ่มต้นแบบซ่อน

    const appData = useRealtimeData ? useRealtimeData() : { provinceData: {}, regions: {}, crops: [] };
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
    const [isCopied, setIsCopied] = useState(false);

    // --- EFFECT: Handle Deep Linking ---
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.includes('video_cat=')) {
                const cat = hash.split('video_cat=')[1];
                if (cat) {
                    setVideoCategory(cat);
                    setSimulatingItem(null);
                    setShowKnowledgeCenter(false);
                }
            }
            else if (hash.includes('sim_item=')) {
                // Handled in App component usually, but kept here for safety
            }
            else if (!hash) {
                setVideoCategory(null);
            }
        };
        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleCloseVideo = () => {
        setVideoCategory(null);
        history.pushState("", document.title, window.location.pathname + window.location.search);
    };

    // ... (Effects and Handlers)
    useEffect(() => {
        if (!document.fullscreenElement) {
            setIsBlinking(true);
            const timer = setTimeout(() => setIsBlinking(false), 8000); 
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        if (initialAction === 'openKnowledgeCenter') {
            setShowKnowledgeCenter(true);
        }
    }, [initialAction]);

    // Handle Slogan Timer & Animation
    useEffect(() => {
        if (selectedProvince) {
            setShowSlogan(true);
            // 1. Start Fade In
            setTimeout(() => setSloganClass('opacity-100 translate-y-0 transition-all duration-1000 ease-out'), 100);

            // 2. Start Fade Out (ก่อนหมดเวลาเล็กน้อย)
            const fadeOutTimer = setTimeout(() => {
                setSloganClass('opacity-0 -translate-y-10 transition-all duration-1000 ease-in');
            }, 8000); // เริ่มจางตอนวินาทีที่ 8

            // 3. Remove from DOM
            const removeTimer = setTimeout(() => {
                setShowSlogan(false);
                setSloganClass('opacity-0 translate-y-10'); // Reset position
            }, 9000); // หายไปตอนวินาทีที่ 9

            return () => {
                clearTimeout(fadeOutTimer);
                clearTimeout(removeTimer);
            };
        } else {
            setShowSlogan(false);
            setSloganClass('opacity-0 translate-y-10');
        }
    }, [selectedProvince]);


    useEffect(() => {
        if (initialConfig?.province && mapInstance && appData.provinceData && appData.provinceData[initialConfig.province]) {
            const info = appData.provinceData[initialConfig.province];
            mapInstance.flyTo([info.lat - 0.1, info.lng], 10, {
                animate: true,
                duration: 2.5,
                easeLinearity: 0.25
            });
            setSoilInfo(info);
            setPinCoords([info.lat, info.lng]);
        }
    }, [initialConfig, mapInstance, appData.provinceData]);

    // --- WEATHER API FETCHING ---
    useEffect(() => {
        if (!selectedProvince || !appData.provinceData || !appData.provinceData[selectedProvince]) {
            setWeatherData(null);
            setExpandWeather(false); // Reset expansion when province changes
            return;
        }

        const info = appData.provinceData[selectedProvince];
        const fetchWeather = async () => {
            try {
                // ใช้ Open-Meteo API (ฟรี ไม่ต้องใช้ Key)
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${info.lat}&longitude=${info.lng}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FBangkok`);
                const data = await res.json();
                setWeatherData(data);
            } catch (err) {
                console.error("Weather fetch failed:", err);
            }
        };

        fetchWeather();
    }, [selectedProvince, appData.provinceData]);

    // Helper: แปลงรหัสสภาพอากาศเป็นไอคอน
    const getWeatherIcon = (code) => {
        if (code === 0) return 'fa-sun text-yellow-400';
        if (code === 1 || code === 2 || code === 3) return 'fa-cloud-sun text-blue-200';
        if (code >= 45 && code <= 48) return 'fa-smog text-slate-400';
        if (code >= 51 && code <= 67) return 'fa-cloud-rain text-blue-400';
        if (code >= 80 && code <= 99) return 'fa-cloud-showers-heavy text-blue-500';
        return 'fa-cloud text-slate-200';
    };

    // Helper: แปลงรหัสสภาพอากาศเป็นคำอธิบายไทยสั้นๆ
    const getWeatherDesc = (code) => {
        if (code === 0) return 'ฟ้าโปร่ง';
        if (code <= 3) return 'มีเมฆบางส่วน';
        if (code <= 48) return 'หมอก';
        if (code <= 67) return 'ฝนตกปรอยๆ';
        if (code >= 80) return 'ฝนตกหนัก';
        return 'ปกติ';
    };

    // Helper: วันในสัปดาห์
    const getDayName = (dateString) => {
        const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
        const d = new Date(dateString);
        return days[d.getDay()];
    };

    // ... (Map Layer Logic)
    useEffect(() => {
        if (isPinning) { setMapType('hybrid'); } else if (simulatingItem || selectedProvince) { setMapType('satellite'); }
    }, [isPinning, simulatingItem, selectedProvince]);

    useEffect(() => {
        if (!mapInstance) return;
        if (tileLayerRef.current) mapInstance.removeLayer(tileLayerRef.current);
        if (labelLayerRef.current) mapInstance.removeLayer(labelLayerRef.current);
        if (mapType === 'satellite') { tileLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(mapInstance); } 
        else if (mapType === 'hybrid') { tileLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(mapInstance); labelLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', { className: 'blue-hybrid-labels' }).addTo(mapInstance); } 
        else { tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance); }
        return () => { if (tileLayerRef.current) mapInstance.removeLayer(tileLayerRef.current); if (labelLayerRef.current) mapInstance.removeLayer(labelLayerRef.current); };
    }, [mapType, mapInstance]);

    // ... (Marker Logic)
    useEffect(() => {
        if (!mapInstance) return;
        let topPane = mapInstance.getPane('top-pane');
        if (!topPane) { topPane = mapInstance.createPane('top-pane'); topPane.style.zIndex = 3000; topPane.style.pointerEvents = 'none'; }
        if (!provinceFeaturesRef.current) provinceFeaturesRef.current = L.layerGroup().addTo(mapInstance);
        if (!selectedProvince || !appData.provinceData || !appData.provinceData[selectedProvince]) {
            if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; lastProvinceRef.current = null; }
            if (provinceFeaturesRef.current) provinceFeaturesRef.current.clearLayers();
            setPinCoords(null);
            return;
        }
        const info = appData.provinceData[selectedProvince];
        if (lastProvinceRef.current !== selectedProvince) {
            if (provinceFeaturesRef.current) provinceFeaturesRef.current.clearLayers();
            const places = [ { name: "ศาลากลาง", icon: "fa-landmark", color: "#60a5fa", lat: info.lat + 0.01, lng: info.lng - 0.01 }, { name: "ตลาดกลาง", icon: "fa-store", color: "#34d399", lat: info.lat + 0.015, lng: info.lng + 0.01 } ];
            places.forEach(p => { const icon = L.divIcon({ className: 'custom-place-icon', html: `<div class="landmark-icon" style="background-color: ${p.color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.5);"><i class="fa-solid ${p.icon} text-white text-xs"></i></div>`, iconSize: [30, 30] }); L.marker([p.lat, p.lng], { icon }).bindPopup(p.name).addTo(provinceFeaturesRef.current); });
        }
        if (!markerRef.current) {
            const customIcon = L.divIcon({ className: 'custom-pin', html: `<div class="pin-inner transition-all duration-300" style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`, iconSize: [24, 24], iconAnchor: [12, 12] });
            markerRef.current = L.marker([info.lat, info.lng], { icon: customIcon, draggable: true, pane: 'top-pane' }).addTo(mapInstance);
            markerRef.current.dragging.disable();
            lastProvinceRef.current = selectedProvince;
            setPinCoords([info.lat, info.lng]);
            markerRef.current.on('dragend', (e) => { const { lat, lng } = e.target.getLatLng(); setPinCoords([lat, lng]); });
        } else { if (lastProvinceRef.current !== selectedProvince) { markerRef.current.setLatLng([info.lat, info.lng]); lastProvinceRef.current = selectedProvince; setPinCoords([info.lat, info.lng]); } markerRef.current.setOpacity(1); }
    }, [selectedProvince, mapInstance, appData.provinceData]);

    useEffect(() => { if (markerRef.current) { const el = markerRef.current.getElement(); if (!el) return; const inner = el.querySelector('.pin-inner'); if (isPinning) { markerRef.current.dragging.enable(); if (inner) inner.classList.add('scale-125', 'ring-4', 'ring-emerald-400/50'); } else { markerRef.current.dragging.disable(); if (inner) inner.classList.remove('scale-125', 'ring-4', 'ring-emerald-400/50'); } } }, [isPinning, selectedProvince]);
    useEffect(() => { if (pinCoords) { setIsAddressLoading(true); fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pinCoords[0]}&lon=${pinCoords[1]}&format=json&accept-language=th`).then(res => res.json()).then(data => { if (data.address) { setAddressDetails(data.address); const a = data.address; const parts = []; if (a.village) parts.push('หมู่บ้าน ' + a.village); else if (a.hamlet) parts.push('หมู่บ้าน ' + a.hamlet); if (a.road) parts.push('ถนน ' + a.road); const subDistrict = a.suburb || a.tambon || a.quarter || a.neighbourhood; if (subDistrict) { if (a.quarter) parts.push('แขวง ' + subDistrict); else parts.push('ตำบล ' + subDistrict); } const district = a.city_district || a.district || a.amphoe; if (district) { if (a.state === 'กรุงเทพมหานคร' || a.city_district) parts.push('เขต ' + district); else parts.push('อำเภอ ' + district); } if (a.state) parts.push('จังหวัด ' + a.state); setAddress(parts.length > 0 ? parts.join(' ') : 'พิกัดไม่มีที่อยู่ระบุชัดเจน'); } else { setAddress('ไม่พบข้อมูลที่อยู่'); setAddressDetails(null); } setIsAddressLoading(false); }).catch(e => { setAddress('เชื่อมต่อแผนที่ไม่ได้'); setIsAddressLoading(false); }); } else { setAddress(null); setAddressDetails(null); } }, [pinCoords]);

    const provinceStats = useMemo(() => { if (!selectedProvince || !appData.provinceData) return null; const exactPop = appData.thaiPop?.find(p => p.province_name === selectedProvince); const statsList = appData.stats ? appData.stats.filter(s => s.province === selectedProvince) : []; const maxYear = statsList.length > 0 ? Math.max(...statsList.map(s => s.year)) : 0; const currentStats = statsList.filter(s => s.year === maxYear); const getValue = (keyword) => { const item = currentStats.find(s => s.topic && s.topic.includes(keyword)); return item ? { val: Number(item.value).toLocaleString(), unit: item.unit } : null; }; return { year: maxYear < 2000 && maxYear > 0 ? maxYear + 543 : maxYear, totalPop: exactPop ? { val: Number(exactPop.population).toLocaleString(), unit: 'คน' } : (getValue('ประชากรทั้งหมด') || getValue('รวม') || { val: appData.provinceData[selectedProvince]?.population || '-', unit: 'คน' }), male: getValue('ชาย'), female: getValue('หญิง'), farmers: getValue('เกษตรกร') || getValue('เกษตร') || getValue('ขึ้นทะเบียน'), slogan: appData.provinceData[selectedProvince]?.slogan }; }, [selectedProvince, appData.stats, appData.provinceData, appData.thaiPop]);
    const activeFloodData = useMemo(() => { let result = { risk_level: 'Low', description: 'ไม่พบข้อมูลความเสี่ยงในจุดนี้ (Default)', source: 'No Match Found', debug: { matched: false, reason: 'Init' } }; if (!appData.floodAlerts || !selectedProvince) { result.debug.reason = 'No alerts loaded or Province not selected'; return result; } const provAlerts = appData.floodAlerts.filter(a => a.province === selectedProvince); if (provAlerts.length === 0) { result.debug.reason = `No alerts for province: ${selectedProvince}`; return result; } if (addressDetails) { const rawTambon = addressDetails.suburb || addressDetails.tambon || addressDetails.quarter || addressDetails.neighbourhood || addressDetails.village || ''; const rawAmphoe = addressDetails.city_district || addressDetails.district || addressDetails.amphoe || ''; const normTambon = normalizeThaiName(rawTambon); const normAmphoe = normalizeThaiName(rawAmphoe); if (normTambon) { const tMatch = provAlerts.find(a => { const dbTambon = normalizeThaiName(a.tambon); return dbTambon && (dbTambon === normTambon || dbTambon.includes(normTambon) || normTambon.includes(dbTambon)); }); if (tMatch) return { ...tMatch, source: 'Supabase (Tambon Match)', debug: { matched: true, type: 'Tambon', record: tMatch, mapData: { t: normTambon, a: normAmphoe } } }; } if (normAmphoe) { const aMatch = provAlerts.find(a => { const dbAmphoe = normalizeThaiName(a.amphoe); return dbAmphoe && (dbAmphoe === normAmphoe || dbAmphoe.includes(normAmphoe) || normAmphoe.includes(dbAmphoe)); }); if (aMatch) return { ...aMatch, source: 'Supabase (Amphoe Match)', debug: { matched: true, type: 'Amphoe', record: aMatch, mapData: { t: normTambon, a: normAmphoe } } }; } result.debug.details = { mapNorm: { t: normTambon, a: normAmphoe }, dbRecordsSample: provAlerts.slice(0, 3).map(a => ({t: normalizeThaiName(a.tambon), a: normalizeThaiName(a.amphoe)})) }; } const provWide = provAlerts.find(a => !a.amphoe && !a.tambon); if (provWide) return { ...provWide, source: 'Supabase (Province Wide)', debug: { matched: true, type: 'Province', record: provWide } }; return result; }, [appData.floodAlerts, selectedProvince, addressDetails]);

    const handleFullscreen = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)); else if (document.exitFullscreen) document.exitFullscreen().then(() => setIsFullscreen(false)); };
    const togglePin = () => setIsPinning(!isPinning);
    const toggleMapType = () => setMapType(prev => prev === 'satellite' ? 'standard' : prev === 'standard' ? 'hybrid' : 'satellite');
    const handleRegionSelect = (r) => { setSelectedRegion(r); setSelectedProvince(null); setResults(null); setIsPinning(false); lastProvinceRef.current = null; };
    const handleBack = () => { 
        if (showKnowledgeCenter) { setShowKnowledgeCenter(false); return; }
        if (videoCategory) { setVideoCategory(null); return; }
        if (isPinning) { setIsPinning(false); return; } 
        if (simulatingItem) { setSimulatingItem(null); return; } 
        if (selectedProvince) { setSelectedProvince(null); setResults(null); lastProvinceRef.current = null; setMapType('satellite'); setPinCoords(null); if (mapInstance && mapInstance._container) mapInstance.flyTo(DON_MUEANG_COORDS || [13.9133, 100.6042], 6, { duration: 2 }); return; } 
        if (selectedRegion) { setSelectedRegion(null); return; } 
    };
    const handleAreaChange = (val) => { const newArea = parseFloat(val) || 0; setArea(newArea); };
    
    const handleShareProvince = () => {
        const url = `${window.location.origin}${window.location.pathname}#province=${encodeURIComponent(selectedProvince)}&category=${encodeURIComponent(categoryFilter)}`;
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        try { document.execCommand('copy'); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); } catch (err) { console.error('Copy failed', err); }
        document.body.removeChild(textarea);
    };

    const calculateEconomics = useCallback((newArea) => {
        if (!appData.crops) return [];
        let sourceCrops = [...appData.crops];
        if (sourceCrops.length === 0 && window.AppCore && window.AppCore.MOCK_CROPS) { sourceCrops = [...window.AppCore.MOCK_CROPS]; }
        const integratedExists = sourceCrops.some(c => c.name.includes('โคก') || c.category === 'ผสมผสาน');
        if (!integratedExists) { sourceCrops.push({ name: "โคก หนอง นา โมเดล", category: "ผสมผสาน", price: 0, yield: 0, cost: 35000, risk: "Low", source: 'Generated' }); }
        if (MOCK_CROPS) {
             const coconutExists = sourceCrops.some(c => c.name.includes('มะพร้าว'));
             if (!coconutExists) { const m = MOCK_CROPS.find(c => c.name.includes('มะพร้าว')); if(m) sourceCrops.push(m); }
             const durianExists = sourceCrops.some(c => c.name.includes('ทุเรียน'));
             if (!durianExists) { const m = MOCK_CROPS.find(c => c.name.includes('ทุเรียน')); if(m) sourceCrops.push(m); }
        }
        let processed = sourceCrops.map(c => {
            let avgProfitPerYear = 0, avgCostPerYear = 0, totalCostVal = 0; 
            const isDurian = c.name.includes('ทุเรียน'), isRubber = c.name.includes('ยาง') && !c.name.includes('โพนยางคำ'), isCoconut = c.name.includes('มะพร้าว'), isIntegrated = c.name.includes('โคก') || c.category === 'ผสมผสาน';

            if (isIntegrated && window.calculateIntegratedEconomics) {
                const eco = window.calculateIntegratedEconomics('khoknongna_general', newArea, years);
                if (eco) { avgProfitPerYear = eco.avgProfitPerYear; avgCostPerYear = eco.avgCostPerYear; totalCostVal = avgCostPerYear; }
            } else if (isDurian && window.calculateDurianEconomics) {
                 const eco = window.calculateDurianEconomics('monthong', newArea, years);
                 if (eco) { avgProfitPerYear = (eco.grossIncomeYear * 0.6) - (eco.maintCostPost); avgCostPerYear = eco.maintCostPost; totalCostVal = avgCostPerYear; } 
            } else if (isRubber && window.calculateRubberEconomics) {
                 const eco = window.calculateRubberEconomics('rrim600', newArea, years);
                 if (eco) { avgProfitPerYear = eco.avgProfitPerYear; avgCostPerYear = eco.avgCostPerYear; totalCostVal = avgCostPerYear; }
            } else if (isCoconut && window.calculateCoconutEconomics) {
                 const eco = window.calculateCoconutEconomics('namhom', newArea, years);
                 if (eco) { avgProfitPerYear = eco.avgProfitPerYear; avgCostPerYear = eco.avgCostPerYear; totalCostVal = avgCostPerYear; }
            } else {
                let rawYield = c.yield, pricePerKg = c.price;
                if(c.name.includes('ข้าว') && pricePerKg > 1000) pricePerKg /= 1000;
                let revenue = rawYield * newArea * pricePerKg, cost = Number(c.cost) || 0;
                if (window.getKasetPreset) {
                    const preset = window.getKasetPreset(c.name);
                    if (preset && preset.cycles_per_year) { revenue *= preset.cycles_per_year; cost = (preset.cost_init || cost) * preset.cycles_per_year; }
                }
                let profitPerYear = revenue - (cost * newArea);
                avgProfitPerYear = profitPerYear; totalCostVal = cost * newArea;
            }
            return { ...c, cost: totalCostVal, avgProfitYear: avgProfitPerYear, source: c.source || 'Mock' };
        });

        if (categoryFilter !== 'all') {
            if (categoryFilter === 'plant') processed = processed.filter(c => c.category === 'พืชไร่' || c.category === 'พืชสวน' || !c.category);
            else if (categoryFilter === 'animal') processed = processed.filter(c => c.category === 'ปศุสัตว์');
            else if (categoryFilter === 'integrated') processed = processed.filter(c => c.category === 'ผสมผสาน');
            else if (categoryFilter === 'rice_ministry') processed = processed.filter(c => c.name.includes('ข้าว') && !c.name.includes('หมูปิ้ง'));
            else if (categoryFilter === 'rubber_ministry') processed = processed.filter(c => c.name.includes('ยาง') && !c.name.includes('โพนยางคำ'));
            else if (categoryFilter === 'coconut_ministry') processed = processed.filter(c => c.name.includes('มะพร้าว')); 
            else if (categoryFilter === 'durian_ministry') processed = processed.filter(c => c.name.includes('ทุเรียน')); 
            else if (categoryFilter === 'integrated_ministry') processed = processed.filter(c => c.name.includes('โคก') || c.category === 'ผสมผสาน');
            else if (categoryFilter === 'business_ministry') processed = processed.filter(c => c.category === 'ธุรกิจ');
        }
        
        if (sortType === 'profit') processed.sort((a, b) => b.avgProfitYear - a.avgProfitYear);
        else if (sortType === 'payback') processed.sort((a, b) => (a.cost/(a.avgProfitYear||1)) - (b.cost/(b.avgProfitYear||1)));
        else if (sortType === 'risk') { const r = {'Low':1, 'Medium':2, 'High':3}; processed.sort((a, b) => r[a.risk] - r[b.risk]); }
        else if (sortType === 'balanced') { const riskScore = { 'Low': 1, 'Medium': 1.5, 'High': 2.5 }; processed.sort((a, b) => (b.avgProfitYear / (riskScore[b.risk] || 1.5)) - (a.avgProfitYear / (riskScore[a.risk] || 1.5))); }
        return processed;
    }, [appData.crops, appData.isOnline, sortType, categoryFilter, years]); 

    useEffect(() => { if (selectedProvince) { setResults(calculateEconomics(area)); } }, [calculateEconomics, area, selectedProvince]);

    // --- NEW: Trigger Simulation from Deep Link ---
    useEffect(() => {
        if (initialConfig?.simItem) {
            const allItems = calculateEconomics(initialConfig.area || area);
            const found = allItems.find(c => c.name === initialConfig.simItem);
            
            if (found) {
                setSimulatingItem(found);
                if (initialConfig.area) setArea(initialConfig.area);
                if (initialConfig.years) setYears(initialConfig.years);
            } else {
                const rawMock = window.AppCore.MOCK_CROPS || [];
                const mockFound = rawMock.find(c => c.name === initialConfig.simItem);
                if (mockFound) {
                     setSimulatingItem({ ...mockFound, cost: mockFound.cost * (initialConfig.area || 1), avgProfitYear: 0 }); 
                     setArea(initialConfig.area || 1);
                }
            }
        }
    }, [initialConfig, calculateEconomics]); 

    const handleProvinceSelect = (p) => { 
        if (p === selectedProvince) return; 
        setIsPinning(false); 
        setSelectedProvince(p); 
        setMapType('satellite'); 
        const info = appData.provinceData[p]; 
        if (info) { 
            setSoilInfo(info); 
            setPinCoords([info.lat, info.lng]); 
            if (mapInstance && mapInstance._container) { 
                const center = mapInstance.getCenter(); 
                const bearing = getBearing(center.lat, center.lng, info.lat, info.lng); 
                onTravelStart(`กำลังเดินทางไป ${p}...`, bearing); 
                mapInstance.flyTo([info.lat - 0.1, info.lng], 10, { duration: 2.5, easeLinearity: 0.25, noMoveStart: false });
                setTimeout(() => onTravelEnd(), 2800); 
            } 
        }
        setResults(calculateEconomics(area)); 
    };

    const currentRegionContext = useMemo(() => {
        if (selectedRegion) return selectedRegion;
        if (selectedProvince && appData.regions) {
            for (const [r, provs] of Object.entries(appData.regions)) {
                if (provs.includes(selectedProvince)) return r;
            }
        }
        return null;
    }, [selectedRegion, selectedProvince, appData.regions]);

    const handleGPSLocation = () => {
        if (!navigator.geolocation) { alert("อุปกรณ์ของคุณไม่รองรับ GPS"); return; }
        onTravelStart("กำลังระบุพิกัด GPS...", 0);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                if (pinCoords && Math.abs(pinCoords[0] - latitude) < 0.0001 && Math.abs(pinCoords[1] - longitude) < 0.0001) { onTravelEnd(); return; }
                fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=th`)
                    .then(res => res.json())
                    .then(data => {
                        const addressObj = data.address;
                        const prov = addressObj.state || addressObj.province;
                        const cleanProv = prov ? prov.replace('จังหวัด', '').trim() : null;
                        if (cleanProv && appData.provinceData && appData.provinceData[cleanProv]) {
                            const info = appData.provinceData[cleanProv];
                            setSelectedProvince(cleanProv);
                            const reg = Object.keys(appData.regions).find(r => appData.regions[r].includes(cleanProv));
                            if (reg) setSelectedRegion(reg);
                            setSoilInfo(info);
                            setPinCoords([latitude, longitude]); 
                            if (mapInstance && mapInstance._container) {
                                const center = mapInstance.getCenter();
                                const bearing = getBearing(center.lat, center.lng, latitude, longitude);
                                onTravelStart(`บินไปยังพิกัด GPS (${cleanProv})...`, bearing);
                                mapInstance.flyTo([latitude, longitude], 12, { duration: 3, easeLinearity: 0.2, noMoveStart: false });
                                setTimeout(() => onTravelEnd(), 3200);
                            }
                            setResults(calculateEconomics(area));
                        } else { onTravelEnd(); alert("ไม่พบข้อมูลจังหวัดสำหรับพิกัดนี้"); }
                    })
                    .catch(err => { console.error(err); onTravelEnd(); alert("เชื่อมต่อแผนที่ล้มเหลว"); });
            },
            (err) => { console.warn(err); onTravelEnd(); alert("กรุณาเปิด GPS เพื่อระบุตำแหน่ง"); }
        );
    };

    const handleDashboardDropdownChange = (val) => {
        if (val === 'USE_GPS') { handleGPSLocation(); } 
        else if (val === 'CHANGE_REGION') { setSelectedProvince(null); setSelectedRegion(null); setResults(null); if (mapInstance) mapInstance.flyTo(DON_MUEANG_COORDS, 6, { duration: 1.5 }); } 
        else { handleProvinceSelect(val); }
    };

    const handleVideoClick = (e, item) => {
        e.stopPropagation();
        const vKey = getVideoKey ? getVideoKey(item) : null;
        const vList = vKey ? getVideos(vKey) : [];
        if (vList.length > 0 && vKey) {
            setVideoCategory(vKey);
            setShowKnowledgeCenter(false);
            setSimulatingItem(null);
        } else {
            alert('ยังไม่มีวิดีโอสำหรับรายการนี้');
        }
    };

    const currentProvInfo = appData.provinceData && selectedProvince ? appData.provinceData[selectedProvince] : null;
    const floodColorClass = activeFloodData.risk_level === 'High' ? 'text-red-400' : activeFloodData.risk_level === 'Medium' ? 'text-orange-400' : 'text-green-400';

    return (
        <div className="ui-unified-layer">
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between pointer-auto px-2 md:px-4 z-[2100] mt-2">
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    <button onClick={onGoHome} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg group" title="หน้าแรก"><i className="fa-solid fa-house text-sm md:text-base group-hover:text-emerald-400"></i></button>
                    {(selectedRegion || selectedProvince) && (<button onClick={handleBack} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg animate-fade-in-up" title="ย้อนกลับ"><i className="fa-solid fa-arrow-left text-sm md:text-base"></i></button>)}
                </div>
                <div className="flex-1 flex justify-center px-2 min-w-0">
                    {simulatingItem || showKnowledgeCenter || videoCategory ? (
                        <div className="glass-panel rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-fade-in-up max-w-full overflow-hidden">
                            {showKnowledgeCenter ? <><i className="fa-solid fa-book-journal-whills text-blue-400 animate-pulse"></i><span className="text-sm md:text-base font-bold text-white truncate">ศูนย์ความรู้</span></> :
                             videoCategory ? <><i className="fa-brands fa-youtube text-red-400 animate-pulse"></i><span className="text-sm md:text-base font-bold text-white truncate">คลังวิดีโอ</span></> :
                             <><i className="fa-solid fa-chart-line text-emerald-400 animate-pulse"></i><span className="text-sm md:text-base font-bold text-white truncate">{simulatingItem.name}</span></>}
                        </div>
                    ) : selectedProvince ? (
                        <div className="glass-panel rounded-full px-1 py-1 flex items-center gap-1 md:gap-2 shadow-[0_0_20px_rgba(0,0,0,0.3)] animate-fade-in-up max-w-full overflow-hidden">
                            <div className="flex items-center gap-2 pl-3 pr-2 border-r border-white/20 shrink-0 min-w-[80px]"><div className="relative"><i className="fa-solid fa-seedling text-emerald-400 text-lg"></i><span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${appData.isOnline ? 'bg-green-400' : 'bg-orange-400'}`}></span><span className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-black/50 ${appData.isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></span></span></div><div className="flex flex-col leading-none hidden sm:flex"><span className="text-xs font-bold text-emerald-100">พืชแนะนำ</span><span className={`text-[8px] font-bold uppercase tracking-wide mt-0.5 ${appData.isOnline ? 'text-green-300' : 'text-orange-300'}`}>{appData.isOnline ? '● SUPABASE' : '○ MOCK DATA'}</span></div></div>
                            <div className="relative group pl-1 min-w-0 flex-1">
                                <i className="fa-solid fa-location-dot text-emerald-400 text-xs md:text-sm absolute left-1 top-1/2 -translate-y-1/2 animate-pulse"></i>
                                <select value={selectedProvince} onChange={(e) => handleDashboardDropdownChange(e.target.value)} className="bg-slate-900/50 text-white text-xs md:text-sm font-bold py-2 pl-6 pr-2 focus:outline-none cursor-pointer appearance-none w-full truncate border-b-2 border-emerald-500/50 hover:border-emerald-400 transition-all shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)] rounded-t-md hover:bg-slate-800/70">
                                    <option value="USE_GPS" className="bg-emerald-900 text-emerald-200 font-bold">📍 ใช้พิกัด GPS ปัจจุบัน</option>
                                    <optgroup label={`จังหวัดในภาค${currentRegionContext || ''}`}>
                                        {(appData.regions[currentRegionContext] || (selectedProvince ? [selectedProvince] : [])).map(p => (
                                            <option key={p} value={p} className="bg-slate-800 text-white">{p}</option>
                                        ))}
                                    </optgroup>
                                    <option value="CHANGE_REGION" className="bg-blue-900 text-blue-200 font-bold">🗺️ ไปภูมิภาคอื่น...</option>
                                </select>
                            </div>
                            <div className="w-[1px] h-4 bg-white/20"></div>
                            <div className="flex items-center gap-1 pr-1 shrink-0 relative group">
                                <input type="number" step="0.1" min="0" value={area} onChange={(e) => handleAreaChange(e.target.value)} className="w-10 md:w-16 bg-black/30 text-center text-xs md:text-sm font-bold text-yellow-300 focus:outline-none py-1 transition placeholder-white/30 border border-white/10 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:border-emerald-400 focus:shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                <span className="text-[10px] md:text-xs text-slate-300 font-bold drop-shadow-md">ไร่</span>
                            </div>
                            <div className="w-[1px] h-4 bg-white/20"></div>
                            <div className="flex items-center gap-1 pr-2 shrink-0">
                                <input type="number" min="1" max="50" value={years} onChange={(e) => setYears(parseFloat(e.target.value) || 1)} className="w-8 md:w-10 bg-black/30 text-center text-xs md:text-sm font-bold text-yellow-300 focus:outline-none py-1 transition placeholder-white/30 border border-white/10 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:border-emerald-400 focus:shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                <span className="text-[10px] md:text-xs text-slate-300 font-bold drop-shadow-md">ปี</span>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel rounded-full px-4 py-1.5 text-sm font-bold text-white/90">{selectedRegion ? `ภาค${selectedRegion}` : 'เลือกภูมิภาค'}</div>
                    )}
                </div>
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    {selectedProvince && !simulatingItem && !showKnowledgeCenter && !videoCategory && (<button onClick={togglePin} className={`w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel flex items-center justify-center transition shadow-lg animate-fade-in-up ${isPinning ? 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-white' : 'hover:bg-white/10 text-white'}`} title={isPinning ? "ยืนยันตำแหน่ง" : "ขยับหมุด"}><i className={`fa-solid ${isPinning ? 'fa-check text-lg font-bold' : 'fa-map-location-dot text-sm md:text-base'}`}></i></button>)}
                    <button onClick={toggleMapType} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg" title="เปลี่ยนแผนที่"><i className={`fa-solid ${mapType === 'satellite' ? 'fa-layer-group' : mapType === 'hybrid' ? 'fa-map' : 'fa-earth-americas'} text-sm md:text-base`}></i></button>
                    <button onClick={handleFullscreen} className={`w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg ${isBlinking ? 'animate-pulse ring-2 ring-yellow-400' : ''}`} title="เต็มจอ"><i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm md:text-base`}></i></button>
                </div>
            </div>

            {selectedProvince && !isTraveling && (
                <div className="fixed bottom-0 left-0 w-full z-[20] bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-10 pb-4 px-4 md:px-6 flex flex-col items-end justify-between pointer-events-none animate-fade-in-up">
                    <style>{`.text-shadow-heavy { text-shadow: 0 2px 4px rgba(0,0,0,0.9); }`}</style>
                    <div className="w-full flex flex-col md:flex-row items-end justify-between gap-2">
                        {/* LEFT: Province Info & Address */}
                        <div className="mb-2 md:mb-0 text-shadow-heavy pointer-events-auto">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-3xl md:text-4xl leading-none tracking-wide">{selectedProvince}</h3>
                                <div className="flex gap-1">
                                    <a href="https://www.facebook.com/winayo1" target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition shadow-lg" title="ติดตามผู้พัฒนา">
                                        <i className="fa-brands fa-facebook text-xs"></i>
                                    </a>
                                    <button onClick={handleShareProvince} className={`w-6 h-6 rounded-full flex items-center justify-center transition shadow-lg ${isCopied ? 'bg-green-500 text-white' : 'bg-white/20 hover:bg-white/40 text-white'}`} title="แชร์หน้านี้">
                                        <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-share-nodes'} text-xs`}></i>
                                    </button>
                                </div>
                            </div>
                            <div className="mt-1">
                                {isAddressLoading ? (<span className="text-[10px] text-yellow-300 animate-pulse"><i className="fa-solid fa-spinner fa-spin mr-1"></i> กำลังค้นหาที่อยู่...</span>) : address ? (<div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-emerald-200 border border-emerald-500/30 shadow-lg inline-block max-w-[300px] truncate"><i className="fa-solid fa-map-location-dot mr-1 text-emerald-400"></i>{address}</div>) : (pinCoords && <span className="text-[10px] text-slate-400">{pinCoords[0].toFixed(4)}, {pinCoords[1].toFixed(4)}</span>)}
                            </div>
                        </div>

                    {/* --- Slogan Overlay (New: Transparent Style) --- */}
                    {showSlogan && provinceStats?.slogan && (
                         <div className={`absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-2xl text-center pointer-events-none z-50 ${sloganClass}`}>
                            <div className="bg-black/40 p-4 rounded-xl border border-white/10 shadow-none backdrop-blur-none">
                                <i className="fa-solid fa-quote-left text-emerald-400 text-xl mb-2 opacity-60"></i>
                                <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed text-shadow-heavy font-sarabun tracking-wide">
                                    {provinceStats.slogan}
                                </h2>
                                <i className="fa-solid fa-quote-right text-emerald-400 text-xl mt-2 opacity-60"></i>
                            </div>
                        </div>
                    )}

                        {/* RIGHT: Weather & Stats (รวมอยู่ใน Flex Group เดียวกัน) */}
                        <div className="flex flex-wrap items-end gap-3 text-shadow-heavy justify-end">
                            
                            {/* Weather Card (Moved Here) */}
                            {weatherData && weatherData.current_weather && (
                                <div 
                                    onClick={() => setExpandWeather(!expandWeather)} 
                                    className="bg-black/60 backdrop-blur-md rounded-xl p-2 border border-white/10 pointer-events-auto flex gap-3 shadow-lg cursor-pointer hover:bg-black/70 transition-all relative group h-[48px] items-center"
                                    title={expandWeather ? "ย่อพยากรณ์อากาศ" : "ดูพยากรณ์ล่วงหน้า 7 วัน"}
                                >
                                    <div className={`flex flex-col items-center min-w-[60px] ${expandWeather ? 'border-r border-white/10 pr-3' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <i className={`fa-solid ${getWeatherIcon(weatherData.current_weather.weathercode)} text-xl`}></i>
                                            <div className="text-lg font-bold text-white leading-none">{Math.round(weatherData.current_weather.temperature)}°</div>
                                        </div>
                                        <div className="text-[8px] text-slate-400 truncate max-w-[60px] leading-none mt-1">{getWeatherDesc(weatherData.current_weather.weathercode)}</div>
                                        {!expandWeather && <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>} 
                                    </div>
                                    
                                    {expandWeather && (
                                        <div className="flex gap-2 overflow-x-auto scrollbar-hide animate-slide-in-right">
                                            {weatherData.daily.time.slice(1, 7).map((time, i) => (
                                                <div key={i} className="flex flex-col items-center justify-between min-w-[24px]">
                                                    <div className="text-[8px] text-slate-400">{getDayName(time)}</div>
                                                    <i className={`fa-solid ${getWeatherIcon(weatherData.daily.weathercode[i+1])} text-[10px] my-0.5`}></i>
                                                    <div className="text-[9px] font-bold text-white">{Math.round(weatherData.daily.temperature_2m_max[i+1])}°</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col items-center"><div className="flex items-baseline gap-1"><i className="fa-solid fa-users text-blue-400 text-sm"></i><span className="text-sm font-bold text-white">{provinceStats?.totalPop?.val || '-'}</span><span className="text-[9px] text-slate-300">{provinceStats?.totalPop?.unit}</span></div><div className="text-[9px] text-blue-200 font-bold uppercase tracking-wider">ประชากร</div></div>
                            <div className="flex flex-col items-center"><div className="flex items-baseline gap-1"><i className="fa-solid fa-address-card text-emerald-400 text-sm"></i><span className="text-sm font-bold text-white">{provinceStats?.farmers?.val || '-'}</span><span className="text-[9px] text-emerald-200/70">{provinceStats?.farmers?.unit}</span></div><div className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">เกษตรกร</div></div>
                            
                            <div className="w-px h-6 bg-white/20 hidden md:block"></div>
                            
                            <div className="flex flex-col items-center"><div className="flex items-baseline gap-1"><i className="fa-solid fa-flask text-purple-400 text-sm"></i><span className="text-sm font-bold text-white">{currentProvInfo?.ph || '-'}</span></div><div className="text-[9px] text-purple-200 font-bold uppercase tracking-wider">pH ดิน</div></div>
                            <div className="flex flex-col items-center"><div className="flex items-baseline gap-1"><i className="fa-solid fa-droplet text-blue-400 text-sm"></i><span className="text-sm font-bold text-white">{currentProvInfo?.moisture || '-'}</span><span className="text-[9px] text-blue-200">%</span></div><div className="text-[9px] text-blue-200 font-bold uppercase tracking-wider">ความชื้น</div></div>
                            
                            <div className="flex flex-col items-center group relative cursor-help pointer-events-auto">
                                <div className="flex items-baseline gap-1"><i className={`fa-solid fa-water text-sm ${floodColorClass}`}></i><span className="text-sm font-bold text-white">{activeFloodData.risk_level}</span></div>
                                <div className={`text-[9px] font-bold uppercase tracking-wider ${floodColorClass.replace('text', 'bg').replace('400', '500/20')} px-1.5 rounded`}>เสี่ยงน้ำท่วม</div>
                                <div className="absolute bottom-full mb-2 hidden group-hover:block w-64 bg-black/95 text-white text-xs p-3 rounded border border-white/20 backdrop-blur-md z-50 shadow-2xl origin-bottom-right right-0">
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
                </div>
            )}

            <div className={`w-full flex-1 flex flex-col items-center transition-all duration-700 ease-in-out transform ${isTraveling || isPinning ? '-translate-y-20 opacity-0' : 'translate-y-0 opacity-100'} ${isTraveling || isPinning ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                {!selectedRegion && !selectedProvince && !simulatingItem && !showKnowledgeCenter && !videoCategory && (
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

                {/* CONTENT AREA: Results / Knowledge / Video / Simulation */}
                {(selectedProvince || simulatingItem || showKnowledgeCenter || videoCategory) && !isReadingBook && (
                    <div className={`w-full max-w-5xl mx-auto flex flex-col h-[80vh] animate-slide-down mt-2`}>
                        {showKnowledgeCenter ? (
                            <KnowledgeCenterModal onClose={() => setShowKnowledgeCenter(false)} />
                        ) : videoCategory ? (
                            <VideoGalleryModal category={videoCategory} onClose={() => setVideoCategory(null)} />
                        ) : simulatingItem ? (
                            <SimulationPanel item={simulatingItem} onClose={() => setSimulatingItem(null)} globalArea={area} setGlobalArea={setArea} globalYears={years} setGlobalYears={setYears} floodData={activeFloodData} soilInfo={currentProvInfo} provinceStats={provinceStats} />
                        ) : (
                            /* DEFAULT RESULT LIST */
                            <div className="flex-1 glass-panel-clear rounded-b-3xl overflow-hidden flex flex-col shadow-xl border-t-0">
                                <div className="flex flex-wrap gap-2 p-3 border-b border-white/10 items-center justify-between bg-black/20">
                                    <div className="flex gap-1 overflow-x-auto scrollbar-prominent pb-1">
                                        <button onClick={() => setShowKnowledgeCenter(true)} className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-blue-600 text-white shadow-[0_4px_0_rgb(30,58,138)] active:shadow-none active:translate-y-1 hover:bg-blue-500 transition-all mr-1 border border-blue-400/30"><i className="fa-solid fa-book-journal-whills mr-1"></i>ศูนย์ความรู้</button>
                                        <button onClick={() => setCategoryFilter('plant')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all active:translate-y-1 ${categoryFilter === 'plant' ? 'bg-emerald-500 text-white shadow-[0_4px_0_rgb(6,95,70)]' : 'bg-white/10 text-slate-300 hover:bg-white/20 shadow-[0_4px_0_rgba(255,255,255,0.1)]'}`}>พืชไร่/สวน</button>
                                        <button onClick={() => setCategoryFilter('animal')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all active:translate-y-1 ${categoryFilter === 'animal' ? 'bg-orange-500 text-white shadow-[0_4px_0_rgb(154,52,18)]' : 'bg-white/10 text-slate-300 hover:bg-white/20 shadow-[0_4px_0_rgba(255,255,255,0.1)]'}`}>ฟาร์มสัตว์</button>
                                        <button onClick={() => setCategoryFilter('integrated')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all active:translate-y-1 ${categoryFilter === 'integrated' ? 'bg-blue-500 text-white shadow-[0_4px_0_rgb(30,58,138)]' : 'bg-white/10 text-slate-300 hover:bg-white/20 shadow-[0_4px_0_rgba(255,255,255,0.1)]'}`}>เกษตรผสมผสาน</button>
                                        <button onClick={() => setCategoryFilter('rice_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all active:translate-y-1 ${categoryFilter === 'rice_ministry' ? 'bg-indigo-500 text-white shadow-[0_4px_0_rgb(55,48,163)]' : 'bg-white/10 text-slate-300 hover:bg-white/20 shadow-[0_4px_0_rgba(255,255,255,0.1)]'}`}><i className="fa-solid fa-shekel-sign mr-1"></i>กระทรวงชาวนา</button>
                                        <button onClick={() => setCategoryFilter('rubber_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all active:translate-y-1 ${categoryFilter === 'rubber_ministry' ? 'bg-slate-200 text-slate-900 shadow-[0_4px_0_rgb(100,116,139)]' : 'bg-white/10 text-slate-300 hover:bg-white/20 shadow-[0_4px_0_rgba(255,255,255,0.1)]'}`}><i className="fa-solid fa-droplet mr-1"></i>กระทรวงยางพารา</button>
                                        <button onClick={() => setCategoryFilter('coconut_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all active:translate-y-1 ${categoryFilter === 'coconut_ministry' ? 'bg-green-600 text-white shadow-[0_4px_0_rgb(20,83,45)]' : 'bg-white/10 text-slate-300 hover:bg-white/20 shadow-[0_4px_0_rgba(255,255,255,0.1)]'}`}><i className="fa-solid fa-tree mr-1"></i>กระทรวงมะพร้าว</button>
                                        <button onClick={() => setCategoryFilter('durian_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all active:translate-y-1 ${categoryFilter === 'durian_ministry' ? 'bg-yellow-600 text-white shadow-[0_4px_0_rgb(161,98,7)]' : 'bg-white/10 text-slate-300 hover:bg-white/20 shadow-[0_4px_0_rgba(255,255,255,0.1)]'}`}><i className="fa-solid fa-crown mr-1"></i>กระทรวงทุเรียน</button>
                                        <button onClick={() => setCategoryFilter('integrated_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all active:translate-y-1 ${categoryFilter === 'integrated_ministry' ? 'bg-emerald-700 text-white shadow-[0_4px_0_rgb(6,78,59)]' : 'bg-white/10 text-slate-300 hover:bg-white/20 shadow-[0_4px_0_rgba(255,255,255,0.1)]'}`}><i className="fa-solid fa-layer-group mr-1"></i>กระทรวงเกษตรผสมผสาน</button>
                                        <button onClick={() => setCategoryFilter('business_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all active:translate-y-1 ${categoryFilter === 'business_ministry' ? 'bg-purple-600 text-white shadow-[0_4px_0_rgb(107,33,168)]' : 'bg-white/10 text-slate-300 hover:bg-white/20 shadow-[0_4px_0_rgba(255,255,255,0.1)]'}`}><i className="fa-solid fa-briefcase mr-1"></i>กระทรวงพี่เลี้ยงธุรกิจ</button>
                                        <button onClick={() => setCategoryFilter('all')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all active:translate-y-1 ${categoryFilter === 'all' ? 'bg-emerald-500 text-white shadow-[0_4px_0_rgb(6,95,70)]' : 'bg-white/10 text-slate-300 hover:bg-white/20 shadow-[0_4px_0_rgba(255,255,255,0.1)]'}`}>ทั้งหมด</button>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => setSortType('profit')} className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all active:translate-y-0.5 ${sortType === 'profit' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'border-white/10 text-slate-400 shadow-sm'}`} title="ผลตอบแทนสูง"><i className="fa-solid fa-sack-dollar"></i></button>
                                        <button onClick={() => setSortType('payback')} className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all active:translate-y-0.5 ${sortType === 'payback' ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'border-white/10 text-slate-400 shadow-sm'}`} title="คืนทุนไว"><i className="fa-solid fa-stopwatch"></i></button>
                                        <button onClick={() => setSortType('risk')} className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all active:translate-y-0.5 ${sortType === 'risk' ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'border-white/10 text-slate-400 shadow-sm'}`} title="ความเสี่ยงต่ำ"><i className="fa-solid fa-shield-halved"></i></button>
                                        <button onClick={() => setSortType('balanced')} className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all active:translate-y-0.5 ${sortType === 'balanced' ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-white/10 text-slate-400 shadow-sm'}`} title="แนะนำ"><i className="fa-solid fa-star"></i></button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto scrollbar-prominent pb-44 pt-2">
                                    {results && results.length > 0 ? results.map((item, idx) => {
                                        const hasVideo = getVideoKey && getVideos(getVideoKey(item)).length > 0;
                                        return (
                                            <div key={idx} onClick={() => setSimulatingItem(item)} className="p-4 border-b border-white/10 hover:bg-white/5 cursor-pointer flex flex-col justify-between group transition relative overflow-hidden">
                                                {item.source && item.source.includes('Supabase') && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>}
                                                
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border group-hover:scale-110 transition backdrop-blur-sm shrink-0 ${item.category === 'ธุรกิจ' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>{idx + 1}</div>
                                                        <div>
                                                            <div className="font-bold text-white group-hover:text-yellow-400 transition flex items-center gap-2">
                                                                {item.name}
                                                                {item.category === 'ปศุสัตว์' && <i className="fa-solid fa-cow text-orange-400 text-xs"></i>}
                                                                {item.category === 'ผสมผสาน' && <i className="fa-solid fa-layer-group text-emerald-300 text-xs"></i>}
                                                                {item.category === 'ธุรกิจ' && <i className="fa-solid fa-briefcase text-purple-400 text-xs"></i>}
                                                                {item.source && item.source.includes('Supabase') ? (
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-green-500 bg-green-900/80 text-green-300 uppercase tracking-wider font-bold ml-2 shadow-[0_0_5px_rgba(34,197,94,0.5)]">● LIVE DB</span>
                                                                ) : (
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-slate-600 bg-slate-800/50 text-slate-400 uppercase tracking-wider font-bold ml-2">○ MOCK</span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-slate-300">{item.category === 'ธุรกิจ' ? 'ลงทุน:' : 'ลงทุนเฉลี่ย:'} {(item.cost || 0).toLocaleString()} ฿/{item.category === 'ธุรกิจ' ? 'สาขา' : (item.category === 'ปศุสัตว์' ? 'ตัว/รุ่น' : 'ไร่/ปี')}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-slate-400">กำไรเฉลี่ย/ปี</div>
                                                        <div className="font-bold text-yellow-400 text-lg drop-shadow-md">{(item.avgProfitYear || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ฿</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-white/5 w-full">
                                                    {hasVideo && (
                                                        <button onClick={(e) => handleVideoClick(e, item)} className="px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-red-500/30 group-hover:border-red-400/50">
                                                            <i className="fa-brands fa-youtube text-sm"></i> วิดีโอ
                                                        </button>
                                                    )}
                                                    <button className="px-3 py-1.5 rounded-md bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md flex items-center gap-1.5 border border-emerald-500/50 group-hover:scale-105">
                                                        <i className="fa-solid fa-calculator text-sm"></i> คำนวณกำไร
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }) : <div className="p-10 text-center text-slate-500">ไม่พบข้อมูลตามเงื่อนไข</div>}
                                </div>
                                <div className="w-full h-4 flex items-center justify-center cursor-pointer bg-white/5"><div className="w-12 h-1 bg-white/20 rounded-full"></div></div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 2. HOME PAGE COMPONENT ---
const HomePage = ({ onLocate, isTraveling }) => { 
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [locating, setLocating] = useState(false); 
    const [autoPilotLocation, setAutoPilotLocation] = useState(null);
    const [showManualSelector, setShowManualSelector] = useState(false);
    const [manualRegion, setManualRegion] = useState(null);
    
    const appData = useRealtimeData ? useRealtimeData() : { regions: {} };

    useEffect(() => {
        const checkIP = async () => {
            try {
                const res = await fetch('https://ipwho.is/');
                const data = await res.json();
                
                if (data.success && data.latitude && data.longitude) {
                    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${data.latitude}&lon=${data.longitude}&format=json&accept-language=th`)
                        .then(r => r.json())
                        .then(geo => {
                            const addressObj = geo.address;
                            const prov = addressObj.state || addressObj.province;
                            const cleanProv = prov ? prov.replace('จังหวัด', '').trim() : null;
                            setAutoPilotLocation({ lat: data.latitude, lng: data.longitude, province: cleanProv });
                        })
                        .catch(e => { setAutoPilotLocation({ lat: data.latitude, lng: data.longitude, province: null }); });
                }
            } catch (err) { console.log("Auto-pilot IP check failed (Silent)", err); }
        };
        checkIP();
    }, []);

    const toggleFullscreen = () => { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)); } else { if (document.exitFullscreen) document.exitFullscreen().then(() => setIsFullscreen(false)); } };

    const handleMainEnter = () => {
        if (autoPilotLocation) { onLocate(autoPilotLocation.lat, autoPilotLocation.lng, autoPilotLocation.province); } else { setShowManualSelector(true); }
    };

    const handleLocateClick = () => {
        setLocating(true);
        const useAutoPilotFallback = () => {
             if (autoPilotLocation) { setLocating(false); onLocate(autoPilotLocation.lat, autoPilotLocation.lng, autoPilotLocation.province); } else { setLocating(false); alert("ไม่สามารถระบุตำแหน่งได้ กรุณาเปิด GPS"); }
        };

        if (!navigator.geolocation) { useAutoPilotFallback(); return; }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=th`)
                    .then(res => res.json())
                    .then(data => {
                        const addressObj = data.address;
                        const prov = addressObj.state || addressObj.province;
                        const cleanProv = prov ? prov.replace('จังหวัด', '').trim() : null;
                        setLocating(false);
                        onLocate(latitude, longitude, cleanProv);
                    })
                    .catch(err => { setLocating(false); onLocate(latitude, longitude, null); });
            },
            (error) => { console.warn("GPS Denied/Error, switching to IP fallback..."); useAutoPilotFallback(); },
            { timeout: 5000, enableHighAccuracy: true }
        );
    };

    const handleManualProvinceSelect = (p) => { onLocate(null, null, p); };

    return (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center p-6 animate-fade-in-up">
            <button onClick={toggleFullscreen} className="absolute top-4 right-4 w-10 h-10 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg z-50"><i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm`}></i></button>
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Flag_of_Thailand.svg" alt="Thai Flag" className="w-24 mb-4 animate-flag-wave shadow-lg" />
            <h1 className="text-5xl md:text-7xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-emerald-400 to-cyan-400 drop-shadow-xl">Winai Innovation</h1>
            <p className="text-slate-300 text-lg mb-8 bg-black/40 px-4 py-1 rounded-full backdrop-blur-sm border border-white/10">Super App เพื่อเกษตรกรไทย</p>
            
            {!showManualSelector ? (
                <>
                    <button onClick={handleMainEnter} disabled={isTraveling || locating} className={`group relative font-bold py-4 px-10 rounded-2xl shadow-lg transition-all overflow-hidden border backdrop-blur-md ${autoPilotLocation ? 'bg-emerald-600/80 hover:bg-emerald-500 text-white border-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-white/10 hover:bg-emerald-500/30 text-white border-emerald-400/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'} ${isTraveling ? 'scale-105 cursor-default' : 'hover:scale-105'}`}>
                        {autoPilotLocation && ( <div className="absolute inset-0 z-0"> <div className="absolute inset-0 bg-emerald-400/30 animate-ping rounded-2xl"></div> <div className="absolute inset-0 bg-white/20 animate-pulse rounded-2xl delay-75"></div> </div> )}
                        <div className={`absolute inset-0 bg-emerald-500/20 transition-transform duration-1000 ${isTraveling ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'}`}></div>
                        <span className="relative flex flex-col items-center gap-1 z-10">
                            <span className="flex items-center gap-3 text-xl">{isTraveling ? (<>กำลังเดินทาง...</>) : (<><i className="fa-solid fa-rocket"></i> เข้าสู่เกษตร คราวน์</>)}</span>
                            {autoPilotLocation && !isTraveling && (<span className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold bg-black/20 px-2 rounded-full mt-1"><i className="fa-solid fa-circle-check mr-1"></i>ระบบ Auto pilot พร้อมแล้ว</span>)}
                        </span>
                    </button>
                    <div className={`transition-all duration-700 ease-in-out transform ${autoPilotLocation ? 'scale-0 opacity-0 -translate-y-10' : 'scale-100 opacity-100 translate-y-0'}`}>
                        <button onClick={handleLocateClick} disabled={isTraveling || locating} className="mt-4 px-6 py-2 rounded-full bg-blue-600/80 hover:bg-blue-500 text-white font-bold flex items-center gap-2 transition shadow-lg border border-blue-400/50 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            {locating ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-location-crosshairs"></i>}
                            <span>{locating ? 'กำลังค้นหา...' : 'ค้นหาตำแหน่งของฉัน'}</span>
                        </button>
                    </div>
                </>
            ) : (
                <div className="animate-fade-in-up w-full max-w-2xl bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl relative">
                    <button onClick={() => { setShowManualSelector(false); setManualRegion(null); }} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"><i className="fa-solid fa-xmark"></i></button>
                    {!manualRegion ? (
                        <>
                            <h2 className="text-2xl font-bold text-white mb-6">เลือกภูมิภาคของคุณ</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.keys(appData.regions || {}).map(r => (
                                    <button key={r} onClick={() => setManualRegion(r)} className="bg-white/5 hover:bg-emerald-500/30 border border-white/10 hover:border-emerald-400 rounded-xl p-4 flex flex-col items-center gap-2 transition hover:scale-105">
                                        <span className="text-3xl">{r === 'เหนือ' ? '⛰️' : r === 'ใต้' ? '🌊' : r === 'อีสาน' ? '🌾' : '🏙️'}</span>
                                        <span className="font-bold">{r}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <button onClick={() => setManualRegion(null)} className="text-slate-300 hover:text-white"><i className="fa-solid fa-arrow-left"></i></button>
                                <h2 className="text-xl font-bold text-white">จังหวัดในภาค{manualRegion}</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto scrollbar-prominent p-1">
                                {(appData.regions[manualRegion] || []).sort().map(p => (
                                    <button key={p} onClick={() => handleManualProvinceSelect(p)} className="bg-white/5 hover:bg-emerald-500/40 border border-white/10 rounded-lg p-2 text-sm font-bold text-slate-200 transition">
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="mt-8 text-xs text-slate-400 bg-black/30 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                <p>พัฒนาโดย: Mr.Winai Phanarkat</p>
                <p>Line: 0926533228 | Email: winayo@gmail.com</p>
                <a href="https://www.facebook.com/winayo1" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 transition mt-2 pt-2 border-t border-white/10 font-bold">
                    <i className="fa-brands fa-facebook text-lg"></i>
                    <span>ติดตามผู้พัฒนา</span>
                </a>
            </div>
        </div>
    );
};

// --- 3. APP ROOT COMPONENT ---
const App = () => {
    const [page, setPage] = useState('home');
    const [travel, setTravel] = useState({ active: false, msg: '', rotation: 0 }); 
    const mapRef = useRef(null);
    const rotationInterval = useRef(null);
    const [initialAction, setInitialAction] = useState(null);
    
    // ตั้งค่าเริ่มต้นของ initialConfig ให้มี category เป็น 'rice_ministry' เสมอ
    const [initialConfig, setInitialConfig] = useState({ category: 'rice_ministry' });
    
    const appData = useRealtimeData ? useRealtimeData() : { provinceData: {}, regions: {}, crops: [] };

    useEffect(() => {
        if (mapRef.current) return;
        const map = L.map('global-map', { zoomControl: false, attributionControl: false }).setView([13.7563, 100.5018], 5);
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(map);
        mapRef.current = map;

        const hash = window.location.hash;
        
        if (hash.includes('book')) {
             setPage('kaset'); 
             setInitialAction('openKnowledgeCenter');
             map.setView(DON_MUEANG_COORDS, 6); 
        } 
        else if (hash.includes('province=')) {
            const params = new URLSearchParams(hash.substring(1)); 
            const prov = params.get('province');
            const cat = params.get('category');
            if (prov) {
                // ถ้ามี category ใน URL ให้ใช้ค่านั้น ถ้าไม่มีให้ใช้ 'rice_ministry' เป็น default
                setInitialConfig({ 
                    province: decodeURIComponent(prov), 
                    category: cat ? decodeURIComponent(cat) : 'rice_ministry' 
                });
                setPage('kaset');
            }
        }
        else if (hash.includes('video_cat=')) {
            setPage('kaset');
            map.setView(DON_MUEANG_COORDS, 6);
        }
        // --- NEW: Handle Simulation Deep Link with Cloud Transition ---
        else if (hash.includes('sim_item=')) {
            const params = new URLSearchParams(hash.substring(1));
            const name = decodeURIComponent(params.get('sim_item'));
            const area = parseFloat(params.get('sim_area')) || 1;
            const years = parseFloat(params.get('sim_years')) || 10;
            
            // Trigger Matrix Cloud Transition
            setTravel({ active: true, msg: `กำลังดึงข้อมูล: ${name}...`, rotation: 0 });

            // Wait for animation to cover screen
            setTimeout(() => {
                setInitialConfig({ 
                    simItem: name, 
                    area: area, 
                    years: years,
                    category: 'all' // ถ้ามาจากการแชร์โมเดล ให้แสดงทั้งหมด หรือตามประเภทของโมเดลนั้น
                });
                setPage('kaset');
                map.setView(DON_MUEANG_COORDS, 6);
                
                // End animation (fade out)
                setTimeout(() => {
                    setTravel({ active: false, msg: '', rotation: 0 });
                }, 1500);
            }, 2500);
        }

        return () => { if (map) map.remove(); mapRef.current = null; };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (page === 'home' && !travel.active) { 
            if (rotationInterval.current) clearInterval(rotationInterval.current); 
            rotationInterval.current = setInterval(() => { if (map && map._container) map.panBy([1, 0], { animate: false }); }, 50); 
        } 
        else { 
            if (rotationInterval.current) { clearInterval(rotationInterval.current); rotationInterval.current = null; } 
        }
        return () => { if (rotationInterval.current) clearInterval(rotationInterval.current); };
    }, [page, travel.active]);

    const handleLocateAndFly = (lat, lng, province) => {
        if (!mapRef.current) return;
        let targetLat = lat;
        let targetLng = lng;
        let targetProv = province;

        if ((!targetLat || !targetLng) && province && appData.provinceData && appData.provinceData[province]) {
            targetLat = appData.provinceData[province].lat;
            targetLng = appData.provinceData[province].lng;
        }

        if (!targetLat || !targetLng) { targetLat = DON_MUEANG_COORDS[0]; targetLng = DON_MUEANG_COORDS[1]; }

        if (targetProv) { setInitialConfig({ province: targetProv, category: 'all' }); }
        if (rotationInterval.current) { clearInterval(rotationInterval.current); rotationInterval.current = null; }

        const msg = targetProv ? `กำลังเดินทางสู่ ${targetProv}...` : 'กำลังเดินทางสู่พิกัดของคุณ...';
        const center = mapRef.current.getCenter();
        const bearing = getBearing(center.lat, center.lng, targetLat, targetLng);
        
        setTravel({ active: true, msg: msg, rotation: bearing });

        mapRef.current.flyTo([targetLat, targetLng], 10, { animate: true, duration: 4, easeLinearity: 0.1, noMoveStart: true });

        L.marker([targetLat, targetLng], { icon: L.divIcon({ className: 'custom-user-pin', html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>', iconSize: [16, 16] }) }).addTo(mapRef.current);

        setTimeout(() => { setPage('kaset'); setTravel({ active: false, msg: '', rotation: 0 }); }, 4000);
    };

    const handleGoHome = () => { setPage('home'); if (mapRef.current) mapRef.current.setView([13.7563, 100.5018], 5); };

    return (
        <div className="h-screen w-screen overflow-hidden text-slate-200">
            <div id="global-map"></div>
            <CloudOverlay isActive={travel.active} message={travel.msg} rotation={travel.rotation} />
            {page === 'home' && <HomePage onLocate={handleLocateAndFly} isTraveling={travel.active} />}
            {page === 'kaset' && (<KasetCloudApp mapInstance={mapRef.current} onTravelStart={(msg, rotation) => setTravel({ active: true, msg, rotation })} onTravelEnd={() => setTravel({ active: false, msg: '', rotation: 0 })} onGoHome={handleGoHome} isTraveling={travel.active} initialAction={initialAction} initialConfig={initialConfig} onLocate={handleLocateAndFly} />)}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
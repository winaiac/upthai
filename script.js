// --- script.js : Main Entry Point & Map Logic ---

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// Import helpers & components from split files
const { useRealtimeData, normalizeThaiName, getBearing, DON_MUEANG_COORDS, MOCK_CROPS } = window.AppCore;
const { SimulationPanel, CloudOverlay, KnowledgeCenterModal } = window.AppUI;

const KasetCloudApp = ({ mapInstance, onTravelStart, onTravelEnd, onGoHome, isTraveling, initialAction }) => {
    // ... (Existing state)
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [area, setArea] = useState(1);
    const [years, setYears] = useState(25);
    const [results, setResults] = useState(null);
    const [simulatingItem, setSimulatingItem] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPinning, setIsPinning] = useState(false);
    const [mapType, setMapType] = useState('satellite');
    const [sortType, setSortType] = useState('profit');
    const [categoryFilter, setCategoryFilter] = useState('all');
    
    // NEW: State for Knowledge Center Modal
    const [showKnowledgeCenter, setShowKnowledgeCenter] = useState(false);
    // NEW: State for Reading Mode (to hide dashboard)
    const [isReadingBook, setIsReadingBook] = useState(false);

    // Handle Initial Action (Deep Linking)
    useEffect(() => {
        if (initialAction === 'openKnowledgeCenter') {
            setShowKnowledgeCenter(true);
        }
    }, [initialAction]);

    const appData = useRealtimeData();
    // ... (Existing refs & effects)
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

    // ... (Map logic: Auto-switch, Layers, Markers, Pin Drag, Geocoding) - No changes needed
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

    const provinceStats = useMemo(() => { if (!selectedProvince) return null; const exactPop = appData.thaiPop?.find(p => p.province_name === selectedProvince); const statsList = appData.stats ? appData.stats.filter(s => s.province === selectedProvince) : []; const maxYear = statsList.length > 0 ? Math.max(...statsList.map(s => s.year)) : 0; const currentStats = statsList.filter(s => s.year === maxYear); const getValue = (keyword) => { const item = currentStats.find(s => s.topic && s.topic.includes(keyword)); return item ? { val: Number(item.value).toLocaleString(), unit: item.unit } : null; }; return { year: maxYear < 2000 && maxYear > 0 ? maxYear + 543 : maxYear, totalPop: exactPop ? { val: Number(exactPop.population).toLocaleString(), unit: 'คน' } : (getValue('ประชากรทั้งหมด') || getValue('รวม') || { val: appData.provinceData[selectedProvince]?.population || '-', unit: 'คน' }), male: getValue('ชาย'), female: getValue('หญิง'), farmers: getValue('เกษตรกร') || getValue('เกษตร') || getValue('ขึ้นทะเบียน'), }; }, [selectedProvince, appData.stats, appData.provinceData, appData.thaiPop]);

    const activeFloodData = useMemo(() => { let result = { risk_level: 'Low', description: 'ไม่พบข้อมูลความเสี่ยงในจุดนี้ (Default)', source: 'No Match Found', debug: { matched: false, reason: 'Init' } }; if (!appData.floodAlerts || !selectedProvince) { result.debug.reason = 'No alerts loaded or Province not selected'; return result; } const provAlerts = appData.floodAlerts.filter(a => a.province === selectedProvince); if (provAlerts.length === 0) { result.debug.reason = `No alerts for province: ${selectedProvince}`; return result; } if (addressDetails) { const rawTambon = addressDetails.suburb || addressDetails.tambon || addressDetails.quarter || addressDetails.neighbourhood || addressDetails.village || ''; const rawAmphoe = addressDetails.city_district || addressDetails.district || addressDetails.amphoe || ''; const normTambon = normalizeThaiName(rawTambon); const normAmphoe = normalizeThaiName(rawAmphoe); if (normTambon) { const tMatch = provAlerts.find(a => { const dbTambon = normalizeThaiName(a.tambon); return dbTambon && (dbTambon === normTambon || dbTambon.includes(normTambon) || normTambon.includes(dbTambon)); }); if (tMatch) return { ...tMatch, source: 'Supabase (Tambon Match)', debug: { matched: true, type: 'Tambon', record: tMatch, mapData: { t: normTambon, a: normAmphoe } } }; } if (normAmphoe) { const aMatch = provAlerts.find(a => { const dbAmphoe = normalizeThaiName(a.amphoe); return dbAmphoe && (dbAmphoe === normAmphoe || dbAmphoe.includes(normAmphoe) || normAmphoe.includes(dbAmphoe)); }); if (aMatch) return { ...aMatch, source: 'Supabase (Amphoe Match)', debug: { matched: true, type: 'Amphoe', record: aMatch, mapData: { t: normTambon, a: normAmphoe } } }; } result.debug.details = { mapNorm: { t: normTambon, a: normAmphoe }, dbRecordsSample: provAlerts.slice(0, 3).map(a => ({t: normalizeThaiName(a.tambon), a: normalizeThaiName(a.amphoe)})) }; } const provWide = provAlerts.find(a => !a.amphoe && !a.tambon); if (provWide) return { ...provWide, source: 'Supabase (Province Wide)', debug: { matched: true, type: 'Province', record: provWide } }; return result; }, [appData.floodAlerts, selectedProvince, addressDetails]);

    const handleFullscreen = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)); else if (document.exitFullscreen) document.exitFullscreen().then(() => setIsFullscreen(false)); };
    const togglePin = () => setIsPinning(!isPinning);
    const toggleMapType = () => setMapType(prev => prev === 'satellite' ? 'standard' : prev === 'standard' ? 'hybrid' : 'satellite');
    const handleRegionSelect = (r) => { setSelectedRegion(r); setSelectedProvince(null); setResults(null); setIsPinning(false); lastProvinceRef.current = null; };

    // --- MAIN CALCULATION LOGIC ---
    const calculateEconomics = useCallback((newArea) => {
        if (!appData.crops) return [];
        
        // Add Dynamic Integrated Farming Item if not present
        let sourceCrops = [...appData.crops];
        const integratedExists = sourceCrops.some(c => c.name.includes('โคก') || c.category === 'ผสมผสาน');
        if (!integratedExists) {
            sourceCrops.push({ 
                name: "โคก หนอง นา โมเดล", 
                category: "ผสมผสาน", 
                price: 0, 
                yield: 0, 
                cost: 35000, 
                risk: "Low",
                source: 'Generated' 
            });
        }
        
        // ... (Coconut & Durian checks - kept same)
        const coconutExists = sourceCrops.some(c => c.name.includes('มะพร้าว'));
        if (!coconutExists) { const mockCoconut = MOCK_CROPS.find(c => c.name.includes('มะพร้าว')); if(mockCoconut) sourceCrops.push(mockCoconut); }
        const durianExists = sourceCrops.some(c => c.name.includes('ทุเรียน'));
        if (!durianExists) { const mockDurian = MOCK_CROPS.find(c => c.name.includes('ทุเรียน')); if(mockDurian) sourceCrops.push(mockDurian); }

        let processed = sourceCrops.map(c => {
            let avgProfitPerYear = 0;
            let avgCostPerYear = 0;
            let totalCostVal = 0; 

            const isDurian = c.name.includes('ทุเรียน');
            const isRubber = c.name.includes('ยาง') && !c.name.includes('โพนยางคำ');
            const isCoconut = c.name.includes('มะพร้าว');
            // Check for Integrated Farming
            const isIntegrated = c.name.includes('โคก') || c.category === 'ผสมผสาน';

            if (isIntegrated && window.calculateIntegratedEconomics) {
                // Default to 'khoknongna_general' for list view
                const eco = window.calculateIntegratedEconomics('khoknongna_general', newArea, years);
                if (eco) {
                    avgProfitPerYear = eco.avgProfitPerYear;
                    avgCostPerYear = eco.avgCostPerYear;
                    totalCostVal = avgCostPerYear; // Display Avg Cost/Year/Rai
                }
            }
            else if (isDurian && window.calculateDurianEconomics && window.DURIAN_PRESETS) {
                // ... (Existing Durian Logic)
                let variety = 'monthong';
                if (c.name.includes('ชะนี')) variety = 'chanee'; else if (c.name.includes('ก้านยาว')) variety = 'kanyao'; else if (c.name.includes('กระดุม')) variety = 'kradum';
                const eco = window.calculateDurianEconomics(variety, newArea, years);
                if (eco) {
                    let totalProfit = 0; let totalCost = 0;
                    for(let i=0; i<years; i++) {
                        const age = i+1;
                        let yCost = (age <= eco.waitYears) ? (i===0 ? eco.initialCost : eco.maintCostPre) : eco.maintCostPost;
                        let yYield = eco.yieldPerRai;
                        if (age <= eco.waitYears) yYield = 0; else if (age < eco.waitYears + 2) yYield *= 0.3; else if (age < eco.waitYears + 4) yYield *= 0.7;
                        const yRev = yYield * newArea * eco.price;
                        totalProfit += (yRev - yCost); totalCost += yCost;
                    }
                    avgProfitPerYear = totalProfit / years; avgCostPerYear = totalCost / years; totalCostVal = avgCostPerYear; 
                }
            } 
            else if (isRubber && window.calculateRubberEconomics && window.RUBBER_PRESETS) {
                const eco = window.calculateRubberEconomics('rrim600', newArea, years, false, 'd3');
                if (eco) { avgProfitPerYear = eco.avgProfitPerYear; avgCostPerYear = eco.avgCostPerYear; totalCostVal = avgCostPerYear; }
            }
            else if (isCoconut && window.calculateCoconutEconomics && window.COCONUT_PRESETS) {
                 const eco = window.calculateCoconutEconomics('namhom', newArea, years);
                 if (eco) {
                    let totalProfit = 0; let totalCost = 0;
                    for(let i=0; i<years; i++) {
                        const age = i+1;
                        let yCost = 0;
                        if (age <= eco.waitYears) { yCost = (i === 0) ? eco.initialCost : eco.maintCostPre; } else { yCost = eco.maintCostPost; }
                        let yYield = eco.yieldPerRai; 
                        if (age <= eco.waitYears) { yYield = 0; } else if (age < eco.waitYears + 2) { yYield *= 0.5; }
                        const yRev = yYield * newArea * eco.price;
                        totalProfit += (yRev - yCost); totalCost += yCost;
                    }
                    avgProfitPerYear = totalProfit / years; avgCostPerYear = totalCost / years; totalCostVal = avgCostPerYear;
                 }
            }
            else {
                // ... (Existing Fallback Logic)
                let rawYield = c.yield; let pricePerKg = c.price;
                if (c.price > 1000) { pricePerKg = c.price / 1000; } if (c.name.includes('มะพร้าว')) pricePerKg = c.price; 
                let revenue = rawYield * newArea * pricePerKg; let cost = Number(c.cost) || 0;
                if (window.KASET_PRESETS) { const preset = window.getKasetPreset(c.name); if (preset && preset.cycles_per_year) { revenue *= preset.cycles_per_year; cost = (preset.cost_init || cost) * preset.cycles_per_year; } }
                let profitPerYear = revenue - (cost * newArea);
                avgProfitPerYear = profitPerYear; totalCostVal = cost * newArea; 
                if (!isDurian && !isRubber && !isCoconut) { totalCostVal = cost; } else { if (newArea > 0) totalCostVal = avgCostPerYear / newArea; }
            }
            
            let originSource = c.source || 'Mock';
            if (appData.isOnline && c.id) originSource = 'Supabase'; 

            return { ...c, cost: totalCostVal, avgProfitYear: avgProfitPerYear, source: originSource };
        });

        if (categoryFilter !== 'all') {
            if (categoryFilter === 'plant') processed = processed.filter(c => c.category === 'พืชไร่' || c.category === 'พืชสวน' || !c.category);
            else if (categoryFilter === 'animal') processed = processed.filter(c => c.category === 'ปศุสัตว์');
            else if (categoryFilter === 'integrated') processed = processed.filter(c => c.category === 'ผสมผสาน');
            else if (categoryFilter === 'rice_ministry') processed = processed.filter(c => c.name.includes('ข้าว'));
            else if (categoryFilter === 'rubber_ministry') processed = processed.filter(c => c.name.includes('ยาง') && !c.name.includes('โพนยางคำ'));
            else if (categoryFilter === 'coconut_ministry') processed = processed.filter(c => c.name.includes('มะพร้าว')); 
            else if (categoryFilter === 'durian_ministry') processed = processed.filter(c => c.name.includes('ทุเรียน')); 
            // NEW: Ministry of Integrated Farming Filter
            else if (categoryFilter === 'integrated_ministry') processed = processed.filter(c => c.name.includes('โคก') || c.category === 'ผสมผสาน');
            else if (categoryFilter === 'business_ministry') processed = processed.filter(c => c.category === 'ธุรกิจ');
        }
        
        if (sortType === 'profit') { processed.sort((a, b) => b.avgProfitYear - a.avgProfitYear); } 
        else if (sortType === 'payback') { processed.sort((a, b) => { const pbA = a.avgProfitYear > 0 ? (a.cost / a.avgProfitYear) : 999; const pbB = b.avgProfitYear > 0 ? (b.cost / b.avgProfitYear) : 999; return pbA - pbB; }); } 
        else if (sortType === 'risk') { const riskScore = { 'Low': 1, 'Medium': 2, 'High': 3 }; processed.sort((a, b) => (riskScore[a.risk] || 2) - (riskScore[b.risk] || 2)); } 
        else if (sortType === 'balanced') { const riskScore = { 'Low': 1, 'Medium': 1.5, 'High': 2.5 }; processed.sort((a, b) => (b.avgProfitYear / (riskScore[b.risk] || 1.5)) - (a.avgProfitYear / (riskScore[a.risk] || 1.5))); }
        return processed;
    }, [appData.crops, appData.isOnline, sortType, categoryFilter, years]); 

    useEffect(() => { if (selectedProvince) { setResults(calculateEconomics(area)); } }, [calculateEconomics, area, selectedProvince]);

    // Auto-set years Logic
    useEffect(() => {
        if (simulatingItem) {
            if (simulatingItem.name.includes('ยาง') && !simulatingItem.name.includes('โพนยางคำ')) setYears(25);
            else if (simulatingItem.category === 'ผสมผสาน') setYears(15); // Integrated usually needs time for trees
        }
    }, [simulatingItem]);

    // ... (Map Handlers: handleProvinceSelect, handleBack, handleAreaChange - Same as before)
    const handleProvinceSelect = (p) => { setIsPinning(false); setSelectedProvince(p); setMapType('satellite'); const info = appData.provinceData[p]; if (info) { setSoilInfo(info); setPinCoords([info.lat, info.lng]); } if (mapInstance && info && mapInstance._container) { const center = mapInstance.getCenter(); const bearing = getBearing(center.lat, center.lng, info.lat, info.lng); onTravelStart(`กำลังเดินทางไป ${p}...`, bearing); mapInstance.flyTo([info.lat - 0.1, info.lng], 10, { duration: 3 }); setTimeout(() => onTravelEnd(), 3000); } setResults(calculateEconomics(area)); };
    const handleBack = () => { if (isPinning) { setIsPinning(false); return; } if (simulatingItem) { setSimulatingItem(null); return; } if (selectedProvince) { setSelectedProvince(null); setResults(null); lastProvinceRef.current = null; setMapType('satellite'); setPinCoords(null); if (mapInstance && mapInstance._container) mapInstance.flyTo(DON_MUEANG_COORDS, 6, { duration: 2 }); return; } if (selectedRegion) { setSelectedRegion(null); return; } };
    const handleAreaChange = (val) => { const newArea = parseFloat(val) || 0; setArea(newArea); };
    
    // ... (Render variables - Same as before)
    const currentProvInfo = appData.provinceData[selectedProvince];
    const floodColorClass = activeFloodData.risk_level === 'High' ? 'text-red-400' : activeFloodData.risk_level === 'Medium' ? 'text-orange-400' : 'text-green-400';

    return (
        <div className="ui-unified-layer">
            {/* Pass state setter to Knowledge Center to detect reading mode */}
            {showKnowledgeCenter && <KnowledgeCenterModal onClose={() => setShowKnowledgeCenter(false)} onReadMode={setIsReadingBook} />}

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
                {/* ... (Existing Map Buttons) */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    {selectedProvince && !simulatingItem && (<button onClick={togglePin} className={`w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel flex items-center justify-center transition shadow-lg animate-fade-in-up ${isPinning ? 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-white' : 'hover:bg-white/10 text-white'}`} title={isPinning ? "ยืนยันตำแหน่ง" : "ขยับหมุด"}><i className={`fa-solid ${isPinning ? 'fa-check text-lg font-bold' : 'fa-map-location-dot text-sm md:text-base'}`}></i></button>)}
                    <button onClick={toggleMapType} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg" title="เปลี่ยนแผนที่"><i className={`fa-solid ${mapType === 'satellite' ? 'fa-layer-group' : mapType === 'hybrid' ? 'fa-map' : 'fa-earth-americas'} text-sm md:text-base`}></i></button>
                    <button onClick={handleFullscreen} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel hover:bg-white/10 text-white flex items-center justify-center transition shadow-lg" title="เต็มจอ"><i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-sm md:text-base`}></i></button>
                </div>
            </div>

            {/* ... (Existing Province Stats & Address Bar) */}
            {selectedProvince && !isTraveling && (
                // *** UPDATED: Reduced scale to 0.6 and adjusted width to 167% to prevent overflow ***
                <div className="fixed bottom-6 left-0 w-screen origin-bottom-left scale-[0.6] z-[10] flex flex-col md:flex-row items-end justify-between pointer-events-none animate-fade-in-up px-10">
                    <style>{`.text-shadow-heavy { text-shadow: 0 2px 4px rgba(0,0,0,0.9); }`}</style>
                    <div className="mb-4 md:mb-0 text-shadow-heavy">
                        <h3 className="font-bold text-white text-4xl md:text-5xl leading-none tracking-wide">{selectedProvince}</h3>
                        <div className="mt-1">
                            {isAddressLoading ? (<span className="text-xs text-yellow-300 animate-pulse"><i className="fa-solid fa-spinner fa-spin mr-1"></i> กำลังค้นหาที่อยู่...</span>) : address ? (<div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs md:text-sm text-emerald-200 border border-emerald-500/30 shadow-lg inline-block max-w-[250px] md:max-w-md truncate"><i className="fa-solid fa-map-location-dot mr-2 text-emerald-400"></i>{address}</div>) : (pinCoords && <span className="text-xs text-slate-400">{pinCoords[0].toFixed(4)}, {pinCoords[1].toFixed(4)}</span>)}
                        </div>
                    </div>
                    {/* Stats Icons */}
                    <div className="flex flex-wrap items-end gap-4 md:gap-8 text-shadow-heavy pr-12">
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

                {/* --- FIX: Hide Dashboard Panel when Reading --- */}
                {selectedProvince && !simulatingItem && !isReadingBook && (
                    <div className={`w-full max-w-5xl mx-auto flex flex-col h-[80vh] animate-slide-down mt-2`}>
                        <div className="flex-1 glass-panel-clear rounded-b-3xl overflow-hidden flex flex-col shadow-xl border-t-0">
                            <div className="flex flex-wrap gap-2 p-3 border-b border-white/10 items-center justify-between bg-black/20">
                                <div className="flex gap-1 overflow-x-auto scrollbar-prominent pb-1">
                                    {/* NEW: Knowledge Center Button Moved Here */}
                                    <button onClick={() => setShowKnowledgeCenter(true)} className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)] hover:bg-blue-500 transition mr-1"><i className="fa-solid fa-book-journal-whills mr-1"></i>ศูนย์ความรู้</button>
                                    
                                    <button onClick={() => setCategoryFilter('plant')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'plant' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300'}`}>พืชไร่/สวน</button>
                                    <button onClick={() => setCategoryFilter('animal')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'animal' ? 'bg-orange-500 text-white' : 'bg-white/10 text-slate-300'}`}>ฟาร์มสัตว์</button>
                                    <button onClick={() => setCategoryFilter('integrated')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'integrated' ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-300'}`}>เกษตรผสมผสาน</button>
                                    
                                    {/* กระทรวงต่างๆ */}
                                    <button onClick={() => setCategoryFilter('rice_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'rice_ministry' ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/10 text-slate-300'}`}><i className="fa-solid fa-shekel-sign mr-1"></i>กระทรวงชาวนา</button>
                                    <button onClick={() => setCategoryFilter('rubber_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'rubber_ministry' ? 'bg-slate-200 text-slate-900 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/10 text-slate-300'}`}><i className="fa-solid fa-droplet mr-1"></i>กระทรวงยางพารา</button>
                                    <button onClick={() => setCategoryFilter('coconut_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'coconut_ministry' ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]' : 'bg-white/10 text-slate-300'}`}><i className="fa-solid fa-tree mr-1"></i>กระทรวงมะพร้าว</button>
                                    <button onClick={() => setCategoryFilter('durian_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'durian_ministry' ? 'bg-yellow-600 text-white shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-white/10 text-slate-300'}`}><i className="fa-solid fa-crown mr-1"></i>กระทรวงทุเรียน</button>
                                    <button onClick={() => setCategoryFilter('integrated_ministry')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryFilter === 'integrated_ministry' ? 'bg-emerald-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-white/10 text-slate-300'}`}><i className="fa-solid fa-layer-group mr-1"></i>กระทรวงเกษตรผสมผสาน</button>

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
                                                    {item.category === 'ผสมผสาน' && <i className="fa-solid fa-layer-group text-emerald-300 text-xs"></i>}
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
                                                <div className="text-xs text-slate-300">{item.category === 'ธุรกิจ' ? 'ลงทุน:' : 'ลงทุนเฉลี่ย:'} {(item.cost || 0).toLocaleString()} ฿/{item.category === 'ธุรกิจ' ? 'สาขา' : (item.category === 'ปศุสัตว์' ? 'ตัว/รุ่น' : 'ไร่/ปี')}</div>
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
            <div className="mt-8 text-xs text-slate-400 bg-black/30 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                <p>พัฒนาโดย: Mr.Winai Phanarkat</p>
                <p>Line: 0926533228 | Email: winayo@gmail.com</p>
                {/* NEW FACEBOOK BUTTON */}
                <a href="https://www.facebook.com/winayo1" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 transition mt-2 pt-2 border-t border-white/10 font-bold">
                    <i className="fa-brands fa-facebook text-lg"></i>
                    <span>ติดตามผู้พัฒนา</span>
                </a>
            </div>
        </div>
    );
};

const App = () => {
    // ... (Existing App - No changes)
    const [page, setPage] = useState('home');
    const [travel, setTravel] = useState({ active: false, msg: '', rotation: 0 }); 
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
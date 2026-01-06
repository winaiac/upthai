// --- scriptui.js : UI Components (SimulationPanel, Overlay) ---
// อัปเดตล่าสุด: ปรับ Matrix Rain ให้เป็นทรงก้อนเมฆ โปร่งใส และดูพริ้วไหว

(function(global) {
    const { useState, useEffect, useRef, useMemo } = React;

    // --- HELPER: COPY TO CLIPBOARD ---
    const copyToClipboard = (text) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Failed to copy', err);
        }
        document.body.removeChild(textarea);
    };

    // --- SUB-COMPONENT: HANDBOOK MODAL (Responsive Fixed) ---
    const HandbookModal = ({ bookData, onClose }) => {
        if (!bookData) return null;
        
        const [isCopied, setIsCopied] = useState(false);

        useEffect(() => {
            const originalTitle = document.title;
            document.title = `${bookData.title} - Winai Innovation`;
            return () => { document.title = originalTitle; };
        }, [bookData]);

        const handleShareBook = () => {
            const url = `${window.location.origin}${window.location.pathname}#book=${bookData.id || ''}`; 
            copyToClipboard(url);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        };

        const modalContent = (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in pointer-events-auto font-sarabun">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
                <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl border border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col overflow-hidden bg-slate-900/85 backdrop-blur-xl">
                    <div className="p-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-emerald-900/40 to-white/5">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-lg shadow-lg shrink-0">
                                <i className="fa-solid fa-book-open"></i>
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg md:text-xl font-bold text-white truncate">{bookData.title}</h2>
                                {bookData.subtitle && <div className="text-xs text-emerald-400 truncate">{bookData.subtitle}</div>}
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button 
                                onClick={handleShareBook} 
                                className={`w-8 h-8 rounded-full transition flex items-center justify-center ${isCopied ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-emerald-500 text-slate-300 hover:text-white'}`} 
                                title="คัดลอกลิงก์"
                            >
                                <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-share-nodes'}`}></i>
                            </button>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition">
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-prominent bg-transparent">
                        <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-light shadow-black drop-shadow-md">
                            {bookData.content}
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/10 bg-black/20 flex flex-wrap gap-2 justify-between items-center">
                        <a href="https://www.facebook.com/winayo1" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition text-xs">
                            <i className="fa-brands fa-facebook text-lg"></i>
                            <span>ติดตามผู้พัฒนา</span>
                        </a>
                        <button onClick={onClose} className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[70%] transition shadow-lg border border-white/10">
                            รับทราบ / ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            </div>
        );

        if (typeof ReactDOM !== 'undefined' && document.body) {
            return ReactDOM.createPortal(modalContent, document.body);
        }
        return modalContent;
    };

    // --- SUB-COMPONENT: VIDEO GALLERY MODAL (Responsive Fixed) ---
    const VideoGalleryModal = ({ category, videos: propVideos, title: propTitle, onClose }) => {
        const videos = category && window.AppVideo ? window.AppVideo.getVideos(category) : (propVideos || []);
        
        const titleMap = {
            'durian': 'ทุเรียนคุณภาพ & ส่งออก',
            'date_palm': 'อินทผาลัม (เงินล้าน)',
            'mango': 'มะม่วงน้ำดอกไม้สีทอง',
            'sugarcane': 'อ้อยโรงงาน (30 ตัน/ไร่)',
            'cassava': 'มันสำปะหลังระบบน้ำหยด',
            'rice_jasmine': 'ข้าวหอมมะลิ 105',
            'rice_sticky': 'ข้าวเหนียว กข.6',
            'farm_cafe': 'ธุรกิจฟาร์มคาเฟ่ & ท่องเที่ยว',
            'care_elderly': 'ศูนย์ดูแลผู้สูงอายุ (Day Care)',
            'clinic_physio': 'คลินิกกายภาพบำบัด',
            'factory_salad': 'โรงงานแปรรูปผักสลัด',
            'franchise_meatball': 'แฟรนไชส์ลูกชิ้นระเบิด',
            'affiliate': 'นายหน้า Affiliate (TikTok)',
            'solar_farm': 'Solar Farm ขายไฟ'
        };
        
        const title = propTitle || titleMap[category] || category || 'วิดีโอแนะนำ';

        if (!videos || videos.length === 0) return null;

        const handleShare = () => {
            if (!category) return; 
            const url = `${window.location.origin}${window.location.pathname}#video_cat=${category}`;
            copyToClipboard(url);
            
            const btn = document.getElementById('share-btn-icon-v');
            if(btn) {
                btn.className = 'fa-solid fa-check text-emerald-400';
                setTimeout(() => {
                    btn.className = 'fa-solid fa-share-nodes';
                }, 2000);
            }
        };

        const modalContent = (
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-2 sm:p-4 animate-fade-in pointer-events-auto font-sarabun">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
                
                <div className="relative w-[95%] md:w-full max-w-4xl max-h-[90vh] rounded-2xl border border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col overflow-hidden bg-slate-900">
                    
                    <div className="p-4 sm:p-5 border-b border-white/10 flex flex-row justify-between items-start bg-gradient-to-r from-red-900/40 to-slate-900 shrink-0">
                        <div className="flex flex-1 gap-3 pr-2">
                            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white text-lg shadow-lg shrink-0 mt-1">
                                <i className="fa-brands fa-youtube"></i>
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <h2 className="text-base sm:text-lg font-bold text-white leading-normal break-words">
                                    คลังวิดีโอ: <span className="text-red-300">{title}</span>
                                </h2>
                                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">รวมเทคนิคและความรู้ที่คัดสรรมาแล้ว</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mt-1 shrink-0">
                            {category && (
                                <button 
                                    onClick={handleShare}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/50 flex items-center justify-center transition"
                                    title="แชร์หน้านี้"
                                >
                                    <i id="share-btn-icon-v" className="fa-solid fa-share-nodes"></i>
                                </button>
                            )}
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition">
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-prominent">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {videos.map((vid, idx) => (
                                <div key={idx} className="bg-black/40 rounded-xl overflow-hidden border border-white/10 hover:border-red-500/50 transition group flex flex-col">
                                    <div className="relative w-full pb-[56.25%] bg-black">
                                        <iframe 
                                            className="absolute inset-0 w-full h-full"
                                            src={`https://www.youtube.com/embed/${vid.id}`} 
                                            title={vid.title} 
                                            frameBorder="0" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                    <div className="p-3 bg-white/5">
                                        <h3 className="text-sm font-bold text-slate-200 group-hover:text-red-400 transition line-clamp-2 leading-snug">
                                            {vid.title}
                                        </h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );

        if (typeof ReactDOM !== 'undefined' && document.body) {
            return ReactDOM.createPortal(modalContent, document.body);
        }
        return modalContent;
    };

    // --- COMPONENT: KNOWLEDGE CENTER MODAL ---
    const KnowledgeCenterModal = ({ onClose, onReadMode }) => {
        const [selectedBook, setSelectedBook] = useState(null);
        const [isCopied, setIsCopied] = useState(false);
        const library = (window.AppKnowledge && window.AppKnowledge.LIBRARY) ? window.AppKnowledge.LIBRARY : {};

        useEffect(() => {
            if (onReadMode) onReadMode(!!selectedBook);
        }, [selectedBook, onReadMode]);

        const handleCopyLink = () => {
            const url = `${window.location.origin}${window.location.pathname}#book`;
            copyToClipboard(url);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        };

        return (
            <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in pointer-events-auto ${selectedBook ? '' : 'bg-black/80 backdrop-blur-sm'}`}>
                {selectedBook ? (
                    <HandbookModal bookData={selectedBook} onClose={() => setSelectedBook(null)} />
                ) : (
                    <div className="bg-slate-900 w-full max-w-4xl max-h-[85vh] rounded-2xl border border-blue-500/30 shadow-2xl flex flex-col overflow-hidden relative z-10">
                        <div className="p-5 border-b border-white/10 bg-gradient-to-r from-blue-900/40 to-slate-900 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-book-journal-whills text-2xl text-blue-400"></i>
                                <h2 className="text-xl font-bold text-white">ศูนย์ความรู้การเกษตร</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleCopyLink} className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold transition border border-white/10 ${isCopied ? 'bg-emerald-600 text-white' : 'bg-white/10 hover:bg-blue-600 text-slate-300 hover:text-white'}`}>
                                    <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-link'}`}></i>
                                    <span className="hidden sm:inline">{isCopied ? 'คัดลอกแล้ว' : 'แชร์หน้านี้'}</span>
                                </button>
                                <a href="https://www.facebook.com/winayo1" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition shadow-lg" title="ติดตามผู้พัฒนา">
                                    <i className="fa-brands fa-facebook text-lg"></i>
                                </a>
                                <button onClick={onClose} className="text-slate-400 hover:text-white ml-2"><i className="fa-solid fa-times text-xl"></i></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-prominent grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900">
                            {Object.entries(library).map(([key, book]) => (
                                <div key={key} onClick={() => setSelectedBook({...book, id: key})} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 cursor-pointer transition group hover:border-emerald-500/50">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-emerald-900/50 flex items-center justify-center text-emerald-400 text-2xl group-hover:scale-110 transition shrink-0">
                                            <i className="fa-solid fa-book"></i>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white group-hover:text-emerald-300 transition line-clamp-1">{book.title}</h3>
                                            <div className="text-xs text-slate-400 mt-1 line-clamp-2">{book.subtitle}</div>
                                            <span className="inline-block mt-2 text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">{book.type || 'General'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {!selectedBook && <div className="absolute inset-0 -z-10" onClick={onClose}></div>}
            </div>
        );
    };

    // --- MAIN COMPONENT: SIMULATION PANEL ---
    const SimulationPanel = ({ item, onClose, globalArea, setGlobalArea, globalYears, setGlobalYears, floodData, soilInfo, provinceStats }) => {
        const [panelTab, setPanelTab] = useState('financial');
        const [customCosts, setCustomCosts] = useState(null);
        const [showHandbook, setShowHandbook] = useState(false);
        const [showVideo, setShowVideo] = useState(false);

        const isRice = item.name.includes('ข้าว') && !item.name.includes('ข้าวโพด'); 
        const isRubber = item.name.includes('ยาง') && !item.name.includes('โพนยางคำ');
        const isCoconut = item.name.includes('มะพร้าว'); 
        const isDurian = item.name.includes('ทุเรียน');
        const isIntegrated = item.name.includes('โคก') || item.category === 'ผสมผสาน'; 
        const isDatePalm = item.name.includes('อินทผาลัม'); 
        
        const RICE_PRESETS = (typeof window !== 'undefined' && window.RICE_PRESETS) ? window.RICE_PRESETS : {};
        const RUBBER_PRESETS = (typeof window !== 'undefined' && window.RUBBER_PRESETS) ? window.RUBBER_PRESETS : {};
        const COCONUT_PRESETS = (typeof window !== 'undefined' && window.COCONUT_PRESETS) ? window.COCONUT_PRESETS : {};
        const DURIAN_PRESETS = (typeof window !== 'undefined' && window.DURIAN_PRESETS) ? window.DURIAN_PRESETS : {};
        const KASET_PRESETS = (typeof window !== 'undefined' && window.KASET_PRESETS) ? window.KASET_PRESETS : {};
        const INTEGRATED_PRESETS = (typeof window !== 'undefined' && window.INTEGRATED_PRESETS) ? window.INTEGRATED_PRESETS : {};

        const calculateRubberEconomics = (typeof window !== 'undefined' && window.calculateRubberEconomics) ? window.calculateRubberEconomics : null;
        const calculateCoconutEconomics = (typeof window !== 'undefined' && window.calculateCoconutEconomics) ? window.calculateCoconutEconomics : null;
        const calculateDurianEconomics = (typeof window !== 'undefined' && window.calculateDurianEconomics) ? window.calculateDurianEconomics : null;
        const calculateIntegratedEconomics = (typeof window !== 'undefined' && window.calculateIntegratedEconomics) ? window.calculateIntegratedEconomics : null;

        const getKasetPreset = (typeof window !== 'undefined' && window.getKasetPreset) ? window.getKasetPreset : (name) => null;
        const getKasetSteps = (typeof window !== 'undefined' && window.getKasetSteps) ? window.getKasetSteps : (cat) => [];
        const getInitialVariety = (typeof window !== 'undefined' && window.getInitialVariety) ? window.getInitialVariety : (name) => 'jasmine';

        const kasetPreset = (!isRice && !isRubber && !isCoconut && !isDurian && !isIntegrated) ? getKasetPreset(item.name) : null;

        const [riceConfig, setRiceConfig] = useState({ variety: getInitialVariety(item.name), method: 'wan', fertilizer: 'mixed', labor: 'hire', processing: 0 });
        const [rubberConfig, setRubberConfig] = useState({ clone: 'rrim600', isEUDR: false, tapping: 'd3' });
        const [coconutConfig, setCoconutConfig] = useState({ clone: 'namhom' }); 
        const [durianConfig, setDurianConfig] = useState({ variety: 'monthong' }); 
        const [integratedConfig, setIntegratedConfig] = useState({ model: 'khoknongna_general' });
        const [kasetConfig, setKasetConfig] = useState({ cycles: kasetPreset ? kasetPreset.cycles_per_year : 1 });

        const [kasetSteps, setKasetSteps] = useState([]);

        const lineCanvasRef = useRef(null);
        const lineChartRef = useRef(null);

        useEffect(() => {
            if (!isRice && !isRubber && !isCoconut && !isDurian && !isIntegrated && kasetPreset) {
                const steps = getKasetSteps(kasetPreset.category);
                setKasetSteps(steps);
            }
        }, [isRice, isRubber, isCoconut, isDurian, isIntegrated, kasetPreset]);

        useEffect(() => {
            if (isRice) {
                setRiceConfig(prev => ({ ...prev, variety: getInitialVariety(item.name) }));
            }
        }, [item, isRice]);

        useEffect(() => {
            if (isIntegrated && calculateIntegratedEconomics) {
                const eco = calculateIntegratedEconomics(integratedConfig.model, globalArea, globalYears);
                setCustomCosts({ init: eco.initialCost, maint: eco.maintCostPre, integratedEco: eco });
            } else if (isRice) {
                setCustomCosts({ totalOverride: 4500 * globalArea }); 
            } else if (isRubber && calculateRubberEconomics) {
                const eco = calculateRubberEconomics(rubberConfig.clone, globalArea, globalYears, rubberConfig.isEUDR, rubberConfig.tapping);
                setCustomCosts({ init: eco.initialCost, maint: eco.maintCostPre, rubberEco: eco });
            } else if (isCoconut && calculateCoconutEconomics) {
                const eco = calculateCoconutEconomics(coconutConfig.clone, globalArea, globalYears);
                setCustomCosts({ init: eco.initialCost, maint: eco.maintCostPre, coconutEco: eco });
            } else if (isDurian && calculateDurianEconomics) {
                const eco = calculateDurianEconomics(durianConfig.variety, globalArea, globalYears);
                setCustomCosts({ init: eco.initialCost, maint: eco.maintCostPre, durianEco: eco });
            } else if (kasetPreset) { 
                 const initCost = kasetPreset.cost_init || 0;
                 const maintCost = kasetPreset.cost_maint || 0;
                 const cycles = kasetConfig.cycles || kasetPreset.cycles_per_year || 1;
                 setCustomCosts({ init: initCost * globalArea * cycles, maint: maintCost * globalArea });
            } else {
                setCustomCosts({ totalOverride: (item.cost || 0) * globalArea });
            }
        }, [isRice, isRubber, isCoconut, isDurian, isIntegrated, rubberConfig, coconutConfig, durianConfig, integratedConfig, kasetConfig, kasetPreset, globalArea, globalYears, item]);

        const simulationData = useMemo(() => {
            const data = [];
            let cumulative = 0;
            const currentYearBE = new Date().getFullYear() + 543;
            
            const integratedEco = isIntegrated && customCosts?.integratedEco ? customCosts.integratedEco : null;
            const rubberEco = isRubber && customCosts?.rubberEco ? customCosts.rubberEco : null;
            const coconutEco = isCoconut && customCosts?.coconutEco ? customCosts.coconutEco : null;
            const durianEco = isDurian && customCosts?.durianEco ? customCosts.durianEco : null;

            let activePreset = isRice ? RICE_PRESETS[riceConfig.variety] : kasetPreset;
            if (isRubber) activePreset = RUBBER_PRESETS[rubberConfig.clone];
            if (isCoconut) activePreset = COCONUT_PRESETS[coconutConfig.clone];
            if (isDurian) activePreset = DURIAN_PRESETS[durianConfig.variety];
            if (isIntegrated) activePreset = INTEGRATED_PRESETS[integratedConfig.model];
            if (!activePreset) activePreset = item;

            for (let i = 0; i < globalYears; i++) {
                const age = i + 1;
                let yearlyCost = 0;
                let yearlyRev = 0; 
                let advice = [];
                let totalOutput = 0;
                let priceVal = 0;

                if (isIntegrated && integratedEco) {
                    yearlyCost = (i === 0) ? integratedEco.initialCost : integratedEco.maintCostPre;
                    const preset = INTEGRATED_PRESETS[integratedConfig.model];
                    if (preset) {
                        if (age >= 1) yearlyRev += (preset.revenue_stream.daily * 300) * globalArea;
                        if (age >= 1) yearlyRev += (preset.revenue_stream.monthly * 12) * globalArea;
                        if (age >= 2) yearlyRev += preset.revenue_stream.yearly * globalArea;
                        if (age >= 5) yearlyRev += 10000 * globalArea; 
                    }
                    if (i===0) advice.push('🏗️ ขุดโคกหนองนา ปรับปรุงดิน');
                } 
                else if (isRubber && rubberEco) {
                    if (age <= rubberEco.waitYears) {
                        yearlyCost = (i === 0) ? rubberEco.initialCost : rubberEco.maintCostPre;
                        yearlyRev = 0;
                        priceVal = rubberEco.price;
                    } else {
                        yearlyCost = rubberEco.maintCostPost;
                        let yieldEfficiency = 1.0;
                        if (age <= rubberEco.waitYears + 3) yieldEfficiency = 0.6;
                        const tapFactor = rubberConfig.tapping === 'd3' ? 0.75 : 1.0;
                        const yieldKg = rubberEco.yieldPerRai * yieldEfficiency * tapFactor * globalArea;
                        yearlyRev = yieldKg * rubberEco.price;
                        totalOutput = yieldKg;
                        priceVal = rubberEco.price;
                    }
                } 
                else if (isCoconut && coconutEco) {
                     if (age <= coconutEco.waitYears) {
                        yearlyCost = (i === 0) ? coconutEco.initialCost : coconutEco.maintCostPre;
                        yearlyRev = 0;
                        priceVal = coconutEco.price;
                    } else {
                        yearlyCost = coconutEco.maintCostPost;
                        let yieldVal = coconutEco.yieldPerRai * globalArea;
                        if (age < coconutEco.waitYears + 2) yieldVal *= 0.5;
                        yearlyRev = yieldVal * coconutEco.price;
                        totalOutput = yieldVal;
                        priceVal = coconutEco.price;
                    }
                }
                else if (isDurian && durianEco) {
                    if (age <= durianEco.waitYears) {
                       yearlyCost = (i === 0) ? durianEco.initialCost : durianEco.maintCostPre;
                       yearlyRev = 0;
                       priceVal = durianEco.price;
                   } else {
                       yearlyCost = durianEco.maintCostPost;
                       let yieldVal = durianEco.yieldPerRai * globalArea;
                       if (age < durianEco.waitYears + 2) yieldVal *= 0.3;
                       else if (age < durianEco.waitYears + 4) yieldVal *= 0.7;
                       yearlyRev = yieldVal * durianEco.price;
                       totalOutput = yieldVal;
                       priceVal = durianEco.price;
                   }
                }
                else if (isDatePalm) {
                    if (age <= 3) {
                        yearlyCost = (i === 0) ? (kasetPreset.cost_init || 85000) * globalArea : (kasetPreset.cost_maint || 35000) * 0.6 * globalArea;
                        yearlyRev = 0;
                        if (i === 0) advice.push('🌱 เริ่มต้น: แนะนำต้นเนื้อเยื่อ 100% (ป้องกันกลายพันธุ์)');
                    } else {
                        yearlyCost = (kasetPreset.cost_maint || 35000) * globalArea;
                        let yieldVal = (kasetPreset.yield || 2000) * globalArea;
                        if (age < 5) yieldVal *= 0.4;
                        else if (age < 7) yieldVal *= 0.8;
                        let currentPrice = kasetPreset.price || 120;
                        if (age % 4 === 0) { 
                            currentPrice *= 0.7; 
                            advice.push('📉 ระวัง: ราคาร่วงจากผลผลิตล้นตลาด (แปรรูปช่วยได้)');
                        }
                        yearlyRev = yieldVal * currentPrice;
                        totalOutput = yieldVal;
                        priceVal = currentPrice;
                        advice.push('🐝 สำคัญ: ผสมเกสรช่วง ม.ค.-ก.พ. และห่อผลช่วง พ.ค.');
                    }
                }
                else if (kasetPreset) {
                    if (['tree', 'business', 'premium_durian', 'premium_fruit'].includes(kasetPreset.category)) {
                        yearlyCost = (i === 0) ? (customCosts?.init || 0) : (customCosts?.maint || 0);
                    } else {
                        yearlyCost = (customCosts?.init || 0) * (kasetPreset.cycles_per_year || 1);
                    }
                    
                    let price = kasetPreset.price || 0;
                    let yieldVal = kasetPreset.yield || 0;
                    
                    if (kasetPreset.category === 'tree' || kasetPreset.category === 'premium_durian' || kasetPreset.category === 'premium_fruit') {
                         if (age < (kasetPreset.wait_years || 0)) {
                             yieldVal = 0;
                         } else if (age < (kasetPreset.wait_years || 0) + 3) {
                             yieldVal = yieldVal * 0.5;
                         }
                    }
                    
                    yearlyRev = yieldVal * globalArea * price;
                    if (kasetPreset.cycles_per_year) yearlyRev *= kasetPreset.cycles_per_year;
                    
                    totalOutput = yieldVal * globalArea * (kasetPreset.cycles_per_year || 1);
                    priceVal = price;
                }
                else {
                    yearlyCost = (item.cost || 0) * globalArea;
                    let price = item.price || 0;
                    if(item.name.includes('ข้าว') && price > 1000) price /= 1000;
                    yearlyRev = (item.yield || 0) * globalArea * price;
                    totalOutput = (item.yield || 0) * globalArea;
                    priceVal = price;
                }

                let floodRiskLevel = floodData ? floodData.risk_level : 'Low';
                let riskLoss = 0;
                if (floodRiskLevel === 'High' && i % 3 === 0) { 
                    riskLoss = yearlyRev * 0.5; 
                    if(i===0) advice.push('⚠️ เสี่ยงน้ำท่วม: เสียหาย 50%');
                    if(isDatePalm) advice.push('🌧️ อินทผาลัมไม่ชอบฝนช่วงเก็บเกี่ยว (ผลแตก)');
                }
                
                if (isIntegrated && floodRiskLevel === 'High') {
                    riskLoss = riskLoss * 0.5; 
                    if(i===0) advice.push('🛡️ โคกหนองนาช่วยลดความเสียหายน้ำท่วม');
                }

                const yearlyProfit = (yearlyRev - riskLoss) - yearlyCost;
                cumulative += yearlyProfit;

                data.push({
                    year: currentYearBE + i,
                    cost: yearlyCost,
                    revenue: yearlyRev - riskLoss,
                    profit: yearlyProfit,
                    accumulatedProfit: cumulative,
                    analysis: advice,
                    breakEven: (cumulative > 0 && (cumulative - yearlyProfit) <= 0) ? `🎉 คืนทุนปีที่ ${age}` : null,
                    details: { yieldKg: totalOutput, priceVal: priceVal }
                });
            }
            return data;
        }, [item, globalArea, globalYears, isIntegrated, isRice, isRubber, isCoconut, isDurian, isDatePalm, integratedConfig, rubberConfig, coconutConfig, durianConfig, customCosts, floodData, kasetPreset, riceConfig, kasetConfig]);

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
        
        const finalYearData = simulationData[simulationData.length - 1];
        const totalAccumulatedProfit = finalYearData ? finalYearData.accumulatedProfit : 0;
        const averageProfitPerYear = globalYears > 0 ? (totalAccumulatedProfit / globalYears) : 0;
        const breakEvenYearData = simulationData.find(d => d.breakEven);
        const breakEvenText = breakEvenYearData ? breakEvenYearData.breakEven : (totalAccumulatedProfit > 0 ? 'คืนทุนแล้ว (ตั้งแต่เริ่ม)' : 'ยังไม่คืนทุน');

        let availableBookKey = null;
        if (isIntegrated) availableBookKey = 'integrated_research_full';
        if (isDurian) availableBookKey = 'durian_manual'; 
        if (isRice) {
            availableBookKey = 'rice_modern_manual'; 
            if (riceConfig.variety === 'riceberry') availableBookKey = 'riceberry_organic_research';
        }
        if (isRubber) availableBookKey = 'rubber_manual';
        if (isCoconut) availableBookKey = 'coconut_manual';
        if (item.name.includes('โพนยางคำ')) availableBookKey = 'phon_yang_kham_manual';
        if (item.name.includes('หมู') || item.name.includes('สุกร')) availableBookKey = 'pig_manual';
        if (item.name.includes('ข้าวโพด')) availableBookKey = 'maize_manual';
        if (item.name.includes('อินทผาลัม')) availableBookKey = 'date_palm_research';

        const handleOpenHandbook = () => {
            if (availableBookKey && window.AppKnowledge) {
                const book = window.AppKnowledge.getBook(availableBookKey);
                if (book) { setShowHandbook(true); }
            }
        };

        const currentVideoKey = window.AppVideo ? window.AppVideo.getVideoKey(item, { variety: riceConfig.variety }) : null;
        const currentVideos = currentVideoKey ? window.AppVideo.getVideos(currentVideoKey) : [];

        let activePreset = isRice ? RICE_PRESETS[riceConfig.variety] : kasetPreset;
        if (isRubber) activePreset = RUBBER_PRESETS[rubberConfig.clone];
        if (isCoconut) activePreset = COCONUT_PRESETS[coconutConfig.clone];
        if (isDurian) activePreset = DURIAN_PRESETS[durianConfig.variety];
        if (isIntegrated) activePreset = INTEGRATED_PRESETS[integratedConfig.model];
        if (!activePreset) activePreset = item;

        return (
            <div className={`flex flex-col h-full w-full animate-slide-down rounded-b-3xl overflow-hidden shadow-2xl border-t-0 ${showHandbook || showVideo ? '' : 'glass-panel-clear'}`}>
                {showHandbook && availableBookKey && window.AppKnowledge && (
                    <HandbookModal 
                        bookData={window.AppKnowledge.getBook(availableBookKey)} 
                        onClose={() => setShowHandbook(false)} 
                    />
                )}

                {showVideo && currentVideos.length > 0 && (
                    <VideoGalleryModal 
                        videos={currentVideos}
                        title={activePreset?.name || item.name}
                        onClose={() => setShowVideo(false)}
                    />
                )}
                
                {!showHandbook && !showVideo && (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 pt-6">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        {isIntegrated ? <i className="fa-solid fa-layer-group text-emerald-300"></i> : <i className="fa-solid fa-seedling text-emerald-400"></i>}
                                        {activePreset?.name || item.name}
                                    </h2>
                                    <div className="text-xs text-slate-400 mt-1">{isIntegrated ? 'กระทรวงเกษตรผสมผสาน' : 'ข้อมูลทั่วไป'}</div>
                                </div>
                                <div className="flex gap-2">
                                    {currentVideos.length > 0 && (
                                        <button 
                                            onClick={() => setShowVideo(true)} 
                                            className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition shadow-lg animate-pulse"
                                            title="ดูวิดีโอแนะนำ"
                                        >
                                            <i className="fa-brands fa-youtube"></i>
                                        </button>
                                    )}
                                    <button onClick={onClose}><i className="fa-solid fa-times text-slate-400 hover:text-white text-xl"></i></button>
                                </div>
                            </div>

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

                            <div className="flex gap-2 mb-4 bg-black/20 p-1 rounded-xl">
                                <button onClick={() => setPanelTab('financial')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${panelTab === 'financial' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><i className="fa-solid fa-calculator mr-1"></i> โมเดล & กำไร</button>
                                <button onClick={() => setPanelTab('market')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${panelTab === 'market' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><i className="fa-solid fa-tree mr-1"></i> ประโยชน์ระบบนิเวศ</button>
                            </div>

                            {panelTab === 'financial' ? (
                                <div className="space-y-4 animate-fade-in-up">
                                    
                                    {isRice && (
                                        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4">
                                            <h3 className="text-sm font-bold text-indigo-300 mb-3 border-b border-indigo-500/20 pb-2"><i className="fa-solid fa-sliders mr-2"></i>ปรับสูตรการปลูก</h3>
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                {Object.entries(RICE_PRESETS).map(([key, info]) => (
                                                    <button key={key} onClick={() => setRiceConfig({...riceConfig, variety: key})} className={`text-xs p-2 rounded border text-left transition ${riceConfig.variety === key ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                                        <div className="font-bold">{info.name}</div>
                                                        <div className="text-[9px] opacity-70">{info.price.toLocaleString()} ฿/ตัน</div>
                                                    </button>
                                                ))}
                                            </div>
                                            
                                            {availableBookKey && (
                                                <button onClick={handleOpenHandbook} className="w-full mt-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-purple-400/30">
                                                    <i className="fa-solid fa-book-open animate-pulse"></i> 
                                                    {availableBookKey === 'riceberry_organic_research' ? 'อ่านยุทธศาสตร์ข้าวไรซ์เบอร์รี่ (วิจัย)' : 'อ่านคู่มือชาวนามืออาชีพ (วิถีใหม่)'}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* General Handbook Button for other crops including Date Palm */}
                                    {!isIntegrated && !isDurian && !isRice && !isRubber && availableBookKey && (
                                        <div className="mb-4">
                                            <button onClick={handleOpenHandbook} className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-blue-400/30">
                                                <i className="fa-solid fa-book-open animate-pulse"></i> 
                                                {availableBookKey === 'maize_manual' ? 'อ่านยุทธศาสตร์ข้าวโพดเลี้ยงสัตว์' : 
                                                 availableBookKey === 'date_palm_research' ? 'อ่านวิจัยยุทธศาสตร์อินทผลัม' :
                                                 'อ่านคู่มือการจัดการ'}
                                            </button>
                                        </div>
                                    )}

                                    {kasetPreset && !isRice && !isRubber && !isCoconut && !isDurian && !isIntegrated && (
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

                                    <div className="bg-black/30 p-3 rounded-xl border border-white/10 text-xs space-y-2 shadow-inner">
                                        <div className="font-bold text-slate-300 border-b border-white/10 pb-1 mb-2 flex justify-between items-center">
                                            <span>สรุปการเงิน (Financial Summary)</span>
                                            <span className="text-[9px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/50">รวม {globalYears} ปี</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-2">
                                            <div>
                                                <div className="text-slate-400 text-[10px]">กำไรสุทธิรวม (ตัวเงิน+ทรัพย์สิน)</div>
                                                <div className="font-bold text-emerald-400 text-base">{totalAccumulatedProfit.toLocaleString(undefined, {maximumFractionDigits: 0})} ฿</div>
                                            </div>
                                            <div>
                                                <div className="text-slate-400 text-[10px]">เฉลี่ยกำไร/ปี</div>
                                                <div className="font-bold text-yellow-400 text-base">{averageProfitPerYear.toLocaleString(undefined, {maximumFractionDigits: 0})} ฿/ปี</div>
                                            </div>
                                        </div>
                                        {breakEvenText && <div className="text-center text-orange-300 font-bold mt-2 animate-pulse text-[10px]">{breakEvenText}</div>}
                                    </div>
                                    <div className="h-48 bg-black/20 rounded-xl p-2 border border-white/5 relative mt-4"><canvas ref={lineCanvasRef}></canvas></div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-slide-in-right">
                                    {isIntegrated ? (
                                        <>
                                            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4">
                                                <h3 className="text-sm font-bold text-indigo-300 mb-3 border-b border-indigo-500/20 pb-2"><i className="fa-solid fa-tree mr-2"></i>หลักการ 3 ป่า 4 ประโยชน์</h3>
                                                <div className="space-y-2 text-xs">
                                                    {benefits.map((b, idx) => (
                                                        <div key={idx} className="flex items-start gap-2">
                                                            <i className="fa-solid fa-check text-green-400 mt-0.5"></i>
                                                            <span className="text-slate-300">{b}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {specialPlants.length > 0 && (
                                                <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
                                                    <h3 className="text-sm font-bold text-orange-300 mb-3 border-b border-orange-500/20 pb-2"><i className="fa-solid fa-leaf mr-2"></i>พืชแนะนำ (ทนเค็ม/เศรษฐกิจ)</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {specialPlants.map((p, idx) => (
                                                            <span key={idx} className="bg-orange-500/10 border border-orange-500/30 px-2 py-1 rounded text-[10px] text-orange-200">{p}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center text-slate-400 py-10">ข้อมูลเพิ่มเติมอยู่ในหน้าหลัก</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    };

    const CloudOverlay = ({ isActive, message, rotation = 0 }) => {
        // --- MATRIX EFFECT LOGIC ---
        const canvasRef = useRef(null);
        
        useEffect(() => {
            if (!isActive || !canvasRef.current) return;
            
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            let animationFrameId;

            // Set canvas size
            const resizeCanvas = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };
            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();

            // Matrix characters (Agricultural + Digital mix)
            const chars = '01ไอทีเกษตร🌾🌱🚜💧☀💻📱📡AI5G'.split('');
            const fontSize = 14; // Slightly smaller for denser cloud
            const columns = canvas.width / fontSize;
            const drops = Array(Math.floor(columns)).fill(1);

            const draw = () => {
                // Fade out effect
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = 'rgba(52, 211, 153, 0.5)'; // Emerald-ish Green, Semi-transparent
                ctx.font = `${fontSize}px 'Courier Prime', monospace`;

                for (let i = 0; i < drops.length; i++) {
                    const text = chars[Math.floor(Math.random() * chars.length)];
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    drops[i]++;
                }
                animationFrameId = requestAnimationFrame(draw);
            };

            draw();

            return () => {
                cancelAnimationFrame(animationFrameId);
                window.removeEventListener('resize', resizeCanvas);
            };
        }, [isActive]);

        return (
            <div 
                className={`cloud-container ${isActive ? 'active' : ''}`} 
                style={{ backgroundColor: 'transparent' }} // Override black bg
            >
                {/* Matrix Canvas Background with Cloud Mask */}
                <canvas 
                    ref={canvasRef} 
                    id="matrix-canvas" 
                    className="absolute inset-0 z-0"
                    style={{
                        maskImage: 'radial-gradient(closest-side, black 40%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(closest-side, black 40%, transparent 100%)',
                        opacity: 0.7, // Overall transparency
                    }}
                ></canvas>
                
                {/* Foreground Content */}
                {message && (
                    <div className="travel-message flex flex-col items-center z-10">
                        <div className="text-6xl text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-pulse">
                            <i className="fa-solid fa-plane-up transition-transform duration-700 ease-in-out" style={{ transform: `rotate(${rotation}deg)` }}></i>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold glass-panel-clear px-10 py-6 rounded-full text-white tracking-wide shadow-[0_0_50px_rgba(16,185,129,0.4)] matrix-text border border-emerald-500/30">
                            {message}
                        </h2>
                    </div>
                )}
            </div>
        );
    };

    // Expose Components (FULL EXPORT - DO NOT ABBREVIATE)
    global.AppUI = {
        SimulationPanel,
        CloudOverlay,
        KnowledgeCenterModal,
        VideoGalleryModal // Export VideoGalleryModal for use in Dashboard (script.js)
    };

})(window);
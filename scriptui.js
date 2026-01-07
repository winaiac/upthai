// --- scriptui.js : UI Components (SimulationPanel, Overlay) ---
// อัปเดตล่าสุด: ขยายส่วนหัว (Immersive Header) และย้ายปุ่มควบคุมทั้งหมดไปไว้บนวิดีโอ (Overlay Controls)

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

    // --- HELPER: GET COVER IMAGE ---
    // คัดเลือกภาพ Unsplash ที่สื่อความหมายดีที่สุดสำหรับแต่ละธุรกิจ
    const getCoverImage = (name, category) => {
        const n = name.toLowerCase();
        
        // *** FIX: Priority 1 - ตรวจสอบหมูปิ้งก่อนเสมอ ***
        if (n.includes('หมูปิ้ง') || n.includes('moo ping')) return 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80'; 

        // --- 1. กลุ่มเกษตรหลัก (Agriculture) ---
        if (n.includes('ข้าว') && !n.includes('โพด') && !n.includes('หมู')) return 'https://images.unsplash.com/photo-1535242208474-9a2793260ca8?auto=format&fit=crop&w=800&q=80'; // ทุ่งนา
        if (n.includes('ยางพารา')) return 'https://images.unsplash.com/photo-1598064977473-b78f4b005c28?auto=format&fit=crop&w=800&q=80'; // สวนยาง
        if (n.includes('ทุเรียน')) return 'https://images.unsplash.com/photo-1591347073229-79759c6c7689?auto=format&fit=crop&w=800&q=80'; // ทุเรียน
        if (n.includes('มะพร้าว')) return 'https://images.unsplash.com/photo-1622396481328-9b1b9e879799?auto=format&fit=crop&w=800&q=80'; // มะพร้าว
        if (n.includes('ข้าวโพด')) return 'https://images.unsplash.com/photo-1601648764658-ad77726985fa?auto=format&fit=crop&w=800&q=80'; // ข้าวโพด
        if (n.includes('อินทผาลัม')) return 'https://images.unsplash.com/photo-1563426732357-19493952e85e?auto=format&fit=crop&w=800&q=80'; // อินทผาลัม
        if (n.includes('โคก') || category === 'ผสมผสาน') return 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&w=800&q=80'; // ธรรมชาติ/เกษตรผสมผสาน
        if (n.includes('หมู') || n.includes('สุกร')) {
            return 'https://images.unsplash.com/photo-1604848698030-c434ba08ece1?auto=format&fit=crop&w=800&q=80'; // ฟาร์มหมู
        }

        // --- 2. กลุ่มธุรกิจ (Business Ministry) ---
        if (n.includes('คาเฟ่')) return 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80'; // ร้านกาแฟในสวน
        if (n.includes('กาแฟ')) return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80'; // กาแฟดริป/โบราณ
        if (n.includes('ชานม') || n.includes('ไข่มุก')) return 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?auto=format&fit=crop&w=800&q=80'; // ชานมไข่มุก
        if (n.includes('แซนด์วิช')) return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80'; // แซนด์วิช
        if (n.includes('หมูกระทะ') || n.includes('บุฟเฟต์')) return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80'; // ปิ้งย่าง
        if (n.includes('ผู้สูงอายุ')) return 'https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?auto=format&fit=crop&w=800&q=80'; // ดูแลผู้สูงอายุ
        if (n.includes('กายภาพ')) return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'; // กายภาพบำบัด
        if (n.includes('สลัด')) return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'; // ผักสลัด
        if (n.includes('ลูกชิ้น')) return 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80'; // ลูกชิ้นปิ้ง
        if (n.includes('ออนไลน์') || n.includes('affiliate') || n.includes('live')) return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'; // การตลาดออนไลน์
        if (n.includes('content') || n.includes('creator')) return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80'; // Content Creator
        if (n.includes('dropship')) return 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=800&q=80'; // E-commerce
        if (n.includes('รถพุ่มพวง') || n.includes('food truck')) return 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=800&q=80'; // Food Truck
        if (n.includes('ต้นไม้')) return 'https://images.unsplash.com/photo-1463320898484-cdee8141c787?auto=format&fit=crop&w=800&q=80'; // ร้านต้นไม้
        if (n.includes('solar')) return 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80'; // แผงโซลาร์เซลล์
        if (n.includes('โฮมสเตย์') || n.includes('เต็นท์')) return 'https://images.unsplash.com/photo-1496545672479-7f9462d5edd2?auto=format&fit=crop&w=800&q=80'; // แคมป์ปิ้ง/โฮมสเตย์
        
        // Default
        return 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'; // ธรรมชาติทั่วไป
    };

    // --- SUB-COMPONENT: HANDBOOK PANEL (Embedded) ---
    const HandbookPanel = ({ bookData, onClose }) => {
        if (!bookData) return null;
        
        const [isCopied, setIsCopied] = useState(false);

        const handleShareBook = () => {
            const url = `${window.location.origin}${window.location.pathname}#book=${bookData.id || ''}`; 
            copyToClipboard(url);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        };

        return (
            <div className="w-full h-full flex flex-col bg-slate-900/85 backdrop-blur-xl rounded-b-3xl overflow-hidden border-t-0 animate-fade-in">
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-emerald-900/40 to-white/5 shrink-0">
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

                <div className="p-4 border-t border-white/10 bg-black/20 flex flex-wrap gap-2 justify-between items-center shrink-0">
                    <a href="https://www.facebook.com/winayo1" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition text-xs">
                        <i className="fa-brands fa-facebook text-lg"></i>
                        <span>ติดตามผู้พัฒนา</span>
                    </a>
                    <button onClick={onClose} className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[70%] transition shadow-lg border border-white/10">
                        กลับหน้ารายการ
                    </button>
                </div>
            </div>
        );
    };

    // --- SUB-COMPONENT: VIDEO GALLERY PANEL (Embedded) ---
    const VideoGalleryPanel = ({ category, videos: propVideos, title: propTitle, onClose }) => {
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
            'solar_farm': 'Solar Farm ขายไฟ',
            'moo_ping': 'ข้าวเหนียวหมูปิ้งเงินล้าน'
        };
        
        const title = propTitle || titleMap[category] || category || 'วิดีโอแนะนำ';

        if (!videos || videos.length === 0) return <div className="p-10 text-center text-white">ไม่พบวิดีโอ</div>;

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

        return (
            <div className="w-full h-full flex flex-col bg-slate-900 rounded-b-3xl overflow-hidden border border-red-500/30 shadow-2xl animate-fade-in">
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

                <div className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-prominent bg-slate-900">
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
        );
    };

    // --- COMPONENT: KNOWLEDGE CENTER PANEL (Embedded) ---
    const KnowledgeCenterPanel = ({ onClose, onReadMode }) => {
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

        if (selectedBook) {
            return (
                <HandbookPanel 
                    bookData={selectedBook} 
                    onClose={() => setSelectedBook(null)} 
                />
            );
        }

        return (
            <div className="w-full h-full flex flex-col bg-slate-900 rounded-b-3xl overflow-hidden border-t-0 border border-blue-500/30 shadow-2xl animate-fade-in">
                <div className="p-5 border-b border-white/10 bg-gradient-to-r from-blue-900/40 to-slate-900 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <i className="fa-solid fa-book-journal-whills text-2xl text-blue-400"></i>
                        <h2 className="text-xl font-bold text-white">ศูนย์ความรู้การเกษตร & ธุรกิจ</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleCopyLink} className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold transition border border-white/10 ${isCopied ? 'bg-emerald-600 text-white' : 'bg-white/10 hover:bg-blue-600 text-slate-300 hover:text-white'}`}>
                            <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-link'}`}></i>
                            <span className="hidden sm:inline">{isCopied ? 'คัดลอกแล้ว' : 'แชร์หน้านี้'}</span>
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-white ml-2">
                            <i className="fa-solid fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 scrollbar-prominent grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900">
                    {Object.entries(library).map(([key, book]) => (
                        <div key={key} onClick={() => setSelectedBook({...book, id: key})} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 cursor-pointer transition group hover:border-emerald-500/50 flex flex-col">
                            <div className="flex items-start gap-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition shrink-0 ${book.type === 'Business Manual' ? 'bg-purple-900/50 text-purple-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                                    <i className={`fa-solid ${book.type === 'Business Manual' || book.type === 'SME Starter' ? 'fa-briefcase' : 'fa-book'}`}></i>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white group-hover:text-emerald-300 transition line-clamp-1">{book.title}</h3>
                                    <div className="text-xs text-slate-400 mt-1 line-clamp-2">{book.subtitle}</div>
                                    <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded text-slate-300 border ${book.type === 'Business Manual' ? 'bg-purple-900/30 border-purple-500/30' : 'bg-slate-800 border-slate-700'}`}>{book.type || 'General'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- MAIN COMPONENT: SIMULATION PANEL ---
    const SimulationPanel = ({ item, onClose, globalArea, setGlobalArea, globalYears, setGlobalYears, floodData, soilInfo, provinceStats }) => {
        const [panelTab, setPanelTab] = useState('financial');
        const [customCosts, setCustomCosts] = useState(null);
        const [showHandbook, setShowHandbook] = useState(false);
        const [showVideo, setShowVideo] = useState(false);
        const [isCopied, setIsCopied] = useState(false);
        
        // --- NEW: VIDEO HEADER STATE ---
        const [showVideoHeader, setShowVideoHeader] = useState(true);

        // --- CALCULATION LOGIC ---
        const isRice = item.name.includes('ข้าว') && !item.name.includes('ข้าวโพด') && !item.name.includes('หมูปิ้ง'); 
        const isRubber = item.name.includes('ยาง') && !item.name.includes('โพนยางคำ');
        const isCoconut = item.name.includes('มะพร้าว'); 
        const isDurian = item.name.includes('ทุเรียน');
        const isIntegrated = item.name.includes('โคก') || item.category === 'ผสมผสาน'; 
        const isDatePalm = item.name.includes('อินทผาลัม'); 
        
        const RICE_PRESETS = (typeof window !== 'undefined' && window.RICE_PRESETS) ? window.RICE_PRESETS : {};
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
            if (isRice) { setRiceConfig(prev => ({ ...prev, variety: getInitialVariety(item.name) })); }
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
                } else if (isRubber && rubberEco) {
                     if (age <= rubberEco.waitYears) {
                        yearlyCost = (i === 0) ? rubberEco.initialCost : rubberEco.maintCostPre;
                        yearlyRev = 0; priceVal = rubberEco.price;
                    } else {
                        yearlyCost = rubberEco.maintCostPost;
                        let yieldEfficiency = 1.0;
                        if (age <= rubberEco.waitYears + 3) yieldEfficiency = 0.6;
                        const tapFactor = rubberConfig.tapping === 'd3' ? 0.75 : 1.0;
                        const yieldKg = rubberEco.yieldPerRai * yieldEfficiency * tapFactor * globalArea;
                        yearlyRev = yieldKg * rubberEco.price;
                        totalOutput = yieldKg; priceVal = rubberEco.price;
                    }
                } else if (isCoconut && coconutEco) {
                     if (age <= coconutEco.waitYears) {
                        yearlyCost = (i === 0) ? coconutEco.initialCost : coconutEco.maintCostPre;
                        yearlyRev = 0; priceVal = coconutEco.price;
                    } else {
                        yearlyCost = coconutEco.maintCostPost;
                        let yieldVal = coconutEco.yieldPerRai * globalArea;
                        if (age < coconutEco.waitYears + 2) yieldVal *= 0.5;
                        yearlyRev = yieldVal * coconutEco.price;
                        totalOutput = yieldVal; priceVal = coconutEco.price;
                    }
                } else if (isDurian && durianEco) {
                    if (age <= durianEco.waitYears) {
                       yearlyCost = (i === 0) ? durianEco.initialCost : durianEco.maintCostPre;
                       yearlyRev = 0; priceVal = durianEco.price;
                   } else {
                       yearlyCost = durianEco.maintCostPost;
                       let yieldVal = durianEco.yieldPerRai * globalArea;
                       if (age < durianEco.waitYears + 2) yieldVal *= 0.3;
                       else if (age < durianEco.waitYears + 4) yieldVal *= 0.7;
                       yearlyRev = yieldVal * durianEco.price;
                       totalOutput = yieldVal; priceVal = durianEco.price;
                   }
                } else if (isDatePalm) {
                    if (age <= 3) {
                        yearlyCost = (i === 0) ? (kasetPreset.cost_init || 85000) * globalArea : (kasetPreset.cost_maint || 35000) * 0.6 * globalArea;
                        yearlyRev = 0;
                    } else {
                        yearlyCost = (kasetPreset.cost_maint || 35000) * globalArea;
                        let yieldVal = (kasetPreset.yield || 2000) * globalArea;
                        if (age < 5) yieldVal *= 0.4; else if (age < 7) yieldVal *= 0.8;
                        let currentPrice = kasetPreset.price || 120;
                        if (age % 4 === 0) currentPrice *= 0.7; 
                        yearlyRev = yieldVal * currentPrice;
                        totalOutput = yieldVal; priceVal = currentPrice;
                    }
                } else if (kasetPreset) {
                    if (['tree', 'business', 'premium_durian', 'premium_fruit'].includes(kasetPreset.category)) {
                        yearlyCost = (i === 0) ? (customCosts?.init || 0) : (customCosts?.maint || 0);
                    } else {
                        yearlyCost = (customCosts?.init || 0) * (kasetPreset.cycles_per_year || 1);
                    }
                    let price = kasetPreset.price || 0;
                    let yieldVal = kasetPreset.yield || 0;
                    if (['tree', 'premium_durian', 'premium_fruit'].includes(kasetPreset.category)) {
                         if (age < (kasetPreset.wait_years || 0)) yieldVal = 0;
                         else if (age < (kasetPreset.wait_years || 0) + 3) yieldVal *= 0.5;
                    }
                    yearlyRev = yieldVal * globalArea * price;
                    if (kasetPreset.cycles_per_year) yearlyRev *= kasetPreset.cycles_per_year;
                    totalOutput = yieldVal * globalArea * (kasetPreset.cycles_per_year || 1); priceVal = price;
                } else {
                    yearlyCost = (item.cost || 0) * globalArea;
                    let price = item.price || 0;
                    if(item.name.includes('ข้าว') && price > 1000) price /= 1000;
                    yearlyRev = (item.yield || 0) * globalArea * price;
                    totalOutput = (item.yield || 0) * globalArea; priceVal = price;
                }
                
                let floodRiskLevel = floodData ? floodData.risk_level : 'Low';
                let riskLoss = 0;
                if (floodRiskLevel === 'High' && i % 3 === 0) { 
                    riskLoss = yearlyRev * 0.5; 
                }
                if (isIntegrated && floodRiskLevel === 'High') { riskLoss = riskLoss * 0.5; }

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
        }, [simulationData, panelTab, customCosts, showHandbook, showVideo]);

        if (!customCosts) return <div className="p-10 text-center text-slate-400">กำลังคำนวณโมเดล...</div>;
        
        // --- 1. DETERMINE AVAILABLE HANDBOOK (MAPPING LOGIC) ---
        let availableBookKey = null;
        const itemName = item.name.toLowerCase();

        // 1.1 เกษตรหลัก
        if (isIntegrated) availableBookKey = 'integrated_research_full';
        if (isDurian) availableBookKey = 'durian_manual'; 
        if (isRice) {
            availableBookKey = 'rice_modern_manual'; 
            if (riceConfig.variety === 'riceberry') availableBookKey = 'riceberry_organic_research';
        }
        if (isRubber) availableBookKey = 'rubber_manual';
        if (isCoconut) availableBookKey = 'coconut_manual';
        if (itemName.includes('โพนยางคำ')) availableBookKey = 'phon_yang_kham_manual';
        if (itemName.includes('หมู') && !itemName.includes('หมูปิ้ง') && (itemName.includes('สุกร') || itemName.includes('ขุน'))) availableBookKey = 'pig_manual';
        if (itemName.includes('ข้าวโพด')) availableBookKey = 'maize_manual';
        if (itemName.includes('อินทผาลัม')) availableBookKey = 'date_palm_research';

        // 1.2 ธุรกิจ (Business Ministry) - Mapping Logic
        if (itemName.includes('ฟาร์มคาเฟ่')) availableBookKey = 'biz_farm_cafe';
        else if (itemName.includes('กาแฟ') && (itemName.includes('โบราณ') || itemName.includes('slow'))) availableBookKey = 'biz_street_coffee';
        else if (itemName.includes('ชานม') || itemName.includes('ไข่มุก')) availableBookKey = 'biz_bubble_tea';
        else if (itemName.includes('แซนด์วิช')) availableBookKey = 'biz_sandwich';
        else if (itemName.includes('หมูกระทะ') || itemName.includes('บุฟเฟต์')) availableBookKey = 'biz_buffet';
        else if (itemName.includes('ผู้สูงอายุ') || itemName.includes('day care')) availableBookKey = 'biz_elderly_care';
        else if (itemName.includes('กายภาพ')) availableBookKey = 'biz_physio_clinic';
        else if (itemName.includes('ผักสลัด') || itemName.includes('salad')) availableBookKey = 'biz_salad_factory';
        else if (itemName.includes('ลูกชิ้น')) availableBookKey = 'biz_meatball';
        else if (itemName.includes('affiliate')) availableBookKey = 'biz_affiliate';
        else if (itemName.includes('live') && itemName.includes('ขาย')) availableBookKey = 'biz_live_commerce';
        else if (itemName.includes('content') || itemName.includes('creator')) availableBookKey = 'biz_content_creator';
        else if (itemName.includes('dropship')) availableBookKey = 'biz_dropship';
        else if (itemName.includes('รถพุ่มพวง') || itemName.includes('food truck')) availableBookKey = 'biz_mobile_truck';
        else if (itemName.includes('ต้นไม้') || itemName.includes('plant')) availableBookKey = 'biz_plant_shop';
        else if (itemName.includes('solar') || itemName.includes('ขายไฟ')) availableBookKey = 'biz_solar_farm';
        else if (itemName.includes('โฮมสเตย์') || itemName.includes('กางเต็นท์')) availableBookKey = 'biz_homestay';
        
        // --- เพิ่ม Mapping หมูปิ้ง ---
        else if (itemName.includes('หมูปิ้ง') || itemName.includes('moo ping')) availableBookKey = 'biz_moo_ping';

        // --- PREPARE VIDEO HEADER ---
        const currentVideoKey = window.AppVideo ? window.AppVideo.getVideoKey(item, { variety: riceConfig.variety }) : null;
        const currentVideos = currentVideoKey ? window.AppVideo.getVideos(currentVideoKey) : [];
        const firstVideoId = currentVideos.length > 0 ? currentVideos[0].id : null; // Get first video for header

        const finalYearData = simulationData[simulationData.length - 1];
        const totalAccumulatedProfit = finalYearData ? finalYearData.accumulatedProfit : 0;
        const averageProfitPerYear = globalYears > 0 ? (totalAccumulatedProfit / globalYears) : 0;
        const breakEvenYearData = simulationData.find(d => d.breakEven);
        const breakEvenText = breakEvenYearData ? breakEvenYearData.breakEven : (totalAccumulatedProfit > 0 ? 'คืนทุนแล้ว (ตั้งแต่เริ่ม)' : 'ยังไม่คืนทุน');

        // Share Function for Main Simulation Panel (Updated Logic)
        const handleShareSimulation = () => {
            const areaUnit = (item.category === 'ธุรกิจ' || (item.category && item.category.includes('business'))) ? 'สาขา' : 'ไร่';
            
            // Construct Smart Link (Direct to Simulation)
            const baseUrl = window.location.href.split('#')[0];
            const shareUrl = `${baseUrl}#sim_item=${encodeURIComponent(item.name)}&sim_area=${globalArea}&sim_years=${globalYears}`;

            const summary = `
📊 สรุปโมเดล: ${item.name}
📍 พื้นที่: ${globalArea.toLocaleString()} ${areaUnit}
⏳ ระยะเวลา: ${globalYears} ปี
💰 กำไรสุทธิรวม: ${totalAccumulatedProfit.toLocaleString()} บาท
💸 กำไรเฉลี่ย/ปี: ${averageProfitPerYear.toLocaleString()} บาท

สร้างโดย: Winai Innovation
${shareUrl}
            `.trim();
            copyToClipboard(summary);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        };

        // --- RENDER LOGIC: SWAP CONTENT IN PLACE ---
        if (showHandbook && availableBookKey && window.AppKnowledge) {
            return (
                <HandbookPanel 
                    bookData={window.AppKnowledge.getBook(availableBookKey)} 
                    onClose={() => setShowHandbook(false)} 
                />
            );
        }

        if (showVideo && currentVideos.length > 0) {
            return (
                <VideoGalleryPanel 
                    category={currentVideoKey}
                    videos={currentVideos}
                    title={item.name}
                    onClose={() => setShowVideo(false)}
                />
            );
        }

        const coverImg = getCoverImage(item.name, item.category);

        // Main Simulation View
        return (
            <div className={`flex flex-col h-full w-full animate-slide-down rounded-b-3xl overflow-hidden shadow-2xl border-t-0 glass-panel-clear`}>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 pt-6">
                    
                    {/* --- ADDED: Cover Image/Video Banner (UPDATED: Immersive Controls) --- */}
                    {/* ขยายความสูงของส่วนหัวเป็น h-56/h-80 และรวมปุ่มควบคุมเข้าไปข้างใน */}
                    <div className="w-full h-56 md:h-80 rounded-xl mb-4 shadow-lg overflow-hidden relative group bg-black">
                        {firstVideoId && showVideoHeader ? (
                            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                                <iframe 
                                    // *** FIX: ใช้เทคนิค Scale 300% + Aspect-Video เพื่อบังคับสัดส่วน 16:9 และ Crop ส่วนเกินออก (แก้ขอบดำ) ***
                                    src={`https://www.youtube.com/embed/${firstVideoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${firstVideoId}&showinfo=0&modestbranding=1&iv_load_policy=3&disablekb=1&rel=0&playsinline=1&vq=tiny`}
                                    className="absolute top-1/2 left-1/2 w-[300%] aspect-video -translate-x-1/2 -translate-y-1/2 object-cover opacity-60 pointer-events-none"
                                    allow="autoplay; encrypted-media"
                                    frameBorder="0"
                                ></iframe>
                            </div>
                        ) : (
                            <div 
                                className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                                style={{ backgroundImage: `url(${coverImg})` }}
                            ></div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                        
                        {/* --- TOP RIGHT CONTROLS (OVERLAY) --- */}
                        {/* รวมปุ่มทั้งหมดไว้ที่มุมขวาบนของวิดีโอ */}
                        <div className="absolute top-3 right-3 z-20 flex gap-2 items-center">
                            
                            {/* 1. ปุ่มเล่น/หยุดวิดีโอปก (ถ้ามี) */}
                            {firstVideoId && (
                                <button 
                                    onClick={() => setShowVideoHeader(!showVideoHeader)}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition backdrop-blur-md border border-white/10 shadow-lg ${showVideoHeader ? 'bg-red-600/80 text-white animate-pulse' : 'bg-black/40 text-slate-300 hover:text-white hover:bg-black/60'}`}
                                    title={showVideoHeader ? "ปิดวิดีโอหน้าปก" : "เล่นวิดีโอหน้าปก"}
                                >
                                    <i className={`fa-solid ${showVideoHeader ? 'fa-pause' : 'fa-play'}`}></i>
                                </button>
                            )}

                             {/* 2. ปุ่มแชร์ */}
                             <button 
                                onClick={handleShareSimulation} 
                                className={`w-9 h-9 rounded-full transition flex items-center justify-center shadow-lg backdrop-blur-md border border-white/10 ${isCopied ? 'bg-emerald-500 text-white' : 'bg-black/40 text-slate-300 hover:text-white hover:bg-black/60'}`}
                                title="แชร์สรุปผลลัพธ์"
                            >
                                <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-share-nodes'}`}></i>
                            </button>

                            {/* 3. ปุ่มคลังวิดีโอ YouTube */}
                            {currentVideos.length > 0 && (
                                <button 
                                    onClick={() => setShowVideo(true)} 
                                    className="w-9 h-9 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center transition shadow-lg backdrop-blur-md border border-white/10 animate-pulse"
                                    title="ดูวิดีโอแนะนำ"
                                >
                                    <i className="fa-brands fa-youtube"></i>
                                </button>
                            )}

                            {/* 4. ปุ่มปิด (กากบาท) */}
                            <button onClick={onClose} className="w-9 h-9 rounded-full bg-black/40 hover:bg-red-500/80 flex items-center justify-center text-slate-300 hover:text-white transition backdrop-blur-md border border-white/10 shadow-lg">
                                <i className="fa-solid fa-times text-lg"></i>
                            </button>
                        </div>

                        <div className="absolute bottom-4 left-4 text-white z-10">
                            <h2 className="text-2xl md:text-3xl font-bold shadow-black drop-shadow-md">{item.name}</h2>
                            <div className="text-sm text-emerald-300 font-light tracking-wide">{isIntegrated ? 'กระทรวงเกษตรผสมผสาน' : item.category === 'ธุรกิจ' ? 'กระทรวงพี่เลี้ยงธุรกิจ' : 'ข้อมูลพืชเศรษฐกิจ'}</div>
                        </div>
                    </div>

                    {/* Previous control bar removed - integrated into header */}

                    <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2 border border-white/10 mb-4">
                        <div className="flex-1 flex flex-col px-2 border-r border-white/10">
                            <span className="text-[10px] text-slate-400 uppercase">ขนาดพื้นที่/สาขา</span>
                            <input type="number" value={globalArea} onChange={e => setGlobalArea(parseFloat(e.target.value)||0)} className="bg-transparent font-bold text-emerald-400 focus:outline-none" />
                        </div>
                        <div className="flex-1 flex flex-col px-2">
                            <span className="text-[10px] text-slate-400 uppercase">ระยะเวลา (ปี)</span>
                            <input type="number" value={globalYears} onChange={e => setGlobalYears(parseFloat(e.target.value)||0)} className="bg-transparent font-bold text-yellow-400 focus:outline-none" />
                        </div>
                    </div>

                    <div className="flex gap-2 mb-4 bg-black/20 p-1 rounded-xl">
                        <button onClick={() => setPanelTab('financial')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${panelTab === 'financial' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><i className="fa-solid fa-calculator mr-1"></i> โมเดล & กำไร</button>
                        <button onClick={() => setPanelTab('market')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${panelTab === 'market' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><i className="fa-solid fa-tree mr-1"></i> ประโยชน์/ความเสี่ยง</button>
                    </div>

                    {panelTab === 'financial' ? (
                        <div className="space-y-4 animate-fade-in-up">
                            
                            {/* RICE PRESETS (เดิม) */}
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
                                </div>
                            )}

                            {/* --- BUTTON TO OPEN HANDBOOK --- */}
                            {availableBookKey && (
                                <div className="mb-4">
                                    <button onClick={() => setShowHandbook(true)} className={`w-full py-3 rounded-lg text-white font-bold text-xs shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border ${availableBookKey.startsWith('biz_') ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-purple-500/30 border-purple-400/30' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30 border-blue-400/30'}`}>
                                        <i className="fa-solid fa-book-open animate-pulse text-lg"></i> 
                                        <span>
                                            {availableBookKey.startsWith('biz_') ? 'อ่านคู่มือเริ่มต้นธุรกิจนี้ (ฉบับจับมือทำ)' : 
                                             availableBookKey === 'maize_manual' ? 'อ่านยุทธศาสตร์ข้าวโพดเลี้ยงสัตว์' : 
                                             availableBookKey === 'date_palm_research' ? 'อ่านวิจัยยุทธศาสตร์อินทผลัม' :
                                             'อ่านคู่มือการจัดการมืออาชีพ'}
                                        </span>
                                    </button>
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
                             <div className="text-center text-slate-400 py-10">ข้อมูลเพิ่มเติมอยู่ในหน้าหลัก</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const CloudOverlay = ({ isActive, message, rotation = 0 }) => {
        const canvasRef = useRef(null);
        useEffect(() => {
            if (!isActive || !canvasRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            let animationFrameId;
            const resizeCanvas = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();
            const chars = '01ไอทีเกษตร🌾🌱🚜💧☀💻📱📡AI5G'.split('');
            const fontSize = 14; 
            const columns = canvas.width / fontSize;
            const drops = Array(Math.floor(columns)).fill(1);
            const draw = () => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(52, 211, 153, 0.5)'; 
                ctx.font = `${fontSize}px 'Courier Prime', monospace`;
                for (let i = 0; i < drops.length; i++) {
                    const text = chars[Math.floor(Math.random() * chars.length)];
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) { drops[i] = 0; }
                    drops[i]++;
                }
                animationFrameId = requestAnimationFrame(draw);
            };
            draw();
            return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', resizeCanvas); };
        }, [isActive]);

        return (
            <div className={`cloud-container ${isActive ? 'active' : ''}`} style={{ backgroundColor: 'transparent' }}>
                <canvas ref={canvasRef} id="matrix-canvas" className="absolute inset-0 z-0" style={{ maskImage: 'radial-gradient(closest-side, black 40%, transparent 100%)', WebkitMaskImage: 'radial-gradient(closest-side, black 40%, transparent 100%)', opacity: 0.7 }}></canvas>
                {message && (
                    <div className="travel-message flex flex-col items-center z-10">
                        <div className="text-6xl text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-pulse">
                            <i className="fa-solid fa-plane-up transition-transform duration-700 ease-in-out" style={{ transform: `rotate(${rotation}deg)` }}></i>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold glass-panel-clear px-10 py-6 rounded-full text-white tracking-wide shadow-[0_0_50px_rgba(16,185,129,0.4)] matrix-text border border-emerald-500/30">{message}</h2>
                    </div>
                )}
            </div>
        );
    };

    // Expose Components (FULL EXPORT)
    global.AppUI = {
        SimulationPanel,
        CloudOverlay,
        KnowledgeCenterModal: KnowledgeCenterPanel, // Export as Panel
        VideoGalleryModal: VideoGalleryPanel // Export as Panel
    };

})(window);
import { useState, useEffect, useMemo } from 'react';
import {
  Activity, Ambulance, Heart, MapPin, Search,
  ChevronRight, ChevronLeft, X, Stethoscope, Building2,
  AlertTriangle, Loader2
} from 'lucide-react';
import medicalData from './data_mg.json';

// --- CONFIGURATION ---
const API_URL = "http://192.168.0.104:8080/predict";

// --- INTERFACES ---
interface Etablissement {
  nom: string;
  region: string;
  contact: string;
  categorie: string;
}

interface DiagnosisResponse {
  maladie: string;
  urgence: string;
  etablissement: Etablissement[]; // C'est maintenant un tableau []
}

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'symptoms' | 'results'>('landing');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [locationName, setLocationName] = useState<string>("Antsirabe");

  const allSymptoms = useMemo(() => {
    const symptomsSet = new Set<string>();
    (medicalData as any[]).forEach(m => {
      m.symptomes.forEach((s: any) => symptomsSet.add(s.nom));
    });
    return Array.from(symptomsSet).sort((a, b) => a.localeCompare(b));
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=14`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.village;
            if (city) setLocationName(city);
          } catch (e) { setLocationName("Antsirabe"); }
        },
        () => setLocationName("Antsirabe")
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100">
    <div className="fixed top-6 left-6 z-50 flex items-center gap-3 bg-white/90 backdrop-blur-xl px-5 py-2.5 rounded-2xl shadow-sm border border-slate-200/60">
    <MapPin className="w-4 h-4 text-red-500" />
    <span className="text-xs font-black text-slate-700">{locationName}</span>
    </div>

    {currentView === 'landing' && <LandingPage onStart={() => setCurrentView('symptoms')} />}
    {currentView === 'symptoms' && (
      <SymptomsPage
      allSymptoms={allSymptoms}
      selectedSymptoms={selectedSymptoms}
      setSelectedSymptoms={setSelectedSymptoms}
      onBack={() => setCurrentView('landing')}
      onContinue={() => setCurrentView('results')}
      />
    )}
    {currentView === 'results' && (
      <TriageResultsPage
      locationName={locationName}
      selectedSymptoms={selectedSymptoms}
      onBack={() => {
        setSelectedSymptoms([]);
        setCurrentView('symptoms');
      }}
      />
    )}
    </div>
  );
}

// --- PAGE RÉSULTATS (AVEC LISTE D'HÔPITAUX) ---
function TriageResultsPage({ selectedSymptoms, locationName, onBack }: any) {
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDiagnosis = async () => {
      try {
        setLoading(true);
        setError(false);

        // Transformation pour l'API : {"fievre": 1, ...}
        const evidenceObj = selectedSymptoms.reduce((acc: any, symptom: string) => {
          acc[symptom] = 1;
          return acc;
        }, {});

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evidence: evidenceObj,
            region: locationName.toLowerCase()
          }),
        });

        if (!response.ok) throw new Error();
        const data = await response.json();
        setDiagnosis(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDiagnosis();
  }, [selectedSymptoms, locationName]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
    <p className="font-black text-slate-400 animate-pulse text-[10px] tracking-widest uppercase">Fandinihana ny valiny...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
    <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
    <h2 className="text-2xl font-black mb-2">Tsy nandeha ny fikarohana</h2>
    <button onClick={onBack} className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black shadow-lg uppercase text-xs">Hiverina</button>
    </div>
  );

  const isCritical = diagnosis?.urgence === "critique" || diagnosis?.urgence === "urgent";

  return (
    <div className="max-w-4xl mx-auto px-6 py-32">
    {/* Carte Maladie */}
    <div className={`p-12 rounded-[55px] shadow-2xl border-4 text-center mb-12 ${
      isCritical ? 'bg-red-600 text-white border-red-400' : 'bg-white border-blue-50 text-slate-900'
    }`}>
    <Activity className={`w-16 h-16 mx-auto mb-6 ${isCritical ? 'text-white' : 'text-blue-600'}`} />
    <h2 className="text-5xl font-black uppercase mb-4 tracking-tighter">{diagnosis?.maladie}</h2>
    <div className={`inline-block px-6 py-2 rounded-full text-[11px] font-black uppercase ${isCritical ? 'bg-white/20' : 'bg-blue-100 text-blue-600'}`}>
    Ambaratonga: {diagnosis?.urgence}
    </div>
    </div>

    {/* Liste des Établissements */}
    <div className="bg-white p-10 rounded-[50px] shadow-xl border border-slate-100 mb-8">
    <h3 className="font-black text-xl italic flex items-center gap-4 mb-8 text-blue-900">
    <Building2 size={24} /> Hopitaly soso-kevitra
    </h3>
    <div className="grid gap-4">
    {diagnosis?.etablissement && Array.isArray(diagnosis.etablissement) && diagnosis.etablissement.length > 0 ? (
      diagnosis.etablissement.map((h, i) => (
        <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-[30px] border border-blue-50 hover:border-blue-200 transition-all group">
        <div>
        <h4 className="font-black text-blue-900 text-lg group-hover:text-blue-600">{h.nom}</h4>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{h.categorie} • {h.region}</p>
        </div>
        <div className="text-right">
        <p className="text-xs font-black text-slate-700 mb-2">{h.contact}</p>
        <button onClick={() => window.location.href=`tel:${h.contact}`} className="bg-white border-2 border-blue-600 text-blue-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm">Antsoy</button>
        </div>
        </div>
      ))
    ) : (
      <p className="text-center text-slate-400 italic py-6">Tsy misy hopitaly hita.</p>
    )}
    </div>
    </div>

    {/* SOS Button */}
    <div className="bg-red-50 p-8 rounded-[40px] border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
    <div className="flex items-center gap-4">
    <Ambulance className="text-red-600" size={40} />
    <p className="text-sm font-black text-red-900 uppercase italic">Mila vonjy taitra haingana?</p>
    </div>
    <button onClick={() => window.location.href="tel:124"} className="bg-red-600 text-white px-10 py-5 rounded-[25px] font-black text-xs shadow-xl uppercase">Antsoy ny 124</button>
    </div>

    <button onClick={onBack} className="mt-20 block mx-auto text-slate-300 font-black uppercase text-[10px] tracking-[0.4em] hover:text-blue-600 transition-colors underline underline-offset-8">
    ← HIVERINA AM-PIANDOHANA
    </button>
    </div>
  );
}

// --- LANDING PAGE ---
function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <div className="bg-white p-12 rounded-[55px] shadow-2xl border border-red-50 mb-10">
    <Heart className="w-20 h-20 text-red-600 animate-pulse" />
    </div>
    <h1 className="text-6xl font-black mb-4 tracking-tighter italic text-blue-600">MADA-CARE <span className="text-slate-900">AI</span></h1>
    <p className="max-w-xl text-lg text-slate-400 mb-12 font-medium">Fitaovana hifidianana toeram-pitsaboana mifanaraka amin'ny aretinao.</p>
    <button onClick={onStart} className="bg-blue-600 text-white px-14 py-7 rounded-[35px] text-2xl font-black shadow-2xl flex items-center gap-4 hover:scale-105 transition-all uppercase">Hanomboka <ChevronRight size={24} /></button>
    </div>
  );
}

// --- SYMPTOMS PAGE ---
function SymptomsPage({ allSymptoms, selectedSymptoms, setSelectedSymptoms, onBack, onContinue }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = allSymptoms.filter((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev: string[]) => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s]);
  };

  return (
    <div className="min-h-screen pt-28 pb-12 px-6">
    <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8">
    <div className="lg:col-span-8 space-y-6">
    <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-200 flex items-center gap-4">
    <Search className="text-slate-400 w-6 h-6" />
    <input
    type="text"
    placeholder="Inona no tsapanao?..."
    className="w-full bg-transparent outline-none font-bold text-xl"
    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
    />
    </div>
    <div className="bg-white p-10 rounded-[45px] border border-slate-100 shadow-sm min-h-[550px] flex flex-col">
    <div className="grid md:grid-cols-2 gap-3 flex-1 content-start">
    {currentItems.map((s: string) => (
      <button
      key={s}
      onClick={() => toggleSymptom(s)}
      className={`p-5 rounded-[22px] border-2 text-left transition-all ${
        selectedSymptoms.includes(s) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-white hover:border-blue-100'
      }`}
      >
      <span className="text-sm font-bold">{s}</span>
      </button>
    ))}
    </div>
    <div className="mt-8 flex justify-between items-center pt-8 border-t">
    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-3 bg-slate-100 rounded-xl disabled:opacity-20"><ChevronLeft/></button>
    <span className="text-xs font-black text-slate-400 tracking-widest uppercase">Pejy {currentPage} / {totalPages || 1}</span>
    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-3 bg-slate-100 rounded-xl disabled:opacity-20"><ChevronRight/></button>
    </div>
    </div>
    </div>
    <div className="lg:col-span-4">
    <div className="bg-white p-8 rounded-[40px] shadow-xl border border-blue-50 sticky top-28">
    <h3 className="font-black text-slate-400 uppercase text-[10px] mb-6 flex items-center gap-2 italic">
    <Stethoscope className="text-blue-600" size={16}/> VOAFIDY ({selectedSymptoms.length})
    </h3>
    <div className="space-y-2 mb-8 max-h-[300px] overflow-y-auto pr-2">
    {selectedSymptoms.map((s: string) => (
      <div key={s} className="bg-blue-50/50 p-4 rounded-2xl flex justify-between items-center text-xs font-black text-blue-900 italic border border-blue-100">
      <span className="flex-1 pr-2">{s}</span>
      <X size={16} className="cursor-pointer text-blue-300 hover:text-red-500" onClick={() => toggleSymptom(s)} />
      </div>
    ))}
    </div>
    {selectedSymptoms.length > 0 && (
      <button onClick={onContinue} className="w-full bg-blue-600 text-white py-6 rounded-[28px] font-black text-sm shadow-2xl hover:bg-blue-700 transition-all uppercase tracking-tighter">Hijerjy ny vokatra</button>
    )}
    <button onClick={onBack} className="w-full mt-4 text-[10px] font-black text-slate-300 text-center uppercase tracking-widest hover:text-blue-600">Hiverina</button>
    </div>
    </div>
    </div>
    </div>
  );
}

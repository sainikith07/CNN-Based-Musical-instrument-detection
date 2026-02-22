import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Download, FileJson, FileText, Activity, ShieldCheck, Zap, Info, Github, Linkedin, Mail, Phone, Table, TrendingUp, LogOut, Crown, CheckCircle2, Server, PieChart as PieChartIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import confetti from 'canvas-confetti';
import { useDropzone } from 'react-dropzone';
import { cn } from './utils';
import { User, InstrumentPrediction } from './types';

// --- Mock Data & Helpers ---

const INSTRUMENTS = ['Violin', 'Drums', 'Guitar', 'Flute', 'Piano', 'Saxophone'];

const INSTRUMENT_COLORS: Record<string, string> = {
  'Violin': '#7C3AED', // Purple
  'Drums': '#EF4444',  // Red
  'Guitar': '#3B82F6', // Blue
  'Flute': '#06B6D4',  // Cyan
  'Piano': '#F59E0B',  // Yellow
  'Saxophone': '#10B981', // Green
};

const INSTRUMENT_IMAGES: Record<string, string> = {
  'Piano': 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&q=80&w=2000',
  'Guitar': 'https://images.unsplash.com/photo-1525201548942-d8b8bb66ec70?auto=format&fit=crop&q=80&w=2000',
  'Violin': 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&q=80&w=2000',
  'Drums': 'https://images.unsplash.com/photo-1543443374-b6fe10a6ab7b?auto=format&fit=crop&q=80&w=2000',
  'Saxophone': 'https://images.unsplash.com/photo-1528143358888-6d3c7f67bd5d?auto=format&fit=crop&q=80&w=2000',
  'Flute': 'https://images.unsplash.com/photo-1573511860302-28c52431992a?auto=format&fit=crop&q=80&w=2000',
};

const getMockPrediction = (fileName: string): InstrumentPrediction => {
  // Check if file name contains an instrument name (case-insensitive)
  const lowerFileName = fileName.toLowerCase();
  const detectedFromFileName = INSTRUMENTS.find(inst => lowerFileName.includes(inst.toLowerCase()));
  
  const name = detectedFromFileName || INSTRUMENTS[Math.floor(Math.random() * INSTRUMENTS.length)];
  
  // Ensure confidence scores sum to 100%
  const primaryConfidence = detectedFromFileName ? (90 + Math.random() * 9) : (75 + Math.random() * 20);
  let remaining = 100 - primaryConfidence;
  
  const otherInstruments = INSTRUMENTS.filter(i => i !== name);
  const similarInstruments = otherInstruments.map((inst, index) => {
    let score;
    if (index === otherInstruments.length - 1) {
      score = remaining;
    } else {
      score = Math.random() * (remaining / 1.5);
      remaining -= score;
    }
    return { name: inst, similarity: score };
  }).sort((a, b) => b.similarity - a.similarity);

  // Timeline data simulation
  const timelineData = ['Segment 1', 'Segment 2', 'Segment 3'].map((seg) => {
    const data: any = { segment: seg };
    let segRemaining = 100;
    const segPrimary = detectedFromFileName ? (85 + Math.random() * 10) : (60 + Math.random() * 35);
    data[name] = segPrimary;
    segRemaining -= segPrimary;

    otherInstruments.forEach((inst, idx) => {
      if (idx === otherInstruments.length - 1) {
        data[inst] = segRemaining;
      } else {
        const s = Math.random() * (segRemaining / 1.5);
        data[inst] = s;
        segRemaining -= s;
      }
    });
    return data;
  });

  return {
    name,
    confidence: primaryConfidence,
    intensity: 60 + Math.random() * 35,
    health: Math.random() > 0.2 ? 'Healthy' : 'Needs Tuning',
    condition: Math.random() > 0.2 ? 'Excellent resonance with clear harmonic profile.' : 'Slight mechanical noise detected in lower frequencies.',
    similarInstruments,
    timelineData,
    timestamp: new Date().toLocaleString(),
  };
};

// --- Components ---

const Navbar = ({ user, onLogout, onGoPremium }: { user: User | null; onLogout: () => void; onGoPremium: () => void }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 glass px-6 py-4 flex justify-between items-center border-b border-white/10">
    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.reload()}>
      <div className="w-10 h-10 bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] rounded-xl flex items-center justify-center shadow-lg shadow-[#7C3AED]/20 group-hover:neon-glow-purple transition-all">
        <Activity className="text-white w-6 h-6" />
      </div>
      <span className="text-xl font-display font-bold tracking-tight text-white">
        InstruNet <span className="text-[#06B6D4]">AI</span>
      </span>
    </div>
    <div className="flex items-center gap-6">
      {user && (
        <>
          <div className="hidden md:flex items-center gap-6">
            <span className="text-sm text-[#F8FAFC] font-medium animate-in fade-in slide-in-from-right-4 duration-500">
              Welcome, <span className="text-[#06B6D4]">{user.name}</span>
            </span>
            {user.isPremium ? (
              <span className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] uppercase font-bold rounded-full tracking-wider shadow-lg shadow-amber-500/20">
                <Crown className="inline-block w-3 h-3 mr-1 mb-0.5" /> Premium Member
              </span>
            ) : (
              <button 
                onClick={onGoPremium}
                className="btn-premium"
              >
                <Zap className="inline-block w-3 h-3 mr-1 mb-0.5" /> Go Premium
              </button>
            )}
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#9CA3AF] hover:text-white hover:border-red-500/50 border border-white/5 bg-white/5 px-4 py-2 rounded-xl transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </>
      )}
    </div>
  </nav>
);

const Footer = () => (
  <footer className="bg-[#0F172A]/80 backdrop-blur-md border-t border-white/5 pt-16 pb-8 px-6">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
      <div className="col-span-1 md:col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="text-[#06B6D4] w-6 h-6" />
          <span className="text-xl font-display font-bold text-white">InstruNet AI</span>
        </div>
        <p className="text-[#9CA3AF] max-w-md mb-6 leading-relaxed">
          The industry standard for CNN-based musical instrument recognition. Our neural networks provide professional-grade spectral analysis and health monitoring for acoustic and digital instruments.
        </p>
        <div className="flex gap-4">
          <a href="https://github.com/sainikith07" target="_blank" rel="noreferrer" className="p-2.5 bg-[#111827] rounded-xl border border-white/5 hover:border-[#7C3AED]/50 hover:neon-glow-purple transition-all group">
            <Github className="w-5 h-5 text-[#9CA3AF] group-hover:text-white" />
          </a>
          <a href="https://www.linkedin.com/in/sai-nikith-kaleru/" target="_blank" rel="noreferrer" className="p-2.5 bg-[#111827] rounded-xl border border-white/5 hover:border-[#7C3AED]/50 hover:neon-glow-purple transition-all group">
            <Linkedin className="w-5 h-5 text-[#9CA3AF] group-hover:text-white" />
          </a>
          <a href="mailto:sainikith04@gmail.com" className="p-2.5 bg-[#111827] rounded-xl border border-white/5 hover:border-[#7C3AED]/50 hover:neon-glow-purple transition-all group">
            <Mail className="w-5 h-5 text-[#9CA3AF] group-hover:text-white" />
          </a>
        </div>
      </div>
      
      <div>
        <h4 className="text-white font-semibold mb-6">Platform</h4>
        <ul className="space-y-4 text-[#9CA3AF] text-sm">
          <li><a href="#" className="hover:text-[#06B6D4] transition-colors">Spectral Analysis</a></li>
          <li><a href="#" className="hover:text-[#06B6D4] transition-colors">Instrument Health</a></li>
          <li><a href="#" className="hover:text-[#06B6D4] transition-colors">Premium Access</a></li>
          <li><a href="#" className="hover:text-[#06B6D4] transition-colors">API Documentation</a></li>
        </ul>
      </div>

      <div>
        <h4 className="text-white font-semibold mb-6">Support</h4>
        <ul className="space-y-4 text-[#9CA3AF] text-sm">
          <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#06B6D4]" /> 9573311069</li>
          <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#06B6D4]" /> sainikith04@gmail.com</li>
          <li className="text-[#9CA3AF]/50 mt-6 pt-6 border-t border-white/5">Developed by <span className="text-[#F8FAFC] font-medium">Sai Nikith</span></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 text-center text-[#9CA3AF]/40 text-[10px] tracking-[0.3em] uppercase">
      &copy; 2026 InstruNet AI &bull; Professional Edition
    </div>
  </footer>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [authName, setAuthName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ prediction: InstrumentPrediction; audioUrl: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation
    setUser({
      id: '1',
      email: 'user@example.com',
      name: isLogin ? 'Sai Nikith' : (authName || 'New User'),
      isPremium: false, // Start as free user
    });
  };

  const handleGoPremium = () => {
    if (user) {
      setUser({ ...user, isPremium: true });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#ffffff']
      });
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
      setResult(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/wav': ['.wav'] },
    multiple: false
  } as any);

  const analyzeAudio = async () => {
    if (!file) return;
    setAnalyzing(true);
    
    // Simulate CNN processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const prediction = getMockPrediction(file.name);
    const audioUrl = URL.createObjectURL(file);
    
    setResult({ prediction, audioUrl });
    setAnalyzing(false);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#06b6d4', '#ffffff']
    });
  };

  useEffect(() => {
    if (result && waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#3f3f46',
        progressColor: '#10b981',
        cursorColor: '#10b981',
        barWidth: 2,
        barRadius: 3,
        height: 80,
      });

      wavesurfer.current.load(result.audioUrl);
      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));
      wavesurfer.current.on('finish', () => setIsPlaying(false));

      return () => wavesurfer.current?.destroy();
    }
  }, [result]);

  const togglePlay = () => {
    wavesurfer.current?.playPause();
  };

  const downloadCSV = () => {
    if (!result) return;
    const p = result.prediction;
    const headers = ["Metric", "Value"];
    const rows = [
      ["File Name", file?.name || ""],
      ["Instrument", p.name],
      ["Confidence", `${p.confidence.toFixed(2)}%`],
      ["Intensity", `${p.intensity.toFixed(2)}%`],
      ["Health", p.health],
      ["Condition", p.condition],
      ["Timestamp", p.timestamp],
      ["Developer", "Sai Nikith"],
      ["Contact", "9573311069"]
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${p.name.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadJSON = () => {
    if (!result) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      report: "InstruNet AI Analysis Report",
      timestamp: result.prediction.timestamp,
      instrument: result.prediction.name,
      confidence: result.prediction.confidence,
      health: result.prediction.health,
      condition: result.prediction.condition,
      intensity: result.prediction.intensity,
      developer: "Sai Nikith"
    }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `analysis_${result.prediction.name.toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadPDF = () => {
    if (!result) return;
    try {
      console.log("Starting PDF generation...");
      const doc = new jsPDF('p', 'mm', 'a4') as any;
      const p = result.prediction;

      const getSafeY = (fallback: number) => {
        const last = (doc as any).lastAutoTable;
        if (last && typeof last.finalY === 'number' && !isNaN(last.finalY)) {
          return last.finalY;
        }
        return fallback;
      };

      // PDF Header
      doc.setFillColor(15, 23, 42); // Midnight Blue
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("InstruNet AI Report", 20, 25);
      doc.setFontSize(10);
      doc.text("CNN-Based Instrument Intelligence", 20, 32);

      // Watermark for non-premium
      if (!user?.isPremium) {
        doc.setTextColor(220, 220, 220);
        doc.setFontSize(60);
        doc.text("FREE VERSION", 40, 150, { angle: 45 });
      } else {
        // Premium Badge in PDF
        doc.setFillColor(245, 158, 11);
        if (typeof doc.roundedRect === 'function') {
          doc.roundedRect(160, 45, 30, 10, 2, 2, 'F');
        } else {
          doc.rect(160, 45, 30, 10, 'F');
        }
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text("PREMIUM", 165, 52);
      }

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text(`Date: ${p.timestamp || new Date().toLocaleString()}`, 20, 55);
      doc.text(`File: ${file?.name || 'Unknown'}`, 20, 65);

      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      const description = `The CNN model has analyzed the audio signal from "${file?.name || 'the uploaded file'}". Based on the spectral patterns and harmonic distribution, the system identifies the primary instrument as ${p.name || 'Unknown'} with a confidence score of ${(p.confidence || 0).toFixed(2)}%. The instrument appears to be in ${(p.health || 'Unknown').toLowerCase()} condition. 

Technical Analysis Summary:
The spectral centroid and roll-off values are consistent with the characteristic timbre of a ${(p.name || 'Unknown').toLowerCase()}. Harmonic analysis reveals a strong fundamental frequency with well-defined overtones, suggesting a high-quality recording environment. No significant transient noise or distortion was detected in the primary frequency bands.`;
      doc.text(doc.splitTextToSize(description, 170), 20, 80);

      autoTable(doc, {
        startY: 105,
        head: [['Metric', 'Value']],
        body: [
          ['Instrument', p.name || 'Unknown'],
          ['Confidence Score', `${(p.confidence || 0).toFixed(2)}%`],
          ['Instrument Intensity', `${(p.intensity || 0).toFixed(2)}%`],
          ['Health Status', p.health || 'N/A'],
          ['Condition Analysis', p.condition || 'N/A'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237] } // Purple
      });

      let currentY = getSafeY(160);

      // Similarity Table
      autoTable(doc, {
        startY: currentY + 10,
        head: [['Similar Instruments', 'Similarity %']],
        body: (p.similarInstruments || []).map(i => [i.name || 'Unknown', `${(i.similarity || 0).toFixed(2)}%`]),
        theme: 'grid',
        headStyles: { fillColor: [6, 182, 212] } // Cyan
      });

      currentY = getSafeY(currentY + 40);

      // Premium Section: Detailed Analysis
      if (user?.isPremium) {
        console.log("Generating premium content...");
        doc.addPage();
        doc.setFillColor(124, 58, 237); // Purple
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text("Premium Advanced Analytics", 20, 13);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(12);
        doc.text("Frequency Band Distribution Analysis:", 20, 35);
        
        autoTable(doc, {
          startY: 40,
          head: [['Frequency Band', 'Energy Distribution %']],
          body: [
            ['Sub-Bass (20-60Hz)', '15%'],
            ['Bass (60-250Hz)', '25%'],
            ['Low-Mid (250-500Hz)', '20%'],
            ['High-Mid (500-2kHz)', '25%'],
            ['Treble (2kHz-20kHz)', '15%'],
          ],
          theme: 'striped',
          headStyles: { fillColor: [245, 158, 11] } // Amber
        });

        currentY = getSafeY(100);

        doc.text("Timeline Segment Analysis:", 20, currentY + 15);
        
        const sim1 = p.similarInstruments?.[0]?.name || 'N/A';
        const sim2 = p.similarInstruments?.[1]?.name || 'N/A';

        autoTable(doc, {
          startY: currentY + 20,
          head: [['Segment', p.name || 'Primary', sim1, sim2]],
          body: (p.timelineData || []).map((d: any) => [
            d.segment || 'N/A', 
            `${Number(d[p.name] || 0).toFixed(1)}%`, 
            `${Number(d[sim1] || 0).toFixed(1)}%`,
            `${Number(d[sim2] || 0).toFixed(1)}%`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [6, 182, 212] } // Cyan
        });

        currentY = getSafeY(currentY + 60);

        // Visualizations in PDF (Mocked with rectangles)
        doc.text("Probability Distribution Visualization:", 20, currentY + 15);
        let barY = currentY + 25;
        const chartData = [
          { name: p.name, value: p.confidence }, 
          ...(p.similarInstruments || []).slice(0, 4).map(i => ({ name: i.name, value: i.similarity }))
        ];
        
        chartData.forEach((item) => {
          if (!item.name) return;
          const color = INSTRUMENT_COLORS[item.name] || '#7C3AED';
          // Convert hex to RGB for jsPDF
          const r = parseInt(color.slice(1, 3), 16) || 0;
          const g = parseInt(color.slice(3, 5), 16) || 0;
          const b = parseInt(color.slice(5, 7), 16) || 0;
          
          doc.setFillColor(r, g, b);
          const val = typeof item.value === 'number' ? item.value : 0;
          const barWidth = Math.max(0, (val / 100) * 100);
          
          if (!isNaN(barY) && !isNaN(barWidth) && barY < 280) {
            doc.rect(50, barY, barWidth, 6, 'F');
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(8);
            doc.text(item.name, 20, barY + 5);
            doc.text(`${val.toFixed(1)}%`, 50 + barWidth + 2, barY + 5);
          }
          barY += 10;
        });
        
        currentY = barY;
      } else {
        currentY = getSafeY(currentY);
      }

      // Footer
      const finalY = Math.min(Math.max(currentY + 20, 100), 280);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Developed by: Sai Nikith", 20, finalY);
      doc.text("Contact: 9573311069 | Email: sainikith04@gmail.com", 20, finalY + 7);
      doc.text("GitHub: sainikith07 | LinkedIn: sai-nikith-kaleru", 20, finalY + 14);

      console.log("Saving PDF...");
      doc.save(`InstruNet_Report_${p.name || 'Analysis'}.pdf`);
      console.log("PDF saved successfully.");
    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("Failed to generate PDF. Check the console for details.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0F172A]">
        {/* Animated Background Soundwave */}
        <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-10 -z-10">
          {[...Array(40)].map((_, i) => (
            <div 
              key={i} 
              className="wave-bar" 
              style={{ 
                height: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.05}s`
              }} 
            />
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md glass-card p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]" />
          
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#7C3AED]/30 mb-6 neon-glow-purple">
              <Activity className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">InstruNet AI</h1>
            <p className="text-[#06B6D4] text-xs font-bold uppercase tracking-[0.3em] mb-4">CNN-Based Instrument Intelligence</p>
            <p className="text-[#9CA3AF] text-center text-sm leading-relaxed">
              {isLogin ? 'Professional instrument analysis suite.' : 'Join the community of acoustic engineers.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em] mb-2 ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-[#1F2937] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#7C3AED] transition-all placeholder:text-[#4B5563]"
                  placeholder="Sai Nikith"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em] mb-2 ml-1">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full bg-[#1F2937] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#7C3AED] transition-all placeholder:text-[#4B5563]"
                placeholder="sainikith04@gmail.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em] mb-2 ml-1">Password</label>
              <input 
                type="password" 
                required
                className="w-full bg-[#1F2937] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#7C3AED] transition-all placeholder:text-[#4B5563]"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white font-bold py-4 rounded-xl shadow-xl shadow-[#7C3AED]/20 hover:neon-glow-purple hover:scale-[1.02] active:scale-[0.98] transition-all mt-6"
            >
              {isLogin ? 'Sign In to Suite' : 'Create Professional Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-[#9CA3AF] hover:text-[#06B6D4] transition-colors font-medium"
            >
              {isLogin ? "New to InstruNet? Create account" : "Already registered? Sign in here"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <Navbar user={user} onLogout={() => setUser(null)} onGoPremium={handleGoPremium} />

      <main className="flex-grow pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Hero / Upload Section */}
          {!result && !analyzing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto text-center py-12"
            >
              <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 tracking-tight">
                Identify Instruments with <span className="text-gradient">CNN Precision</span>
              </h2>
              <p className="text-[#9CA3AF] text-lg mb-12 max-w-xl mx-auto">
                Upload your .wav audio file and let our advanced neural network detect instruments, analyze health, and generate professional reports.
              </p>

              <div 
                {...getRootProps()} 
                className={cn(
                  "relative group cursor-pointer p-12 rounded-3xl border-2 border-dashed transition-all duration-300",
                  isDragActive ? "border-[#06B6D4] bg-[#06B6D4]/5 scale-105" : "border-white/10 bg-[#111827]/40 hover:border-[#7C3AED]/50 hover:bg-[#111827]/60"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-[#1F2937] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm group-hover:neon-glow-purple">
                    <Download className={cn("w-10 h-10", isDragActive ? "text-[#06B6D4]" : "text-[#4B5563]")} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {file ? file.name : "Drop your .wav file here"}
                  </h3>
                  <p className="text-[#9CA3AF] text-sm">
                    {file ? "File chosen" : "or click to browse from your computer"}
                  </p>
                </div>
              </div>

              {file && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={analyzeAudio}
                  className="mt-8 px-12 py-4 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white font-bold rounded-2xl shadow-xl shadow-[#7C3AED]/20 hover:neon-glow-purple hover:scale-105 transition-all"
                >
                  Start CNN Analysis
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Analyzing State */}
          {analyzing && (
            <div className="max-w-md mx-auto text-center py-24">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-[#7C3AED]/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                <Activity className="absolute inset-0 m-auto w-12 h-12 text-[#06B6D4] animate-pulse" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Analyzing Audio Signal...</h2>
              <p className="text-[#9CA3AF]">Our CNN model is processing the spectrogram patterns.</p>
              
              <div className="mt-12 space-y-6">
                <div className="h-2 w-full bg-[#1F2937] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3 }}
                    className="h-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Preprocessing', icon: CheckCircle2 },
                    { label: 'Feature Extraction', icon: Zap },
                    { label: 'Classification', icon: Activity }
                  ].map((step, i) => (
                    <motion.div 
                      key={step.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.5 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#1F2937] flex items-center justify-center border border-white/5 text-[#06B6D4] neon-glow-cyan">
                        <step.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest">{step.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Hero Result Card */}
                <div className="relative rounded-3xl overflow-hidden min-h-[450px] flex flex-col justify-end p-8 md:p-12 shadow-2xl">
                  <div className="absolute inset-0 -z-10">
                    <img 
                      src={INSTRUMENT_IMAGES[result.prediction.name] || INSTRUMENT_IMAGES['Piano']} 
                      alt={result.prediction.name}
                      className="w-full h-full object-cover brightness-[0.4] scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-4 py-1 bg-[#7C3AED] text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-[#7C3AED]/30">
                          Detected Instrument
                        </span>
                        <span className="px-4 py-1 bg-white/10 backdrop-blur-md text-[#06B6D4] text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/10">
                          CNN Confidence: {result.prediction.confidence.toFixed(1)}%
                        </span>
                      </div>
                      <h1 className="text-6xl md:text-8xl font-display font-bold text-white mb-4 tracking-tight">
                        {result.prediction.name}
                      </h1>
                      <p className="text-[#9CA3AF] text-lg max-w-lg font-medium">
                        {result.prediction.condition}
                      </p>
                      <div className="mt-4 text-sm text-[#4B5563] font-mono">
                        Audio file: {file?.name}
                      </div>
                    </motion.div>

                    <div className="flex flex-wrap gap-4 justify-end">
                      <button 
                        onClick={downloadPDF}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-[#0F172A] font-bold rounded-xl hover:bg-[#F8FAFC] transition-all shadow-lg shadow-white/10 hover:scale-105"
                      >
                        <FileText className="w-5 h-5" /> PDF Report
                      </button>
                      <button 
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-6 py-3 bg-[#1F2937] text-white font-bold rounded-xl border border-white/10 hover:bg-[#374151] transition-all hover:scale-105"
                      >
                        <Table className="w-5 h-5" /> CSV Data
                      </button>
                      <button 
                        onClick={downloadJSON}
                        className="flex items-center gap-2 px-6 py-3 bg-[#111827] text-white font-bold rounded-xl border border-white/10 hover:bg-[#1F2937] transition-all hover:scale-105"
                      >
                        <FileJson className="w-5 h-5" /> JSON
                      </button>
                    </div>
                  </div>
                </div>

                {/* Analysis Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Column: Audio & Waveform */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* Audio Player Card */}
                    <div className="glass-card p-8">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                          <Activity className="text-[#06B6D4] w-5 h-5" /> Audio Waveform
                        </h3>
                        <div className="text-[10px] font-mono text-[#4B5563] uppercase tracking-[0.2em]">
                          Real-time Signal Analysis
                        </div>
                      </div>
                      
                      <div ref={waveformRef} className="mb-8 opacity-80" />
                      
                      <div className="flex items-center gap-6">
                        <button 
                          onClick={togglePlay}
                          className="w-16 h-16 bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] rounded-full flex items-center justify-center text-white shadow-xl shadow-[#7C3AED]/20 hover:scale-110 hover:neon-glow-purple transition-all"
                        >
                          {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                        </button>
                        
                        <div className="flex-grow">
                          <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-3 font-bold uppercase tracking-widest">
                            <span>Signal Timeline</span>
                            <span>{file?.size ? (file.size / 1024 / 1024).toFixed(2) : 0} MB</span>
                          </div>
                          <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]" 
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Instrument Profile Summary */}
                    <div className="glass-card p-8">
                      <h3 className="text-xl font-display font-bold text-white mb-8 flex items-center gap-2">
                        <ShieldCheck className="text-[#10B981] w-5 h-5" /> Instrument Spectral Profile
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-[#1F2937]/50 rounded-2xl border border-white/5">
                          <div className="text-[10px] text-[#9CA3AF] uppercase font-bold mb-3 tracking-widest">Timbre Quality</div>
                          <div className="text-2xl font-bold text-[#10B981]">Rich & Warm</div>
                          <p className="text-xs text-[#4B5563] mt-3 leading-relaxed">Harmonic content shows strong fundamental presence with balanced overtones.</p>
                        </div>
                        <div className="p-6 bg-[#1F2937]/50 rounded-2xl border border-white/5">
                          <div className="text-[10px] text-[#9CA3AF] uppercase font-bold mb-3 tracking-widest">Attack Response</div>
                          <div className="text-2xl font-bold text-[#06B6D4]">Crisp</div>
                          <p className="text-xs text-[#4B5563] mt-3 leading-relaxed">Transient peaks are well-defined, indicating excellent mechanical condition.</p>
                        </div>
                        <div className="p-6 bg-[#1F2937]/50 rounded-2xl border border-white/5">
                          <div className="text-[10px] text-[#9CA3AF] uppercase font-bold mb-3 tracking-widest">Decay Profile</div>
                          <div className="text-2xl font-bold text-[#7C3AED]">Natural</div>
                          <p className="text-xs text-[#4B5563] mt-3 leading-relaxed">Exponential decay curve matches standard acoustic resonance patterns.</p>
                        </div>
                      </div>
                    </div>

                    {/* Prediction Distribution Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Bar Chart */}
                      <div className="glass-card p-8">
                        <h3 className="text-xl font-display font-bold text-white mb-8 flex items-center gap-2">
                          <Activity className="text-[#7C3AED] w-5 h-5" /> Probability Distribution
                        </h3>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              { name: result.prediction.name, value: result.prediction.confidence },
                              ...result.prediction.similarInstruments.map(i => ({ name: i.name, value: i.similarity }))
                            ].sort((a, b) => INSTRUMENTS.indexOf(a.name) - INSTRUMENTS.indexOf(b.name))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis dataKey="name" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                              <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = [
                                      { name: result.prediction.name, value: result.prediction.confidence },
                                      ...result.prediction.similarInstruments.map(i => ({ name: i.name, value: i.similarity }))
                                    ].sort((a, b) => b.value - a.value);

                                    return (
                                      <div className="bg-[#111827] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                                        <p className="text-[#06B6D4] font-bold text-xs uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Confidence Scores</p>
                                        <div className="space-y-2">
                                          {data.map((item) => (
                                            <div key={item.name} className="flex items-center justify-between gap-8">
                                              <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: INSTRUMENT_COLORS[item.name] }} />
                                                <span className="text-white text-[10px] font-medium">{item.name}</span>
                                              </div>
                                              <span className="text-[#F8FAFC] text-[10px] font-mono">{item.value.toFixed(1)}%</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1500}>
                                {[
                                  { name: result.prediction.name, value: result.prediction.confidence },
                                  ...result.prediction.similarInstruments.map(i => ({ name: i.name, value: i.similarity }))
                                ].sort((a, b) => INSTRUMENTS.indexOf(a.name) - INSTRUMENTS.indexOf(b.name)).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={INSTRUMENT_COLORS[entry.name]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Pie Chart */}
                      <div className="glass-card p-8">
                        <h3 className="text-xl font-display font-bold text-white mb-8 flex items-center gap-2">
                          <PieChartIcon className="text-[#06B6D4] w-5 h-5" /> Composition Analysis
                        </h3>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: result.prediction.name, value: result.prediction.confidence },
                                  ...result.prediction.similarInstruments.map(i => ({ name: i.name, value: i.similarity }))
                                ].sort((a, b) => INSTRUMENTS.indexOf(a.name) - INSTRUMENTS.indexOf(b.name))}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                dataKey="value"
                                animationDuration={1500}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={true}
                              >
                                {[
                                  { name: result.prediction.name, value: result.prediction.confidence },
                                  ...result.prediction.similarInstruments.map(i => ({ name: i.name, value: i.similarity }))
                                ].sort((a, b) => INSTRUMENTS.indexOf(a.name) - INSTRUMENTS.indexOf(b.name)).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={INSTRUMENT_COLORS[entry.name]} stroke="rgba(15, 23, 42, 0.5)" strokeWidth={2} />
                                ))}
                              </Pie>
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = [
                                      { name: result.prediction.name, value: result.prediction.confidence },
                                      ...result.prediction.similarInstruments.map(i => ({ name: i.name, value: i.similarity }))
                                    ].sort((a, b) => b.value - a.value);

                                    return (
                                      <div className="bg-[#111827] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                                        <p className="text-[#06B6D4] font-bold text-xs uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Composition Details</p>
                                        <div className="space-y-2">
                                          {data.map((item) => (
                                            <div key={item.name} className="flex items-center justify-between gap-8">
                                              <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: INSTRUMENT_COLORS[item.name] }} />
                                                <span className="text-white text-[10px] font-medium">{item.name}</span>
                                              </div>
                                              <span className="text-[#F8FAFC] text-[10px] font-mono">{item.value.toFixed(1)}%</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Visualization */}
                    <div className="glass-card p-8">
                      <h3 className="text-xl font-display font-bold text-white mb-8 flex items-center gap-2">
                        <TrendingUp className="text-[#10B981] w-5 h-5" /> Instrument Activity Timeline
                      </h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={result.prediction.timelineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="segment" stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F8FAFC' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey={result.prediction.name} stroke={INSTRUMENT_COLORS[result.prediction.name]} strokeWidth={4} dot={{ r: 6, fill: INSTRUMENT_COLORS[result.prediction.name], strokeWidth: 2, stroke: '#0F172A' }} activeDot={{ r: 8 }} />
                            {result.prediction.similarInstruments.slice(0, 2).map((inst) => (
                              <Line key={inst.name} type="monotone" dataKey={inst.name} stroke={INSTRUMENT_COLORS[inst.name]} strokeDasharray="5 5" strokeWidth={2} dot={false} />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Confidence Table */}
                    <div className="glass-card p-8">
                      <h3 className="text-xl font-display font-bold text-white mb-8 flex items-center gap-2">
                        <Table className="text-[#06B6D4] w-5 h-5" /> Prediction Confidence
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="py-4 px-4 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Instrument</th>
                              <th className="py-4 px-4 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Confidence</th>
                              <th className="py-4 px-4 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { name: result.prediction.name, value: result.prediction.confidence, status: 'PRIMARY' },
                              ...result.prediction.similarInstruments.map(i => ({ name: i.name, value: i.similarity, status: 'SECONDARY' }))
                            ].sort((a, b) => b.value - a.value).map((inst) => (
                              <tr key={inst.name} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: INSTRUMENT_COLORS[inst.name] }} />
                                    <span className="text-sm font-bold text-white">{inst.name}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm font-mono text-[#F8FAFC] min-w-[60px]">{inst.value.toFixed(2)}%</span>
                                    <div className="flex-grow h-1.5 bg-[#1F2937] rounded-full overflow-hidden hidden sm:block">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${inst.value}%` }}
                                        className="h-full"
                                        style={{ backgroundColor: INSTRUMENT_COLORS[inst.name] }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <span className={cn(
                                    "px-3 py-1 rounded-full text-[8px] font-bold tracking-widest",
                                    inst.status === 'PRIMARY' ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30" : "bg-[#4B5563]/20 text-[#9CA3AF] border border-white/5"
                                  )}>
                                    {inst.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Premium: Frequency Band Distribution */}
                    {user.isPremium && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-8"
                      >
                        <h3 className="text-xl font-display font-bold text-white mb-8 flex items-center gap-2">
                          <Zap className="text-[#F59E0B] w-5 h-5" /> Frequency Band Distribution
                        </h3>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Sub-Bass', value: 15 },
                                  { name: 'Bass', value: 25 },
                                  { name: 'Low-Mid', value: 20 },
                                  { name: 'High-Mid', value: 25 },
                                  { name: 'Treble', value: 15 },
                                ]}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                dataKey="value"
                                animationDuration={1500}
                              >
                                {[
                                  '#EF4444', // red
                                  '#F59E0B', // amber
                                  '#10B981', // emerald
                                  '#3B82F6', // blue
                                  '#7C3AED', // purple
                                ].map((color, index) => (
                                  <Cell key={`cell-${index}`} fill={color} stroke="rgba(15, 23, 42, 0.5)" strokeWidth={2} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F8FAFC' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-5 gap-2 mt-4">
                          {['Sub-Bass', 'Bass', 'Low-Mid', 'High-Mid', 'Treble'].map((band, i) => (
                            <div key={band} className="text-center">
                              <div className="text-[10px] text-[#9CA3AF] uppercase font-bold mb-2 tracking-tighter">{band}</div>
                              <div className={cn("h-1 rounded-full", [
                                'bg-[#EF4444]', 'bg-[#F59E0B]', 'bg-[#10B981]', 'bg-[#3B82F6]', 'bg-[#7C3AED]'
                              ][i])} />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Right Column: Stats & Health */}
                  <div className="space-y-8">
                    
                    {/* Health Status Card */}
                    <div className="glass-card p-8">
                      <h3 className="text-xl font-display font-bold text-white mb-8 flex items-center gap-2">
                        <ShieldCheck className="text-[#10B981] w-5 h-5" /> Instrument Health
                      </h3>
                      <div className="flex items-center gap-6 mb-10">
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl",
                          result.prediction.health === 'Healthy' ? "bg-[#10B981]/20 text-[#10B981] shadow-[#10B981]/10" : "bg-[#F59E0B]/20 text-[#F59E0B] shadow-[#F59E0B]/10"
                        )}>
                          <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-white tracking-tight">{result.prediction.health}</div>
                          <div className="text-[10px] text-[#9CA3AF] uppercase tracking-[0.2em] font-bold">Current Status</div>
                        </div>
                      </div>
                      
                      <div className="space-y-8">
                        <div>
                          <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-3 font-bold uppercase tracking-widest">
                            <span>Resonance Quality</span>
                            <span>{result.prediction.intensity.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${result.prediction.intensity}%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-[#10B981] to-[#06B6D4]"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-3 font-bold uppercase tracking-widest">
                            <span>Harmonic Stability</span>
                            <span>{(result.prediction.confidence - 5).toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${result.prediction.confidence - 5}%` }}
                              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                              className="h-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Premium Features Card */}
                    {user.isPremium && (
                      <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-3xl text-white shadow-xl shadow-amber-500/20">
                        <div className="flex items-center gap-2 mb-6">
                          <Zap className="w-5 h-5 fill-current" />
                          <h3 className="text-lg font-bold">Premium Insights</h3>
                        </div>
                        <ul className="space-y-4 text-sm font-medium">
                          <li className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            Deep Harmonic Layer Analysis
                          </li>
                          <li className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            Acoustic Environment Simulation
                          </li>
                          <li className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            Multi-Instrument Separation
                          </li>
                          <li className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            High-Res Spectrogram Export
                          </li>
                        </ul>
                        <button className="w-full mt-8 py-3 bg-white text-amber-600 font-bold rounded-xl hover:bg-zinc-100 transition-colors">
                          View Advanced Metrics
                        </button>
                      </div>
                    )}

                    {/* System Info Panel */}
                    <div className="glass-card p-8">
                      <h3 className="text-xl font-display font-bold text-white mb-8 flex items-center gap-2">
                        <Server className="text-[#7C3AED] w-5 h-5" /> System Info
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#9CA3AF]">CNN Model</span>
                          <span className="text-white font-mono">v4.2-stable</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#9CA3AF]">Processing</span>
                          <span className="text-white font-mono">GPU Accelerated</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#9CA3AF]">Developer</span>
                          <span className="text-white">Sai Nikith</span>
                        </div>
                        <div className="pt-6 border-t border-white/5 flex justify-center gap-6">
                          <Info className="w-5 h-5 text-[#06B6D4] animate-pulse" />
                          <Zap className="w-5 h-5 text-[#7C3AED] animate-pulse delay-75" />
                          <Activity className="w-5 h-5 text-[#10B981] animate-pulse delay-150" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Reset Button */}
                <div className="flex justify-center pt-12">
                  <button 
                    onClick={() => {
                      setResult(null);
                      setFile(null);
                    }}
                    className="px-10 py-4 bg-white/5 backdrop-blur-md text-[#9CA3AF] hover:text-white border border-white/10 hover:border-[#7C3AED]/50 rounded-2xl transition-all flex items-center gap-3 text-sm font-bold uppercase tracking-widest group"
                  >
                    <Activity className="w-4 h-4 group-hover:text-[#7C3AED] transition-colors" />
                    Analyze another file
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      <Footer />
    </div>
  );
}

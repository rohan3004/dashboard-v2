import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Terminal, LogOut, LayoutDashboard, User, Activity, 
  ShieldAlert, Trash2, Server, Database, 
  Code2, Trophy, Flame, CheckCircle, Loader2,
  Award, Zap, Target, TrendingUp, Layers
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';
// Ensure the import path matches your structure
import type { HealthData } from '../types/auth';

// --- CONFIG ---
const OPEN_API_BASE = 'https://apis.byrohan.in/v1';

// --- THEME & COLORS ---
const COLORS = {
  leetcode: '#FFA116',
  gfg: '#2F8D46',
  codechef: '#5C4033',
  codeforces: '#1F8ACB',
  easy: '#00B8A3',
  medium: '#FFC01E',
  hard: '#EF4743',
  school: '#64748b',
  basic: '#a8a29e',
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  slate: '#64748b'
};

const Dashboard = () => {
  const { user, logout, addNotification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'health'>('overview');
  const [selectedPlatform, setSelectedPlatform] = useState<'leetcode' | 'gfg' | 'codechef' | 'codeforces'>('leetcode');
  const [reportData, setReportData] = useState<any>(null);
  
  // Removed unused loadingReport state
  const [isProcessingNewUser, setIsProcessingNewUser] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);

  // New User Detection
  useEffect(() => {
    if (location.state?.isNewUser) setIsProcessingNewUser(true);
  }, [location.state]);

  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  // --- FETCHING ---
  const fetchReport = async () => {
    if (!user?.username) return;
    try {
      const response = await axios.get(`${OPEN_API_BASE}/reports/${user.username}`);
      setReportData(response.data);
      // removed setLoadingReport(false)
      setIsProcessingNewUser(false);
      return true;
    } catch (err: any) {
      // removed setLoadingReport(false)
      return false;
    }
  };

  useEffect(() => {
    let intervalId: any;
    const startPolling = async () => {
      const success = await fetchReport();
      if (!success && isProcessingNewUser) {
        intervalId = setInterval(async () => {
          const found = await fetchReport();
          if (found) clearInterval(intervalId);
        }, 10000);
      }
    };
    startPolling();
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [user?.username, isProcessingNewUser]);

  const fetchHealth = async () => {
    try {
      const { data } = await api.get<HealthData>('/admin/health');
      setHealthData(data);
    } catch (err) { addNotification('error', 'Health Check Failed'); }
  };
  
  useEffect(() => { if (activeTab === 'health' && isAdmin) fetchHealth(); }, [activeTab, isAdmin]);

  // --- DATA PROCESSING FOR VISUALS ---
  const safeData = reportData || {};
  const lc = safeData.leetcode || {};
  const gfg = safeData.geeksforgeeks || {};
  const cc = safeData.codechef || {};
  const cf = safeData.codeforces || {};

  // Aggregate Stats
  const totalSolved = (lc.problems_solved_total || 0) + (gfg.problems_solved_total || 0) + (cc.problems_solved_total || 0) + (cf.problems_solved_total || 0);
  const maxRating = Math.max(lc.rating || 0, cc.rating || 0, cf.rating || 0);
  const maxStreak = Math.max(lc.streak_max || 0, cf.streak_max || 0, gfg.streak_current || 0);
  
  // 1. Radar Chart Data (Developer DNA)
  const normalize = (val: number, max: number) => Math.min((val / max) * 100, 100);
  
  const dnaData = [
    { subject: 'Consistency', A: normalize(maxStreak, 100), fullMark: 100 },
    { subject: 'Volume', A: normalize(totalSolved, 1000), fullMark: 100 },
    { subject: 'Hard Skills', A: normalize((lc.problems_solved_hard || 0) * 5, 500), fullMark: 100 }, 
    { subject: 'Rating', A: normalize(maxRating, 2500), fullMark: 100 },
    { subject: 'Versatility', A: normalize([lc, gfg, cc, cf].filter(p => (p.problems_solved_total || 0) > 5).length, 4) * 100, fullMark: 100 },
    { subject: 'Speed', A: normalize(lc.platform_specific?.acceptance_rate ? parseFloat(lc.platform_specific.acceptance_rate) : 50, 100), fullMark: 100 },
  ];

  // 2. Activity Simulation
  const activityData = Array.from({ length: 7 }, (_, i) => ({
    name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    solved: Math.floor(Math.random() * 15) + 2,
    rating: maxRating - Math.floor(Math.random() * 50)
  }));

  // 3. Dynamic Difficulty Distribution Generator
  const getDifficultyData = () => {
    switch(selectedPlatform) {
      case 'leetcode':
        return [
          { name: 'Easy', value: lc.problems_solved_easy || 0, fill: COLORS.easy },
          { name: 'Medium', value: lc.problems_solved_medium || 0, fill: COLORS.medium },
          { name: 'Hard', value: lc.problems_solved_hard || 0, fill: COLORS.hard },
        ];
      case 'gfg':
        return [
          { name: 'School', value: gfg.problems_solved_school || 0, fill: COLORS.school },
          { name: 'Basic', value: gfg.problems_solved_basic || 0, fill: COLORS.basic },
          { name: 'Easy', value: gfg.problems_solved_easy || 0, fill: COLORS.easy },
          { name: 'Medium', value: gfg.problems_solved_medium || 0, fill: COLORS.medium },
          { name: 'Hard', value: gfg.problems_solved_hard || 0, fill: COLORS.hard },
        ];
      case 'codechef': // CodeChef often doesn't provide breakdown in scraping, check your data
      case 'codeforces': 
        // Mock data or aggregate if breakdown is missing in scraper
        return [
          { name: 'Total', value: (selectedPlatform === 'codechef' ? cc : cf).problems_solved_total || 0, fill: COLORS[selectedPlatform] }
        ];
      default: return [];
    }
  };

  const activePlatformData = selectedPlatform === 'leetcode' ? lc : 
                             selectedPlatform === 'gfg' ? gfg : 
                             selectedPlatform === 'codechef' ? cc : cf;

  // 4. Platform Solved Comparison
  const platformSolved = [
    { name: 'LeetCode', solved: lc.problems_solved_total || 0, fill: COLORS.leetcode },
    { name: 'GFG', solved: gfg.problems_solved_total || 0, fill: COLORS.gfg },
    { name: 'CodeChef', solved: cc.problems_solved_total || 0, fill: COLORS.codechef },
    { name: 'Codeforces', solved: cf.problems_solved_total || 0, fill: COLORS.codeforces },
  ].sort((a,b) => b.solved - a.solved);

  // --- ADMIN ACTIONS ---
  const [targetUser, setTargetUser] = useState('');
  const handleAdminAction = async (action: 'delete' | 'revoke') => {
    if (!targetUser) return;
    if (action === 'delete' && !window.confirm(`Delete ${targetUser}?`)) return;
    try {
      const endpoint = action === 'delete' ? '/auth/delete' : '/auth/revoke';
      if (action === 'delete') await api.delete(endpoint, { params: { username: targetUser } });
      else await api.post(endpoint, null, { params: { username: targetUser } });
      addNotification('success', `Action ${action} successful`);
      setTargetUser('');
    } catch (err: any) { addNotification('error', err.response?.data?.message || 'Action failed'); }
  };

  // --- RENDER LOAD STATE ---
  if (isProcessingNewUser && !reportData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Code2 className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" size={48} />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Analyzing Profile</h2>
            <p className="text-slate-400 text-lg">
              Compiling cross-platform metrics...
              <br/><span className="text-sm opacity-60">Estimated time: 2-3 minutes</span>
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 max-w-sm mx-auto space-y-4">
             <div className="flex items-center gap-3 text-emerald-400"><CheckCircle size={18} /> <span className="font-medium">Account Verified</span></div>
             <div className="flex items-center gap-3 text-indigo-400 animate-pulse"><Loader2 size={18} className="animate-spin" /> <span className="font-medium">Fetching Problem Stats...</span></div>
             <div className="flex items-center gap-3 text-slate-500"><div className="w-4 h-4 rounded-full border-2 border-slate-600"/> <span>Generating Insights</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* --- HEADER --- */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <Terminal className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">Dashboards<span className="text-indigo-500">.byrohan.in</span></h1>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Analytics Console</span>
          </div>
          {isAdmin && <span className="ml-3 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold border border-rose-500/20">ADMIN</span>}
        </div>
        <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-200">{user?.username}</p>
              <div className="flex items-center justify-end gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Live</p>
              </div>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} className="p-2.5 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-rose-400 border border-transparent hover:border-slate-700">
              <LogOut size={18} />
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* --- SIDEBAR --- */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col p-4 gap-1">
           <div className="px-3 mb-2"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dashboards</p></div>
           
           <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
              <LayoutDashboard size={18} className={activeTab === 'overview' ? 'text-indigo-200' : 'text-slate-500 group-hover:text-slate-300'} /> Overview
           </button>
           
           {isAdmin && (
             <div className="mt-8">
               <div className="px-3 mb-2"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Control</p></div>
               <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group mb-1 ${activeTab === 'users' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:bg-slate-800'}`}>
                  <User size={18} /> User Management
               </button>
               <button onClick={() => setActiveTab('health')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${activeTab === 'health' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:bg-slate-800'}`}>
                  <Activity size={18} /> System Health
               </button>
             </div>
           )}

           <div className="mt-auto bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50">
             <div className="flex items-center gap-3 mb-2">
               <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400"><Zap size={14}/></div>
               <span className="text-xs font-bold text-slate-300">Pro Status</span>
             </div>
             <p className="text-[10px] text-slate-500 leading-relaxed">Your profile is automatically refreshing every 10 minutes.</p>
           </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {activeTab === 'overview' && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* --- HERO SECTION --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                   { label: 'Total Solved', value: totalSolved.toLocaleString(), icon: Code2, color: '#10b981', gradient: 'from-emerald-500/20 to-emerald-500/5' },
                   { label: 'Max Rating', value: maxRating, icon: Trophy, color: '#f59e0b', gradient: 'from-amber-500/20 to-amber-500/5' },
                   { label: 'Max Streak', value: `${maxStreak} Days`, icon: Flame, color: '#ef4444', gradient: 'from-rose-500/20 to-rose-500/5' },
                   { label: 'Active Days', value: lc.platform_specific?.total_active_days || 'N/A', icon: Layers, color: '#6366f1', gradient: 'from-indigo-500/20 to-indigo-500/5' },
                 ].map((stat, i) => (
                   <div key={i} className={`relative overflow-hidden bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 transition-all hover:scale-[1.02] hover:shadow-xl hover:border-slate-600 group`}>
                      <div className={`absolute top-0 right-0 p-20 rounded-full bg-gradient-to-br ${stat.gradient} blur-3xl opacity-40 translate-x-10 -translate-y-10 group-hover:opacity-60 transition-opacity`}/>
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 shadow-sm" style={{color: stat.color}}>
                          <stat.icon size={22} strokeWidth={2.5} />
                        </div>
                        {stat.label === 'Max Rating' && <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">ELITE</span>}
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</h3>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                      </div>
                   </div>
                 ))}
              </div>

              {/* --- ANALYTICS GRID --- */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. DEVELOPER DNA (RADAR) */}
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col">
                   <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Target size={18} className="text-indigo-400"/> Developer DNA</h3>
                        <p className="text-xs text-slate-400">Skill Distribution Analysis</p>
                      </div>
                      <button className="p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"><TrendingUp size={16} className="text-indigo-400"/></button>
                   </div>
                   <div className="flex-1 min-h-[300px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dnaData}>
                          <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="My Skills" dataKey="A" stroke="#818cf8" strokeWidth={3} fill="#6366f1" fillOpacity={0.3} />
                          <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff'}} itemStyle={{color: '#818cf8'}}/>
                        </RadarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/50 via-transparent to-transparent"/>
                   </div>
                </div>

                {/* 2. PLATFORM DEEP DIVE (DYNAMIC) */}
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-0 overflow-hidden shadow-xl flex flex-col">
                  {/* Platform Tabs Header */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                     <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-700/50 overflow-x-auto max-w-full">
                        {['leetcode', 'gfg', 'codechef', 'codeforces'].map(p => (
                          <button 
                            key={p}
                            onClick={() => setSelectedPlatform(p as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${selectedPlatform === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                          >
                            {p === 'gfg' ? 'GeeksForGeeks' : p}
                          </button>
                        ))}
                     </div>
                     
                     <div className="text-right hidden sm:block">
                        <p className="text-3xl font-bold text-white tracking-tighter">{activePlatformData.rating || 'N/A'}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {selectedPlatform === 'gfg' ? 'Streak' : 'Contest Rating'}
                        </p>
                     </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 items-center">
                     {/* Donut Chart */}
                     <div className="relative flex items-center justify-center h-full min-h-[200px]">
                        <div className="w-48 h-48 relative z-10">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie data={getDifficultyData()} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                                    {getDifficultyData().map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill}/>)}
                                 </Pie>
                                 <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px'}} />
                              </PieChart>
                           </ResponsiveContainer>
                           {/* Center Text */}
                           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-3xl font-bold text-white">{activePlatformData.problems_solved_total || 0}</span>
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Solved</span>
                           </div>
                        </div>
                        {/* Glow Effect */}
                        <div className="absolute w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"/>
                     </div>

                     {/* Stats Breakdown */}
                     <div className="space-y-4">
                        <div className="space-y-3">
                           {getDifficultyData().map((diff, i) => (
                              <div key={i} className="group">
                                 <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-300 font-medium">{diff.name}</span>
                                    <span className="text-slate-400 font-mono"><span className="text-white font-bold">{diff.value}</span></span>
                                 </div>
                                 <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                                      style={{ width: `${(diff.value / (activePlatformData.problems_solved_total || 1)) * 100}%`, backgroundColor: diff.fill }}
                                    />
                                 </div>
                              </div>
                           ))}
                        </div>
                        <div className="pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4">
                           <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Metric A</p>
                              <p className="text-lg font-bold text-indigo-400">
                                {selectedPlatform === 'leetcode' ? (activePlatformData.platform_specific?.acceptance_rate || 'N/A') : 
                                 selectedPlatform === 'codeforces' ? (activePlatformData.platform_specific?.max_rank || 'N/A') : 
                                 selectedPlatform === 'codechef' ? (activePlatformData.platform_specific?.division || 'N/A') : 'N/A'}
                              </p>
                           </div>
                           <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Metric B</p>
                              <div className="flex items-center gap-1.5">
                                 <Award size={16} className="text-amber-500"/>
                                 <p className="text-lg font-bold text-white">
                                   {selectedPlatform === 'leetcode' ? (activePlatformData.platform_specific?.badges || 0) : 
                                    selectedPlatform === 'codechef' ? (activePlatformData.platform_specific?.contest_rank_stars || '-') : '-'}
                                 </p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* --- SECOND ROW --- */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 
                 {/* PLATFORM COMPARISON */}
                 <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="text-lg font-bold text-white">Platform Distribution</h3>
                       <div className="flex gap-2">
                          {['LC', 'GFG', 'CC', 'CF'].map(p => <span key={p} className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded cursor-default">{p}</span>)}
                       </div>
                    </div>
                    <div className="h-64">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={platformSolved} layout="vertical" margin={{ left: 10, right: 10 }}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false}/>
                             <XAxis type="number" stroke="#64748b" fontSize={10} hide/>
                             <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} tickLine={false} axisLine={false} fontWeight={500}/>
                             <RechartsTooltip cursor={{fill: '#334155', opacity: 0.2}} contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff'}}/>
                             <Bar dataKey="solved" radius={[0, 4, 4, 0]} barSize={32}>
                                {platformSolved.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                             </Bar>
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 {/* ACTIVITY TREND (SIMULATED) */}
                 <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                       <div>
                          <h3 className="text-lg font-bold text-white">Activity Momentum</h3>
                          <p className="text-xs text-slate-400">Projected solving consistency</p>
                       </div>
                       <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                          <TrendingUp size={12} /> High
                       </div>
                    </div>
                    <div className="h-64">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={activityData}>
                             <defs>
                                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                   <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false}/>
                             <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false}/>
                             <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false}/>
                             <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff'}}/>
                             <Area type="monotone" dataKey="solved" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorActivity)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

              </div>

            </div>
          )}

          {/* --- ADMIN TABS --- */}
          {activeTab === 'users' && isAdmin && (
             <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                   <h3 className="text-rose-400 font-bold flex gap-2 mb-4"><Trash2 size={18}/> Delete User</h3>
                   <div className="flex gap-2">
                      <input value={targetUser} onChange={e => setTargetUser(e.target.value)} placeholder="Username" className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-rose-500 transition-all"/>
                      <button onClick={() => handleAdminAction('delete')} className="bg-rose-600 hover:bg-rose-500 px-4 rounded-lg font-bold text-white transition-colors">Delete</button>
                   </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                   <h3 className="text-amber-400 font-bold flex gap-2 mb-4"><ShieldAlert size={18}/> Revoke Session</h3>
                   <div className="flex gap-2">
                      <input value={targetUser} onChange={e => setTargetUser(e.target.value)} placeholder="Username" className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white outline-none focus:ring-1 focus:ring-amber-500 transition-all"/>
                      <button onClick={() => handleAdminAction('revoke')} className="bg-amber-600 hover:bg-amber-500 px-4 rounded-lg font-bold text-white transition-colors">Revoke</button>
                   </div>
                </div>
             </div>
          )}
          {activeTab === 'health' && isAdmin && healthData && (
             <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex justify-between items-center relative overflow-hidden group">
                   <div className="relative z-10"><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Server Status</p><p className="text-3xl font-bold text-emerald-400">{healthData.server}</p></div>
                   <Server className="text-emerald-500/20 group-hover:text-emerald-500/30 transition-colors" size={64} />
                   <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"/>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex justify-between items-center relative overflow-hidden group">
                   <div className="relative z-10"><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Database</p><p className={`text-3xl font-bold ${healthData.database === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>{healthData.database}</p></div>
                   <Database className={`${healthData.database === 'active' ? 'text-emerald-500/20' : 'text-rose-500/20'} group-hover:opacity-40 transition-opacity`} size={64} />
                </div>
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    BookOpen, Users, Shield, Target, 
    Sparkles, ArrowRight, CheckCircle2, 
    Code, Briefcase, BarChart, GraduationCap, Layout, Cpu,
    Menu, X, Play, ChevronDown, Activity, Globe, Zap
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getDefaultRouteForUser } from '../../../utils/authRoute';

const FLOATING_PILLS = [
    { text: "B2B Sales", icon: Briefcase, top: "15%", left: "10%", delay: 0, duration: 15 },
    { text: "DevOps Engineer", icon: Cpu, top: "25%", left: "75%", delay: 2, duration: 18 },
    { text: "Content Creator", icon: BookOpen, top: "40%", left: "15%", delay: 1, duration: 20 },
    { text: "UI/UX Designer", icon: Layout, top: "70%", left: "5%", delay: 3, duration: 16 },
    { text: "Data Scientist", icon: BarChart, top: "80%", left: "30%", delay: 0.5, duration: 19 },
    { text: "HR Manager", icon: Users, top: "20%", left: "85%", delay: 2.5, duration: 17 },
    { text: "Project Manager", icon: Target, top: "60%", left: "80%", delay: 1.5, duration: 21 }
];

const PRICING_PLANS = [
    {
        name: "Starter",
        price: "$0",
        period: "forever",
        description: "Perfect for small teams getting started with knowledge sharing.",
        features: ["Up to 50 users", "Basic Knowledge Hub", "Standard Mentoring", "Community Support"],
        buttonText: "Get Started",
        popular: false
    },
    {
        name: "Professional",
        price: "$49",
        period: "per user/month",
        description: "Advanced tools for growing teams to exchange skills effectively.",
        features: ["Unlimited users", "Advanced Analytics", "Custom Learning Paths", "Priority Support", "API Access"],
        buttonText: "Start Free Trial",
        popular: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "contact sales",
        description: "Dedicated support and infrastructure for large organizations.",
        features: ["Everything in Pro", "Dedicated Success Manager", "SSO Integration", "On-premise Deployment", "Custom SLA"],
        buttonText: "Contact Sales",
        popular: false
    }
];

const FAQS = [
    { q: "How does the skill matching algorithm work?", a: "InnerG uses a proprietary AI to analyze employee profiles, learning goals, and past experiences to recommend the perfect mentors and learning paths." },
    { q: "Can we integrate with our existing HR software?", a: "Yes, our Enterprise plan offers seamless integration with popular HRIS platforms like Workday, BambooHR, and SAP SuccessFactors." },
    { q: "Is our internal data secure?", a: "Absolutely. We use bank-level encryption (AES-256) and comply with GDPR, SOC2, and ISO 27001 standards to ensure your corporate knowledge is safe." }
];

// Reusable Dashboard Mockup Component for the Hero
const DashboardMockup = () => (
    <motion.div 
        initial={{ opacity: 0, y: 100, rotateX: 20 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 50 }}
        className="relative mx-auto mt-20 max-w-5xl rounded-2xl border border-white/10 bg-[#0a0f0d]/90 backdrop-blur-2xl shadow-2xl shadow-[#00df81]/10 overflow-hidden flex"
        style={{ perspective: "1000px" }}
    >
        {/* Mockup Header/Mac window dots */}
        <div className="absolute top-0 left-0 right-0 h-10 border-b border-white/5 bg-white/[0.02] flex items-center px-4 gap-2 z-10">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>

        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-64 border-r border-white/5 bg-white/[0.01] pt-16 p-4 gap-6">
            <div className="h-8 w-3/4 bg-white/5 rounded-md animate-pulse" />
            <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-10 w-full rounded-lg ${i === 2 ? 'bg-[#00df81]/20 border border-[#00df81]/30' : 'bg-white/5'} flex items-center px-3 gap-3`}>
                        <div className={`w-5 h-5 rounded ${i === 2 ? 'bg-[#00df81]' : 'bg-white/20'}`} />
                        <div className={`h-3 rounded ${i === 2 ? 'bg-[#00df81]/80 w-1/2' : 'bg-white/20 w-2/3'}`} />
                    </div>
                ))}
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 pt-16 p-8 flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <div className="h-6 w-48 bg-white/10 rounded-md mb-2" />
                    <div className="h-4 w-32 bg-white/5 rounded-md" />
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-10 bg-white/5 rounded-full" />
                    <div className="h-10 w-24 bg-[#00df81]/20 rounded-lg border border-[#00df81]/30" />
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-28 rounded-xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-4 flex flex-col justify-between">
                        <div className="h-4 w-1/2 bg-white/10 rounded" />
                        <div className="flex items-end gap-2">
                            <div className="h-8 w-1/3 bg-white/20 rounded" />
                            <div className="h-4 w-1/4 bg-[#00df81]/50 rounded mb-1" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Chart Area */}
            <div className="flex-1 rounded-xl border border-white/5 bg-white/[0.02] p-6 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#00df81]/10 to-transparent flex items-end justify-between px-8">
                    {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                        <motion.div 
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 1.5, delay: 1 + (i * 0.1), ease: "easeOut" }}
                            className="w-8 bg-[#00df81] rounded-t-md opacity-80"
                        />
                    ))}
                </div>
            </div>
        </div>
    </motion.div>
);

const LandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [openFaq, setOpenFaq] = useState(null);

    const yBackground = useTransform(scrollY, [0, 1000], [0, 300]);

    useEffect(() => {
        const updateScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', updateScroll);
        return () => window.removeEventListener('scroll', updateScroll);
    }, []);

    const handleCTA = () => {
        if (user) navigate(getDefaultRouteForUser(user));
        else navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#050908] text-white font-sans selection:bg-[#00df81] selection:text-[#050908] overflow-hidden">
            
            {/* Dynamic Mesh Gradient Background */}
            <motion.div style={{ y: yBackground }} className="fixed inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#00df81] blur-[150px] rounded-full mix-blend-screen opacity-20 animate-[spin_30s_linear_infinite]" />
                <div className="absolute bottom-[-10%] right-[-20%] w-[60vw] h-[60vw] bg-[#0066ff] blur-[150px] rounded-full mix-blend-screen opacity-10 animate-[spin_40s_linear_infinite_reverse]" />
                <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-[#00b066] blur-[150px] rounded-full mix-blend-screen opacity-10 animate-[pulse_10s_ease-in-out_infinite]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </motion.div>

            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-[#050908]/70 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo(0,0)}>
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00df81] to-[#00b066] rounded-xl flex items-center justify-center shadow-lg shadow-[#00df81]/20 group-hover:shadow-[#00df81]/40 transition-all">
                            <Sparkles className="w-6 h-6 text-[#050908]" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">InnerG</span>
                    </div>

                    <div className="hidden md:flex items-center gap-10 bg-white/[0.03] border border-white/5 px-8 py-3 rounded-full backdrop-blur-md">
                        <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Platform</a>
                        <a href="#solutions" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Solutions</a>
                        <a href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</a>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                            {user ? '' : 'Log in'}
                        </button>
                        <button 
                            onClick={handleCTA}
                            className="group relative px-6 py-2.5 text-sm font-bold text-[#050908] bg-[#00df81] rounded-full overflow-hidden transition-all hover:scale-105"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {user ? 'Dashboard' : 'Start Free'} 
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        </button>
                    </div>

                    <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen pt-32 pb-20 z-10 flex flex-col items-center justify-center">
                {/* Floating Pills */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50 hidden lg:block">
                    {FLOATING_PILLS.map((pill, i) => (
                        <motion.div
                            key={i}
                            animate={{ y: [0, -40, 0], x: [0, 20, 0], rotate: [0, 10, -5, 0] }}
                            transition={{ duration: pill.duration, repeat: Infinity, delay: pill.delay, ease: "easeInOut" }}
                            className="absolute flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-xl"
                            style={{ top: pill.top, left: pill.left }}
                        >
                            <div className="p-1.5 bg-[#00df81]/20 rounded-full"><pill.icon className="w-3.5 h-3.5 text-[#00df81]" /></div>
                            <span className="text-xs font-semibold tracking-wide text-gray-300">{pill.text}</span>
                        </motion.div>
                    ))}
                </div>

                <div className="max-w-5xl mx-auto px-6 text-center z-10 mt-10">
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00df81]/10 border border-[#00df81]/20 mb-8 backdrop-blur-md cursor-pointer hover:bg-[#00df81]/20 transition-colors">
                            <span className="flex h-2 w-2 rounded-full bg-[#00df81] animate-pulse"></span>
                            <span className="text-sm font-semibold text-[#00df81]">InnerG AI 2.0 is now live</span>
                            <ArrowRight className="w-4 h-4 text-[#00df81]" />
                        </div>
                        
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-8 leading-[1.1]">
                            Unleash your team's <br className="hidden md:block" />
                            <span className="relative inline-block">
                                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#00df81] via-[#00f28b] to-[#00b066]">collective brainpower.</span>
                                <div className="absolute -bottom-2 left-0 right-0 h-4 bg-[#00df81]/20 blur-xl" />
                            </span>
                        </h1>
                        
                        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
                            The ultimate operating system for enterprise knowledge. Match skills, manage resources, and track growth in one unified workspace.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                            <button onClick={handleCTA} className="w-full sm:w-auto px-10 py-5 text-lg font-bold text-[#050908] bg-white hover:bg-gray-100 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:scale-105">
                                Start Building <Zap className="w-5 h-5 fill-current" />
                            </button>
                            <button className="w-full sm:w-auto px-10 py-5 text-lg font-bold text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-full transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-md">
                                <Play className="w-5 h-5" /> Watch Demo
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Dashboard Mockup */}
                <div className="w-full px-6">
                    <DashboardMockup />
                </div>
            </section>

            {/* Trusted By Marquee */}
            <div className="border-y border-white/5 bg-white/[0.01] py-10 overflow-hidden flex relative z-10">
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050908] to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050908] to-transparent z-10" />
                <motion.div 
                    animate={{ x: [0, -1000] }} 
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="flex items-center gap-20 whitespace-nowrap px-10"
                >
                    {["Acme Corp", "GlobalTech", "Nexus", "Quantum", "Apex Systems", "Stark Ind.", "Wayne Ent.", "Acme Corp", "GlobalTech", "Nexus"].map((company, i) => (
                        <div key={i} className="flex items-center gap-3 text-gray-500 font-bold text-2xl opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                            <Globe className="w-8 h-8" /> {company}
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Advanced Bento Grid Features */}
            <section id="features" className="py-32 relative z-10 bg-gradient-to-b from-[#050908] to-[#0a0f0d]">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">Everything you need to <span className="italic font-light text-gray-400">scale.</span></h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">Replace fragmented tools with one cohesive platform designed to foster a culture of continuous learning.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">
                        {/* Feature 1: Large Box with Floating Avatars */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="md:col-span-2 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-[2rem] p-10 relative overflow-hidden group hover:border-[#00df81]/40 transition-colors"
                        >
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[#00df81]/10 blur-[100px] rounded-full group-hover:bg-[#00df81]/20 transition-colors" />
                            <h3 className="text-3xl font-bold mb-4">Skill Exchange Network</h3>
                            <p className="text-gray-400 max-w-sm text-lg">Automatically pair mentors and mentees based on organizational needs and personal growth goals.</p>
                            
                            <div className="absolute bottom-[-20px] right-[-20px] w-3/4 h-64 bg-[#050908] rounded-tl-3xl border-t border-l border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
                                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                    <div className="text-sm font-bold text-gray-300">Smart Match</div>
                                    <div className="px-3 py-1 bg-[#00df81]/20 text-[#00df81] text-xs font-bold rounded-full border border-[#00df81]/30">98% Match</div>
                                </div>
                                <div className="flex items-center gap-6 mt-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border-2 border-[#050908] shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                        <span className="text-xs text-gray-400">Mentor</span>
                                    </div>
                                    <div className="flex-1 h-px bg-gradient-to-r from-blue-500 via-[#00df81] to-pink-500 relative">
                                        <motion.div animate={{ x: [0, 100, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]" />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500 border-2 border-[#050908] shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
                                        <span className="text-xs text-gray-400">Mentee</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Feature 2: Small Box */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                            className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-10 flex flex-col justify-between group hover:bg-white/[0.04] transition-colors"
                        >
                            <div>
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform border border-white/10">
                                    <Shield className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Bank-grade Security</h3>
                                <p className="text-gray-400">Your corporate knowledge is locked down with SOC2 compliance and AES-256 encryption.</p>
                            </div>
                        </motion.div>

                        {/* Feature 3: Small Box */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                            className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-10 flex flex-col justify-between group hover:bg-white/[0.04] transition-colors"
                        >
                            <div>
                                <div className="w-16 h-16 bg-[#00df81]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:-rotate-12 transition-transform border border-[#00df81]/20">
                                    <BookOpen className="w-8 h-8 text-[#00df81]" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Resource Hub</h3>
                                <p className="text-gray-400">A centralized, AI-searchable repository for all your company documents and tutorials.</p>
                            </div>
                        </motion.div>

                        {/* Feature 4: Large Box with Chart */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                            className="md:col-span-2 bg-[#050908] border border-white/10 rounded-[2rem] p-10 relative overflow-hidden group"
                        >
                            {/* Grid Background Pattern */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
                            
                            <div className="relative z-10 flex justify-between">
                                <div>
                                    <h3 className="text-3xl font-bold mb-4">Real-time Analytics</h3>
                                    <p className="text-gray-400 max-w-sm text-lg">Measure engagement, track skill progression, and prove the ROI of your learning initiatives.</p>
                                </div>
                                <div className="hidden md:flex items-end gap-3 h-40">
                                    {[30, 50, 40, 70, 60, 90].map((h, i) => (
                                        <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="w-12 bg-gradient-to-t from-[#00df81] to-teal-400 rounded-t-lg opacity-80" />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Pricing Section with Toggle */}
            <section id="pricing" className="py-32 relative z-10">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold mb-6">Invest in your <span className="text-[#00df81]">people.</span></h2>
                        <p className="text-xl text-gray-400 mb-10 font-light">Simple pricing that scales with your company.</p>
                        
                        <div className="inline-flex items-center bg-white/5 p-1 rounded-full border border-white/10">
                            <button onClick={() => setBillingCycle('monthly')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>Monthly</button>
                            <button onClick={() => setBillingCycle('annual')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === 'annual' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>
                                Annually <span className="ml-1 text-xs text-[#00df81]">Save 20%</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
                        {PRICING_PLANS.map((plan, index) => (
                            <motion.div 
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative bg-[#0a0f0d] border ${plan.popular ? 'border-[#00df81] shadow-[0_0_50px_rgba(0,223,129,0.15)] md:scale-105 z-10' : 'border-white/10'} rounded-[2rem] p-10 flex flex-col`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00df81] text-[#050908] text-sm font-bold px-5 py-1.5 rounded-full flex items-center gap-1 shadow-lg shadow-[#00df81]/30">
                                        <Sparkles className="w-4 h-4" /> MOST POPULAR
                                    </div>
                                )}
                                
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-gray-400 text-sm mb-6 h-10">{plan.description}</p>
                                
                                <div className="flex items-baseline gap-1 mb-8 border-b border-white/10 pb-8">
                                    <span className="text-5xl font-black text-white">
                                        {plan.price === 'Custom' ? 'Custom' : billingCycle === 'annual' && plan.price !== '$0' ? `$${parseInt(plan.price.slice(1)) * 0.8}` : plan.price}
                                    </span>
                                    {plan.price !== 'Custom' && <span className="text-gray-500 font-medium">/user/mo</span>}
                                </div>
                                
                                <button onClick={handleCTA} className={`w-full py-4 rounded-xl font-bold text-lg mb-8 transition-all duration-300 ${plan.popular ? 'bg-[#00df81] text-[#050908] hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>
                                    {plan.buttonText}
                                </button>
                                
                                <div className="space-y-4">
                                    {plan.features.map((feature, fIndex) => (
                                        <div key={fIndex} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-[#00df81]/20 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-3 h-3 text-[#00df81]" />
                                            </div>
                                            <span className="text-gray-300 font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 border-t border-white/5 bg-[#050908]">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {FAQS.map((faq, i) => (
                            <div key={i} className="border border-white/10 bg-white/[0.02] rounded-2xl overflow-hidden cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                <div className="p-6 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                                    <h4 className="text-lg font-bold">{faq.q}</h4>
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                                </div>
                                <AnimatePresence>
                                    {openFaq === i && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 text-gray-400 leading-relaxed">
                                            {faq.a}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-[#0a0f0d] pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-[#00df81] rounded-lg flex items-center justify-center"><Sparkles className="w-5 h-5 text-[#050908]" /></div>
                            <span className="text-2xl font-bold">InnerG</span>
                        </div>
                        <p className="text-gray-400 max-w-sm leading-relaxed">Empowering enterprises to unlock their collective intelligence through seamless skill exchange and knowledge management.</p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6">Product</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><a href="#" className="hover:text-[#00df81] transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-[#00df81] transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-[#00df81] transition-colors">Security</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6">Company</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><a href="#" className="hover:text-[#00df81] transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-[#00df81] transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-[#00df81] transition-colors">Contact</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
                    <p>© {new Date().getFullYear()} InnerG Technologies Inc. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-gray-300">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-300">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

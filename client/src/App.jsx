import React, { useState } from 'react';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Upload, Search, Download, ArrowRight, Building2, User, Mail, Globe, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

// --- Utility Components ---
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Card = ({ children, className }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden", className)}
    >
        {children}
    </motion.div>
);

const Button = ({ children, onClick, disabled, variant = 'primary', className, icon: Icon }) => {
    const variants = {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200",
        secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm",
        success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                className
            )}
        >
            {Icon && <Icon className="w-5 h-5 mr-2" />}
            {children}
        </button>
    );
};

// --- Main App Component ---
function App() {
    const [step, setStep] = useState('input');
    const [companyName, setCompanyName] = useState('');
    const [companyUrl, setCompanyUrl] = useState('');
    const [progress, setProgress] = useState([]);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [spreadsheetUrl, setSpreadsheetUrl] = useState(null);

    const [loadingText, setLoadingText] = useState('Analyzing Company Data');

    React.useEffect(() => {
        if (step === 'processing') {
            const messages = [
                'Analyzing Company Data...',
                'Finding Decision Makers...',
                'Building a Lead List...',
                'Verifying Emails...',
                'Finalizing Results...'
            ];
            let index = 0;
            const timer = setInterval(() => {
                index = (index + 1) % messages.length;
                setLoadingText(messages[index]);
            }, 2500);
            return () => clearInterval(timer);
        }
    }, [step]);

    const handleGenerate = async () => {
        if (!companyUrl) return;
        setStep('processing');
        setError(null);
        setSpreadsheetUrl(null); // Reset on new generate
        setProgress(['Initializing scrape...']);

        try {
            const progressTimer = setInterval(() => {
                setProgress(prev => {
                    if (prev.includes('Scraping website content...')) {
                        if (prev.includes('Analyzing business model...')) {
                            if (prev.includes('identifying target companies...')) {
                                if (prev.includes('Finding decision makers...')) return prev;
                                return [...prev, 'Finding decision makers...'];
                            }
                            return [...prev, 'identifying target companies...'];
                        }
                        return [...prev, 'Analyzing business model...'];
                    }
                    return [...prev, 'Scraping website content...'];
                });
            }, 1500);

            const response = await axios.post(`${API_URL}/generate-leads`, {
                companyName,
                companyUrl
            });

            clearInterval(progressTimer);
            setResults(response.data);
            setStep('results');
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.error || err.message || 'An error occurred. Please check the URL and try again.';
            setError(errorMessage);
            setStep('input');
        }
    };

    const exportToGoogleSheets = async (tokenResponse) => {
        setIsExporting(true);
        try {
            const response = await axios.post(`${API_URL}/export-sheet`, {
                accessToken: tokenResponse.access_token,
                companyName,
                leads: results.leads
            });
            if (response.data.url) {
                setSpreadsheetUrl(response.data.url);
                window.open(response.data.url, '_blank');
            }
        } catch (err) {
            alert('Export failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsExporting(false);
        }
    };

    const login = useGoogleLogin({
        onSuccess: exportToGoogleSheets,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
    });

    const handleExport = () => {
        login();
    };

    const handleDownloadCSV = () => {
        if (!results || !results.leads) return;

        // Prepare CSV Content
        const headers = ['Name', 'Job Title', 'Company', 'Email', 'LinkedIn', 'Domain'];
        const csvRows = [headers.join(',')];

        results.leads.forEach(lead => {
            const row = [
                `"${lead.name || ''}"`,
                `"${lead.title || ''}"`,
                `"${lead.company || ''}"`,
                `"${lead.email || ''}"`,
                `"${lead.linkedin || ''}"`,
                `"${lead.domain || ''}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${companyName.replace(/\s+/g, '_')}_leads.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                            LeadGen AI
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <a href="#" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">Documentation</a>
                        <a href="#" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">Support</a>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <AnimatePresence mode="wait">

                        {/* INPUT STEP */}
                        {step === 'input' && (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col items-center"
                            >
                                <div className="text-center max-w-2xl mb-12">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6">
                                        <Sparkles className="w-3 h-3" />
                                        AI-Powered B2B Intelligence
                                    </div>
                                    <h1 className="text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                                        Turn Websites into <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Qualified Leads</span>
                                    </h1>
                                    <p className="text-lg text-slate-500 leading-relaxed">
                                        Enter any company URL. Our AI analyzes their business, identifies their Ideal Customer Profile (ICP), and generates verified decision-maker leads instantly.
                                    </p>
                                </div>

                                <Card className="w-full max-w-lg mb-12">
                                    <div className="p-8 space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name</label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={companyName}
                                                    onChange={(e) => setCompanyName(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                                    placeholder="e.g. Stripe"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Website URL</label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                                <input
                                                    type="url"
                                                    value={companyUrl}
                                                    onChange={(e) => setCompanyUrl(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                                    placeholder="https://stripe.com"
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                                {error}
                                            </div>
                                        )}

                                        <Button
                                            variant="primary"
                                            className="w-full text-lg"
                                            onClick={handleGenerate}
                                            disabled={!companyUrl}
                                            icon={ArrowRight}
                                        >
                                            Generate Lead List
                                        </Button>


                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {/* PROCESSING STEP */}
                        {step === 'processing' && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20"
                            >
                                <div className="relative w-32 h-32 mb-8">
                                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                                    </div>
                                </div>

                                <div className="h-10 mb-6 relative w-full flex justify-center">
                                    <AnimatePresence mode="wait">
                                        <motion.h2
                                            key={loadingText}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="text-2xl font-bold text-slate-900 absolute"
                                        >
                                            {loadingText}
                                        </motion.h2>
                                    </AnimatePresence>
                                </div>

                                <div className="w-full max-w-sm space-y-4">
                                    {['Initializing scrape', 'Scraping website content...', 'Analyzing business model...', 'identifying target companies...', 'Finding decision makers...'].map((stepName, idx) => {
                                        // Simple logic to show progress checks
                                        const isActive = progress.length > idx;
                                        return (
                                            <div key={idx} className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                                                isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-400"
                                            )}>
                                                {isActive ? (
                                                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                                                )}
                                                <span className="font-medium">{stepName}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* RESULTS STEP */}
                        {step === 'results' && results && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                {/* Header */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h2 className="text-3xl font-bold text-slate-900">Analysis Results</h2>
                                        <p className="text-slate-500">Target leads generated for {results.leads[0]?.company || 'Unknown Company'}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="secondary" onClick={() => setStep('input')}>New Search</Button>

                                        {spreadsheetUrl ? (
                                            <Button
                                                variant="success"
                                                icon={ArrowRight}
                                                onClick={() => window.open(spreadsheetUrl, '_blank')}
                                            >
                                                View Sheet
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="success"
                                                icon={isExporting ? Loader2 : Download}
                                                onClick={handleExport}
                                                disabled={isExporting}
                                            >
                                                {isExporting ? 'Exporting...' : 'Export to Sheets'}
                                            </Button>
                                        )}
                                        {/* CSV Download Option (No Login) */}
                                        <Button
                                            variant="secondary"
                                            icon={Download}
                                            onClick={handleDownloadCSV}
                                        >
                                            Download CSV
                                        </Button>
                                    </div>
                                </div>

                                {/* Analysis Cards */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card className="h-full">
                                        <div className="p-6 h-full flex flex-col">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <h3 className="font-bold text-slate-800">Company Overview</h3>
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed flex-grow">
                                                {results.companyAnalysis?.summary || 'Analysis unavailable.'}
                                            </p>
                                        </div>
                                    </Card>
                                    <Card className="h-full">
                                        <div className="p-6 h-full flex flex-col">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <h3 className="font-bold text-slate-800">Ideal Customer Profile (ICP)</h3>
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed flex-grow">
                                                {results.companyAnalysis?.icp || 'ICP unavailable.'}
                                            </p>
                                        </div>
                                    </Card>
                                </div>

                                {/* Leads Table */}
                                {/* Grouped Results */}
                                {results.groupedLeads ? (
                                    results.groupedLeads.map((companyGroup, grpIdx) => (
                                        <Card key={grpIdx} className="overflow-hidden mb-8">
                                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                                                        <Building2 className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-800">{companyGroup.companyName}</h3>
                                                        {companyGroup.companyDomain && (
                                                            <div className="flex items-center gap-2">
                                                                <Globe className="w-3 h-3 text-slate-400" />
                                                                <a href={`https://${companyGroup.companyDomain}`} target="_blank" rel="noreferrer" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                                                                    {companyGroup.companyDomain}
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                                                    {companyGroup.decisionMakers.length} Leads
                                                </span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 bg-white">
                                                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Prospect</th>
                                                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Title</th>
                                                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">LinkedIn Profile</th>
                                                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Status</th>
                                                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {companyGroup.decisionMakers.map((lead, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs ring-2 ring-white shadow-sm">
                                                                            {lead.name.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-semibold text-slate-900 text-sm">{lead.name}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="inline-flex px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                                                        {lead.title}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <a
                                                                        href={lead.linkedin}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 w-fit transition-colors"
                                                                    >
                                                                        <span className="truncate max-w-[120px]">View Profile</span>
                                                                        <ArrowRight className="w-3 h-3" />
                                                                    </a>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    {lead.email !== 'Not Found' && lead.email !== 'N/A' && lead.email ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                                                                            <span className="text-sm text-emerald-700 font-medium">{lead.email}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                                            <span className="text-sm text-slate-500 italic">Not Found</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-200">
                                                                        <Mail className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        No grouped leads available.
                                    </div>
                                )}
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

export default App;

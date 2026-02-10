
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Verdict, CommunityPost, TrendingTopic, PatientQuestion } from './types';
import { analyzeMedicalClaim } from './services/geminiService';
import ClaimInput from './components/ClaimInput';
import VerdictCard from './components/VerdictCard';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginMode, setLoginMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [roleMode, setRoleMode] = useState<UserRole>('USER');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', license: '' });

  // App State
  const [activeTab, setActiveTab] = useState<'HUB' | 'WELLNESS' | 'PORTAL'>('HUB');
  const [isLoading, setIsLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [history, setHistory] = useState<Verdict[]>([]);
  
  // Data State
  const [trending, setTrending] = useState<TrendingTopic[]>([
    { id: '1', topic: 'Vitamin C & COVID', count: 1240, type: 'CLAIM' },
    { id: '2', topic: 'Retinol', count: 850, type: 'INGREDIENT' },
    { id: '3', topic: 'Apple Cider Vinegar', count: 620, type: 'INGREDIENT' },
  ]);

  const [wellnessPosts, setWellnessPosts] = useState<CommunityPost[]>([
    {
      id: 'p1',
      authorName: 'Alex Rivera',
      authorId: 'u1',
      isProfessional: false,
      content: 'I have been using curry leaves in my hair oil for 3 months, and the shedding has significantly reduced! My grandmother was right.',
      likes: 45,
      timestamp: Date.now() - 1000000,
      comments: [{ id: 'c1', authorName: 'Doctor Sam', content: 'While anecdotal, curry leaves are rich in antioxidants and beta-carotene which can support hair health.', timestamp: Date.now() }]
    }
  ]);

  const [portalQuestions, setPortalQuestions] = useState<PatientQuestion[]>([]);

  // Auth Handlers
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name || (roleMode === 'PROFESSIONAL' ? 'Dr. Sarah' : 'Alex'),
      email: formData.email,
      role: roleMode,
      isVerified: roleMode === 'PROFESSIONAL',
      licenseNumber: formData.license,
      specialty: roleMode === 'PROFESSIONAL' ? 'Dermatology' : undefined
    };
    setCurrentUser(newUser);
    setShowLogin(false);
  };

  // Analysis Handler
  const handleAnalyze = async (text: string, image?: string) => {
    setIsLoading(true);
    try {
      const result = await analyzeMedicalClaim(text, image);
      setVerdict(result);
      setHistory(prev => [result, ...prev.slice(0, 4)]);
      
      // If user is patient, also add to portal for doctor review
      if (currentUser?.role === 'USER') {
        const newQuestion: PatientQuestion = {
          id: Math.random().toString(36).substr(2, 9),
          userId: currentUser.id,
          userName: currentUser.name,
          text: text,
          timestamp: Date.now(),
          verdict: result,
          status: 'OPEN'
        };
        setPortalQuestions(prev => [newQuestion, ...prev]);
      }
    } catch (err) {
      console.error(err);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostExperience = (text: string) => {
    if (!currentUser) return;
    const newPost: CommunityPost = {
      id: Math.random().toString(36).substr(2, 9),
      authorName: currentUser.name,
      authorId: currentUser.id,
      isProfessional: currentUser.role === 'PROFESSIONAL',
      content: text,
      likes: 0,
      timestamp: Date.now(),
      comments: []
    };
    setWellnessPosts(prev => [newPost, ...prev]);
  };

  const handleDoctorResponse = (questionId: string, response: string) => {
    setPortalQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, doctorResponse: response, status: 'ANSWERED' } : q
    ));
    if (verdict && portalQuestions.find(q => q.id === questionId)?.verdict?.claim === verdict.claim) {
      setVerdict({ ...verdict, doctorComment: response });
    }
  };

  if (showLogin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04default/6M6 20.147L2.43 17.5A11.921 11.921 0 002.5 12c0-1.66.33-3.29.98-4.79L6 8.5" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-white mb-2">MedCheck AI Pro</h2>
          <p className="text-slate-400 text-center text-sm mb-8">Verify medical claims with scientific rigor.</p>
          
          <div className="flex bg-slate-800 p-1 rounded-xl mb-6">
            <button 
              onClick={() => setRoleMode('USER')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${roleMode === 'USER' ? 'bg-white text-slate-900' : 'text-slate-400'}`}
            >
              Patient
            </button>
            <button 
              onClick={() => setRoleMode('PROFESSIONAL')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${roleMode === 'PROFESSIONAL' ? 'bg-white text-slate-900' : 'text-slate-400'}`}
            >
              Medical Professional
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {loginMode === 'SIGNUP' && (
              <input 
                type="text" required placeholder="Full Name" 
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              />
            )}
            <input 
              type="email" required placeholder="Email Address" 
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            />
            <input 
              type="password" required placeholder="Password" 
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
            />
            {roleMode === 'PROFESSIONAL' && loginMode === 'SIGNUP' && (
              <input 
                type="text" required placeholder="Medical License ID" 
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.license} onChange={e => setFormData({...formData, license: e.target.value})}
              />
            )}
            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20">
              {loginMode === 'LOGIN' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
            {loginMode === 'LOGIN' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button onClick={() => setLoginMode(loginMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="text-blue-400 font-bold hover:underline">
              {loginMode === 'LOGIN' ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04default/6M6 20.147L2.43 17.5A11.921 11.921 0 002.5 12c0-1.66.33-3.29.98-4.79L6 8.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">MedCheck Pro</h1>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Scientific Hub</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-slate-800 flex items-center justify-end">
              {currentUser?.role === 'PROFESSIONAL' && <span className="mr-1">Dr.</span>}
              {currentUser?.name}
              {currentUser?.role === 'PROFESSIONAL' && (
                <svg className="w-4 h-4 text-blue-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </p>
            <p className="text-[10px] text-slate-500">{currentUser?.role === 'PROFESSIONAL' ? 'Medical Professional' : 'Patient'}</p>
          </div>
          <button onClick={() => setShowLogin(true)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <nav className="lg:col-span-3 space-y-2 hidden lg:block">
          <button 
            onClick={() => setActiveTab('HUB')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'HUB' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span>Scientific Hub</span>
          </button>
          <button 
            onClick={() => setActiveTab('WELLNESS')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'WELLNESS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>Wellness Hub</span>
          </button>
          <button 
            onClick={() => setActiveTab('PORTAL')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'PORTAL' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{currentUser?.role === 'PROFESSIONAL' ? 'Patients Portal' : 'Consultations'}</span>
          </button>
        </nav>

        {/* Dynamic Center Panel */}
        <div className="lg:col-span-6 space-y-8">
          {activeTab === 'HUB' && (
            <>
              <ClaimInput onAnalyze={handleAnalyze} isLoading={isLoading} />
              
              {verdict && (
                <VerdictCard 
                  verdict={verdict} 
                  onReport={() => alert('Report submitted for peer review.')} 
                  onRelatedClick={(c) => handleAnalyze(c)}
                  currentUser={currentUser}
                  onAddDoctorComment={(comment) => handleDoctorResponse('current', comment)}
                />
              )}

              {!verdict && !isLoading && (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-700">Awaiting your query</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">Analyze ingredients, health hacks, or social media transcripts to get evidence-based truth.</p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'WELLNESS' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Share Your Experience</h3>
                <textarea 
                  placeholder="Post about your health journey or natural remedies you've tried..."
                  className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all h-24 text-slate-700"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePostExperience((e.target as HTMLTextAreaElement).value);
                      (e.target as HTMLTextAreaElement).value = '';
                    }
                  }}
                />
                <div className="flex justify-between items-center mt-3">
                  <p className="text-xs text-slate-400">Press Enter to share with the community</p>
                  <button className="text-blue-600 font-bold text-sm hover:underline">Guidelines</button>
                </div>
              </div>

              {wellnessPosts.map(post => (
                <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                      {post.authorName[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center">
                        {post.authorName}
                        {post.isProfessional && (
                          <span className="ml-2 bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded font-bold">Professional</span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400">{new Date(post.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{post.content}</p>
                  <div className="flex items-center space-x-6 pt-2 border-t border-slate-50">
                    <button className="flex items-center space-x-1.5 text-slate-500 hover:text-red-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-xs font-bold">{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-1.5 text-slate-500 hover:text-blue-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-xs font-bold">{post.comments.length} Comments</span>
                    </button>
                  </div>
                  {post.comments.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      {post.comments.map(comment => (
                        <div key={comment.id} className="text-sm">
                          <span className="font-bold text-slate-800">{comment.authorName}: </span>
                          <span className="text-slate-600 italic">{comment.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'PORTAL' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center justify-between">
                <span>{currentUser?.role === 'PROFESSIONAL' ? 'Cases for Review' : 'Your Verified Questions'}</span>
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs">{portalQuestions.length} Total</span>
              </h3>
              
              {portalQuestions.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 text-slate-400">
                  No cases currently listed.
                </div>
              ) : (
                portalQuestions.map(q => (
                  <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                          {q.userName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{q.userName}</p>
                          <p className="text-[10px] text-slate-400">{new Date(q.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${q.status === 'OPEN' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                        {q.status}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium">"{q.text}"</p>
                    {q.verdict && (
                      <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                        <span className="text-xs text-slate-500 italic">AI Verdict: {q.verdict.status}</span>
                        <button onClick={() => setVerdict(q.verdict!)} className="text-xs text-blue-600 font-bold hover:underline">View Analysis</button>
                      </div>
                    )}
                    {q.doctorResponse ? (
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <p className="text-xs font-bold text-blue-800 mb-1">Doctor Response:</p>
                        <p className="text-sm text-blue-700 italic">"{q.doctorResponse}"</p>
                      </div>
                    ) : currentUser?.role === 'PROFESSIONAL' ? (
                      <div className="pt-2">
                        <textarea 
                          placeholder="Provide professional insight for this patient..."
                          className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl mb-3 outline-none focus:ring-2 focus:ring-blue-500"
                          id={`resp-${q.id}`}
                        />
                        <button 
                          onClick={() => {
                            const el = document.getElementById(`resp-${q.id}`) as HTMLTextAreaElement;
                            if (el.value) handleDoctorResponse(q.id, el.value);
                          }}
                          className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                        >
                          Submit Viewpoint
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center">Awaiting professional review...</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-3 space-y-6">
          {/* Trends */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Trending Now</h3>
            <div className="space-y-4">
              {trending.map(item => (
                <div key={item.id} className="flex items-center justify-between group cursor-pointer" onClick={() => handleAnalyze(item.topic)}>
                  <div>
                    <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">#{item.topic}</p>
                    <p className="text-[10px] text-slate-400">{(item.count / 1000).toFixed(1)}K analyses this week</p>
                  </div>
                  <div className={`p-1 rounded ${item.type === 'CLAIM' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recently Verified */}
          {history.length > 0 && (
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Inquiries</h3>
              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center space-x-2 text-xs text-slate-600 pb-2 border-b border-slate-50 last:border-0 hover:text-blue-600 cursor-pointer" onClick={() => setVerdict(h)}>
                    <span className={`w-2 h-2 rounded-full ${h.status === 'TRUE' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <p className="truncate flex-1">{h.claim}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Professional Credentials (for Users) */}
          <section className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white">
            <h3 className="font-bold mb-2">Verified Content</h3>
            <p className="text-xs text-blue-100 leading-relaxed mb-4">Every result marked with a blue tick has been cross-referenced by our AI and peer-reviewed by licensed doctors.</p>
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-blue-600 bg-slate-200 overflow-hidden">
                  <img src={`https://picsum.photos/seed/doc${i}/32/32`} alt="Doctor" />
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-blue-600 bg-blue-500 flex items-center justify-center text-[10px] font-bold">
                +12
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 inset-x-0 lg:hidden bg-white/90 backdrop-blur-md border-t border-slate-100 px-6 py-4 flex items-center justify-around z-50">
        <button 
          onClick={() => setActiveTab('HUB')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'HUB' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <span className="text-[10px] font-bold">Scientific Hub</span>
        </button>
        <button 
          onClick={() => setActiveTab('WELLNESS')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'WELLNESS' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-[10px] font-bold">Wellness Hub</span>
        </button>
        <button 
          onClick={() => setActiveTab('PORTAL')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'PORTAL' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-bold">Portal</span>
        </button>
      </nav>
    </div>
  );
};

export default App;

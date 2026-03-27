'use client';

import React, {
  useState, useEffect, useCallback, useRef,
} from 'react';
import Link from 'next/link';
import {
  motion, AnimatePresence,
  useMotionValue, useSpring, useScroll, useTransform, useInView,
} from 'motion/react';
import {
  ArrowRight, CheckCircle, ShieldCheck, UserPlus, FileText,
  CursorClick, MagnifyingGlass, ChartBar, CalendarDots,
  BookOpen, Bell, Sparkle, CaretDown, Lightning,
  TrendUp, Clock, Briefcase, Users, SealCheck,
} from '@phosphor-icons/react';
import { MOCK_PLACEMENTS } from '@/lib/mock-data';

/* ════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════ */
const EASE = [0.22, 1, 0.36, 1] as const;

const COMPANIES = [
  { name: 'Stripe',  role: 'Software Engineer',  fields: 22, color: '#635bff' },
  { name: 'Figma',   role: 'Frontend Developer', fields: 18, color: '#a259ff' },
  { name: 'Notion',  role: 'Full-Stack Engineer', fields: 24, color: '#e8e8e8' },
  { name: 'Vercel',  role: 'Backend Engineer',   fields: 20, color: '#e8e8e8' },
  { name: 'Airbnb',  role: 'Product Engineer',   fields: 26, color: '#ff5a5f' },
];

const FAQ_DATA = [
  { q: 'How is CareerOrbit different from a job board?', a: "Job boards show you listings — you still apply yourself. We source roles, tailor your resume for each one, fill every field, and hand you a ready-to-submit package." },
  { q: 'Is this completely legal?', a: "Yes. We prepare ~90% of the work. You review and submit yourself — you stay the applicant at all times. No account impersonation, no compliance risk." },
  { q: 'I already have a job. Is CareerOrbit useful?', a: "Absolutely. Many users are currently employed and passively exploring better opportunities without spending hours searching. Your subscription keeps your profile active on your schedule." },
  { q: 'What visa types do you support?', a: "Everyone — CPT, OPT, STEM OPT, H-1B, H-4 EAD, Green Card, and U.S. citizens. We factor your visa status into every search and application." },
  { q: 'How fast do I see results?', a: "After completing onboarding (under 15 minutes), our team gets to work. You'll see prepared applications in your dashboard within 24–48 hours." },
];

const AUDIENCES = [
  'OPT Students','STEM OPT','H-1B Holders','H-4 EAD',
  'Green Card','U.S. Citizens','Employed & Exploring','Recent Graduates',
];

/* ════════════════════════════════════════════
   CUSTOM CURSOR
════════════════════════════════════════════ */
function CustomCursor() {
  const cx = useMotionValue(-100);
  const cy = useMotionValue(-100);
  const sx = useSpring(cx, { stiffness: 600, damping: 30 });
  const sy = useSpring(cy, { stiffness: 600, damping: 30 });
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked]  = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => { cx.set(e.clientX); cy.set(e.clientY); };
    const over  = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      setHovered(!!t.closest('a,button,[role=button]'));
    };
    const down = () => setClicked(true);
    const up   = () => setClicked(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup',   up);
    document.documentElement.classList.add('has-custom-cursor');
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup',   up);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, [cx, cy]);

  return (
    <>
      {/* Dot */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full"
        style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%' }}
        animate={{ width: clicked ? 6 : hovered ? 0 : 5, height: clicked ? 6 : hovered ? 0 : 5, background: '#14b8a6', opacity: hovered ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      />
      {/* Ring */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full border"
        style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%', borderColor: '#14b8a6' }}
        animate={{ width: clicked ? 28 : hovered ? 44 : 28, height: clicked ? 28 : hovered ? 44 : 28, opacity: clicked ? 0.5 : 0.4, scale: clicked ? 0.8 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      />
    </>
  );
}

/* ════════════════════════════════════════════
   SCROLL PROGRESS BAR
════════════════════════════════════════════ */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return <motion.div id="scroll-bar" style={{ scaleX }} />;
}

/* ════════════════════════════════════════════
   MAGNETIC BUTTON
════════════════════════════════════════════ */
function MagBtn({ children, href, className, onClick }: { children: React.ReactNode; href?: string; className?: string; onClick?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const x   = useMotionValue(0);
  const y   = useMotionValue(0);
  const sx  = useSpring(x, { stiffness: 300, damping: 20 });
  const sy  = useSpring(y, { stiffness: 300, damping: 20 });

  const move = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - r.left - r.width  / 2) * 0.35);
    y.set((e.clientY - r.top  - r.height / 2) * 0.35);
  };
  const leave = () => { x.set(0); y.set(0); };

  const inner = (
    <motion.div ref={ref} style={{ x: sx, y: sy }} onMouseMove={move} onMouseLeave={leave} onClick={onClick} className={className}>
      {children}
    </motion.div>
  );
  return href?.startsWith('/') ? <Link href={href}>{inner}</Link> : <a href={href}>{inner}</a>;
}

/* ════════════════════════════════════════════
   CHAR REVEAL
════════════════════════════════════════════ */
function CharReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((ch, i) => (
        <motion.span key={i} initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.4, delay: delay + i * 0.028, ease: EASE }}
          style={{ display: 'inline-block', whiteSpace: ch === ' ' ? 'pre' : 'normal' }}>
          {ch === ' ' ? '\u00A0' : ch}
        </motion.span>
      ))}
    </span>
  );
}

/* ════════════════════════════════════════════
   COUNT UP
════════════════════════════════════════════ */
function CountUp({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const dur = 1400;
    const step = to / dur * 16;
    const iv = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(iv); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(iv);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{val}{suffix}</span>;
}

/* ════════════════════════════════════════════
   TILT CARD
════════════════════════════════════════════ */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx  = useMotionValue(0);
  const ry  = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 20 });
  const sry = useSpring(ry, { stiffness: 200, damping: 20 });

  const move = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    rx.set(((e.clientY - r.top)  / r.height - 0.5) * -14);
    ry.set(((e.clientX - r.left) / r.width  - 0.5) *  14);
  };
  const leave = () => { rx.set(0); ry.set(0); };

  return (
    <motion.div ref={ref} onMouseMove={move} onMouseLeave={leave}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      className={className}>
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   PARTICLES
════════════════════════════════════════════ */
const DOTS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  r: Math.random() * 2 + 1,
  dur: Math.random() * 8 + 6,
  delay: Math.random() * 5,
}));

function Particles() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {DOTS.map(d => (
        <motion.div key={d.id} className="absolute rounded-full"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.r * 2, height: d.r * 2, background: '#14b8a6' }}
          animate={{ y: [-20, 20, -20], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   LIVE PREVIEW CARD
════════════════════════════════════════════ */
type Stage = 'scanning' | 'found' | 'preparing' | 'ready';
function LivePreview() {
  const [cidx, setCidx]   = useState(0);
  const [stage, setStage] = useState<Stage>('scanning');
  const [prog, setProg]   = useState(0);
  const co = COMPANIES[cidx];
  const next = useCallback(() => { setStage('scanning'); setProg(0); setCidx(i => (i+1)%COMPANIES.length); }, []);
  useEffect(() => {
    const ts = [
      setTimeout(() => setStage('found'),     1200),
      setTimeout(() => setStage('preparing'), 2800),
      setTimeout(() => setStage('ready'),     5400),
      setTimeout(next,                        8000),
    ];
    return () => ts.forEach(clearTimeout);
  }, [cidx, next]);
  useEffect(() => {
    if (stage !== 'preparing') return;
    let p = 0;
    const iv = setInterval(() => { p = Math.min(p+2,100); setProg(p); if (p>=100) clearInterval(iv); }, 48);
    return () => clearInterval(iv);
  }, [stage]);

  return (
    <TiltCard>
      <div className="doppelrand glow-surface w-full max-w-md mx-auto lg:mx-0">
        <div className="doppelrand-inner overflow-hidden relative" style={{ minHeight: 280 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-1.5">
              {['#ff5f57','#febc2e','#28c840'].map(c=><span key={c} className="w-3 h-3 rounded-full" style={{background:c}}/>)}
            </div>
            <span className="text-[11px] font-semibold tracking-widest uppercase" style={{color:'var(--text-3)'}}>CareerOrbit</span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-teal-400">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-ring"/>LIVE
            </span>
          </div>
          <div className="h-px bg-white/5 mb-5"/>

          <AnimatePresence mode="wait">
            {stage==='scanning' && (
              <motion.div key="sc" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.3}} className="relative py-8">
                <div className="scan-line"/>
                <div className="flex flex-col items-center gap-3">
                  <MagnifyingGlass size={32} weight="light" className="text-teal-400/60"/>
                  <p className="text-sm font-medium" style={{color:'var(--text-3)'}}>Scanning opportunities<span className="cursor">_</span></p>
                </div>
              </motion.div>
            )}
            {stage==='found' && (
              <motion.div key="fo" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.4,ease:EASE}} className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--text-3)'}}>Match found</p>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
                    style={{background:`${co.color}20`,color:co.color,border:`1px solid ${co.color}30`}}>{co.name[0]}</div>
                  <div>
                    <p className="text-sm font-bold" style={{color:'var(--text-1)'}}>{co.role}</p>
                    <p className="text-xs" style={{color:'var(--text-2)'}}>{co.name} · Full-time</p>
                  </div>
                </div>
                <p className="text-xs" style={{color:'var(--text-3)'}}>Analysing role requirements…</p>
              </motion.div>
            )}
            {stage==='preparing' && (
              <motion.div key="pr" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.4,ease:EASE}} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkle size={16} weight="duotone" className="text-teal-400"/>
                  <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider">Preparing application</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                    style={{background:`${co.color}20`,color:co.color}}>{co.name[0]}</div>
                  <div>
                    <p className="text-sm font-bold" style={{color:'var(--text-1)'}}>{co.role}</p>
                    <p className="text-xs" style={{color:'var(--text-2)'}}>{co.name}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5" style={{color:'var(--text-3)'}}>
                    <span>Tailoring resume</span><span>{prog}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-100" style={{width:`${prog}%`,background:'linear-gradient(to right,#14b8a6,#34d399)'}}/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[`${co.fields} fields`,'Cover letter','Role keywords','ATS optimised'].map((t,i)=>(
                    <div key={t} className="flex items-center gap-1.5 text-[11px]" style={{color:'var(--text-3)'}}>
                      {prog>=(i+1)*25
                        ? <CheckCircle size={12} weight="fill" className="text-teal-400 shrink-0 check-pop"/>
                        : <div className="w-3 h-3 rounded-full border border-white/10 shrink-0"/>}
                      {t}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            {stage==='ready' && (
              <motion.div key="rd" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.4,ease:EASE}} className="space-y-4">
                <div className="p-3 rounded-xl flex items-center gap-2" style={{background:'rgba(20,184,166,0.06)',border:'1px solid rgba(20,184,166,0.2)'}}>
                  <CheckCircle size={16} weight="fill" className="text-teal-400 shrink-0"/>
                  <p className="text-sm font-semibold text-teal-300">Ready for your review</p>
                </div>
                <div className="space-y-2">
                  {[`Resume tailored for role`,`All ${co.fields} fields filled`,'Cover letter drafted','ATS keywords embedded'].map(t=>(
                    <div key={t} className="flex items-center gap-2 text-sm" style={{color:'var(--text-2)'}}>
                      <CheckCircle size={14} weight="fill" className="text-teal-400 shrink-0"/>{t}
                    </div>
                  ))}
                </div>
                <button className="w-full mt-1 rounded-xl py-2.5 text-sm font-black flex items-center justify-center gap-2 glow-teal-sm hover:opacity-90 transition-opacity"
                  style={{background:'#14b8a6',color:'#042f2e'}}>
                  Review &amp; Submit
                  <span className="flex items-center justify-center w-5 h-5 rounded-lg" style={{background:'rgba(4,47,46,0.3)'}}>
                    <ArrowRight size={13} weight="bold"/>
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 flex items-center justify-center gap-1.5">
            {COMPANIES.map((_,i)=>(
              <span key={i} className="h-1 rounded-full transition-all duration-500"
                style={{width:i===cidx?'20px':'6px',background:i===cidx?'#14b8a6':'rgba(255,255,255,0.1)'}}/>
            ))}
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

/* ════════════════════════════════════════════
   INTERACTIVE FEATURE TABS
════════════════════════════════════════════ */
const FEAT_TABS = [
  {
    id: 'dashboard', label: 'Application Dashboard', Icon: ChartBar,
    desc: 'Your entire pipeline — applied, screening, interview, assessment, offer — in one live view with activity graphs and status tracking.',
    mockup: (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{color:'var(--text-3)'}}>Live Pipeline</p>
          <TrendUp size={14} weight="bold" className="text-teal-400"/>
        </div>
        {[
          {co:'Stripe', role:'Software Engineer', st:'Interview', c:'#22c55e'},
          {co:'Figma', role:'Frontend Dev', st:'Screening', c:'#f59e0b'},
          {co:'Notion', role:'Full-Stack Eng', st:'Applied', c:'#60a5fa'},
          {co:'Vercel', role:'Backend Eng', st:'Assessment', c:'#a78bfa'},
          {co:'Airbnb', role:'Product Eng', st:'Applied', c:'#60a5fa'},
        ].map((r,i)=>(
          <motion.div key={r.co} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.06,ease:EASE}}
            className="flex items-center justify-between py-2 border-b last:border-0" style={{borderColor:'var(--border)'}}>
            <div>
              <p className="text-xs font-semibold" style={{color:'var(--text-1)'}}>{r.co}</p>
              <p className="text-[10px]" style={{color:'var(--text-3)'}}>{r.role}</p>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold rounded-full px-2 py-0.5"
              style={{background:`${r.c}18`,color:r.c}}>
              <span className="w-1.5 h-1.5 rounded-full" style={{background:r.c}}/>{r.st}
            </span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: 'calendar', label: 'Events & Calendar', Icon: CalendarDots,
    desc: 'All interviews, screenings, assessments, and calls on one color-coded calendar. Click any event to see full details and prep notes.',
    mockup: (
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{color:'var(--text-3)'}}>March 2025</p>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-3">
          {['M','T','W','T','F','S','S'].map((d,i)=><p key={i} className="text-[9px] font-bold" style={{color:'var(--text-3)'}}>{d}</p>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({length:31},(_,i)=>{
            const events: Record<number,string> = {3:'#22c55e',8:'#f59e0b',12:'#60a5fa',17:'#22c55e',22:'#a78bfa',28:'#f59e0b'};
            const c = events[i+1];
            return (
              <motion.div key={i} initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} transition={{delay:i*0.01}}
                className="aspect-square rounded-lg flex flex-col items-center justify-center text-[11px] font-medium"
                style={{background: c?`${c}15`:'rgba(255,255,255,0.02)', color: c?c:'var(--text-3)', border: c?`1px solid ${c}30`:'1px solid transparent'}}>
                {i+1}
                {c && <span className="w-1 h-1 rounded-full mt-0.5" style={{background:c}}/>}
              </motion.div>
            );
          })}
        </div>
      </div>
    ),
  },
  {
    id: 'notifications', label: 'Smart Alerts', Icon: Bell,
    desc: 'Real-time alerts for status changes, upcoming interviews, and deadline reminders. Never miss a critical moment in your search.',
    mockup: (
      <div className="space-y-2.5">
        {[
          {text:'Interview scheduled — Stripe, Mar 17 at 2pm', time:'2 min ago', c:'#22c55e', icon:'📅'},
          {text:'Application prepared for Figma — ready to review', time:'1 hr ago', c:'#14b8a6', icon:'✅'},
          {text:'Screening call — Notion, tomorrow 10am', time:'3 hr ago', c:'#f59e0b', icon:'📞'},
          {text:'New match found: Staff Engineer @ Linear', time:'Today', c:'#a78bfa', icon:'🎯'},
        ].map((n,i)=>(
          <motion.div key={i} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:i*0.08,ease:EASE}}
            className="flex items-start gap-3 p-3 rounded-xl" style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)'}}>
            <span className="text-base mt-0.5 shrink-0">{n.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-snug" style={{color:'var(--text-1)'}}>{n.text}</p>
              <p className="text-[10px] mt-1" style={{color:'var(--text-3)'}}>{n.time}</p>
            </div>
            <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{background:n.c}}/>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: 'ai', label: 'AI-Tailored Resumes', Icon: Sparkle,
    desc: 'Every application gets a resume optimised for that exact role — right keywords, right format, ATS-ready. Automatically, every time.',
    mockup: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{background:'var(--accent-bg)',border:'1px solid var(--accent-bdr)'}}>
          <Sparkle size={18} weight="duotone" className="text-teal-400 shrink-0"/>
          <div>
            <p className="text-xs font-bold" style={{color:'var(--text-1)'}}>Tailoring for Software Engineer @ Stripe</p>
            <p className="text-[10px] mt-0.5" style={{color:'var(--text-3)'}}>Optimising 6 sections</p>
          </div>
        </div>
        {[
          {label:'Work Experience', pct:100, done:true},
          {label:'Skills & Keywords', pct:100, done:true},
          {label:'Summary', pct:88, done:false},
          {label:'ATS Compatibility', pct:96, done:true},
        ].map((s,i)=>(
          <motion.div key={s.label} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.1}}>
            <div className="flex justify-between text-[11px] mb-1" style={{color:'var(--text-3)'}}>
              <span className="flex items-center gap-1.5">
                {s.done && <CheckCircle size={11} weight="fill" className="text-teal-400"/>}
                {s.label}
              </span>
              <span style={{color: s.pct===100?'#14b8a6':'var(--text-2)'}}>{s.pct}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div initial={{width:0}} animate={{width:`${s.pct}%`}} transition={{delay:i*0.1+0.2,duration:0.8,ease:EASE}}
                className="h-full rounded-full" style={{background: s.pct===100?'linear-gradient(to right,#14b8a6,#34d399)':'rgba(255,255,255,0.2)'}}/>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: 'prep', label: 'Interview Prep', Icon: BookOpen,
    desc: 'Curated study guides, screening scripts, and phone prep materials for every stage. Download PDFs and go in confident.',
    mockup: (
      <div className="space-y-2.5">
        {[
          {title:'Screening Call Guide', pages:12, tag:'Screening', c:'#f59e0b'},
          {title:'Technical Interview Prep', pages:28, tag:'Interview', c:'#22c55e'},
          {title:'Phone Call Scripts', pages:8, tag:'Phone', c:'#60a5fa'},
          {title:'Behavioural Questions', pages:16, tag:'Interview', c:'#22c55e'},
        ].map((g,i)=>(
          <motion.div key={g.title} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.07,ease:EASE}}
            className="flex items-center justify-between p-3 rounded-xl" style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)'}}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:`${g.c}15`,border:`1px solid ${g.c}30`}}>
                <FileText size={14} weight="duotone" style={{color:g.c}}/>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{color:'var(--text-1)'}}>{g.title}</p>
                <p className="text-[10px]" style={{color:'var(--text-3)'}}>{g.pages} pages</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background:`${g.c}15`,color:g.c}}>{g.tag}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
];

function FeatureTabs() {
  const [active, setActive] = useState('dashboard');
  const feat = FEAT_TABS.find(f => f.id===active)!;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Tab list */}
      <div className="lg:col-span-2 flex flex-col gap-2">
        {FEAT_TABS.map(f => (
          <button key={f.id} onClick={() => setActive(f.id)}
            className={`feature-tab flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left border transition-all ${active===f.id ? 'feature-tab-active' : 'border-transparent hover:border-white/5 hover:bg-white/[0.02]'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${active===f.id ? 'bg-teal-500/20 border border-teal-500/30' : 'bg-white/[0.03] border border-white/5'}`}>
              <f.Icon size={18} weight="duotone" className={active===f.id ? 'text-teal-400' : 'text-slate-500'}/>
            </div>
            <div>
              <p className={`text-sm font-semibold transition-colors ${active===f.id ? 'text-teal-300' : 'text-slate-400'}`}>{f.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Mockup panel */}
      <div className="lg:col-span-3">
        <div className="doppelrand rounded-3xl h-full" style={{minHeight:400}}>
          <div className="doppelrand-inner h-full flex flex-col">
            <div className="mb-5 pb-4" style={{borderBottom:'1px solid var(--border)'}}>
              <div className="flex items-center gap-2 mb-1">
                <feat.Icon size={16} weight="duotone" className="text-teal-400"/>
                <p className="text-sm font-bold" style={{color:'var(--text-1)'}}>{feat.label}</p>
              </div>
              <p className="text-xs leading-relaxed" style={{color:'var(--text-2)'}}>{feat.desc}</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div key={active}
                  initial={{opacity:0,y:12,filter:'blur(4px)'}}
                  animate={{opacity:1,y:0,filter:'blur(0px)'}}
                  exit={{opacity:0,y:-8,filter:'blur(2px)'}}
                  transition={{duration:0.35,ease:EASE}}
                  className="h-full">
                  {feat.mockup}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   FADE IN
════════════════════════════════════════════ */
function FadeIn({ children, delay=0, className='' }: { children:React.ReactNode; delay?:number; className?:string }) {
  return (
    <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
      transition={{duration:0.6,delay,ease:EASE}} className={className}>{children}</motion.div>
  );
}

/* ════════════════════════════════════════════
   FAQ ITEM
════════════════════════════════════════════ */
function FaqItem({ q, a, idx }: { q:string; a:string; idx:number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
      transition={{delay:idx*0.06,ease:EASE}}
      className="surface rounded-2xl overflow-hidden" style={{transition:'border-color 0.2s'}}>
      <button onClick={()=>setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.02] transition-colors">
        <span className="font-semibold pr-4 text-[15px] leading-snug" style={{color:'var(--text-1)'}}>{q}</span>
        <motion.div animate={{rotate:open?180:0}} transition={{duration:0.3,ease:EASE}}>
          <CaretDown size={16} weight="bold" style={{color:open?'#14b8a6':'var(--text-3)'}}/>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
            transition={{duration:0.32,ease:EASE}}>
            <p className="px-6 pb-5 text-sm leading-relaxed border-t border-white/5 pt-4" style={{color:'var(--text-2)'}}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function LandingPage() {

  const STEPS = [
    {Icon:FileText,        n:'01',title:'Share Profile',      desc:'One-time setup — your resume, target roles, visa status, preferences.'},
    {Icon:MagnifyingGlass, n:'02',title:'We Source Roles',    desc:'Our team scans company portals daily and matches openings to your profile.'},
    {Icon:Sparkle,         n:'03',title:'We Prep Everything', desc:'Resume tailored per role, every field filled, all responses drafted.'},
    {Icon:CursorClick,     n:'04',title:'You Submit',         desc:'One click. You stay the applicant — 100% legal and compliant.'},
  ];

  return (
    <>
      <CustomCursor />
      <ScrollProgress />

      <div className="min-h-screen antialiased" style={{background:'var(--base)',color:'var(--text-1)'}}>

        {/* ── ISLAND NAV ── */}
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <nav className="island-nav rounded-full px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center font-black text-[10px] text-[#042f2e]">CO</div>
              <span className="font-bold text-sm tracking-tight" style={{color:'var(--text-1)'}}>CareerOrbit</span>
            </div>
            <div className="hidden sm:flex items-center gap-5 text-[13px]" style={{color:'var(--text-2)'}}>
              {['How It Works','Features','FAQ'].map((l,i)=>(
                <a key={l} href={`#${['how-it-works','features','faq'][i]}`} className="link-accent hover:text-white transition-colors">{l}</a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Link href="/sign-in" className="btn-ghost px-4 py-1.5 text-[13px]">Sign In</Link>
              <Link href="/sign-up" className="btn-accent px-4 py-1.5 text-[13px]">Get Started</Link>
            </div>
          </nav>
        </div>

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
          <div className="absolute inset-0 dot-grid"/>
          <Particles/>
          <div className="orb-a absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full pointer-events-none"
            style={{background:'radial-gradient(circle,rgba(20,184,166,0.07) 0%,transparent 70%)'}}/>
          <div className="orb-b absolute top-1/3 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{background:'radial-gradient(circle,rgba(56,189,248,0.04) 0%,transparent 70%)'}}/>
          <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
            style={{background:'linear-gradient(to top,var(--base),transparent)'}}/>

          <div className="relative max-w-7xl mx-auto px-5 sm:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

              <div className="lg:col-span-7 space-y-8">
                <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5,ease:EASE}}>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest"
                    style={{background:'var(--accent-bg)',border:'1px solid var(--accent-bdr)',color:'#5eead4'}}>
                    <Lightning size={12} weight="fill"/>
                    Reverse Recruiting Agency
                  </div>
                </motion.div>

                <div className="space-y-1">
                  <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5,delay:0.1,ease:EASE}}>
                    <h1 className="display text-[clamp(52px,7vw,88px)]" style={{color:'var(--text-1)'}}>We apply to</h1>
                  </motion.div>
                  <h1 className="display text-[clamp(52px,7vw,88px)] g-text-hero">
                    <CharReveal text="jobs for you." delay={0.25}/>
                  </h1>
                </div>

                <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.7,duration:0.6}}
                  className="text-[17px] max-w-lg leading-relaxed" style={{color:'var(--text-2)'}}>
                  Stop spending 40+ hours a week on job applications. Our team sources roles, tailors your resume, and preps every field — you review and hit submit.
                </motion.p>

                <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.85}}
                  className="flex items-center gap-2 text-sm" style={{color:'var(--text-3)'}}>
                  <CheckCircle size={15} weight="fill" className="text-teal-500 shrink-0"/>
                  <span>OPT · STEM OPT · H-1B · H-4 · Green Card · U.S. Citizens · Everyone</span>
                </motion.div>

                <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:1,ease:EASE}} className="flex flex-wrap gap-3">
                  <MagBtn href="/sign-up" className="btn-accent inline-flex items-center gap-2.5 px-6 py-3 text-[15px]">
                    Start Free
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-600/40">
                      <ArrowRight size={14} weight="bold"/>
                    </span>
                  </MagBtn>
                  <MagBtn href="#how-it-works" className="btn-ghost inline-flex items-center gap-2 px-6 py-3 text-[15px]">
                    How It Works
                  </MagBtn>
                </motion.div>

                {/* Counting stats */}
                <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:1.1,ease:EASE}}
                  className="grid grid-cols-3 gap-3">
                  {[
                    {to:50,suffix:'+',label:'Applications per day'},
                    {to:90,suffix:'%',label:'Work done for you'},
                    {to:24,suffix:'hr',label:'First apps ready'},
                  ].map(s=>(
                    <div key={s.label} className="doppelrand rounded-2xl">
                      <div className="doppelrand-inner py-3">
                        <p className="text-xl font-black" style={{color:'var(--text-1)'}}>
                          <CountUp to={s.to} suffix={s.suffix}/>
                        </p>
                        <p className="text-[11px] font-medium mt-0.5 leading-snug" style={{color:'var(--text-3)'}}>{s.label}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              <motion.div initial={{opacity:0,x:32}} animate={{opacity:1,x:0}} transition={{delay:0.18,duration:0.7,ease:EASE}}
                className="lg:col-span-5">
                <LivePreview/>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div className="border-y overflow-hidden py-4" style={{borderColor:'var(--border)',background:'var(--surface-1)'}}>
          <div className="flex">
            <div className="marquee-track flex gap-4 whitespace-nowrap">
              {[...AUDIENCES,...AUDIENCES].map((a,i)=>(
                <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium"
                  style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',color:'var(--text-2)'}}>
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── PROBLEM ── */}
        <section className="py-28 relative overflow-hidden">
          <div className="orb-a absolute right-0 top-0 w-[400px] h-[400px] rounded-full pointer-events-none"
            style={{background:'radial-gradient(circle,rgba(239,68,68,0.04) 0%,transparent 70%)'}}/>
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-8"
                style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171'}}>
                The Problem
              </div>
            </FadeIn>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <FadeIn className="lg:col-span-2" delay={0.05}>
                <TiltCard>
                  <div className="doppelrand rounded-3xl h-full">
                    <div className="doppelrand-inner flex flex-col justify-between h-full" style={{minHeight:280}}>
                      <Clock size={32} weight="duotone" className="text-red-400/80 mb-6"/>
                      <div>
                        <p className="font-black leading-none mb-3" style={{color:'var(--text-1)',fontSize:'clamp(48px,4vw,64px)'}}>
                          <CountUp to={40} suffix="+"/>
                        </p>
                        <p className="text-base leading-relaxed" style={{color:'var(--text-2)'}}>
                          Hours per week the average job seeker spends searching, tailoring, and applying. Time you simply don&apos;t have.
                        </p>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </FadeIn>
              <div className="lg:col-span-3 flex flex-col gap-6">
                {[
                  {Icon:Briefcase,c:'rgba(251,191,36,0.1)',bc:'rgba(251,191,36,0.2)',ic:'text-amber-400',title:'Tight Visa Windows',desc:"OPT gives you ~3 months. H-1B layoffs give you 30–60 days. Every wasted hour searching instead of preparing costs you."},
                  {Icon:Users,c:'rgba(96,165,250,0.1)',bc:'rgba(96,165,250,0.2)',ic:'text-blue-400',title:'Brutal Competition',desc:'Good roles get hundreds of applications in hours. Consistency and volume wins — we keep you active every single day.'},
                ].map((card,i)=>(
                  <FadeIn key={card.title} delay={0.1+i*0.08}>
                    <TiltCard>
                      <div className="doppelrand rounded-3xl">
                        <div className="doppelrand-inner">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{background:card.c,border:`1px solid ${card.bc}`}}>
                              <card.Icon size={20} weight="duotone" className={card.ic}/>
                            </div>
                            <div>
                              <p className="text-lg font-bold mb-1.5" style={{color:'var(--text-1)'}}>{card.title}</p>
                              <p className="text-sm leading-relaxed" style={{color:'var(--text-2)'}}>{card.desc}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-28 relative" style={{background:'var(--surface-1)'}}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <FadeIn className="mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-5"
                style={{background:'var(--accent-bg)',border:'1px solid var(--accent-bdr)',color:'#5eead4'}}>
                How It Works
              </div>
              <h2 className="display text-[clamp(36px,5vw,60px)]" style={{color:'var(--text-1)'}}>
                We do <span className="g-text">90% of the work.</span>
              </h2>
              <p className="mt-4 text-[17px] max-w-lg leading-relaxed" style={{color:'var(--text-2)'}}>
                Simple, legal, scalable. You stay in control at every step.
              </p>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-px relative">
              {STEPS.map((s,i)=>(
                <FadeIn key={s.n} delay={i*0.12}>
                  <div className="relative h-full">
                    {i<3 && <div className="step-connector hidden md:block"/>}
                    <div className="doppelrand rounded-3xl h-full mr-px">
                      <div className="doppelrand-inner relative overflow-hidden h-full" style={{minHeight:220}}>
                        <span className="absolute -bottom-3 -right-1 text-[80px] font-black pointer-events-none select-none leading-none"
                          style={{color:'rgba(255,255,255,0.025)'}}>{s.n}</span>
                        <motion.div whileHover={{scale:1.08,rotate:3}} transition={{type:'spring',stiffness:300,damping:20}}
                          className="relative w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                          style={{background:'var(--accent-bg)',border:'1px solid var(--accent-bdr)'}}>
                          <s.Icon size={20} weight="duotone" className="text-teal-400"/>
                        </motion.div>
                        <p className="font-bold mb-1.5" style={{color:'var(--text-1)'}}>{s.title}</p>
                        <p className="text-sm leading-relaxed" style={{color:'var(--text-2)'}}>{s.desc}</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES TABS ── */}
        <section id="features" className="py-28">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <FadeIn className="mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-5"
                style={{background:'rgba(255,255,255,0.04)',border:'1px solid var(--border-md)',color:'var(--text-2)'}}>
                The Platform
              </div>
              <h2 className="display text-[clamp(36px,5vw,60px)]" style={{color:'var(--text-1)'}}>
                Your career <span className="g-text">command center.</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <FeatureTabs/>
            </FadeIn>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="py-28 relative overflow-hidden" style={{background:'var(--surface-1)'}}>
          <div className="orb-b absolute -left-32 bottom-0 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{background:'radial-gradient(circle,rgba(20,184,166,0.05) 0%,transparent 70%)'}}/>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 relative">
            <FadeIn className="mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-5"
                style={{background:'var(--accent-bg)',border:'1px solid var(--accent-bdr)',color:'#5eead4'}}>
                Student Stories
              </div>
              <h2 className="display text-[clamp(36px,5vw,60px)]" style={{color:'var(--text-1)'}}>
                Real journeys.<br/>Real offers.
              </h2>
            </FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {MOCK_PLACEMENTS.map((p,i)=>(
                <FadeIn key={p.id} delay={i*0.1}>
                  <TiltCard className="h-full">
                    <div className="doppelrand rounded-3xl h-full">
                      <div className="doppelrand-inner h-full flex flex-col">
                        <span className="text-5xl font-black leading-none mb-2 select-none" style={{color:'rgba(20,184,166,0.15)'}}>&ldquo;</span>
                        <p className="text-[15px] leading-relaxed flex-1" style={{color:'var(--text-2)'}}>{p.testimonial}</p>
                        <div className="mt-6 pt-5 flex items-center justify-between" style={{borderTop:'1px solid var(--border)'}}>
                          <div>
                            <p className="font-bold" style={{color:'var(--text-1)'}}>{p.studentName}</p>
                            <p className="text-sm" style={{color:'var(--text-3)'}}>{p.role}</p>
                          </div>
                          {p.companyName && (
                            <span className="flex items-center gap-1.5 rounded-xl text-[12px] font-bold px-3 py-1.5"
                              style={{background:'var(--accent-bg)',border:'1px solid var(--accent-bdr)',color:'#5eead4'}}>
                              <SealCheck size={14} weight="fill"/>{p.companyName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── SIGN UP ── */}
        <section id="register" className="py-28">
          <div className="max-w-2xl mx-auto px-5 sm:px-8">
            <FadeIn className="mb-10 text-center">
              <h2 className="display text-[clamp(32px,4vw,52px)] mb-3" style={{color:'var(--text-1)'}}>Create your account</h2>
              <p style={{color:'var(--text-2)'}}>Free to start — no credit card required.</p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="doppelrand rounded-3xl">
                <div className="doppelrand-inner flex flex-col items-center text-center gap-6 py-10">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{background:'var(--accent-bg)',border:'1px solid var(--accent-bdr)'}}>
                    <UserPlus size={26} weight="duotone" className="text-teal-400"/>
                  </div>
                  <div>
                    <p className="font-bold text-lg" style={{color:'var(--text-1)'}}>Student Account</p>
                    <p className="text-sm mt-1" style={{color:'var(--text-3)'}}>Instant access to your dashboard. Free to start.</p>
                  </div>
                  <Link href="/sign-up" className="btn-accent inline-flex items-center gap-2.5 px-8 py-3 text-[15px] w-full justify-center">
                    Create Free Account
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-600/40"><ArrowRight size={14} weight="bold"/></span>
                  </Link>
                  <p className="text-xs" style={{color:'var(--text-3)'}}>
                    Already have an account?{' '}
                    <Link href="/sign-in" className="link-accent" style={{color:'var(--accent)'}}>Sign in</Link>
                  </p>
                  <div className="flex items-center gap-2 text-xs" style={{color:'var(--text-3)'}}>
                    <ShieldCheck size={14} weight="duotone" className="text-teal-600 shrink-0"/>
                    Encrypted sessions. Your data is never sold or shared.
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-24" style={{background:'var(--surface-1)'}}>
          <div className="max-w-2xl mx-auto px-5 sm:px-8">
            <FadeIn className="mb-12 text-center">
              <h2 className="display text-[clamp(32px,4vw,52px)]" style={{color:'var(--text-1)'}}>Questions</h2>
            </FadeIn>
            <div className="space-y-2">
              {FAQ_DATA.map((item,i)=><FaqItem key={i} q={item.q} a={item.a} idx={i}/>)}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 dot-grid"/>
          <div className="orb-a absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
            style={{background:'radial-gradient(circle,rgba(20,184,166,0.07) 0%,transparent 65%)'}}/>
          <FadeIn className="max-w-3xl mx-auto px-5 sm:px-8 text-center relative">
            <h2 className="display text-[clamp(40px,6vw,76px)] mb-2" style={{color:'var(--text-1)'}}>Stop applying alone.</h2>
            <h2 className="display text-[clamp(40px,6vw,76px)] g-text-hero mb-6">Let us work for you.</h2>
            <p className="text-[17px] max-w-lg mx-auto mb-10 leading-relaxed" style={{color:'var(--text-2)'}}>
              Join the students who let CareerOrbit handle the grind — so they can focus on preparing and performing.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <MagBtn href="/sign-up" className="btn-accent inline-flex items-center gap-2.5 px-9 py-4 text-base">
                Create Free Account
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-600/40"><ArrowRight size={14} weight="bold"/></span>
              </MagBtn>
              <MagBtn href="/sign-in" className="btn-ghost inline-flex items-center gap-2 px-9 py-4 text-base">Sign In</MagBtn>
            </div>
          </FadeIn>
        </section>

        {/* ── FOOTER ── */}
        <footer className="py-12" style={{borderTop:'1px solid var(--border)',background:'var(--surface-1)'}}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center font-black text-[10px] text-[#042f2e]">CO</div>
                  <span className="font-bold text-sm" style={{color:'var(--text-1)'}}>CareerOrbit</span>
                </div>
                <p className="text-sm max-w-xs leading-relaxed" style={{color:'var(--text-3)'}}>A reverse recruiting agency. We work for you, not the employer.</p>
              </div>
              <div className="flex gap-10 text-sm">
                {[
                  {title:'Platform',links:[{l:'How It Works',h:'#how-it-works'},{l:'Features',h:'#features'},{l:'FAQ',h:'#faq'}]},
                  {title:'Account', links:[{l:'Sign Up',h:'/sign-up'},{l:'Sign In',h:'/sign-in'}]},
                ].map(col=>(
                  <div key={col.title}>
                    <p className="font-semibold mb-3" style={{color:'var(--text-1)'}}>{col.title}</p>
                    <ul className="space-y-2">
                      {col.links.map(lk=>(
                        <li key={lk.l}>
                          {lk.h.startsWith('/')
                            ? <Link href={lk.h} className="link-accent hover:text-white transition-colors" style={{color:'var(--text-3)'}}>{lk.l}</Link>
                            : <a href={lk.h} className="link-accent hover:text-white transition-colors" style={{color:'var(--text-3)'}}>{lk.l}</a>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 pt-6 text-xs text-center" style={{borderTop:'1px solid var(--border)',color:'var(--text-3)'}}>
              © {new Date().getFullYear()} CareerOrbit. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

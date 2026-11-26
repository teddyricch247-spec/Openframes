export type AnimationDemoKind =
  | 'kinetic-type'
  | 'svg-morph'
  | 'data-bars'
  | 'timeline-edit'
  | 'audio-sync'
  | 'spatial-orbit';

export interface HeroVideoPlaceholder {
  id: string;
  slotCode: string;
  title: string;
  duration: string;
  aspectHint: string;
  toolStack: string;
  description: string;
  demoKind: AnimationDemoKind;
  imageSrc: string;
  posterTone: string;
}

export interface WorkflowStep {
  stepNumber: number;
  minuteRange: string;
  durationMinutes: number;
  title: string;
  shortLabel: string;
  toolUsed: string;
  summary: string;
  deliverable: string;
}

export type GuideTabId = 'all' | 'open-source' | 'workflow' | 'templates';

export interface GuideModule {
  id: string;
  chapter: string;
  title: string;
  category: Exclude<GuideTabId, 'all'>;
  categoryLabel: string;
  timeSaved: string;
  description: string;
  highlights: string[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const HERO_VIDEO_PLACEHOLDERS: HeroVideoPlaceholder[] = [
  {
    id: 'marias-bikes',
    slotCode: '9:16 SCENE 01',
    title: "Maria's Bikes",
    duration: '00:38',
    aspectHint: '9:16 Vertical Scene',
    toolStack: 'Open-Source Agent · 20 Min Build',
    description:
      'Storefront character dialogue and props generated from structured scene prompts using free open-source coding agents—zero paid AI subscriptions.',
    demoKind: 'kinetic-type',
    imageSrc: '/assets/aistudio/InShot_1795699107252_a8aa48b8.png',
    posterTone: 'from-sky-900 via-slate-900 to-emerald-950',
  },
  {
    id: 'night-guard',
    slotCode: '9:16 SCENE 02',
    title: 'Night Guard',
    duration: '00:24',
    aspectHint: '9:16 Vertical Scene',
    toolStack: 'Open-Source Agent · Props & Rigging',
    description:
      'Night-shift scene with custom signage, props, lighting, and timed character cues built and edited from start to finish in a 20-minute sprint.',
    demoKind: 'svg-morph',
    imageSrc: '/assets/aistudio/InShot_1795699193359_0915fd10.png',
    posterTone: 'from-slate-900 via-blue-950 to-slate-950',
  },
  {
    id: 'lighthouse',
    slotCode: '9:16 SCENE 03',
    title: 'Lighthouse',
    duration: '00:46',
    aspectHint: '9:16 Vertical Scene',
    toolStack: 'Open-Source Agent · Volumetric Beams',
    description:
      'Atmospheric coastal environment with rotating volumetric light beams, animated water reflections, and camera framing coded in minutes.',
    demoKind: 'spatial-orbit',
    imageSrc: '/assets/aistudio/InShot_1795699168102_3cffdefb.png',
    posterTone: 'from-blue-950 via-indigo-950 to-slate-950',
  },
  {
    id: 'moving-walkway',
    slotCode: '9:16 SCENE 04',
    title: 'Moving Walkway',
    duration: '00:34',
    aspectHint: '9:16 Vertical Scene',
    toolStack: 'Open-Source Agent · Loop Mechanics',
    description:
      'Synchronized character motion over a continuous conveyor loop with crisp shadows and readable framing tailored for 9:16 feeds.',
    demoKind: 'timeline-edit',
    imageSrc: '/assets/aistudio/InShot_1795699138072_93496d91.png',
    posterTone: 'from-sky-800 via-slate-900 to-slate-950',
  },
  {
    id: 'coin-counter',
    slotCode: '9:16 SCENE 05',
    title: 'Coin Counter',
    duration: '00:31',
    aspectHint: '9:16 Vertical Scene',
    toolStack: 'Open-Source Agent · Expressions & Cut',
    description:
      'Close-up dialogue shot with dynamic counter signage, facial expressions, and a 4-minute beat-locked sound and caption pass.',
    demoKind: 'audio-sync',
    imageSrc: '/assets/aistudio/InShot_1795699059809_ba626826.png',
    posterTone: 'from-amber-950 via-slate-900 to-slate-950',
  },
  {
    id: 'bakery-walk',
    slotCode: '9:16 SCENE 06',
    title: 'Bakery Walk',
    duration: '00:44',
    aspectHint: '9:16 Vertical Scene',
    toolStack: 'Open-Source Agent · Multi-Character',
    description:
      'Multi-character street interaction with dynamic props, walk cycle, and clean depth staging exported within the 20-minute workflow.',
    demoKind: 'data-bars',
    imageSrc: '/assets/aistudio/InShot_1795699050053_894cc33a.png',
    posterTone: 'from-emerald-950 via-slate-900 to-slate-950',
  },
];

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    stepNumber: 1,
    minuteRange: '00:00 – 04:00',
    durationMinutes: 4,
    title: 'Scene Blueprint & Prompt Framing',
    shortLabel: 'Blueprint',
    toolUsed: 'Structured Scene Spec (Markdown)',
    summary:
      'Skip vague one-line prompts that waste iterations. Fill in the 4-line timing, palette, and motion-curve template so the agent nails scene structure on the first pass.',
    deliverable: 'Locked shot list + exact timing cues',
  },
  {
    stepNumber: 2,
    minuteRange: '04:00 – 11:00',
    durationMinutes: 7,
    title: 'Free Open-Source Agent Code Generation',
    shortLabel: 'Code Agent',
    toolUsed: 'OpenCode / Aider + Free API & Local Models',
    summary:
      'Run the exact open-source terminal agent setup that replaces a $20–$200/mo Claude Code subscription. It writes clean Remotion, SVG, and Canvas scenes directly into your folder.',
    deliverable: 'Working code-drawn animation scenes at $0 API cost',
  },
  {
    stepNumber: 3,
    minuteRange: '11:00 – 16:00',
    durationMinutes: 5,
    title: 'Live Preview Scrub & Deterministic Render',
    shortLabel: 'Render',
    toolUsed: 'Headless Render + FFmpeg Pipeline',
    summary:
      'Hot-reload keyframe tweaks in seconds and batch-export crisp 60fps 1080p/4K MP4 frames via a single copy-paste render command.',
    deliverable: 'Lossless 60fps rendered animation clips',
  },
  {
    stepNumber: 4,
    minuteRange: '16:00 – 20:00',
    durationMinutes: 4,
    title: 'Rapid Cut, SFX Drop & Final Export',
    shortLabel: 'Final Edit',
    toolUsed: 'Included Cut Template + Free NLE Presets',
    summary:
      'Drop rendered clips onto the pre-built pacing track, snap subtle UI clicks and transitions onto frame markers, and export a finished video in 4 minutes flat.',
    deliverable: 'Published video ready for YouTube, X, or Reels',
  },
];

export const GUIDE_MODULES: GuideModule[] = [
  {
    id: 'zero-sub-stack',
    chapter: 'Module 01',
    title: 'The $0/Month Claude Code Alternative Stack',
    category: 'open-source',
    categoryLabel: 'Open-Source Stack',
    timeSaved: 'Saves $240–$2,400/yr',
    description:
      'Step-by-step installation of open-source CLI coding agents paired with free-tier coding models and local Ollama fallbacks that match paid agent output for motion code.',
    highlights: [
      'Exact CLI config file copy-paste setup',
      'Which free coding models draw SVG & React motion cleanly',
      'Zero rate-limit fallback workflow for uninterrupted sessions',
    ],
  },
  {
    id: 'motion-primitives',
    chapter: 'Module 02',
    title: 'Code-Drawn Animation Engines Without Keyframe Bloat',
    category: 'open-source',
    categoryLabel: 'Open-Source Stack',
    timeSaved: '100% Free & MIT Licensed',
    description:
      'How to pair Remotion, Motion Canvas, and pure HTML5 Canvas so AI agents never hallucinate broken timelines or overlapping layers.',
    highlights: [
      'Pre-wired starter repository with instant live preview',
      'Spring physics & bezier easing helpers agents understand',
      '1080x1920 vertical & 1920x1080 widescreen presets',
    ],
  },
  {
    id: 'twenty-min-clock',
    chapter: 'Module 03',
    title: 'The Real-Time 20-Minute Production Sprint',
    category: 'workflow',
    categoryLabel: '20-Min Workflow',
    timeSaved: '20 min start to export',
    description:
      'Follow along minute-by-minute as a blank folder turns into a fully edited, sound-designed 45-second animation in 20 minutes of real work.',
    highlights: [
      'Unedited 20-minute screen recording breakdown',
      'How to fix layout bugs in 1 prompt instead of 10',
      'Frame-accurate FFmpeg render script for fast output',
    ],
  },
  {
    id: 'four-min-edit',
    chapter: 'Module 04',
    title: 'The 4-Minute Editing & Sound Sync System',
    category: 'workflow',
    categoryLabel: '20-Min Workflow',
    timeSaved: '4 min editing pass',
    description:
      'Why most creators spend 3 hours editing a 30-second video—and the marker-based audio & cut checklist that finishes the entire edit inside the 20-minute window.',
    highlights: [
      'Pre-organized free SFX pack (clicks, whooshes, pops)',
      'Auto-normalize loudness & crisp caption styling',
      'Zero-bloat export settings for crisp social compression',
    ],
  },
  {
    id: 'prompt-vault',
    chapter: 'Module 05',
    title: '12 Copy-Paste Scene Prompt Blueprints',
    category: 'templates',
    categoryLabel: 'Templates & Prompts',
    timeSaved: 'Instant start',
    description:
      'Battle-tested prompt skeletons for SaaS UI explainers, animated bar/line charts, kinetic quotes, code walkthroughs, and product callouts.',
    highlights: [
      'Structured JSON/Markdown prompt schemas',
      'Color & typography constraint blocks that prevent ugly output',
      'Includes starter Git repository you own forever',
    ],
  },
  {
    id: 'fix-prompts',
    chapter: 'Module 06',
    title: '1-Shot Visual Fix & Polish Prompts',
    category: 'templates',
    categoryLabel: 'Templates & Prompts',
    timeSaved: 'No endless debugging',
    description:
      'What to type when text clips, timing feels sluggish, or elements overlap—so your agent corrects geometry cleanly on the very next turn.',
    highlights: [
      'Overlap & safe-margin correction prompts',
      'Rhythm & anticipation curve upgrades',
      'Checklist before hitting final render',
    ],
  },
];

export const FAQS: FaqItem[] = [
  {
    id: 'faq-claude-sub',
    question: 'Do I really not need a Claude Code or paid AI subscription?',
    answer:
      'Correct. The guide walks through free open-source terminal coding agents and free-tier / local model endpoints that execute the exact same file-editing and animation-coding loop at $0/month.',
  },
  {
    id: 'faq-20-mins',
    question: 'Does the 20 minutes really include editing and exporting?',
    answer:
      'Yes—20 minutes of actual hands-on work from opening an empty folder to exporting the final edited video with sound effects. You get the exact timer breakdown and starter templates so you are not building boilerplate from scratch.',
  },
  {
    id: 'faq-coding-skill',
    question: 'Do I need to be an experienced programmer or motion designer?',
    answer:
      'No. If you can copy and paste terminal commands and describe what you want on screen using the included prompt templates, the open-source agent writes and adjusts the animation code for you.',
  },
  {
    id: 'faq-black-friday',
    question: 'How long does the $17 Black Friday price last?',
    answer:
      'The guide is normally $47. The $17 Black Friday discount ends at 11:59 PM on Black Friday (November 27, 2026), after which it automatically returns to $47.',
  },
  {
    id: 'faq-included',
    question: 'What format do I receive right after purchasing?',
    answer:
      'You get instant lifetime access to the complete interactive guide, the unedited 20-minute workflow walkthrough, the pre-configured starter repo, and all 12 scene prompt blueprints.',
  },
];

export function getTotalWorkflowMinutes(steps: WorkflowStep[] = WORKFLOW_STEPS): number {
  return steps.reduce((sum, step) => sum + step.durationMinutes, 0);
}

export function filterCurriculumItems(
  modules: GuideModule[],
  activeTab: GuideTabId
): GuideModule[] {
  if (activeTab === 'all') {
    return modules;
  }
  return modules.filter((mod) => mod.category === activeTab);
}

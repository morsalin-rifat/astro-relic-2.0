import { useEffect, useRef, useState } from 'react';
import { store, useGame, t } from '../state/store';
import { audio } from '../game/audio';
import { UI, MISSIONS } from '../data/content';
import { STORY, HOTSPOTS, HOTSPOT_ORDER } from '../data/story';
import { SolarHUD } from './SolarHUD';

const POP = 'cubic-bezier(.785, .135, .15, .01)';

function speakerName(s: string) {
  return s === 'nova' ? 'NOVA' : s === 'sojourner' ? 'SOJOURNER' : '';
}

/* ---------------- Dialogue box ---------------- */
function Dialogue() {
  const current = useGame((s) => s.current);
  const choices = useGame((s) => s.choices);
  const lang = useGame((s) => s.lang);
  const phase = useGame((s) => s.phase);

  if (phase === 'home' || phase === 'cinematic') return null;

  if (!current && choices) {
    return (
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {choices.map((c) => (
          <button
            key={c.action}
            onClick={() => {
              store.set({ choices: null });
              store.emit(c.action, c.data);
            }}
            className="px-7 py-3 border border-[#ffd97d]/70 text-[#ffd97d] tracking-[0.25em] text-sm hover:bg-[#ffd97d] hover:text-black transition-all duration-200"
            style={{ transitionTimingFunction: POP }}
          >
            {t(c, lang)}
          </button>
        ))}
      </div>
    );
  }

  if (!current) return null;
  const name = speakerName(current.speaker);
  return (
    <button
      onClick={() => store.advanceDialogue()}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-[min(650px,92vw)] text-left cursor-pointer group"
    >
      <div className="relative bg-black/75 backdrop-blur-md border border-white/15 px-5 py-4 rounded-xl flex items-center gap-4 shadow-2xl">
        <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-[#ffd97d]" />
        <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-[#ffd97d]" />
        
        {/* 2D Character Avatar */}
        {current.speaker === 'nova' && (
          <div className="relative flex-shrink-0">
            <img
              src="/images/nova_ai_guide_avatar_1791384201763.jpg"
              alt="Nova AI Guide"
              className="w-16 h-16 rounded-full border-2 border-[#00f0ff] object-cover shadow-[0_0_15px_rgba(0,240,255,0.45)]"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-[#00f0ff] text-black text-[9px] font-bold rounded-full">
              AI
            </span>
          </div>
        )}
        {current.speaker === 'sojourner' && (
          <div className="relative flex-shrink-0 w-16 h-16 rounded-full border-2 border-[#ffd97d] bg-[#221a14] flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(255,217,125,0.3)]">
            🤖
          </div>
        )}

        <div className="flex-1">
          {name && (
            <div
              className={`text-[11px] font-bold tracking-[0.35em] mb-1 ${
                current.speaker === 'nova' ? 'text-[#00f0ff]' : 'text-[#ffd97d]'
              }`}
            >
              {name}
            </div>
          )}
          <div className="text-[15px] leading-relaxed text-[#ece7db] font-sans">{t(current, lang)}</div>
          <div className="text-[10px] tracking-[0.3em] text-white/40 mt-1.5 group-hover:text-white/70 transition-colors">
            {t(UI.clickContinue, lang)} ▸
          </div>
        </div>
      </div>
    </button>
  );
}

/* ---------------- Home overlay ---------------- */
function HomeUI() {
  const phase = useGame((s) => s.phase);
  const lang = useGame((s) => s.lang);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (phase === 'home') {
      const id = setTimeout(() => setShow(true), 400);
      return () => clearTimeout(id);
    }
    setShow(false);
    return undefined;
  }, [phase]);
  if (phase !== 'home') return null;
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-1000"
      style={{ opacity: show ? 1 : 0 }}
    >
      <div className="text-[11px] tracking-[0.6em] text-[#9fd8ff]/70 mb-6">{t(UI.tagline1, lang).toUpperCase()}</div>
      <h1 className="font-display text-[clamp(3rem,10vw,7.5rem)] leading-none tracking-[0.08em] text-[#f3ede0] select-none">
        ASTRO&nbsp;RELIC
      </h1>
      <div className="mt-6 text-center text-[13px] text-white/55 tracking-[0.2em] leading-7">
        <div>{t(UI.tagline2, lang)}</div>
        <div>{t(UI.tagline3, lang)}</div>
      </div>
      <button
        onClick={() => store.emit('start')}
        className="pointer-events-auto mt-12 group relative px-10 py-4 overflow-hidden border border-[#ffd97d]/60"
      >
        <span
          className="absolute inset-0 bg-[#ffd97d] origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-300"
          style={{ transitionTimingFunction: POP }}
        />
        <span className="relative z-10 tracking-[0.3em] text-sm text-[#ffd97d] group-hover:text-black transition-colors duration-300">
          {t(UI.cta, lang)} →
        </span>
      </button>
      <div className="mt-5 text-[10px] tracking-[0.4em] text-white/35">{t(UI.ctaSub, lang)}</div>
    </div>
  );
}

/* ---------------- Journey choice ---------------- */
function JourneyChoice() {
  const show = useGame((s) => s.showChoice);
  const lang = useGame((s) => s.lang);
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="text-[11px] tracking-[0.5em] text-white/50 mb-2">{t(UI.chooseJourney, lang)}</div>
      <div className="text-white/80 text-lg mb-10">{t(UI.twoWorlds, lang)}</div>
      <div className="flex gap-6 flex-wrap justify-center px-6">
        <button
          onClick={() => store.emit('choose:mars')}
          className="group relative w-72 p-8 border border-[#c1543a]/60 text-left overflow-hidden hover:border-[#ffd97d] transition-colors duration-300"
        >
          <span
            className="absolute inset-0 bg-[#c1543a]/20 origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-300"
            style={{ transitionTimingFunction: POP }}
          />
          <div className="relative">
            <div className="text-3xl tracking-[0.2em] text-[#e0603f] mb-3">{t(UI.mars, lang)}</div>
            <div className="text-sm text-white/60 leading-relaxed">{t(UI.marsDesc, lang)}</div>
            <div className="mt-6 text-[10px] tracking-[0.35em] text-[#ffd97d]">🚩 PATHFINDER / SOJOURNER</div>
          </div>
        </button>
        <div className="relative w-72 p-8 border border-white/10 text-left opacity-50">
          <div className="text-3xl tracking-[0.2em] text-white/70 mb-3">{t(UI.moon, lang)}</div>
          <div className="text-sm text-white/50 leading-relaxed">{t(UI.moonDesc, lang)}</div>
          <div className="mt-6 text-[10px] tracking-[0.35em] text-white/40">
            🔒 {t(UI.locked, lang)} — {t(UI.comingSoon, lang)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Cinematic caption ---------------- */
function Caption() {
  const caption = useGame((s) => s.caption);
  const lang = useGame((s) => s.lang);
  if (!caption) return null;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="text-[clamp(1.4rem,4vw,2.6rem)] tracking-[0.45em] text-[#f3ede0] font-display animate-[fadein_1.2s_ease]">
        {t(caption, lang)}
      </div>
    </div>
  );
}

/* ---------------- Story mode overlay ---------------- */
function StoryOverlay() {
  const show = useGame((s) => s.showStory);
  const phase = useGame((s) => s.phase);
  const lang = useGame((s) => s.lang);
  const [chapter, setChapter] = useState(0);
  const [line, setLine] = useState(-1); // -1 = title card
  const active = show && phase === 'story';

  useEffect(() => {
    if (active) {
      setChapter(0);
      setLine(-1);
      store.emit('story:chapter', STORY[0]?.camera);
    }
  }, [active]);

  if (!active) return null;
  const ch = STORY[chapter]!;
  const isLast = chapter === STORY.length - 1 && line === ch.lines.length - 1;

  const advance = () => {
    if (line === -1) {
      setLine(0);
      return;
    }
    if (line < ch.lines.length - 1) {
      setLine(line + 1);
      return;
    }
    if (chapter < STORY.length - 1) {
      const next = chapter + 1;
      setChapter(next);
      setLine(-1);
      store.emit('story:chapter', STORY[next]!.camera);
      return;
    }
    store.emit('storyFinished');
  };

  return (
    <div className="absolute inset-0 z-30 cursor-pointer" onClick={advance}>
      {/* letterbox */}
      <div className="absolute top-0 inset-x-0 h-[9vh] bg-black" />
      <div className="absolute bottom-0 inset-x-0 h-[9vh] bg-black" />
      <div className="absolute top-[9vh] left-6 text-[10px] tracking-[0.5em] text-[#ffd97d]/80">
        {t(UI.storyMode, lang)}
      </div>

      {line === -1 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <div className="text-[clamp(1.3rem,3.5vw,2.2rem)] font-display tracking-[0.2em] text-[#f3ede0]">
              {t(ch.title, lang)}
            </div>
            <div className="mt-4 text-[10px] tracking-[0.4em] text-white/40">{t(UI.clickContinue, lang)} ▸</div>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-[12vh] inset-x-0 flex justify-center px-6">
          <div
            key={`${chapter}-${line}`}
            className="max-w-[680px] text-center text-[clamp(0.95rem,2vw,1.2rem)] leading-8 text-[#ece7db] animate-[fadein_0.8s_ease]"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.9)' }}
          >
            {lang === 'bn' ? ch.lines[line]!.bn : ch.lines[line]!.en}
          </div>
        </div>
      )}
      {line !== -1 && (
        <div className="absolute bottom-[9.5vh] right-6 text-[10px] tracking-[0.35em] text-white/40">
          {isLast ? '●●●●●' : t(UI.clickContinue, lang) + ' ▸'}
        </div>
      )}
    </div>
  );
}

/* ---------------- Inspect panel ---------------- */
function InspectPanel() {
  const phase = useGame((s) => s.phase);
  const active = useGame((s) => s.activeHotspot);
  const visited = useGame((s) => s.visitedHotspots);
  const lang = useGame((s) => s.lang);
  if (phase !== 'inspect') return null;
  const h = HOTSPOTS.find((x) => x.id === active);
  const allVisited = HOTSPOT_ORDER.every((id) => visited.includes(id));

  return (
    <>
      <div className="absolute top-6 left-6 z-30 text-[10px] tracking-[0.5em] text-[#ffd97d]/80">
        SOJOURNER — {t(UI.myHardware, lang)}
      </div>
      <div className="absolute top-6 right-20 z-30 flex gap-2">
        {HOTSPOT_ORDER.map((id) => (
          <div
            key={id}
            className={`w-2 h-2 rotate-45 ${visited.includes(id) ? 'bg-[#9fd8ff]' : 'bg-white/20'}`}
          />
        ))}
      </div>

      {h && (
        <div className="absolute right-0 top-0 bottom-0 z-30 w-[min(420px,92vw)] bg-black/70 backdrop-blur-md border-l border-white/10 p-7 overflow-y-auto animate-[slidein_0.35s_ease]">
          <button
            onClick={() => store.set({ activeHotspot: null })}
            className="absolute top-4 left-4 text-white/40 hover:text-white text-lg z-10"
          >
            ✕
          </button>
          <div className="text-[10px] tracking-[0.45em] text-white/40 mb-1">HARDWARE</div>
          <div className="text-2xl font-display tracking-[0.1em] text-[#ffd97d] mb-6">{t(h.label, lang)}</div>
          {[
            { k: UI.whatItDid, v: h.did, c: '#9fd8ff' },
            { k: UI.whyItMattered, v: h.mattered, c: '#ffd97d' },
            { k: UI.missionEvent, v: h.event, c: '#e0603f' },
          ].map(({ k, v, c }) => (
            <div key={k.en} className="mb-6">
              <div className="text-[10px] tracking-[0.4em] mb-2" style={{ color: c }}>
                {t(k, lang)}
              </div>
              <div className="text-sm leading-7 text-[#e6e1d4]">{t(v, lang)}</div>
            </div>
          ))}
        </div>
      )}

      {allVisited && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3">
          <div className="text-xs tracking-[0.25em] text-[#9fd8ff]">{t(UI.allVisited, lang)}</div>
          <button
            onClick={() => store.emit('finishInspect')}
            className="px-8 py-3 bg-[#ffd97d] text-black tracking-[0.3em] text-sm hover:bg-white transition-colors"
            style={{ transitionTimingFunction: POP }}
          >
            {t(UI.finishInspect, lang)} →
          </button>
        </div>
      )}
    </>
  );
}

/* ---------------- Chapter complete overlay ---------------- */
function CompleteOverlay() {
  const phase = useGame((s) => s.phase);
  const lang = useGame((s) => s.lang);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (phase !== 'complete') {
      setShow(false);
      return;
    }
    const off = store.on('ui:showComplete', () => setShow(true));
    return off;
  }, [phase]);
  if (phase !== 'complete' || !show) return null;
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none">
      <div className="text-[clamp(2rem,6vw,4rem)] font-display tracking-[0.3em] text-[#f3ede0] animate-[fadein_1.5s_ease]">
        {t(UI.chapterComplete, lang)}
      </div>
      <div className="mt-3 text-[11px] tracking-[0.5em] text-[#ffd97d]">🚩 PATHFINDER / SOJOURNER</div>
      <button
        onClick={() => {
          const flags = store.get().flags;
          if (!flags.includes('pathfinder')) store.set({ flags: [...flags, 'pathfinder'] });
          store.emit('nextChapter');
        }}
        className="pointer-events-auto mt-10 px-9 py-3 border border-[#ffd97d]/70 text-[#ffd97d] tracking-[0.3em] text-sm hover:bg-[#ffd97d] hover:text-black transition-all duration-200"
        style={{ transitionTimingFunction: POP }}
      >
        {t(UI.nextChapter, lang)} →
      </button>
    </div>
  );
}

/* ---------------- Journey map ---------------- */
function JourneyMap() {
  const phase = useGame((s) => s.phase);
  const flags = useGame((s) => s.flags);
  const lang = useGame((s) => s.lang);
  if (phase !== 'map') return null;
  return (
    <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center">
      <div className="w-[min(480px,92vw)]">
        <div className="text-center text-[11px] tracking-[0.55em] text-[#e0603f] mb-8">🔴 {t(UI.marsJourney, lang)}</div>
        <div className="space-y-0">
          {MISSIONS.map((m, i) => {
            const done = flags.includes(m.id);
            const isFirst = i === 0;
            return (
              <div key={m.id} className="flex flex-col items-center">
                {i > 0 && <div className="w-px h-6 bg-white/15" />}
                <div
                  className={`w-full text-center py-4 border tracking-[0.2em] text-sm ${
                    done
                      ? 'border-[#ffd97d]/60 text-[#ffd97d]'
                      : isFirst
                      ? 'border-white/25 text-white/80'
                      : 'border-white/10 text-white/30'
                  }`}
                >
                  {done ? '🚩' : isFirst ? '🚩' : '🔒'} {lang === 'bn' ? m.bn : m.name}
                  {!done && !isFirst && (
                    <div className="text-[9px] tracking-[0.35em] text-white/25 mt-1">{t(UI.completeFirst, lang)}</div>
                  )}
                  {isFirst && !done && (
                    <button
                      onClick={() => store.emit('replay')}
                      className="block mx-auto mt-2 text-[10px] tracking-[0.3em] text-[#9fd8ff] hover:text-white"
                    >
                      {t(UI.replay, lang)} →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center text-[10px] tracking-[0.3em] text-white/40">
          🌙 {t(UI.moon, lang)} — {t(UI.comingSoon, lang)}
        </div>
        <button
          onClick={() => store.emit('toSolar')}
          className="mt-6 mx-auto block text-[10px] tracking-[0.4em] text-white/50 hover:text-[#ffd97d] transition-colors"
        >
          ← {t(UI.backToSolar, lang)}
        </button>
      </div>
    </div>
  );
}

/* ---------------- HUD ---------------- */
function HUD() {
  const phase = useGame((s) => s.phase);
  const objective = useGame((s) => s.objective);
  const hint = useGame((s) => s.hint);
  const tutorialDone = useGame((s) => s.tutorialDone);
  const showChoice = useGame((s) => s.showChoice);
  const lang = useGame((s) => s.lang);
  return (
    <>
      {phase === 'solar' && !tutorialDone && !showChoice && (
        <button
          onClick={() => store.emit('skipTutorial')}
          className="absolute bottom-6 right-6 z-30 text-[10px] tracking-[0.35em] text-white/40 hover:text-[#ffd97d] transition-colors"
        >
          SKIP GUIDE ▸▸
        </button>
      )}
      {objective && phase === 'explore' && (
        <div className="absolute top-6 left-6 z-20 border-l-2 border-[#ffd97d] pl-3">
          <div className="text-[9px] tracking-[0.45em] text-white/40 mb-1">OBJECTIVE</div>
          <div className="text-xs tracking-[0.15em] text-[#ece7db]">{t(objective, lang)}</div>
        </div>
      )}
      {hint && phase === 'explore' && (
        <div className="absolute top-[4.5rem] right-6 z-20 text-[10px] tracking-[0.2em] text-white/40 text-right">
          {t(hint, lang)}
        </div>
      )}
    </>
  );
}

/* ---------------- Top controls ---------------- */
function TopControls() {
  const lang = useGame((s) => s.lang);
  const muted = useGame((s) => s.muted);
  const phase = useGame((s) => s.phase);
  if (phase === 'home') return null;
  return (
    <div className="absolute top-5 right-5 z-50 flex gap-2">
      <button
        onClick={() => store.set({ lang: lang === 'en' ? 'bn' : 'en' })}
        className="px-3 py-1.5 border border-white/20 text-[11px] tracking-[0.2em] text-white/70 hover:border-[#ffd97d] hover:text-[#ffd97d] transition-colors"
      >
        {t(UI.langBtn, lang)}
      </button>
      <button
        onClick={() => {
          const next = !muted;
          store.set({ muted: next });
          audio.setMuted(next);
        }}
        className="px-3 py-1.5 border border-white/20 text-[11px] tracking-[0.2em] text-white/70 hover:border-[#ffd97d] hover:text-[#ffd97d] transition-colors"
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}

/* ---------------- Touch joystick ---------------- */
function Joystick() {
  const phase = useGame((s) => s.phase);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const active = useRef(false);
  if (phase !== 'explore') return null;
  return (
    <div
      ref={ref}
      className="absolute bottom-8 left-8 z-30 w-28 h-28 rounded-full border border-white/20 bg-black/30 touch-none [@media(pointer:fine)]:hidden"
      onPointerDown={(e) => {
        active.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!active.current || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        const len = Math.hypot(dx, dy) || 1;
        const k = Math.min(len, 1) / len;
        setPos({ x: dx * k, y: dy * k });
        store.emit('joystick', { x: dx * k, y: -dy * k });
      }}
      onPointerUp={() => {
        active.current = false;
        setPos({ x: 0, y: 0 });
        store.emit('joystick', { x: 0, y: 0 });
      }}
    >
      <div
        className="absolute w-10 h-10 rounded-full bg-[#ffd97d]/50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ transform: `translate(calc(-50% + ${pos.x * 30}px), calc(-50% + ${pos.y * 30}px))` }}
      />
    </div>
  );
}

/* ---------------- Homepage telemetry bar ---------------- */
function TelemetryBar() {
  const phase = useGame((s) => s.phase);
  const lang = useGame((s) => s.lang);
  const muted = useGame((s) => s.muted);
  const [utc, setUtc] = useState('--:--:--');

  useEffect(() => {
    if (phase !== 'home') return;
    const tick = () => setUtc(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase]);

  if (phase !== 'home') return null;

  return (
    <div className="absolute top-0 inset-x-0 z-40 pointer-events-auto">
      <div className="telemetry-bar border-b border-white/10 backdrop-blur-md flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 h-11">
        {/* left — deep space network status */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <span className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-[#7dffb0] whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7dffb0] animate-[blinkdot_1.6s_ease-in-out_infinite]" />
            {t(TELEMETRY.dsn, lang)}
          </span>
          <span className="hidden md:block text-[10px] tracking-[0.2em] text-white/45 whitespace-nowrap">
            {t(TELEMETRY.freq, lang)}
          </span>
          <span className="hidden lg:block text-[10px] tracking-[0.2em] text-white/45 whitespace-nowrap">
            {t(TELEMETRY.protocol, lang)}
          </span>
        </div>

        {/* center — mission time / location */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] tracking-[0.25em] text-white/55 whitespace-nowrap">
          <span className="text-[#ffd97d]">{t(TELEMETRY.sol, lang)}</span>
          <span className="w-px h-3 bg-white/15" />
          <span>{t(TELEMETRY.vector, lang)}</span>
        </div>

        {/* right — UTC clock + sound/language toggles */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden sm:block text-[10px] tracking-[0.15em] text-white/45 tabular-nums">
            {utc} UTC
          </span>
          <button
            onClick={() => {
              const next = !muted;
              store.set({ muted: next });
              audio.setMuted(next);
              if (!next) audio.beep();
            }}
            aria-label={t(UI.mute, lang)}
            className="flex items-end gap-[2px] h-6 px-2 py-1.5 border border-white/15 hover:border-[#00f0ff] transition-colors"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`w-[2px] h-3 origin-bottom ${muted ? 'bg-white/25' : 'bg-[#00f0ff]'}`}
                style={muted ? undefined : { animation: `wave 1.1s ease-in-out ${i * 0.12}s infinite` }}
              />
            ))}
          </button>
          <button
            onClick={() => {
              store.set({ lang: lang === 'en' ? 'bn' : 'en' });
              audio.beep();
            }}
            className="px-2.5 py-1 border border-white/15 text-[10px] tracking-[0.2em] text-white/70 hover:border-[#ffd97d] hover:text-[#ffd97d] transition-colors"
          >
            {t(UI.langBtn, lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Root overlays ---------------- */
export function Overlays() {
  const fading = useGame((s) => s.fading);
  return (
    <>
      <HomeUI />
      <Caption />
      <Dialogue />
      <JourneyChoice />
      <StoryOverlay />
      <InspectPanel />
      <CompleteOverlay />
      <JourneyMap />
      <SolarHUD />
      <HUD />
      <TopControls />
      <Joystick />
      {/* backdrop fade overlay */}
      <div
        className="absolute inset-0 z-[60] bg-black pointer-events-none transition-opacity duration-500"
        style={{ opacity: fading ? 1 : 0 }}
      />
    </>
  );
}

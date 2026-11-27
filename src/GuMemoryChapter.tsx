import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  disposeNativeBridge,
  initializeNativeVibration,
  invokesNativeVibration,
  type NativeHapticStyle,
} from './nativeBridge';
import './gu-memory.css';

type Speaker = 'mengpo' | 'gu' | 'friend' | 'narrator';
type Line = { speaker: Speaker; text: string };
type EvidenceId = 'corpse' | 'knife' | 'cup' | 'letter' | 'ledger' | 'contract' | 'exitAgreement' | 'secondKnife';
type Stage = 0 | 1 | 2;
type Mode = 'dialogue' | 'walk' | 'choice' | 'ending' | 'collapsed' | 'transition';
type Evidence = { id: EvidenceId; label: string; x: number; shape: string; lines: Line[] };
export type GuMemorySettings = {
  hapticEnabled: boolean;
  screenShakeEnabled: boolean;
  earlyInterval: number;
  earlyStrength: number;
};
type TremorKind = 'entry' | 'ambient' | 'clue' | 'urgent';

const MAP_WIDTH = 1900;
const timeLimits = [38, 52, 78] as const;
const stageNames = ['第一段 · 死亡现场', '第二段 · 账目疑云', '第三段 · 背叛与杀意'] as const;
const cast: Record<Speaker, { name: string; role: string; portrait?: string }> = {
  mengpo: { name: '小孟婆', role: '记忆的观测者', portrait: 'mengpo' },
  gu: { name: '顾沉', role: '记忆中的合伙人', portrait: 'gu' },
  friend: { name: '朋友', role: '共同经营者' },
  narrator: { name: '记忆回声', role: '片段旁白' },
};

const entryLines: Record<Stage, Line[]> = {
  0: [
    { speaker: 'mengpo', text: '这片记忆在排斥我。空间会时不时震动……我得尽快找出关键线索，在它彻底崩塌前离开。' },
    { speaker: 'gu', text: '是他背叛了我……他夺走了我的一切。' },
    { speaker: 'mengpo', text: '顾沉只记得自己死在这里，却把死亡之前发生的事藏了起来。' },
  ],
  1: [
    { speaker: 'friend', text: '顾沉，最近账目上的几笔款项始终对不上。我已经查过几次，希望你能给我一个解释。' },
    { speaker: 'gu', text: '他怎么会查到这里……' },
    { speaker: 'mengpo', text: '记忆退回到冲突发生之前了。震动暂时轻了一些，但这封信、账本和契约里一定藏着原因。' },
  ],
  2: [
    { speaker: 'friend', text: '顾沉，账目的事情我们必须说清楚。你侵吞的钱，我会追回来。如果你不肯解释，我只能退出合作，把这些事公之于众。' },
    { speaker: 'gu', text: '你非要把事情做绝？' },
    { speaker: 'mengpo', text: '奇怪，这段记忆反而完整得多，几乎不再震动。也许顾沉愿意承认自己起了杀心，却不愿再往后看。' },
  ],
};

const evidence: Record<Stage, Evidence[]> = {
  0: [
    { id: 'corpse', label: '顾沉的尸体', x: 1450, shape: 'body', lines: [
      { speaker: 'mengpo', text: '顾沉倒在办公室里。记忆没有留下清晰的经过，只剩下一场冲突的残影。' },
      { speaker: 'gu', text: '我明明只是想拿回属于自己的东西……' },
    ] },
    { id: 'knife', label: '带血的匕首', x: 1120, shape: 'knife', lines: [
      { speaker: 'mengpo', text: '一把带血的匕首。它确实是凶器，可记忆把是谁先拔刀的部分撕掉了。' },
      { speaker: 'narrator', text: '袖口里闪过一道寒光，画面随即破碎。' },
    ] },
    { id: 'cup', label: '破碎的茶杯', x: 790, shape: 'cup', lines: [
      { speaker: 'mengpo', text: '茶杯碎在地上。两个人在死前争吵过，这场冲突恐怕不是突然发生的。' },
      { speaker: 'friend', text: '账目你总得给我一个解释。我们不能再这样合作下去了。' },
    ] },
  ],
  1: [
    { id: 'letter', label: '合作伙伴的求助信', x: 1450, shape: 'letter', lines: [
      { speaker: 'friend', text: '顾沉，最近账目上的几笔款项始终对不上。我已经查过几次，希望你能给我一个解释。' },
      { speaker: 'gu', text: '他怎么会查到这里……' },
      { speaker: 'mengpo', text: '朋友已经察觉共同账目有异，写信要求顾沉说明。' },
    ] },
    { id: 'ledger', label: '被涂改的账本', x: 1110, shape: 'ledger', lines: [
      { speaker: 'gu', text: '这些钱本来就是我该得的。若不是我，他哪来今天的家业？' },
      { speaker: 'narrator', text: '他把共同经营的款项改记到自己名下。另一边，朋友逐笔核对账目。' },
      { speaker: 'friend', text: '这些钱明明是从共同经营的账目里支出去的……顾沉，你究竟瞒了我多少？' },
      { speaker: 'mengpo', text: '他把侵吞解释成应得的报酬，仿佛只要这么说，账目就不再属于两个人。' },
    ] },
    { id: 'contract', label: '合作经营契约', x: 770, shape: 'contract', lines: [
      { speaker: 'narrator', text: '契约写着：双方共同出资、经营，按约定分配收益。' },
      { speaker: 'mengpo', text: '他们起初是平等的伙伴。顾沉后来逐渐掌握账目和经营决策，朋友则负责外部事务。' },
      { speaker: 'gu', text: '我只是比他多做了一点。那些家业，我拿得并不过分。' },
    ] },
  ],
  2: [
    { id: 'exitAgreement', label: '退出合作协议', x: 1390, shape: 'agreement', lines: [
      { speaker: 'friend', text: '这是退出合作的协议。被侵吞的款项，你必须交代清楚。否则我会把账目问题公开。' },
      { speaker: 'mengpo', text: '朋友已经决定离开，也准备揭露顾沉侵吞财产的事实。' },
      { speaker: 'gu', text: '他不能把所有东西都带走……' },
    ] },
    { id: 'secondKnife', label: '藏在袖中的匕首', x: 940, shape: 'knife', lines: [
      { speaker: 'narrator', text: '深夜，顾沉把匕首藏进袖口，等朋友到来。' },
      { speaker: 'friend', text: '是你先做了不该做的事。' },
      { speaker: 'gu', text: '你非要把事情做绝？' },
      { speaker: 'mengpo', text: '记忆停在他起了杀意的这一刻。顾沉没有让自己继续看下去——这里没有战斗，只有他确实先想杀人灭口的事实。' },
    ] },
  ],
};

const truthLines: Line[] = [
  { speaker: 'mengpo', text: '你和朋友共同经营事业。起初关系亲密，合作顺利；后来你逐渐掌握账目和经营决策，开始侵吞共同财产。' },
  { speaker: 'mengpo', text: '他发现异常后，要求你解释，也准备退出合作、揭露真相。你害怕罪行曝光，于是把匕首藏进袖中，想杀他灭口。' },
  { speaker: 'narrator', text: '争斗中，朋友夺过匕首刺中顾沉。顾沉倒地，朋友惊慌退开。' },
  { speaker: 'mengpo', text: '朋友后来接管事业，并追回部分被你侵吞的财产。你却只记得他杀死了你，把自己先前的所作所为全都抹去了。' },
  { speaker: 'mengpo', text: '顾沉，你一直说自己被朋友背叛，可你有没有想过，他为什么会与你反目？' },
  { speaker: 'gu', text: '就算我做过一些错事，他也不该杀我！' },
];
const responseLines: Record<'A' | 'B', Line[]> = {
  A: [
    { speaker: 'mengpo', text: '你先侵吞财产，又想杀人灭口。你真的觉得自己只是一个被背叛的人吗？' },
    { speaker: 'gu', text: '我只是想保住自己应得的东西！难道我就该任由他毁掉我的一切？' },
  ],
  B: [
    { speaker: 'mengpo', text: '他确实杀死了你，这件事不能因此被抹去。但你也不能把自己先前的所作所为一并忘掉。' },
    { speaker: 'gu', text: '……至少你承认，他确实杀了我。可我做的那些事，真的就不能被原谅吗？' },
  ],
};
export default function GuMemoryChapter({ onExit, settings }: { onExit: () => void; settings: GuMemorySettings }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const playerX = useRef(1610);
  const direction = useRef(0);
  const modeRef = useRef<Mode>('dialogue');
  const stageRef = useRef<Stage>(0);
  const collectedRef = useRef<EvidenceId[]>([]);
  const nearbyRef = useRef<string | null>(null);
  const timeLeftRef = useRef<number>(timeLimits[0]);
  const advanceRef = useRef<() => void>(() => {});
  const interactRef = useRef<(id: string) => void>(() => {});
  const completeRef = useRef<(() => void) | null>(null);
  const onExitRef = useRef(onExit);
  const settingsRef = useRef(settings);
  const facingRef = useRef<'left' | 'right'>('left');
  const hapticTimerRef = useRef<number | null>(null);
  const stageTimerRef = useRef<number | null>(null);
  const tremorRef = useRef<(kind: TremorKind) => void>(() => {});
  const [stage, setStage] = useState<Stage>(0);
  const [collected, setCollected] = useState<EvidenceId[]>([]);
  const [mode, setMode] = useState<Mode>('dialogue');
  const [dialogue, setDialogue] = useState<Line[]>(entryLines[0]);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [remaining, setRemaining] = useState<number>(timeLimits[0]);
  const [nearby, setNearby] = useState<string | null>(null);
  const [affinity, setAffinity] = useState<number | null>(null);
  const [facing, setFacing] = useState<'left' | 'right'>('left');
  const [hapticAvailable, setHapticAvailable] = useState<boolean | null>(null);

  stageRef.current = stage;
  modeRef.current = mode;
  collectedRef.current = collected;
  onExitRef.current = onExit;
  settingsRef.current = settings;

  const triggerTremor = (kind: TremorKind) => {
    const currentSettings = settingsRef.current;
    if (!currentSettings.hapticEnabled && !currentSettings.screenShakeEnabled) return;

    if (currentSettings.screenShakeEnabled) {
      const chapter = viewportRef.current?.closest<HTMLElement>('.gu-chapter');
      if (chapter) {
        const stageStrength = stageRef.current === 0 ? 1 : stageRef.current === 1 ? .72 : .46;
        const kindStrength = kind === 'entry' || kind === 'clue' ? 1.22 : kind === 'urgent' ? 1.35 : 1;
        const amplitude = Math.max(4, currentSettings.earlyStrength * stageStrength * kindStrength);
        chapter.style.setProperty('--gu-shake-x1', `${-amplitude}px`);
        chapter.style.setProperty('--gu-shake-y1', `${amplitude * .42}px`);
        chapter.style.setProperty('--gu-shake-x2', `${amplitude * .78}px`);
        chapter.style.setProperty('--gu-shake-y2', `${-amplitude * .3}px`);
        chapter.style.setProperty('--gu-shake-x3', `${-amplitude * .55}px`);
        chapter.style.setProperty('--gu-shake-y3', `${amplitude * .2}px`);
        chapter.style.setProperty('--gu-shake-x4', `${amplitude * .5}px`);
        chapter.style.setProperty('--gu-shake-y4', `${-amplitude * .2}px`);
        chapter.style.setProperty('--gu-shake-x5', `${-amplitude * .38}px`);
        chapter.style.setProperty('--gu-shake-x6', `${-amplitude * .24}px`);
        chapter.classList.remove('gu-shake');
        void chapter.offsetWidth;
        chapter.classList.add('gu-shake');
      }
    }

    if (currentSettings.hapticEnabled) {
      const style: NativeHapticStyle = stageRef.current === 0 || kind === 'urgent' || kind === 'clue'
        ? 'heavy'
        : stageRef.current === 1
          ? 'medium'
          : 'light';
      void invokesNativeVibration(style).then((result) => {
        if (!result.ok) setHapticAvailable(false);
      });
      if (style === 'heavy') {
        if (hapticTimerRef.current !== null) window.clearTimeout(hapticTimerRef.current);
        hapticTimerRef.current = window.setTimeout(() => {
          hapticTimerRef.current = null;
          void invokesNativeVibration('medium').then((result) => {
            if (!result.ok) setHapticAvailable(false);
          });
        }, 145);
      }
    }
  };
  tremorRef.current = triggerTremor;

  const setModeRef = (value: Mode) => { modeRef.current = value; setMode(value); };
  const startDialogue = (lines: Line[], onComplete: () => void) => {
    direction.current = 0;
    nearbyRef.current = null;
    setNearby(null);
    setDialogue(lines);
    setDialogueIndex(0);
    completeRef.current = onComplete;
    setModeRef('dialogue');
  };
  const enterStage = (next: Stage) => {
    stageRef.current = next;
    setStage(next);
    playerX.current = 1610;
    timeLeftRef.current = timeLimits[next];
    setRemaining(timeLimits[next]);
    setCollected([]);
    collectedRef.current = [];
    startDialogue(entryLines[next], () => setModeRef('walk'));
    if (stageTimerRef.current !== null) window.clearTimeout(stageTimerRef.current);
    stageTimerRef.current = window.setTimeout(() => {
      stageTimerRef.current = null;
      tremorRef.current('entry');
    }, 320);
  };
  const collapse = () => { direction.current = 0; setModeRef('collapsed'); };

  const advanceDialogue = () => {
    if (dialogueIndex < dialogue.length - 1) { setDialogueIndex((index) => index + 1); return; }
    completeRef.current?.();
    completeRef.current = null;
  };
  advanceRef.current = advanceDialogue;

  const interact = (id: string) => {
    if (modeRef.current !== 'walk') return;
    const currentStage = stageRef.current;
    if (id === 'exit') {
      if (Math.abs(playerX.current - 80) > 118) return;
      if (collectedRef.current.length !== evidence[currentStage].length) return;
      if (currentStage < 2) {
        setModeRef('transition');
        window.setTimeout(() => enterStage((currentStage + 1) as Stage), 450);
      } else startDialogue(truthLines, () => setModeRef('choice'));
      return;
    }
    const clue = evidence[currentStage].find((item) => item.id === id);
    if (clue && Math.abs(playerX.current - clue.x) > 118) return;
    if (!clue || collectedRef.current.includes(clue.id)) return;
    const next = [...collectedRef.current, clue.id];
    collectedRef.current = next;
    setCollected(next);
    const allFound = next.length === evidence[currentStage].length;
    tremorRef.current(allFound ? 'entry' : 'clue');
    const lines = allFound
      ? [...clue.lines, { speaker: 'mengpo' as const, text: currentStage === 0 ? '这段记忆快要撑不住了。线索已经够了，我得马上从左侧离开。' : currentStage === 1 ? '这些线索已经拼出账目的真相。空间又开始震动，出口在左边。' : '我终于知道他为何记住那场死亡，却不肯提起自己先动了杀念。记忆正在松动，先从左侧离开。' }]
      : clue.lines;
    startDialogue(lines, () => setModeRef('walk'));
  };
  interactRef.current = interact;

  const selectResponse = (choice: 'A' | 'B') => {
    setAffinity(choice === 'A' ? 1 : 2);
    startDialogue(responseLines[choice], () => setModeRef('ending'));
  };

  useEffect(() => {
    if (completeRef.current === null) completeRef.current = () => { modeRef.current = 'walk'; setMode('walk'); };
  }, []);

  useEffect(() => {
    let active = true;
    void initializeNativeVibration().then((result) => {
      if (active) setHapticAvailable(result.ok);
    });
    const entryTimer = window.setTimeout(() => tremorRef.current('entry'), 650);
    const onPageHide = () => disposeNativeBridge();
    window.addEventListener('pagehide', onPageHide);
    return () => {
      active = false;
      window.clearTimeout(entryTimer);
      if (hapticTimerRef.current !== null) window.clearTimeout(hapticTimerRef.current);
      if (stageTimerRef.current !== null) window.clearTimeout(stageTimerRef.current);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((key === 'a' || key === 'arrowleft') && modeRef.current === 'walk') {
        direction.current = -1;
        facingRef.current = 'left';
        setFacing('left');
        event.preventDefault();
      } else if ((key === 'd' || key === 'arrowright') && modeRef.current === 'walk') {
        direction.current = 1;
        facingRef.current = 'right';
        setFacing('right');
        event.preventDefault();
      } else if (!event.repeat && (key === 'e' || key === ' ')) {
        if (modeRef.current === 'dialogue') advanceRef.current();
        else if (modeRef.current === 'walk' && nearbyRef.current) interactRef.current(nearbyRef.current);
      } else if (!event.repeat && key === 'escape' && modeRef.current !== 'ending') onExitRef.current();
    };
    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((key === 'a' || key === 'arrowleft') && direction.current < 0) direction.current = 0;
      if ((key === 'd' || key === 'arrowright') && direction.current > 0) direction.current = 0;
    };
    const blur = () => { direction.current = 0; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    let raf = 0;
    let previous = 0;
    let lastSecond = -1;
    let shakeElapsed = 0;
    let shakeActiveFor = 0;
    let lastStage = stageRef.current;
    let hasLeftDialogue = false;
    const frame = (now: number) => {
      const dt = previous === 0 ? 0 : Math.min(50, now - previous) / 1000;
      previous = now;
      const viewport = viewportRef.current;
      const world = worldRef.current;
      const player = playerRef.current;
      if (viewport && world && player) {
        if (modeRef.current === 'walk') {
          playerX.current = Math.max(70, Math.min(MAP_WIDTH - 50, playerX.current + direction.current * 250 * dt));
          timeLeftRef.current = Math.max(0, timeLeftRef.current - dt);
          const seconds = Math.ceil(timeLeftRef.current);
          if (seconds !== lastSecond) { lastSecond = seconds; setRemaining(seconds); }
          if (timeLeftRef.current <= 0) collapse();
        } else direction.current = 0;
        if (modeRef.current === 'walk') {
          if (!hasLeftDialogue) {
            hasLeftDialogue = true;
            shakeElapsed = 0;
            tremorRef.current('entry');
          }
          if (lastStage !== stageRef.current) {
            lastStage = stageRef.current;
            shakeElapsed = 0;
            hasLeftDialogue = true;
          }
          shakeElapsed += dt;
          shakeActiveFor = Math.max(0, shakeActiveFor - dt);
          const currentSettings = settingsRef.current;
          const earlyInterval = Math.max(1.2, currentSettings.earlyInterval);
          const shakeInterval = timeLeftRef.current <= 12
            ? Math.max(1.1, earlyInterval * .58)
            : stageRef.current === 0
              ? earlyInterval
              : stageRef.current === 1
                ? earlyInterval * 1.35
                : earlyInterval * 2;
          if (shakeActiveFor === 0 && shakeElapsed >= shakeInterval) {
            tremorRef.current(timeLeftRef.current <= 12 ? 'urgent' : 'ambient');
            shakeActiveFor = .62;
            shakeElapsed = 0;
          }
        } else {
          hasLeftDialogue = false;
          shakeActiveFor = Math.max(0, shakeActiveFor - dt);
        }
        if (shakeActiveFor === 0) viewport.closest('.gu-chapter')?.classList.remove('gu-shake');
        const cameraX = Math.max(0, Math.min(MAP_WIDTH - viewport.clientWidth, playerX.current - viewport.clientWidth * .47));
        player.style.left = `${playerX.current}px`;
        player.style.transform = `translateX(-50%) scaleX(${facingRef.current === 'left' ? -1 : 1})`;
        player.classList.toggle('walking', direction.current !== 0);
        world.style.transform = `translate3d(${-cameraX}px,0,0)`;
        const targets: Array<{ id: string; x: number }> = [
          ...evidence[stageRef.current].filter((item) => !collectedRef.current.includes(item.id)).map((item) => ({ id: item.id, x: item.x })),
          ...(collectedRef.current.length === evidence[stageRef.current].length ? [{ id: 'exit', x: 80 }] : []),
        ];
        const nextNearby = targets.map((target) => ({ ...target, distance: Math.abs(playerX.current - target.x) }))
          .filter((target) => target.distance <= 118)
          .sort((a, b) => a.distance - b.distance)[0]?.id ?? null;
        if (nextNearby !== nearbyRef.current) { nearbyRef.current = nextNearby; setNearby(nextNearby); }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);

  const press = (sign: -1 | 1) => (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (modeRef.current !== 'walk') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    direction.current = sign;
    facingRef.current = sign < 0 ? 'left' : 'right';
    setFacing(sign < 0 ? 'left' : 'right');
  };
  const currentEvidence = evidence[stage];
  const line = dialogue[dialogueIndex];
  const allCollected = collected.length === currentEvidence.length;
  const closeTarget = nearby === 'exit' ? '记忆出口' : currentEvidence.find((item) => item.id === nearby)?.label;

  return <section className={`gu-chapter ${remaining <= 12 && mode === 'walk' ? 'gu-crumbling' : ''}`}>
    <>
      <div className={`gu-viewport ${remaining <= 12 && mode === 'walk' ? 'gu-crumbling' : ''}`} ref={viewportRef}>
        <div className={`gu-world gu-world-${stage}`} ref={worldRef} style={{ width: MAP_WIDTH }}>
          <div className="gu-backwall"><i/><i/><i/><span>{stage === 0 ? '共同经营 · 办公室' : stage === 1 ? '共同经营 · 办公室' : '那一夜 · 冲突之前'}</span></div>
          <div className="gu-floor"/>
          <div className="gu-desk"><i/><b/></div><div className="gu-chair"/><div className="gu-paper-scatter"/>
          {stage === 0 && <div className="gu-corpse-silhouette" aria-label="顾沉倒在地上"/>}
          {stage !== 0 && <div className="gu-memory-npc"><i/><b/><span>记忆中的朋友</span></div>}
          {currentEvidence.map((item) => <button key={item.id} className={`gu-evidence gu-evidence-${item.shape} ${collected.includes(item.id) ? 'found' : ''}`} style={{ left: item.x }} onClick={() => interactRef.current(item.id)} aria-label={`调查${item.label}`}>
            <i>{collected.includes(item.id) ? '✓' : '?'}</i><b>{item.label}</b>
          </button>)}
          <button className={`gu-exit ${allCollected ? 'open' : 'locked'}`} style={{ left: 80 }} onClick={() => interactRef.current('exit')} aria-label="左侧记忆出口">
            <i>←</i><b>{allCollected ? '前往更早的记忆' : `线索 ${collected.length}/${currentEvidence.length}`}</b>
          </button>
          <div className={`gu-player ${facing === 'left' ? 'face-left' : ''}`} ref={playerRef} aria-label="小孟婆的观测影子"><i/><b/><span>小孟婆</span></div>
        </div>
      </div>
      <header className="gu-header"><button onClick={onExit}>← 返回章节</button><div><small>顾沉 · 记忆调查</small><strong>{stageNames[stage]}</strong></div><div className={`gu-timer ${remaining <= 12 ? 'urgent' : ''}`}><small>空间崩塌倒计时</small><b>{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</b></div></header>
      <aside className="gu-objective"><small>关键证据</small><strong>{stageNames[stage]}</strong><p>{allCollected ? '证据已齐，沿地图左侧找到出口。' : '找到全部物证，再从左侧出口离开。记忆将间歇震动，并在倒计时结束后崩塌。'}</p><div>{currentEvidence.map((item) => <span className={collected.includes(item.id) ? 'done' : ''} key={item.id}>{collected.includes(item.id) ? '✓' : '□'} {item.label}</span>)}</div></aside>
      {hapticAvailable === false && <span className="gu-haptic-status">当前预览仅显示震屏；手机触觉震动需在 evomeme 平台内体验。</span>}
      {mode === 'walk' && closeTarget && <button className="gu-interact" onClick={() => interactRef.current(nearby!)}><span>{closeTarget}</span><b>{nearby === 'exit' && !allCollected ? '尚未解锁' : '调查 E ↗'}</b></button>}
      <div className="gu-controls" onPointerLeave={() => { direction.current = 0; }}><button onPointerDown={press(-1)} onPointerUp={() => { direction.current = 0; }} onPointerCancel={() => { direction.current = 0; }}>←</button><button onPointerDown={press(1)} onPointerUp={() => { direction.current = 0; }} onPointerCancel={() => { direction.current = 0; }}>→</button></div>
      <div className="gu-collapse-shade"/>
    </>
    {mode === 'dialogue' && line && <div className={`gu-dialogue voice-${line.speaker}`}>
      {cast[line.speaker].portrait ? <img className="vn-bust" src={`./art-test/${cast[line.speaker].portrait}-portrait.png`} alt="" draggable={false}/> : <div className="vn-bust gu-portrait-fallback"><BlockFigure name="" kind={line.speaker}/></div>}
      <div className="gu-dialogue-box"><div className="gu-name"><small>{stageNames[stage]}</small><strong>{cast[line.speaker].name}</strong><span>{cast[line.speaker].role}</span><i>{String(dialogueIndex + 1).padStart(2, '0')} / {String(dialogue.length).padStart(2, '0')}</i></div><p>{line.text}</p><footer><span>点击继续　·　空间暂停震动</span><button onClick={advanceDialogue}>继续 →</button></footer></div>
    </div>}
    {mode === 'choice' && <section className="gu-choice"><small>真相揭露 · 顾沉</small><h2>你要如何回应他？</h2><button onClick={() => selectResponse('A')}><b>指出他的过错</b><span>你先侵吞财产，又想杀人灭口。你真的觉得自己只是一个被背叛的人吗？</span><i>倾向值 +1</i></button><button onClick={() => selectResponse('B')}><b>承认他受到的伤害</b><span>他确实杀死了你，这件事不能因此被抹去。但你也不能把自己先前的所作所为一并忘掉。</span><i>倾向值 +2</i></button></section>}
    {mode === 'collapsed' && <section className="gu-result"><small>记忆空间崩塌</small><h2>线索还没来得及拼完整</h2><p>顾沉的记忆拒绝继续显现。重新进入这一段，再寻找遗漏的证据。</p><button onClick={() => enterStage(stageRef.current)}>重新进入记忆</button></section>}
    {mode === 'ending' && <section className="gu-result gu-final"><small>顾沉 · 记忆调查完成 · 倾向值 +{affinity}</small><h2>这段记忆暂告一段落</h2><p>顾沉低下头，似乎仍不愿承认自己曾经起过杀心。</p><button onClick={onExit}>回到章节选择</button></section>}
    {mode === 'walk' && <div className="gu-controls-hint">方向键 / A D 移动　·　靠近证据后按 E　·　收齐证据后从左侧出口离开</div>}
  </section>;
}

function BlockFigure({ name, kind }: { name: string; kind: string }) {
  return <div className={`gu-figure figure-${kind}`}><i/><b/>{name && <span>{name}</span>}</div>;
}

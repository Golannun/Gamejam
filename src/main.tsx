import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type GhostId = 'lin' | 'jin' | 'gu';
type Phase = 'menu' | 'settings' | 'diary' | 'prologue' | 'explore' | 'vote' | 'ending';
type Config = {
  ui_background?: { value: string };
  ui_panel?: { value: string };
  ui_accent?: { value: string };
  ui_text?: { value: string };
  move_speed?: { value: number };
};
type DialogueLine = { speaker: 'mengpo' | 'npc'; text: string };
type Person = { id: GhostId; name: string; role: string; dialogue: DialogueLine[] };
type VoiceId = 'mengpo' | GhostId;
type StoryLine = { speaker: VoiceId; text: string };

const diaryText = '我是新上任的孟婆。\n\n每天，我守在忘川边，替凡人盛一碗孟婆汤，送他们过桥投胎。有人哭喊，有人不舍，也有人记不起自己为何而来。我听过许多故事，却不觉得那些回忆与我有关。\n\n生离死别对凡人是一生，对神明却只是寻常一日。我的差事并不难，只是汤要熬，名册要记，亡魂要一一引渡——简单而繁琐。\n\n前任孟婆留下的孟婆汤，好像只剩下两碗了。希望明天的工作不要出岔子。';

const prologueLines: StoryLine[] = [
  { speaker: 'mengpo', text: '三位先别争。我刚刚清点过汤锅，孟婆汤只剩下两碗了。' },
  { speaker: 'mengpo', text: '你们之中只能有一人保留前世记忆；另外两人必须饮汤，忘却前尘后投胎。' },
  { speaker: 'jin', text: '（金万山低头掩住笑意，小声盘算。）只剩两碗……那岂不是有人能保住记忆？' },
  { speaker: 'lin', text: '真的？那我就不用忘记女儿了！我还能接着找她！' },
  { speaker: 'gu', text: '（顾沉的指节攥得发白。）要我忘了仇人？绝不可能。' },
  { speaker: 'lin', text: '我找了女儿这么多年，好不容易才有再见她的希望。我比谁都应该留下记忆。' },
  { speaker: 'jin', text: '我一生的财富都藏在一个只有我知道的地方，当然该由我保留记忆。' },
  { speaker: 'gu', text: '朋友背叛我、害死我。这笔账必须由我亲自讨回来。' },
  { speaker: 'mengpo', text: '既然如此，你们三人就各自讲一讲自己的人生经历。之后再投票，选出唯一能保留记忆的人。' },
];

const voteLines: StoryLine[] = [
  { speaker: 'mengpo', text: '三位都已说完。现在请各自投出一票，选出最应该保留前世记忆的人。' },
  { speaker: 'lin', text: '我投给自己。我不能忘记女儿。' },
  { speaker: 'jin', text: '我投给自己。我的财宝不能落到旁人手里。' },
  { speaker: 'gu', text: '我投给自己。我要记住那个背叛我的人。' },
  { speaker: 'mengpo', text: '三个人，各投给自己。一人一票……居然平票了吗，真是麻烦。' },
];

const voiceMeta: Record<VoiceId, { name: string; role: string; portrait: string }> = {
  mengpo: { name: '小孟婆', role: '新任引渡人', portrait: 'mengpo' },
  lin: { name: '林秀', role: '寻女的母亲', portrait: 'lin' },
  jin: { name: '金万山', role: '藏财的商人', portrait: 'jin' },
  gu: { name: '顾沉', role: '死于背叛的人', portrait: 'gu' },
};

const people: Person[] = [
  { id: 'lin', name: '林秀', role: '寻女的母亲', dialogue: [
    { speaker: 'mengpo', text: '（小孟婆看了看她手中的旧照片。）你最放不下的是什么？' },
    { speaker: 'npc', text: '女儿小时候走失了。我找了很多年，怎么也不想忘。' },
    { speaker: 'mengpo', text: '若还有机会，你仍想带着这段记忆去找她？' },
    { speaker: 'npc', text: '只要我还记得她，下一世就还有机会找到她。' },
  ] },
  { id: 'jin', name: '金万山', role: '藏财的商人', dialogue: [
    { speaker: 'mengpo', text: '（小孟婆转向衣着讲究的商人。）你又在惦记什么？' },
    { speaker: 'npc', text: '我把毕生积攒的财宝藏在一个隐秘地方，不能就这样忘了。' },
    { speaker: 'mengpo', text: '要是忘了藏宝地点，那些财宝就不再属于你了？' },
    { speaker: 'npc', text: '那是我一生的心血。凭什么一碗汤下去，就要我拱手让人？' },
  ] },
  { id: 'gu', name: '顾沉', role: '死于背叛的人', dialogue: [
    { speaker: 'mengpo', text: '（小孟婆察觉他一直攥紧着拳头。）你心里还压着一件事。' },
    { speaker: 'npc', text: '我被最信任的朋友背叛，事业和性命都毁在他手里。' },
    { speaker: 'mengpo', text: '所以你想保留记忆，找到那个人？' },
    { speaker: 'npc', text: '我要记住那张脸。只要有机会，我一定要讨回公道。' },
  ] },
];

function BridgeWorld({ speed, backgroundColor, heardCount, nearby, blocked, npcsSpread, onNearby, onTalk }: { speed: number; backgroundColor: string; heardCount: number; nearby: GhostId | null; blocked: boolean; npcsSpread: boolean; onNearby: (id: GhostId | null) => void; onTalk: (id: GhostId) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const direction = useRef(0);
  const position = useRef(310);
  const nearbyRef = useRef<GhostId | null>(null);
  const speedRef = useRef(speed);
  const blockedRef = useRef(blocked);
  const callbacks = useRef({ onNearby, onTalk });
  const [size, setSize] = useState({ width: 0, height: 0 });
  speedRef.current = speed;
  blockedRef.current = blocked;
  callbacks.current = { onNearby, onTalk };
  const person = people.find((entry) => entry.id === nearby);
  const groundY = size.height * 0.74;
  const ghostX: Record<GhostId, number> = npcsSpread
    ? { lin: 600, jin: 720, gu: 840 }
    : { lin: 430, jin: 540, gu: 650 };
  const ghostPositions = useRef(ghostX);
  ghostPositions.current = ghostX;

  useEffect(() => {
    const hostNode = host.current;
    if (!hostNode) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(hostNode);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const pressed = new Set<string>();
    const leftKeys = new Set(['a', 'arrowleft']);
    const rightKeys = new Set(['d', 'arrowright']);
    const updateDirection = () => {
      const left = [...pressed].some((key) => leftKeys.has(key));
      const right = [...pressed].some((key) => rightKeys.has(key));
      direction.current = blockedRef.current || left === right ? 0 : left ? -1 : 1;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (leftKeys.has(key) || rightKeys.has(key)) {
        pressed.add(key);
        updateDirection();
        event.preventDefault();
      } else if (!event.repeat && !blockedRef.current && (key === 'e' || key === ' ')) {
        const target = nearbyRef.current;
        if (target) callbacks.current.onTalk(target);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      pressed.delete(event.key.toLowerCase());
      updateDirection();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let frame = 0;
    let previousTime = 0;
    const animate = (time: number) => {
      const elapsed = previousTime === 0 ? 0 : Math.min(48, time - previousTime);
      previousTime = time;
      if (player.current && world.current && host.current) {
        if (blockedRef.current) direction.current = 0;
        position.current = Math.max(38, Math.min(1362, position.current + direction.current * speedRef.current * elapsed / 1000));
        const viewportWidth = host.current.clientWidth;
        const cameraX = Math.max(0, Math.min(1400 - viewportWidth, position.current - viewportWidth * 0.35));
        player.current.style.left = `${position.current}px`;
        if (direction.current !== 0) {
          player.current.style.transform = `translateX(-50%) scaleX(${direction.current < 0 ? -1 : 1})`;
        }
        player.current.classList.toggle('walking', direction.current !== 0);
        world.current.style.transform = `translate3d(${-cameraX}px,0,0)`;
        const nearest = (Object.entries(ghostPositions.current) as Array<[GhostId, number]>)
          .map(([id, x]) => ({ id, distance: Math.abs(x - position.current) }))
          .filter((ghost) => ghost.distance < 92)
          .sort((a, b) => a.distance - b.distance)[0]?.id ?? null;
        if (nearest !== nearbyRef.current) {
          nearbyRef.current = nearest;
          callbacks.current.onNearby(nearest);
        }
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const move = (value: -1 | 0 | 1) => { direction.current = blockedRef.current ? 0 : value; };
  const prevent = (event: React.PointerEvent) => event.preventDefault();
  return <>
    <div className="world-viewport" ref={host} aria-label="奈何桥横版场景">
      <div className="world-layer" ref={world} style={{ width: 1400, backgroundColor }}>
        <div className="bridge-upper" style={{ height: groundY }} />
        <div className="bridge-lower" style={{ top: groundY }} />
        {people.map((entry) => <div className={`world-ghost ghost-${entry.id} ${npcsSpread ? 'npc-settled' : 'npc-gathered'}`} key={entry.id} style={{ left: ghostX[entry.id] }}>
          <span className="ghost-label">{entry.name}</span>
          <img className="ghost-sprite" src={`./art-test/${entry.id}-standing.png`} alt="" draggable={false}/>
        </div>)}
        <div className="world-player" ref={player}>
          <i className="player-sprite"/>
        </div>
      </div>
    </div>
    <div className="walk-hud"><span className="hud-mark"/>第一章 <b>两碗孟婆汤</b><small>已交谈 {heardCount} / 3</small></div>
    <div className="world-hint">A / D 或 ← → 移动　·　靠近亡魂后按 E 交谈{person ? `　·　${person.name}` : ''}</div>
    <div className="touch-controls" onPointerLeave={() => move(0)}>
      <button className="move-button" aria-label="向左移动" onPointerDown={(event) => { prevent(event); event.currentTarget.setPointerCapture(event.pointerId); move(-1); }} onPointerUp={() => move(0)} onLostPointerCapture={() => move(0)}>←</button>
      <button className="move-button" aria-label="向右移动" onPointerDown={(event) => { prevent(event); event.currentTarget.setPointerCapture(event.pointerId); move(1); }} onPointerUp={() => move(0)} onLostPointerCapture={() => move(0)}>→</button>
    </div>
    {person && <div className="nearby-prompt"><span>{person.name} · {person.role}</span><button className="primary interact-button" onClick={() => callbacks.current.onTalk(person.id)}>交谈 <b>E</b></button></div>}
  </>;
}

function VisualNovelDialogue({ line, index, total, onAdvance }: { line: StoryLine; index: number; total: number; onAdvance: () => void }) {
  const voice = voiceMeta[line.speaker];
  return <div className={`vn-dialogue voice-${line.speaker}`}>
    <img className="vn-bust" src={`./art-test/${voice.portrait}-portrait.png`} alt="" draggable={false}/>
    <div className="vn-box">
      <div className="vn-nameplate"><span className="eyebrow">奈何桥 · 对话</span><strong>{voice.name}</strong><small>{voice.role}</small><span className="dialogue-count">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span></div>
      <p className="vn-text">{line.text}</p>
      <div className="vn-footer"><span>点击继续</span><button className="primary" onClick={onAdvance}>继续 <b>→</b></button></div>
    </div>
  </div>;
}

function App() {
  const [config, setConfig] = useState<Config>({});
  const [phase, setPhase] = useState<Phase>('menu');
  const [speed, setSpeed] = useState(230);
  const [nearby, setNearby] = useState<GhostId | null>(null);
  const [speaker, setSpeaker] = useState<GhostId | null>(null);
  const [dialoguePage, setDialoguePage] = useState(0);
  const [heard, setHeard] = useState<GhostId[]>([]);
  const [diaryVisible, setDiaryVisible] = useState(0);
  const [prologueIndex, setPrologueIndex] = useState(0);
  const [voteIndex, setVoteIndex] = useState(0);
  const [npcsSpread, setNpcsSpread] = useState(false);

  const diaryCharacters = Array.from(diaryText);

  useEffect(() => {
    fetch('./config.json').then((response) => response.json()).then((loaded: Config) => {
      setConfig(loaded);
      const saved = localStorage.getItem('wangchuan.moveSpeed');
      setSpeed(saved ? Number(saved) : loaded.move_speed?.value ?? 230);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (phase !== 'diary' || diaryVisible >= diaryCharacters.length) return;
    const timer = window.setTimeout(() => setDiaryVisible((visible) => visible + 1), 34);
    return () => window.clearTimeout(timer);
  }, [phase, diaryVisible, diaryCharacters.length]);

  const palette = {
    '--bg': config.ui_background?.value ?? '#17161d',
    '--panel': config.ui_panel?.value ?? '#24232c',
    '--accent': config.ui_accent?.value ?? '#e3b86f',
    '--ink': config.ui_text?.value ?? '#f3eee5',
  } as React.CSSProperties;
  const currentPerson = people.find((person) => person.id === speaker);
  const dialogueLines = currentPerson?.dialogue ?? [];
  const interviewLine = dialogueLines[dialoguePage];
  const activeLine: StoryLine | undefined = phase === 'prologue'
    ? prologueLines[prologueIndex]
    : phase === 'vote'
      ? voteLines[voteIndex]
      : phase === 'explore' && interviewLine
        ? { speaker: interviewLine.speaker === 'npc' ? speaker! : 'mengpo', text: interviewLine.text }
        : undefined;

  const beginGame = () => {
    setDiaryVisible(0);
    setPrologueIndex(0);
    setVoteIndex(0);
    setHeard([]);
    setNearby(null);
    setSpeaker(null);
    setNpcsSpread(false);
    setPhase('diary');
  };

  const startConversation = (id: GhostId) => {
    setSpeaker(id);
    setDialoguePage(0);
  };
  const advanceConversation = () => {
    if (!speaker || !currentPerson) return;
    if (dialoguePage < currentPerson.dialogue.length - 1) { setDialoguePage((page) => page + 1); return; }
    if (speaker && !heard.includes(speaker)) setHeard((previous) => [...previous, speaker]);
    setSpeaker(null);
    setDialoguePage(0);
  };
  const advanceStory = () => {
    if (phase === 'prologue') {
      if (prologueIndex < prologueLines.length - 1) setPrologueIndex((index) => index + 1);
      else { setNpcsSpread(true); setPhase('explore'); }
    } else if (phase === 'vote') {
      if (voteIndex < voteLines.length - 1) setVoteIndex((index) => index + 1);
      else setPhase('ending');
    } else advanceConversation();
  };
  const continueDiary = () => {
    if (diaryVisible < diaryCharacters.length) setDiaryVisible(diaryCharacters.length);
    else { setPrologueIndex(0); setPhase('prologue'); }
  };
  const updateSpeed = (value: number) => {
    setSpeed(value);
    localStorage.setItem('wangchuan.moveSpeed', String(value));
  };

  return <main className="app" style={palette}>
    {phase === 'menu' && <section className="menu-screen">
      <div className="menu-copy"><div className="eyebrow">忘川 · 第一章</div><h1>忘川录</h1><p className="subtitle">两碗孟婆汤</p><p className="menu-description">奈何桥上，三位亡魂等着转世。<br/>锅中剩下的汤，只够两个人喝。</p><div className="menu-actions"><button className="primary menu-primary" onClick={beginGame}>开始游戏 <span>→</span></button><button className="quiet-button" onClick={() => setPhase('settings')}>设置 <span>＋</span></button></div><div className="menu-controls">横屏游玩　·　键盘 / 触屏移动</div></div>
      <div className="menu-block-scene" aria-hidden="true"><div className="menu-slab slab-one"/><div className="menu-slab slab-two"/><div className="menu-slab slab-three"/><div className="menu-player"><i/><b/></div><span>奈何桥</span></div>
      <div className="menu-corner">WANGCHUAN CHRONICLES <b>·</b> PROTOTYPE</div>
    </section>}

    {phase === 'settings' && <section className="subpage"><div className="eyebrow">设置 / SETTINGS</div><h2>游玩设置</h2><div className="setting-row"><div><strong>移动速度</strong><small>调整小孟婆在奈何桥上的行走速度</small></div><output>{speed}</output><input aria-label="移动速度" type="range" min="120" max="360" step="10" value={speed} onChange={(event) => updateSpeed(Number(event.target.value))}/></div><div className="setting-help"><b>操作方式</b><span>电脑：A / D 或方向键移动，E 或空格交谈</span><span>手机：按住左右方块行走，靠近亡魂后点击“交谈”</span></div><button className="secondary-button" onClick={() => setPhase('menu')}>返回主页面</button></section>}

    {phase === 'diary' && <section className="diary-screen">
      <div className="diary-sheet"><div className="diary-heading"><span className="eyebrow">忘川值事录 · 第一日</span><span>新任孟婆手记</span></div><div className="diary-copy">{diaryCharacters.slice(0, diaryVisible).join('')}{diaryVisible < diaryCharacters.length && <i className="diary-caret"/>}</div><div className="diary-footer"><span>{diaryVisible < diaryCharacters.length ? '墨迹未干……' : '手记已毕'}</span><button className="primary" onClick={continueDiary}>{diaryVisible < diaryCharacters.length ? '显示全部文字' : '走上奈何桥'} <span>→</span></button></div></div>
    </section>}

    {(['prologue', 'explore', 'vote'] as Phase[]).includes(phase) && <section className="explore-screen">
      <BridgeWorld speed={speed} backgroundColor={config.ui_background?.value ?? '#17161d'} heardCount={heard.length} nearby={nearby} blocked={phase !== 'explore' || Boolean(speaker)} npcsSpread={npcsSpread} onNearby={setNearby} onTalk={startConversation}/>
      {phase === 'explore' && <aside className="quest-tracker"><span className="eyebrow">本章目标</span><strong>听听三位亡魂的故事</strong><p>请和林秀、金万山、顾沉分别对话，了解他们的人生经历。</p><ul>{people.map((person) => <li className={heard.includes(person.id) ? 'complete' : ''} key={person.id}><i/>{person.name}<span>{heard.includes(person.id) ? '已了解' : '待交谈'}</span></li>)}</ul></aside>}
      {phase === 'explore' && heard.length === 3 && !speaker && <button className="call-vote" onClick={() => { setVoteIndex(0); setPhase('vote'); }}>三人都已陈述　·　开始投票 <span>→</span></button>}
      {phase === 'prologue' && activeLine && <VisualNovelDialogue line={activeLine} index={prologueIndex} total={prologueLines.length} onAdvance={advanceStory}/>}
      {phase === 'explore' && speaker && currentPerson && activeLine && <VisualNovelDialogue line={activeLine} index={dialoguePage} total={dialogueLines.length} onAdvance={advanceStory}/>}
      {phase === 'vote' && activeLine && <VisualNovelDialogue line={activeLine} index={voteIndex} total={voteLines.length} onAdvance={advanceStory}/>}
    </section>}

    {phase === 'ending' && <section className="chapter-end"><div className="end-seal">忘川</div><h2>第一章终了</h2><span className="end-rule"/><button className="ending-return" onClick={() => setPhase('menu')}>返回标题</button></section>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);

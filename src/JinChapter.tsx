import { useEffect, useRef, useState } from 'react';
import './jin.css';

type SceneId = 'home' | 'cave' | 'bridge';
type Speaker = 'mengpo' | 'jin' | 'evil';
type Line = { speaker: Speaker; text: string };
type Clue = { id: string; name: string; description: string };
type Prop = { id: string; label: string; kind: string; x: number; y: number; clue?: Clue; lines: Line[] };
type Tile = { x: number; y: number };
const GRID_COLUMNS = 20;
const GRID_ROWS = 12;
type Facing = 'left' | 'right' | 'up' | 'down';
const art = './chapter-three';
const propArt: Record<string, string> = {
  stove: 'room/cold-stove-and-rice-jar',
  ledger: 'room/debt-ledger',
  book: 'room/book-stand-arrangement',
  altar: 'cave/altar-coin',
  marks: 'cave/wall-marks',
  register: 'cave/offering-register',
  gate: 'room/right-door',
};
const roomArt = [
  { name: 'window-curtains', x: 3, y: 4, width: 23 },
  { name: 'book-cabinet', x: 30, y: 6, width: 24 },
  { name: 'coin-wall-banner', x: 56, y: 8, width: 4 },
  { name: 'bed', x: 73, y: 7, width: 20 },
  { name: 'sideboard', x: 3, y: 24, width: 14 },
  { name: 'small-potted-plant', x: 65, y: 17, width: 4 },
  { name: 'rug-bed', x: 76, y: 31, width: 15 },
  { name: 'window-light', x: 76, y: 62, width: 22 },
  { name: 'rug-main', x: 31, y: 78, width: 36 },
  { name: 'main-desk', x: 38, y: 88, width: 23 },
  { name: 'table-lamp', x: 56, y: 80, width: 4 },
  { name: 'loose-pages', x: 41, y: 89, width: 5 },
  { name: 'abacus', x: 48, y: 89, width: 5 },
  { name: 'low-bench', x: 71, y: 92, width: 14 },
  { name: 'coin-chest-arrangement', x: 2, y: 83, width: 14 },
  { name: 'tall-potted-plant', x: 1, y: 61, width: 6 },
  { name: 'folding-screen', x: 94, y: 12, width: 6 },
  { name: 'vines-top-left', x: 0, y: 0, width: 26 },
  { name: 'vines-top-right', x: 80, y: 0, width: 20 },
  { name: 'foreground-coins-left', x: 0, y: 88, width: 9 },
  { name: 'foreground-coins-right', x: 91, y: 88, width: 9 },
];

const cast: Record<Speaker, { name: string; role: string; portrait: string }> = {
  mengpo: { name: '小孟婆', role: '新任引渡人', portrait: 'mengpo' },
  jin: { name: '金万山', role: '记忆中的商人', portrait: 'jin' },
  evil: { name: '邪神', role: '契约之主', portrait: 'jin' },
};

const arrivalLines: Line[] = [
  { speaker: 'mengpo', text: '金万山年轻的时候……就是住在这样的地方吗？比我想的还要简陋。' },
  { speaker: 'mengpo', text: '屋顶漏雨，灶台也是冷的。他当时一定很想改变自己的处境吧。' },
];
const jinLeavesLines: Line[] = [
  { speaker: 'jin', text: '我受够这样的日子了。做再多苦工，也只够勉强填饱肚子。' },
  { speaker: 'jin', text: '那本书说得是真的吗？只要照着仪式做，就能得到我想要的一切……' },
  { speaker: 'jin', text: '去后山的山洞看看。无论如何，我都要试一试。' },
];
const caveArrivalLines: Line[] = [
  { speaker: 'mengpo', text: '洞里残留着香灰，还有一股散不去的腥甜气味。这里就是他第一次举行仪式的地方。' },
];
const truthLines: Line[] = [
  { speaker: 'mengpo', text: '金万山，你为了财富，把别人的性命当成了祭品。如今你已经死了，还想着继续这场交易？' },
  { speaker: 'jin', text: '我也是没有办法！我若是违约，下一世就会遭受惩罚！' },
];
const leaveLines: Line[] = [{ speaker: 'mengpo', text: '是时候回去了。这里的记忆已经看完了。' }];
const revisitLines: Line[] = [{ speaker: 'mengpo', text: '还是再调查一下吧。也许还有什么细节，是我刚才没有留意到的。' }];
const responseLines: Record<1 | 2, Line[]> = {
  1: [
    { speaker: 'mengpo', text: '你明明知道会伤害无辜的人，却还是一次次献祭。难道你从来没有想过停止吗？' },
    { speaker: 'jin', text: '停止？我付出了那么多，怎么可能说停就停！而且……我若是停止，之前的一切不就都白费了？' },
  ],
  2: [
    { speaker: 'mengpo', text: '你害怕契约带来的惩罚，我能理解。但你不能为了保全自己，就把别人的性命交出去。' },
    { speaker: 'jin', text: '我……我只是想活得好一些。谁知道最后会变成这样？' },
  ],
};

const props: Record<'home' | 'cave', Prop[]> = {
  home: [
    { id: 'cold-stove', label: '冷灶台', kind: 'stove', x: 4, y: 7, clue: { id: 'hunger', name: '空米缸', description: '米缸见底，灶台冰冷。年轻的金万山曾为一顿饱饭发愁。' }, lines: [
      { speaker: 'mengpo', text: '灶台已经冷透了，米缸里也只剩几粒米。' },
      { speaker: 'jin', text: '那时候，我连明天有没有饭吃都不知道。穷怕了的人，总想抓住一个翻身的机会。' },
    ] },
    { id: 'debt-ledger', label: '欠账簿', kind: 'ledger', x: 9, y: 4, clue: { id: 'debts', name: '欠账簿', description: '几笔生意都赔了钱，账目旁写着催债的日期。' }, lines: [
      { speaker: 'mengpo', text: '账上写满了欠款，还有几处催债的记号。' },
      { speaker: 'jin', text: '我试过正经做生意，可每一次都差一点。机会从来不肯等穷人。' },
      { speaker: 'mengpo', text: '贫困能解释他的急切，却不能替他后来做下的事开脱。' },
    ] },
    { id: 'old-book', label: '古书', kind: 'book', x: 14, y: 6, clue: { id: 'book', name: '邪术古书', description: '古书记载着借寿换财的禁忌仪式：献上祭品，便能换取想要的一切。' }, lines: [
      { speaker: 'mengpo', text: '一本来历不明的古书，纸页上写着“借寿换财”。' },
      { speaker: 'jin', text: '只要献上合适的祭品，就能得到想要的一切？' },
      { speaker: 'jin', text: '我那时只当是个荒唐传说……可还是决定试一试。' },
      { speaker: 'mengpo', text: '借别人的寿命换来财富与寿命。他第一次翻开这本书时，应该还没想过自己会走到哪一步。' },
    ] },
  ],
  cave: [
    { id: 'altar', label: '祭坛铜钱', kind: 'altar', x: 10, y: 5, clue: { id: 'coin', name: '祭祀铜钱', description: '第一次仪式用过的铜钱。后来，祭坛上堆起了越来越多的铜钱。' }, lines: [
      { speaker: 'mengpo', text: '祭坛中央压着一枚铜钱。周围的符痕已经褪色，但仪式留下的气息仍在。' },
      { speaker: 'jin', text: '原来是真的……仪式之后，我的生意真的开始好转了！' },
      { speaker: 'evil', text: '你想得到更多？' },
      { speaker: 'jin', text: '我还想要更多财富，还想活得更久！' },
      { speaker: 'evil', text: '那么，就献上更多祭品。' },
      { speaker: 'mengpo', text: '他得到了第一次回应，却把它当成了继续索取的理由。' },
    ] },
    { id: 'wall-marks', label: '石壁刻痕', kind: 'marks', x: 5, y: 3, clue: { id: 'marks', name: '祭祀刻痕', description: '石壁上层层叠叠的日期，记录着仪式持续了许多年。' }, lines: [
      { speaker: 'mengpo', text: '石壁上刻着许多日期，有些已经被新刻痕覆盖。' },
      { speaker: 'jin', text: '只要还有祭品，我就能得到更多……我已经付出了这么多，怎么能停？' },
      { speaker: 'mengpo', text: '他不再只是想摆脱贫困，而是开始害怕失去已经得到的一切。' },
    ] },
    { id: 'name-register', label: '献祭名册', kind: 'register', x: 15, y: 7, clue: { id: 'register', name: '献祭名册', description: '密密麻麻的姓名与祭祀日期，证明这不是一次偶然的尝试。' }, lines: [
      { speaker: 'mengpo', text: '名册上写满了姓名。每一个名字，都对应着一次献祭。' },
      { speaker: 'jin', text: '这些年付出了这么多，总算没有白费。' },
      { speaker: 'evil', text: '你这一世的交易即将结束，但契约不会随你的死亡消失。转世之后，你仍须继续供奉。' },
      { speaker: 'jin', text: '若我忘记仪式呢？' },
      { speaker: 'evil', text: '那便是违约。你欠下的债，自会向你讨还。' },
      { speaker: 'jin', text: '我明白了……我不能忘记。' },
      { speaker: 'mengpo', text: '原来他执意保留记忆，不只是为了财宝，也是为了记住这份契约。' },
    ] },
  ],
};
const clueById: Record<string, Clue> = Object.fromEntries(Object.values(props).flatMap((scene) => scene.flatMap((prop) => prop.clue ? [[prop.clue.id, prop.clue]] : [])));

export default function JinChapter({ onExit }: { onExit: () => void }) {
  const [scene, setScene] = useState<SceneId>('home');
  const [position, setPosition] = useState<Tile>({ x: 16, y: 8 });
  const [facing, setFacing] = useState<Facing>('left');
  const [walkFrame, setWalkFrame] = useState<number | null>(null);
  const nextWalkFrame = useRef(0);
  const stopWalkTimer = useRef<number | null>(null);
  const [jinPosition, setJinPosition] = useState<Tile>({ x: 17, y: 7 });
  const [jinVisible, setJinVisible] = useState(true);
  const [introActive, setIntroActive] = useState(true);
  const [inventory, setInventory] = useState<string[]>([]);
  const [examined, setExamined] = useState<string[]>([]);
  const [dialogue, setDialogue] = useState<Line[] | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [leaveOptions, setLeaveOptions] = useState(false);
  const [surveyComplete, setSurveyComplete] = useState(false);
  const [bridgeFinished, setBridgeFinished] = useState(false);
  const [bridgePoints, setBridgePoints] = useState<1 | 2>(1);
  const [nearProp, setNearProp] = useState<Prop | null>(null);
  const finishAction = useRef<(() => void) | null>(null);
  const nearby = useRef<Prop | null>(null);
  const movementLock = useRef(false);
  const heldKey = useRef('');
  const repeatTimer = useRef<number | null>(null);
  const locked = useRef(true);
  const actionRef = useRef({ step: (_x: number, _y: number) => {}, inspect: (_prop: Prop) => {}, advance: () => {}, toggleInventory: () => {}, exit: () => {} });
  const dialogueRef = useRef(dialogue);
  const currentProps = scene === 'bridge' ? [] : props[scene];
  const completed = examined.filter((id) => currentProps.some((prop) => prop.id === id)).length;
  const sceneDone = completed === currentProps.length;
  const gateOpen = scene === 'home' && sceneDone;
  const exitProp: Prop | null = scene === 'home' ? { id: 'home-exit', label: '山洞入口', kind: 'gate', x: 18, y: 8, lines: [] } : null;

  locked.current = Boolean(introActive || dialogue || inventoryOpen || bridgeFinished);
  dialogueRef.current = dialogue;

  const showDialogue = (lines: Line[], after?: () => void) => {
    finishAction.current = after ?? null;
    setDialogue(lines);
    setDialogueIndex(0);
  };

  const advanceDialogue = () => {
    if (!dialogueRef.current) return;
    if (dialogueIndex < dialogueRef.current.length - 1) setDialogueIndex((index) => index + 1);
    else {
      setDialogue(null);
      const after = finishAction.current;
      finishAction.current = null;
      after?.();
    }
  };

  const inspect = (prop: Prop) => {
    if (locked.current) return;
    if (prop.id === 'home-exit') {
      if (!gateOpen) return;
      nearby.current = null;
      setNearProp(null);
      setScene('cave');
      setPosition({ x: 2, y: 8 });
      showDialogue(caveArrivalLines);
      return;
    }
    const isFirstLook = !examined.includes(prop.id);
    if (isFirstLook) {
      setExamined((old) => [...old, prop.id]);
      if (prop.clue) setInventory((old) => old.includes(prop.clue!.id) ? old : [...old, prop.clue!.id]);
    }
    const allCaveCluesSeen = scene === 'cave' && props.cave.every((entry) => examined.includes(entry.id) || entry.id === prop.id);
    showDialogue(isFirstLook ? prop.lines : [{ speaker: 'mengpo', text: `${prop.label}。${prop.clue ? '线索已经收进背包。' : ''}` }], () => {
      if (allCaveCluesSeen && isFirstLook && !surveyComplete) {
        showDialogue(truthLines, () => { setSurveyComplete(true); setLeaveOptions(true); });
      } else if (surveyComplete && scene === 'cave') setLeaveOptions(true);
    });
  };

  const step = (dx: number, dy: number) => {
    if (locked.current || movementLock.current || scene === 'bridge') return;
    const next = { x: Math.max(1, Math.min(18, position.x + dx)), y: Math.max(2, Math.min(10, position.y + dy)) };
    if (next.x === position.x && next.y === position.y) return;
    if (props[scene].some((prop) => prop.x === next.x && prop.y === next.y)) return;
    if (exitProp && next.x === exitProp.x && next.y === exitProp.y) {
      if (gateOpen) inspect(exitProp);
      return;
    }
    movementLock.current = true;
    setFacing(dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down');
    setWalkFrame(nextWalkFrame.current);
    nextWalkFrame.current = (nextWalkFrame.current + 1) % 4;
    if (stopWalkTimer.current !== null) window.clearTimeout(stopWalkTimer.current);
    stopWalkTimer.current = window.setTimeout(() => setWalkFrame(null), 150);
    setPosition(next);
    window.setTimeout(() => { movementLock.current = false; }, 98);
  };

  const toggleInventory = () => { if (scene !== 'bridge' && !dialogueRef.current && !bridgeFinished) setInventoryOpen((open) => !open); };
  const chooseDeparture = (leave: boolean) => {
    setLeaveOptions(false);
    showDialogue(leave ? leaveLines : revisitLines, () => {
      if (leave) { setScene('bridge'); setBridgeFinished(false); }
    });
  };
  const chooseResponse = (points: 1 | 2) => {
    setBridgePoints(points);
    showDialogue(responseLines[points], () => setBridgeFinished(true));
  };
  const stopMoveRepeat = (key?: string) => {
    if (key && heldKey.current !== key) return;
    heldKey.current = '';
    if (repeatTimer.current !== null) {
      window.clearTimeout(repeatTimer.current);
      window.clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
  };
  const startMoveRepeat = (key: string, dx: number, dy: number) => {
    stopMoveRepeat();
    heldKey.current = key;
    actionRef.current.step(dx, dy);
    repeatTimer.current = window.setTimeout(() => {
      actionRef.current.step(dx, dy);
      repeatTimer.current = window.setInterval(() => actionRef.current.step(dx, dy), 116);
    }, 210);
  };

  actionRef.current = { step, inspect, advance: advanceDialogue, toggleInventory, exit: onExit };

  useEffect(() => {
    const timers: number[] = [];
    const later = (callback: () => void, delay: number) => { timers.push(window.setTimeout(callback, delay)); };
    later(() => { setWalkFrame(0); setPosition({ x: 15, y: 8 }); }, 480);
    later(() => { setWalkFrame(2); setPosition({ x: 14, y: 8 }); }, 720);
    later(() => setWalkFrame(null), 850);
    later(() => showDialogue(arrivalLines, () => showDialogue(jinLeavesLines, () => {
      later(() => setJinPosition({ x: 18, y: 8 }), 240);
      later(() => setJinVisible(false), 630);
      later(() => setIntroActive(false), 670);
    })), 980);
      return () => {
        timers.forEach(window.clearTimeout);
        if (stopWalkTimer.current !== null) window.clearTimeout(stopWalkTimer.current);
      };
  }, []);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const direction: Record<string, Tile> = {
        arrowleft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
        arrowright: { x: 1, y: 0 }, d: { x: 1, y: 0 },
        arrowup: { x: 0, y: -1 }, w: { x: 0, y: -1 },
        arrowdown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
      };
      const move = direction[key];
      if (move) { event.preventDefault(); if (!event.repeat) startMoveRepeat(key, move.x, move.y); }
      else if (!event.repeat && (key === 'e' || key === ' ')) {
        if (dialogueRef.current) actionRef.current.advance();
        else if (!locked.current && nearby.current) actionRef.current.inspect(nearby.current);
      } else if (!event.repeat && (key === 'i' || key === 'b')) actionRef.current.toggleInventory();
      else if (key === 'escape') {
        if (inventoryOpen) setInventoryOpen(false);
        else if (!dialogueRef.current && !bridgeFinished) actionRef.current.exit();
      }
    };
    const keyUp = (event: KeyboardEvent) => stopMoveRepeat(event.key.toLowerCase());
    const blur = () => stopMoveRepeat();
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', blur);
      stopMoveRepeat();
    };
  }, [inventoryOpen, bridgeFinished]);

  useEffect(() => {
    const nearbyProp = [...currentProps, ...(gateOpen && exitProp ? [exitProp] : [])]
      .map((prop) => ({ prop, distance: Math.abs(prop.x - position.x) + Math.abs(prop.y - position.y) }))
      .filter((entry) => entry.distance <= 1)
      .sort((a, b) => a.distance - b.distance)[0]?.prop ?? null;
    nearby.current = nearbyProp;
    setNearProp(nearbyProp);
  }, [position, scene, gateOpen]);

  const tileStyle = (tile: Tile) => ({ left: `${(tile.x + 0.5) * 100 / GRID_COLUMNS}%`, top: `${(tile.y + 0.5) * 100 / GRID_ROWS}%` });
  const sceneName = scene === 'home' ? '金万山的旧居' : scene === 'cave' ? '山洞祭坛' : '奈何桥 · 记忆之后';
  const activeLine = dialogue?.[dialogueIndex];

  return <section className="jin-game">
    <div className="jin-frame">
      {scene !== 'bridge' ? <>
        <div className={`jin-map jin-map-${scene}`} aria-label={`${sceneName}固定格子地图`}>
          {scene === 'home' ? roomArt.map(({ name, x, y, width }) => (
            <img className={`jin-scenery ${name.startsWith('foreground-') || name === 'folding-screen' ? 'jin-foreground' : ''}`} key={name} src={`${art}/room/${name}.png`} style={{ left: `${x}%`, top: `${y}%`, width: `${width}%` }} alt="" draggable={false}/>
          )) : <img className="jin-scenery cave-scatter" src={`${art}/cave/paper-and-coins.png`} alt="" draggable={false}/>}
          {currentProps.map((prop) => <button className={`jin-prop prop-${prop.kind} ${examined.includes(prop.id) ? 'prop-examined' : ''} ${nearProp?.id === prop.id ? 'prop-nearby' : ''}`} style={tileStyle(prop)} key={prop.id} onClick={() => actionRef.current.inspect(prop)} aria-label={`调查${prop.label}`}>
            {prop.kind === 'ledger' && <img className="jin-prop-surface" src={`${art}/room/small-cabinet.png`} alt="" draggable={false}/>}
            <img className="jin-prop-art" src={`${art}/${propArt[prop.kind]}.png`} alt="" draggable={false}/>
            {!examined.includes(prop.id) && <img className="jin-marker" src={`${art}/ui/investigate-marker.png`} alt=""/>}
            <span>{prop.label}</span>
          </button>)}
          {exitProp && <button className={`jin-prop prop-gate ${nearProp?.id === exitProp.id ? 'prop-nearby' : ''}`} style={tileStyle(exitProp)} onClick={() => actionRef.current.inspect(exitProp)} aria-label={exitProp.label}><img className="jin-prop-art" src={`${art}/${propArt.gate}.png`} alt="" draggable={false}/><span>{exitProp.label}</span></button>}
          {scene === 'home' && jinVisible && <div className={`jin-actor jin-young ${jinPosition.x !== 17 ? 'jin-leaving' : ''}`} style={tileStyle(jinPosition)}><img src="./art-test/jin-standing.png" alt="" draggable={false}/><span>金万山（年轻时）</span></div>}
          <div className="jin-actor jin-player" style={tileStyle(position)} aria-label="小孟婆">
            <div className="jin-player-art" style={{
              backgroundImage: `url('${art}/mengpo/${facing}-${walkFrame === null ? 'idle' : 'walk'}.png')`,
              backgroundSize: walkFrame === null ? '100% 100%' : '400% 100%',
              backgroundPosition: walkFrame === null ? '0 0' : `${walkFrame * 100 / 3}% 0`,
            }}/>
          </div>
        </div>
        <header className="jin-hud"><button className="jin-back" onClick={onExit}>← 返回章节</button><div><small>第三章 · 记忆调查</small><strong>{sceneName}</strong></div><button className="jin-bag-button" onClick={() => setInventoryOpen(true)}>背包 <b>{inventory.length}</b></button></header>
        {!leaveOptions && <aside className="jin-objective"><small>调查线索</small><strong>{scene === 'home' ? '他为何走上邪术之路？' : '仪式背后还有什么代价？'}</strong><span>{completed} / {currentProps.length} 已调查</span><div className="objective-dots">{currentProps.map((prop) => <i className={examined.includes(prop.id) ? 'done' : ''} key={prop.id}/>)}</div><p>{scene === 'home' ? '调查屋内三处物件，开启通往山洞的路。' : '调查祭坛、刻痕与名册，还原契约真相。'}</p></aside>}
        {!leaveOptions && <div className="jin-hint">方向键 / WASD 逐格移动　·　E 调查　·　I 背包</div>}
        <div className="jin-controls">{(['left', 'up', 'down', 'right'] as const).map((dir) => {
          const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
          const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
          return <button key={dir} className={`direction-${dir}`} aria-label={dir} onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); startMoveRepeat(`touch-${dir}`, dx, dy); }} onPointerUp={() => stopMoveRepeat(`touch-${dir}`)} onPointerCancel={() => stopMoveRepeat(`touch-${dir}`)} onLostPointerCapture={() => stopMoveRepeat(`touch-${dir}`)} onClick={(event) => { if (event.detail === 0) actionRef.current.step(dx, dy); }}>{dir === 'left' ? '←' : dir === 'right' ? '→' : dir === 'up' ? '↑' : '↓'}</button>;
        })}</div>
        {nearProp && <button className="jin-interact" onClick={() => actionRef.current.inspect(nearProp)}><span>{nearProp.kind === 'gate' ? nearProp.label : `调查 · ${nearProp.label}`}</span><b>E ↗</b></button>}
      </> : <>
        <div className="bridge-memory" aria-label="第一章奈何桥场景">
          <div className="bridge-upper" style={{ height: '74%' }}/><div className="bridge-lower" style={{ top: '74%' }}/>
          <div className="bridge-person bridge-mengpo"><i/><span>小孟婆</span></div>
          <div className="bridge-person bridge-jin"><img src="./art-test/jin-standing.png" alt="" draggable={false}/><span>金万山</span></div>
          <div className="bridge-caption">金万山的记忆已经结束</div>
        </div>
        <header className="bridge-memory-header"><button className="jin-back" onClick={onExit}>← 返回章节</button><span>奈何桥 · 第一章</span></header>
        {!activeLine && !bridgeFinished && <section className="bridge-choice-panel"><small>孟婆汤前 · 最后的回应</small><h2>你会如何回应金万山？</h2><button onClick={() => chooseResponse(1)}><b>质问他</b><span>你明明知道会伤害无辜的人，却还是一次次献祭。</span><i>倾向值 +1</i></button><button onClick={() => chooseResponse(2)}><b>理解他的恐惧</b><span>你害怕契约惩罚，我能理解；但不能把别人的性命交出去。</span><i>倾向值 +2</i></button></section>}
        {bridgeFinished && <section className="bridge-finished"><small>小孟婆的回应 · 倾向值 +{bridgePoints}</small><h2>这段记忆暂告一段落</h2><button onClick={onExit}>返回章节选择</button></section>}
      </>}

      {scene === 'cave' && leaveOptions && !activeLine && <aside className="jin-departure-options"><small>调查完成</small><strong>接下来要？</strong><button onClick={() => chooseDeparture(true)}><b>出去吧</b><span>是时候回去了</span></button><button onClick={() => chooseDeparture(false)}><b>再调查一下</b><span>还是再调查一下吧</span></button></aside>}

      {activeLine && <div className={`vn-dialogue voice-${activeLine.speaker} jin-vn`}>
        <img className="vn-bust" src={`./art-test/${cast[activeLine.speaker].portrait}-portrait.png`} alt="" draggable={false}/>
        <div className="vn-box"><div className="vn-nameplate"><span className="eyebrow">金万山 · 记忆调查</span><strong>{cast[activeLine.speaker].name}</strong><small>{cast[activeLine.speaker].role}</small><span className="dialogue-count">{String(dialogueIndex + 1).padStart(2, '0')} / {String(dialogue?.length ?? 0).padStart(2, '0')}</span></div><p className="vn-text">{activeLine.text}</p><div className="vn-footer"><span>点击继续</span><button className="primary" onClick={advanceDialogue}>继续 <b>→</b></button></div></div>
      </div>}

      {inventoryOpen && <div className="jin-overlay" onClick={() => setInventoryOpen(false)}><section className="inventory-card" onClick={(event) => event.stopPropagation()}><header><div><small>记忆碎片</small><h2>随身线索</h2></div><button onClick={() => setInventoryOpen(false)}>×</button></header>{inventory.length === 0 ? <p className="empty-bag">背包还是空的。调查屋里的方块物件来收集线索。</p> : <div className="clue-list">{inventory.map((id, index) => <article key={id}><b>{String(index + 1).padStart(2, '0')}</b><div><strong>{clueById[id]?.name}</strong><p>{clueById[id]?.description}</p></div></article>)}</div>}<footer><span>{inventory.length} 件线索</span><button onClick={() => setInventoryOpen(false)}>返回探索</button></footer></section></div>}
    </div>
  </section>;
}

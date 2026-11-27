import { useEffect, useRef, useState, type PointerEvent } from 'react';
import './lin-memory.css';

type Speaker = 'mengpo' | 'lin' | 'passerby' | 'host' | 'staff';
type Line = { speaker: Speaker; text: string };
type DialogueKind = 'opening' | 'sceneOneMurmur' | 'sceneOneTalk' | 'sceneTwo' | 'vignette' | 'clue' | 'truth' | 'wait' | 'bridgeArrival' | 'response';
type Mode = 'dialogue' | 'walk' | 'departure' | 'choice' | 'ending';
type Location = 'memory' | 'bridge';
type ClueId = 'photo' | 'poster' | 'files';
type VignetteId = 'searchFailed' | 'mediaInvite' | 'donation' | 'eventFocus';
type TargetId = 'lin' | 'interview' | ClueId | VignetteId;
type Clue = { label: string; x: number; kind: string };
const SCENE_WIDTH = 1800;
const ROAD_WIDTH = 1300;
const SCENE_TWO_START = SCENE_WIDTH + ROAD_WIDTH;
const SCENE_THREE_START = SCENE_TWO_START + SCENE_WIDTH + ROAD_WIDTH;
const MAP_WIDTH = SCENE_THREE_START + SCENE_WIDTH;
const ZONE_WIDTH = SCENE_WIDTH;
const VIEW_WIDTH = 1280;

const cast: Record<Speaker, { name: string; role: string; color: string; clothes: string; portrait?: string }> = {
  mengpo: { name: '小孟婆', role: '新任引渡人', color: '#e6cba8', clothes: '#9e6552', portrait: 'mengpo' },
  lin: { name: '林秀', role: '记忆中的母亲', color: '#d9b69c', clothes: '#65766c', portrait: 'lin' },
  passerby: { name: '路人', role: '街巷行人', color: '#b7a99a', clothes: '#595765' },
  host: { name: '节目主持人', role: '寻亲节目', color: '#dfc9a7', clothes: '#78554f' },
  staff: { name: '工作人员', role: '电话中的声音', color: '#c3b6a3', clothes: '#5b6470' },
};

const openingLines: Line[] = [
  { speaker: 'mengpo', text: '林秀的记忆，从女儿刚走失的时候开始。' },
  { speaker: 'mengpo', text: '沿着这条路往前，我想看看她后来经历了什么。' },
];
const sceneOneMurmur: Line[] = [
  { speaker: 'mengpo', text: '照片被她攥得发皱。她把每一张相似的脸都看得很仔细。' },
  { speaker: 'lin', text: '孩子，你在哪里……你听见妈妈在找你吗？' },
  { speaker: 'mengpo', text: '前面有位路人。林秀又拿起照片，快步追了上去。' },
];
const sceneOneTalk: Line[] = [
  { speaker: 'lin', text: '您好，请问您见过照片上的孩子吗？她那天穿着浅色的外套。' },
  { speaker: 'passerby', text: '抱歉，我没有见过。你别着急，再问问附近的人吧。' },
  { speaker: 'lin', text: '没关系，谢谢您。如果您想起什么，能不能联系我？' },
  { speaker: 'mengpo', text: '她挨家挨户打听，张贴寻人启事，不放过任何一点消息。' },
];
const sceneTwoLines: Line[] = [
  { speaker: 'mengpo', text: '时间又往后走了几年。林秀开始通过媒体和寻亲节目扩大寻找范围。' },
  { speaker: 'host', text: '林女士，节目播出后，很多观众认出了您。有人提供线索，也有人捐款帮助。' },
  { speaker: 'lin', text: '谢谢大家。只要有更多人看见她，我就多一分找到她的希望。' },
  { speaker: 'host', text: '节目结束后，我们还收到新的采访邀约和活动邀请，您愿意继续参加吗？' },
  { speaker: 'lin', text: '当然愿意。我会一直讲下去，只要还有人记得这件事。' },
  { speaker: 'mengpo', text: '起初，她把关注当成寻找女儿的助力。后来，她也渐渐习惯了被众人认出的感觉。' },
];
const clueLines: Record<ClueId, Line[]> = {
  photo: [
    { speaker: 'mengpo', text: '一张旧照片。照片里的女孩笑得很亮，边角已经被反复摩挲得发白。' },
    { speaker: 'lin', text: '我那时候每天都带着她的照片出门。只要有人说见过相似的孩子，我就立刻赶过去。' },
    { speaker: 'mengpo', text: '最初的她，确实没有放弃寻找。' },
  ],
  poster: [
    { speaker: 'mengpo', text: '几张寻亲节目海报。林秀的采访照贴在醒目的位置。' },
    { speaker: 'lin', text: '那段时间，很多人愿意帮我。有人寄来线索，也有人给我路费和捐助。' },
    { speaker: 'mengpo', text: '采访和活动一场接一场地排了下来。寻亲逐渐成了她生活里最重要的事。' },
  ],
  files: [
    { speaker: 'mengpo', text: '资料堆得很高。最下面的几封线索信已经泛黄，旁边却放着最近的采访安排。' },
    { speaker: 'staff', text: '林女士，刚收到一条新的寻人线索。提供者说可能在邻市，您愿意去确认吗？' },
    { speaker: 'lin', text: '最近实在抽不开身，过段时间再说吧。' },
    { speaker: 'staff', text: '那今晚的节目和采访，我先替您确认了。' },
    { speaker: 'lin', text: '好，麻烦你了。' },
    { speaker: 'mengpo', text: '她不再像从前那样立刻核实线索，却仍然积极参加活动、接受采访。' },
  ],
};
const truthLines: Line[] = [
  { speaker: 'mengpo', text: '女儿走失后，林秀曾四处奔走、挨家挨户打听，不放过任何可能的消息。' },
  { speaker: 'mengpo', text: '后来她借助媒体和寻亲节目，得到公众关注、节目报酬和社会捐助。起初，这些帮助确实让她看到了希望。' },
  { speaker: 'mengpo', text: '多年没有结果后，她逐渐失去实际寻找的热情。新的线索被搁置，采访和活动却从未停下。' },
  { speaker: 'mengpo', text: '她并非从未爱过女儿，也不是一开始就想利用女儿。只是后来，她不愿放弃寻亲身份带来的关注、财富和生活。' },
  { speaker: 'mengpo', text: '林秀，你确实一直在寻找女儿。可是这些年，你似乎也渐渐离不开别人对你的关注了。' },
  { speaker: 'lin', text: '我没有……我从来没有想过利用她！' },
];
const responseLines: Record<'A' | 'B', Line[]> = {
  A: [
    { speaker: 'mengpo', text: '我相信你没有忘记女儿。只是这么多年过去，你始终不愿意放弃找到她的希望。' },
    { speaker: 'lin', text: '是啊……只要还能记得她，只要还有机会找到她，我就不想放弃。哪怕转世之后一切都要重新开始，我也想再找她一次。' },
  ],
  B: [
    { speaker: 'mengpo', text: '如果下一世不再有人因为你的寻亲经历而关注你，你还愿意继续寻找吗？' },
    { speaker: 'lin', text: '我当然愿意！可是……这些年一直有人帮我打听消息，也有人愿意听我讲女儿的事。要是没有了这些帮助，光靠我一个人，又怎么找得到她呢？' },
  ],
};
const vignetteMeta: Record<VignetteId, { x: number; label: string; lines: Line[] }> = {
  searchFailed: { x: SCENE_WIDTH + 250, label: '寻人无果', lines: [
    { speaker: 'passerby', text: '这么多天了，还是没有消息吗？' },
    { speaker: 'lin', text: '没有……只要还有一点线索，我就不能停下来。' },
  ] },
  mediaInvite: { x: SCENE_WIDTH + 850, label: '节目邀请', lines: [
    { speaker: 'staff', text: '林女士，我们想邀请您参加一期寻亲节目，通过电视向更多观众介绍您女儿的情况，扩大寻找范围。' },
    { speaker: 'lin', text: '真的吗？那什么时候可以录制？我随时都可以，只要能多一些人帮我找她就好！' },
  ] },
  donation: { x: SCENE_TWO_START + SCENE_WIDTH + 220, label: '节目酬劳与捐助', lines: [
    { speaker: 'staff', text: '林女士，这是本期节目的录制酬劳。另外，还有不少观众给您捐了款，希望能帮您继续寻找女儿。' },
    { speaker: 'lin', text: '这么多……真的太感谢大家了！' },
  ] },
  eventFocus: { x: SCENE_TWO_START + SCENE_WIDTH + 850, label: '活动与线索', lines: [
    { speaker: 'staff', text: '林女士，最近有观众提供了一条疑似您女儿的线索，您要不要抽空去核实一下？' },
    { speaker: 'lin', text: '这几天已经安排了采访和活动，等忙完这阵子再说吧。' },
    { speaker: 'staff', text: '好的。另外，下周还有一场寻亲活动，您愿意继续参加吗？' },
    { speaker: 'lin', text: '当然，麻烦您帮我留个位置。' },
  ] },
};
const waitLines: Line[] = [{ speaker: 'mengpo', text: '再等等。那些线索我已经看过了……只是回到奈何桥后，该怎样面对她，我还得想一想。' }];
const bridgeArrivalLines: Line[] = [
  { speaker: 'mengpo', text: '回到奈何桥了。林秀就在我身边，仍紧紧攥着那张旧照片。' },
  { speaker: 'mengpo', text: '她确实没有忘记女儿。只是这些年，她也渐渐习惯了众人的目光。' },
  { speaker: 'lin', text: '孟婆大人……我没有忘记她。我只是……不知道该怎么继续找下去了。' },
];

const clueMeta: Record<ClueId, Clue> = {
  photo: { label: '女儿旧照片', x: SCENE_THREE_START + 250, kind: 'photo' },
  poster: { label: '寻亲节目海报', x: SCENE_THREE_START + 800, kind: 'poster' },
  files: { label: '积压的寻亲资料', x: SCENE_THREE_START + 1350, kind: 'files' },
};

export default function LinMemoryChapter({
  onExit,
  initialAffinity = 0,
  chaseSpeed = 90,
}: {
  onExit: () => void;
  initialAffinity?: number;
  chaseSpeed?: number;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const playerX = useRef(180);
  const direction = useRef(0);
  const modeRef = useRef<Mode>('dialogue');
  const progressRef = useRef(0);
  const investigatedRef = useRef<ClueId[]>([]);
  const heardVignettesRef = useRef<VignetteId[]>([]);
  const nearbyRef = useRef<TargetId | null>(null);
  const advanceRef = useRef<() => void>(() => {});
  const interactRef = useRef<(id: TargetId) => void>(() => {});
  const timerRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('dialogue');
  const [dialogueKind, setDialogueKind] = useState<DialogueKind>('opening');
  const [dialogue, setDialogue] = useState<Line[]>(openingLines);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [investigated, setInvestigated] = useState<ClueId[]>([]);
  const [heardVignettes, setHeardVignettes] = useState<VignetteId[]>([]);
  const [nearby, setNearby] = useState<TargetId | null>(null);
  const [zoneIndex, setZoneIndex] = useState(0);
  const zoneRef = useRef(0);
  const [linSceneOneX, setLinSceneOneX] = useState(470);
  const [linWalking, setLinWalking] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [location, setLocation] = useState<Location>('memory');
  const chaseDuration = Math.max(1600, Math.round((655 - 470) / Math.max(20, chaseSpeed) * 1000));

  modeRef.current = mode;
  progressRef.current = progress;
  investigatedRef.current = investigated;
  heardVignettesRef.current = heardVignettes;

  const setModeAndRef = (next: Mode) => { modeRef.current = next; setMode(next); };
  const startSequence = (kind: DialogueKind, lines: Line[]) => {
    setTransitioning(false);
    direction.current = 0;
    nearbyRef.current = null;
    setNearby(null);
    setDialogueKind(kind);
    setDialogue(lines);
    setDialogueIndex(0);
    setModeAndRef('dialogue');
  };

  const advanceDialogue = () => {
    if (transitioning) return;
    if (dialogueIndex < dialogue.length - 1) { setDialogueIndex((index) => index + 1); return; }
    if (dialogueKind === 'opening') setModeAndRef('walk');
    else if (dialogueKind === 'sceneOneMurmur') {
      setTransitioning(true);
      setLinSceneOneX(655);
      setLinWalking(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setLinWalking(false);
        startSequence('sceneOneTalk', sceneOneTalk);
      }, chaseDuration);
    } else if (dialogueKind === 'sceneOneTalk') {
      setProgress(1);
      setModeAndRef('walk');
    } else if (dialogueKind === 'sceneTwo') {
      setProgress(2);
      setModeAndRef('walk');
    } else if (dialogueKind === 'vignette') setModeAndRef('walk');
    else if (dialogueKind === 'clue') {
      const allFound = (Object.keys(clueMeta) as ClueId[]).every((id) => investigatedRef.current.includes(id));
      if (allFound) startSequence('truth', truthLines);
      else setModeAndRef('walk');
    } else if (dialogueKind === 'truth') setModeAndRef('departure');
    else if (dialogueKind === 'wait') setModeAndRef('departure');
    else if (dialogueKind === 'bridgeArrival') setModeAndRef('choice');
    else if (dialogueKind === 'response') setModeAndRef('ending');
  };
  advanceRef.current = advanceDialogue;

  const interact = (id: TargetId) => {
    if (modeRef.current !== 'walk') return;
    const vignetteId = (Object.keys(vignetteMeta) as VignetteId[]).find((candidate) => candidate === id);
    if (vignetteId) {
      if (heardVignettesRef.current.includes(vignetteId)) return;
      const nextHeard = [...heardVignettesRef.current, vignetteId];
      heardVignettesRef.current = nextHeard;
      setHeardVignettes(nextHeard);
      startSequence('vignette', vignetteMeta[vignetteId].lines);
    }
    else if (id === 'lin') startSequence('sceneOneMurmur', sceneOneMurmur);
    else if (id === 'interview') startSequence('sceneTwo', sceneTwoLines);
    else {
      const clueId = id as ClueId;
      if (investigatedRef.current.includes(clueId)) return;
      setInvestigated((current) => [...current, clueId]);
      startSequence('clue', clueLines[clueId]);
    }
  };
  interactRef.current = interact;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') { if (modeRef.current === 'walk') { direction.current = -1; event.preventDefault(); } }
      else if (key === 'd' || key === 'arrowright') { if (modeRef.current === 'walk') { direction.current = 1; event.preventDefault(); } }
      else if (!event.repeat && (key === 'e' || key === ' ')) {
        if (modeRef.current === 'dialogue') advanceRef.current();
        else if (modeRef.current === 'walk' && nearbyRef.current) interactRef.current(nearbyRef.current);
      } else if (key === 'escape' && modeRef.current !== 'ending') onExit();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((key === 'a' || key === 'arrowleft') && direction.current < 0) direction.current = 0;
      if ((key === 'd' || key === 'arrowright') && direction.current > 0) direction.current = 0;
    };
    const onBlur = () => { direction.current = 0; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    let frame = 0;
    let previousTime = 0;
    const animate = (time: number) => {
      const elapsed = previousTime === 0 ? 0 : Math.min(48, time - previousTime);
      previousTime = time;
      const viewport = viewportRef.current;
      const world = worldRef.current;
      const player = playerRef.current;
      if (viewport && world && player) {
        if (modeRef.current === 'walk') {
          const stageVignettes: VignetteId[] = progressRef.current === 1 ? ['searchFailed', 'mediaInvite'] : progressRef.current === 2 ? ['donation', 'eventFocus'] : [];
          const nextVignette = stageVignettes.find((id) => !heardVignettesRef.current.includes(id));
          const limit = progressRef.current === 0
            ? SCENE_WIDTH - 70
            : progressRef.current === 1
              ? (nextVignette ? vignetteMeta[nextVignette].x + 112 : SCENE_TWO_START + 650 + 112)
              : progressRef.current === 2
                ? (nextVignette ? vignetteMeta[nextVignette].x + 112 : MAP_WIDTH - 65)
                : MAP_WIDTH - 65;
          playerX.current = Math.max(65, Math.min(limit, playerX.current + direction.current * 225 * elapsed / 1000));
        } else direction.current = 0;
        const scale = viewport.clientWidth / VIEW_WIDTH;
        const cameraX = Math.max(0, Math.min(MAP_WIDTH - VIEW_WIDTH, playerX.current - VIEW_WIDTH * 0.39));
        player.style.left = `${playerX.current}px`;
        player.style.transform = `translateX(-50%) scaleX(${direction.current < 0 ? -1 : 1})`;
        player.classList.toggle('walking', direction.current !== 0);
        world.style.transform = `scale(${scale}) translate3d(${-cameraX}px,0,0)`;
        const zone = playerX.current < SCENE_WIDTH ? 0 : playerX.current < SCENE_TWO_START ? 1 : playerX.current < SCENE_THREE_START ? 2 : playerX.current < SCENE_THREE_START + SCENE_WIDTH ? 3 : 4;
        if (zone !== zoneRef.current) { zoneRef.current = zone; setZoneIndex(zone); }
        const stageVignettes: VignetteId[] = progressRef.current === 1 ? ['searchFailed', 'mediaInvite'] : progressRef.current === 2 ? ['donation', 'eventFocus'] : [];
        const nextVignette = stageVignettes.find((id) => !heardVignettesRef.current.includes(id));
        const targets: Array<{ id: TargetId; x: number }> = progressRef.current === 0
          ? [{ id: 'lin', x: 500 }]
          : progressRef.current === 1
            ? nextVignette ? [{ id: nextVignette, x: vignetteMeta[nextVignette].x }] : [{ id: 'interview', x: SCENE_TWO_START + 650 }]
            : progressRef.current === 2 && nextVignette
              ? [{ id: nextVignette, x: vignetteMeta[nextVignette].x }]
              : (Object.entries(clueMeta) as Array<[ClueId, Clue]>)
                .filter(([id]) => !investigatedRef.current.includes(id))
                .map(([id, clue]) => ({ id, x: clue.x }));
        const near = targets.map((target) => ({ ...target, distance: Math.abs(playerX.current - target.x) }))
          .filter((target) => target.distance <= 112)
          .sort((left, right) => left.distance - right.distance)[0]?.id ?? null;
        if (near !== nearbyRef.current) { nearbyRef.current = near; setNearby(near); }
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [onExit]);

  const pressMove = (value: -1 | 1) => (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (modeRef.current !== 'walk') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    direction.current = value;
  };
  const releaseMove = () => { direction.current = 0; };
  const chooseResponse = (choice: 'A' | 'B') => {
    setScore(choice === 'A' ? 2 : 1);
    startSequence('response', responseLines[choice]);
  };
  const chooseDeparture = (leave: boolean) => {
    if (!leave) {
      startSequence('wait', waitLines);
      return;
    }
    setLocation('bridge');
    startSequence('bridgeArrival', bridgeArrivalLines);
  };
  const activeLine = dialogue[dialogueIndex];
  const zoneNames = ['街巷 · 女儿刚走失', '记忆碎片之路', '寻亲节目 · 公众关注', '记忆碎片之路', '旧居与办公室 · 未拆的信'];
  const progressTitle = progress === 0 ? '记忆片段一 · 寻找刚刚开始' : progress === 1 ? '记忆片段二 · 镜头前的林秀' : '记忆片段三 · 没有拆开的线索';
  const nearbyLabel = nearby === 'lin' ? '记忆中的林秀'
    : nearby === 'interview' ? '寻亲节目片段'
      : nearby && (Object.keys(vignetteMeta) as VignetteId[]).includes(nearby as VignetteId) ? vignetteMeta[nearby as VignetteId].label
        : nearby ? clueMeta[nearby as ClueId].label : '';

  return <section className="lin-memory-demo">
    <div className={`lin-memory-viewport ${location === 'bridge' ? 'lin-bridge-viewport' : ''}`} ref={viewportRef} aria-label={location === 'bridge' ? '第一章奈何桥场景' : '林秀的连续记忆地图'}>
      {location === 'memory' ? <>
      <div className="lin-memory-world" ref={worldRef} style={{ width: MAP_WIDTH }}>
        <div className="lin-memory-zone lin-zone-street" style={{ left: 0, width: ZONE_WIDTH }}>
          <div className="memory-ground"/>
          <BlockActor name="记忆中的林秀" role="lin" left={linSceneOneX} walking={linWalking} transitionDuration={chaseDuration}/><BlockActor name="路人" role="passerby" left={700}/>
          <div className="memory-target-tag" style={{ left: 500 }}>记忆中的林秀 <b>E</b></div>
        </div>
        <div className="lin-street-road-art" style={{ left: SCENE_WIDTH - 180, width: ROAD_WIDTH + 180 }} aria-hidden="true"/>
        <div className="lin-memory-fragment-road road-one" style={{ left: SCENE_WIDTH, width: ROAD_WIDTH }} aria-label="连接记忆片段的碎忆长路">
          <BlockActor name="林秀 · 寻人无果" role="lin" left={250}/><BlockActor name="邻居" role="passerby" left={350}/><div className="memory-target-tag" style={{ left: 250 }}>寻人无果 <b>E</b></div>
          <BlockActor name="林秀 · 接到邀请" role="lin" left={850}/><BlockActor name="节目工作人员" role="staff" left={960}/><div className="memory-target-tag" style={{ left: 850 }}>节目邀请 <b>E</b></div>
        </div>
        <div className="lin-memory-zone lin-zone-studio" style={{ left: SCENE_TWO_START, width: ZONE_WIDTH }}>
          <div className="studio-banner">寻亲进行时</div><div className="memory-ground"/>
          <BlockActor name="林秀" role="lin" left={570}/><BlockActor name="主持人" role="host" left={750}/>
          <div className="memory-target-tag" style={{ left: 650 }}>采访片段 <b>E</b></div>
        </div>
        <div className="lin-memory-fragment-road road-two" style={{ left: SCENE_TWO_START + SCENE_WIDTH, width: ROAD_WIDTH }} aria-label="连接记忆片段的碎忆长路">
          <div className="memory-ground"/><i className="memory-shard shard-four">节目邀约</i><i className="memory-shard shard-five">谢谢大家</i><i className="memory-shard shard-six">线索来信</i>
          <BlockActor name="林秀 · 收到捐助" role="lin" left={320}/><BlockActor name="节目工作人员" role="staff" left={220}/><div className="memory-target-tag" style={{ left: 320 }}>酬劳与捐助 <b>E</b></div>
          <BlockActor name="林秀 · 多年后" role="lin" left={850}/><BlockActor name="工作人员" role="staff" left={960}/><div className="memory-target-tag" style={{ left: 850 }}>活动与线索 <b>E</b></div>
        </div>
        <div className="lin-memory-zone lin-zone-office" style={{ left: SCENE_THREE_START, width: ZONE_WIDTH }}>
          <div className="memory-ground"/>
          {(Object.entries(clueMeta) as Array<[ClueId, Clue]>).map(([id, clue]) => <button key={id} className={`lin-clue lin-clue-${clue.kind} ${investigated.includes(id) ? 'clue-done' : ''}`} style={{ left: clue.x - SCENE_THREE_START }} onClick={() => interactRef.current(id)} aria-label={`调查${clue.label}`}>
            <img src={`./lin-memory/archive-${id}.png`} alt="" draggable={false}/>
            <i>{investigated.includes(id) ? '✓' : '?'}</i><b>{clue.label}</b>
          </button>)}
        </div>
        <div className="lin-player" ref={playerRef} aria-label="小孟婆"><i className="lin-mengpo-sprite"/><span>小孟婆</span></div>
        {([
          ['studio', SCENE_TWO_START],
          ['fragment', SCENE_TWO_START + SCENE_WIDTH],
          ['archive', SCENE_THREE_START],
        ] as const).map(([scene, boundary]) => (
          <div className={`lin-scene-fade lin-scene-fade-${scene}`} key={scene} style={{ left: boundary - 180 }} aria-hidden="true"/>
        ))}
        {[SCENE_WIDTH, SCENE_TWO_START, SCENE_TWO_START + SCENE_WIDTH, SCENE_THREE_START].map((boundary, index) => (
          <img className={`lin-paper-tear ${index % 2 ? 'lin-paper-tear-reversed' : ''}`} key={boundary} src="./lin-memory/paper-tear.png" style={{ left: boundary }} alt="" draggable={false}/>
        ))}
      </div>
      </> : <div className="bridge-memory" aria-label="第一章奈何桥场景">
        <img className="bridge-upper lin-bridge-background lin-bridge-upper" src="./art-test/bridge-upper.jpg" alt="" draggable={false}/>
        <img className="bridge-lower lin-bridge-background lin-bridge-lower" src="./art-test/bridge-lower.jpg" alt="" draggable={false}/>
        <div className="bridge-person bridge-mengpo"><i/><span>小孟婆</span></div>
        <div className="bridge-person bridge-lin"><img src="./art-test/lin-standing.png" alt="" draggable={false}/><span>林秀</span></div>
        <div className="bridge-caption">林秀的记忆 · 奈何桥</div>
      </div>}
    </div>
    <header className="lin-memory-header"><button onClick={onExit}>← 返回章节</button><div><small>{location === 'bridge' ? '奈何桥 · 记忆之后' : '第三章 · 记忆调查'}</small><strong>{location === 'bridge' ? '林秀的回应' : '林秀的记忆'}</strong></div>{location === 'memory' && <span>无美术占位 Demo</span>}</header>
    {location === 'memory' && <>
    <aside className="lin-memory-objective"><small>记忆追踪</small><strong>{progressTitle}</strong><p>{progress === 0 ? '靠近记忆中的林秀并按 E 交互。' : progress === 1 ? '沿碎片路依次回看她从独自寻找、到决定借助媒体的片段。' : '沿碎片路继续前进，再调查旧照片、节目海报和积压资料。'}</p>{progress >= 2 && <div className="lin-clue-progress">{(Object.keys(clueMeta) as ClueId[]).map((id) => <span className={investigated.includes(id) ? 'complete' : ''} key={id}>{clueMeta[id].label}</span>)}</div>}</aside>
    <div className="lin-zone-caption" key={zoneIndex}><small>{zoneIndex === 1 || zoneIndex === 3 ? '记忆碎片路段' : `记忆场景 ${zoneIndex === 0 ? 1 : zoneIndex === 2 ? 2 : 3} / 3`}</small><strong>{zoneNames[zoneIndex]}</strong></div>
    {nearby && mode === 'walk' && <button className="lin-interact-prompt" onClick={() => interactRef.current(nearby)}><span>{nearbyLabel}</span><b>交互 E ↗</b></button>}
    <div className="lin-touch-controls" onPointerLeave={releaseMove}>
      <button aria-label="向左移动" onPointerDown={pressMove(-1)} onPointerUp={releaseMove} onPointerCancel={releaseMove} onLostPointerCapture={releaseMove}>←</button>
      <button aria-label="向右移动" onPointerDown={pressMove(1)} onPointerUp={releaseMove} onPointerCancel={releaseMove} onLostPointerCapture={releaseMove}>→</button>
    </div>
    </>}
    {mode === 'dialogue' && activeLine && <div className={`vn-dialogue voice-${activeLine.speaker}`}>
      {cast[activeLine.speaker].portrait
        ? <img className="vn-bust" src={`./art-test/${cast[activeLine.speaker].portrait}-portrait.png`} alt="" draggable={false}/>
        : <div className={`vn-bust lin-vn-fallback portrait-${activeLine.speaker}`}><i/><b/><span/></div>}
      <div className="vn-box"><div className="vn-nameplate"><span className="eyebrow">{dialogueKind === 'truth' || dialogueKind === 'response' || dialogueKind === 'bridgeArrival' ? '奈何桥 · 林秀的回应' : '林秀 · 记忆调查'}</span><strong>{cast[activeLine.speaker].name}</strong><small>{cast[activeLine.speaker].role}</small><span className="dialogue-count">{String(dialogueIndex + 1).padStart(2, '0')} / {String(dialogue.length).padStart(2, '0')}</span></div><p className="vn-text">{activeLine.text}</p><div className="vn-footer"><span>{transitioning ? '林秀走向路人……' : '点击继续'}</span><button className="primary" onClick={advanceDialogue} disabled={transitioning}>{transitioning ? '回忆中…' : '继续 →'}</button></div></div>
    </div>}
    {mode === 'departure' && location === 'memory' && <section className="lin-departure-panel"><small>记忆调查完成</small><h2>要回奈何桥了吗？</h2><button onClick={() => chooseDeparture(true)}><b>出去吧</b><span>是时候回到奈何桥，听听林秀怎么说。</span></button><button onClick={() => chooseDeparture(false)}><b>再等等</b><span>再看看这些记忆，也许我还需要想一想。</span></button></section>}
    {mode === 'choice' && location === 'bridge' && <section className="lin-choice-panel"><small>孟婆汤前 · 前章倾向 +{initialAffinity} · 最后的回应</small><h2>你想如何回应林秀？</h2><button onClick={() => chooseResponse('A')}><b>安慰她</b><span>我相信你没有忘记女儿。只是这么多年过去，你始终不愿放弃找到她的希望。</span><i>本次 +2</i></button><button onClick={() => chooseResponse('B')}><b>质问她</b><span>如果下一世不再有人因为你的寻亲经历而关注你，你还愿意继续寻找吗？</span><i>本次 +1</i></button></section>}
    {mode === 'ending' && <section className="lin-ending"><small>本次 +{score} · 林秀累计倾向 +{initialAffinity + (score ?? 0)}</small><h2>{score === 2 ? '她仍想记得女儿' : '她也害怕失去帮助'}</h2><p>{score === 2 ? '“哪怕转世之后一切都要重新开始，我也想再找她一次。”' : '“要是没有了这些帮助，光靠我一个人，又怎么找得到她呢？”'}</p><button onClick={onExit}>回到章节选择</button></section>}
  </section>;
}

function BlockActor({ name, role, left, walking = false, transitionDuration }: { name: string; role: string; left: number; walking?: boolean; transitionDuration?: number }) {
  return <div className={`memory-actor actor-${role} ${walking ? 'actor-walking' : ''}`} style={{ left, transitionDuration: transitionDuration === undefined ? undefined : `${transitionDuration}ms`, transitionTimingFunction: transitionDuration === undefined ? undefined : 'linear' }} aria-label={name}>
    {role === 'lin' ? <img className="lin-memory-sprite" src="./lin-memory/lin-side-standing.png" alt="" draggable={false}/> : <><i/><b/></>}
    <span>{name}</span>
  </div>;
}

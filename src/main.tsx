import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import JinChapter from './JinChapter';
import LinMemoryChapter from './LinMemoryChapter';
import GuMemoryChapter from './GuMemoryChapter';
import './style.css';

type GhostId = 'lin' | 'jin' | 'gu';
type Phase = 'menu' | 'settings' | 'diary' | 'prologue' | 'explore' | 'vote' | 'ending' | 'chapterTwo' | 'jinChapter' | 'linMemory' | 'guMemory';
type Config = {
  ui_background?: { value: string };
  ui_panel?: { value: string };
  ui_accent?: { value: string };
  ui_text?: { value: string };
  move_speed?: { value: number };
  gu_vibration_enabled?: { value: boolean };
  gu_shake_enabled?: { value: boolean };
  gu_early_shake_interval?: { value: number };
  gu_early_shake_strength?: { value: number };
  lin_chase_speed?: { value: number };
};
type DialogueLine = { speaker: 'mengpo' | 'npc'; text: string };
type Person = { id: GhostId; name: string; role: string; dialogue: DialogueLine[] };
type VoiceId = 'mengpo' | GhostId;
type StoryLine = { speaker: VoiceId; text: string };
type QuestionId = 'A' | 'B';
type InterviewQuestion = { text: string; score: number; lines: StoryLine[] };
type InterviewScript = { opening: StoryLine[]; questions: Record<QuestionId, InterviewQuestion>; closing: StoryLine[] };
type ChapterTwoStage = 'intro' | 'walk' | 'opening' | 'choice' | 'branch' | 'closing' | 'summary';

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

const chapterTwoIntro: StoryLine[] = [
  { speaker: 'mengpo', text: '我想分别了解一下你们的情况。' },
  { speaker: 'jin', text: '要一个一个问？有什么话不能当着大家的面说？' },
  { speaker: 'mengpo', text: '每个人的经历都不一样，我想听你们自己说。' },
  { speaker: 'mengpo', text: '（小孟婆示意林秀先跟随自己来到引魂廊，另外两位留在远处等候。）' },
];

const interviews: Record<GhostId, InterviewScript> = {
  lin: {
    opening: [
      { speaker: 'mengpo', text: '林秀，我想再了解一些你和女儿的事情。' },
      { speaker: 'lin', text: '孟婆大人想知道什么？' },
    ],
    questions: {
      A: { text: '这些年，你都是怎么继续寻找女儿的？', score: 2, lines: [
        { speaker: 'mengpo', text: '这些年，你都是怎么继续寻找女儿的？' },
        { speaker: 'lin', text: '到处打听，也参加过不少寻亲活动。只要有一点消息，我都不愿意错过。' },
        { speaker: 'mengpo', text: '这么多年过去，一直没有消息，你还坚持得下来吗？' },
        { speaker: 'lin', text: '当然要坚持。现在有不少人认识我，也愿意帮我留意消息。要是我不再露面，大家慢慢忘了这件事，女儿就更难找到了。' },
        { speaker: 'mengpo', text: '你担心大家忘记这件事？' },
        { speaker: 'lin', text: '是啊……我不能让这件事就这么过去。' },
      ] },
      B: { text: '你一直带着这张照片参加寻亲活动吗？', score: 1, lines: [
        { speaker: 'mengpo', text: '你一直带着这张照片参加寻亲活动吗？' },
        { speaker: 'lin', text: '是啊，每次接受采访，我都会带着它。' },
        { speaker: 'mengpo', text: '这么多年，应该有不少人看过这张照片吧？' },
        { speaker: 'lin', text: '可不是嘛。现在很多人一看到我，就知道我是来找女儿的。' },
        { speaker: 'mengpo', text: '那他们后来还会问起你女儿的消息吗？' },
        { speaker: 'lin', text: '当然会。每次有人问，我都得再说一遍她走失的经过。只要还有人记得这件事，我就还有希望。' },
      ] },
    },
    closing: [
      { speaker: 'lin', text: '孟婆大人，我真的不能忘记她。只要还有机会，我就想再找找看。' },
      { speaker: 'mengpo', text: '我明白了。你先在这里等一等吧。' },
    ],
  },
  jin: {
    opening: [
      { speaker: 'mengpo', text: '金万山，你说自己藏起了大部分财宝，还想在下一世重新找回来。我有些事情想问问你。' },
      { speaker: 'jin', text: '孟婆大人尽管问。不过，我可得先说好，藏宝的具体地点，我是绝不会告诉任何人的。' },
      { speaker: 'mengpo', text: '我并不是想问你藏宝的地点。' },
    ],
    questions: {
      A: { text: '你找回财宝之后，打算做什么？', score: 1, lines: [
        { speaker: 'mengpo', text: '你说下一世要找回财宝，找回来之后，还打算做什么？' },
        { speaker: 'jin', text: '自然是重新置办家业，把生意再做起来。' },
        { speaker: 'mengpo', text: '你已经辛苦了一辈子，下一世还想继续经商？' },
        { speaker: 'jin', text: '那是当然。不过，除了那些财宝，我还在藏宝的地方留了些别的东西，下一世也得一并找回来。' },
        { speaker: 'mengpo', text: '别的东西？是什么？' },
        { speaker: 'jin', text: '一些旧物罢了，没什么值钱的。孟婆大人还是别问了。' },
      ] },
      B: { text: '你辛苦了一辈子，为什么还这么放不下财富？', score: 2, lines: [
        { speaker: 'mengpo', text: '你辛苦了一辈子，为什么还这么放不下财富？' },
        { speaker: 'jin', text: '孟婆大人有所不知，我年轻时穷得叮当响，吃过多少苦，才有今天的家业。' },
        { speaker: 'mengpo', text: '所以你不愿意让自己一辈子的心血就这样消失？' },
        { speaker: 'jin', text: '那是自然！我这一辈子什么都靠自己，一点一点攒下来的。如今好不容易有了这些财富，怎么能说忘就忘？' },
        { speaker: 'mengpo', text: '看来，这些财富对你来说不只是钱财。' },
        { speaker: 'jin', text: '当然！那可是一辈子的心血。只要还有机会，我就一定要把它们找回来。' },
      ] },
    },
    closing: [
      { speaker: 'jin', text: '孟婆大人，您可千万别把我的财宝当成身外之物。那可是我一辈子的心血！' },
      { speaker: 'mengpo', text: '我知道了。你也先在这里等着吧。' },
    ],
  },
  gu: {
    opening: [
      { speaker: 'mengpo', text: '顾沉，你说自己被最信任的朋友背叛，甚至因此丢了性命。我想再了解一些你们之间的事情。' },
      { speaker: 'gu', text: '孟婆大人想问什么？' },
    ],
    questions: {
      A: { text: '你说以前把他当作兄弟，之前关系很好吗？', score: 2, lines: [
        { speaker: 'mengpo', text: '你说把他当作兄弟，你们以前关系很好吗？' },
        { speaker: 'gu', text: '当然。我们一起经营事业，经历过不少事情。那时候，我很信任他，很多事情都愿意和他商量。' },
        { speaker: 'mengpo', text: '既然如此，你们矛盾应该很少呀？' },
        { speaker: 'gu', text: '起初是这样。后来生意越做越大，事情也多了起来。有些事情，我觉得还是自己拿主意比较稳妥。' },
        { speaker: 'mengpo', text: '他对此没有意见吗？' },
        { speaker: 'gu', text: '他起初倒也没说什么。后来……算了，都过去了。' },
        { speaker: 'mengpo', text: '你似乎不太愿意提起这段经历。' },
        { speaker: 'gu', text: '没什么好说的。反正最后是他先背叛了我。' },
      ] },
      B: { text: '你们一起经营事业时，平时是谁负责打理账目？', score: 1, lines: [
        { speaker: 'mengpo', text: '你们一起经营事业时，平时是谁负责打理账目？' },
        { speaker: 'gu', text: '主要是我。他负责外面的事情，账目和经营上的决策基本都由我来处理。' },
        { speaker: 'mengpo', text: '那他后来为什么会和你产生矛盾？' },
        { speaker: 'gu', text: '大概是觉得自己分得少了吧。人一旦起了贪念，就什么都不顾了。' },
        { speaker: 'mengpo', text: '既然账目一直由你负责，他又怎么知道自己分得少了？' },
        { speaker: 'gu', text: '……他后来自己查了账。' },
        { speaker: 'mengpo', text: '（顾沉停顿片刻，避开小孟婆的目光。）' },
      ] },
    },
    closing: [
      { speaker: 'gu', text: '孟婆大人，有些事情不是一句背叛就能说清的。但无论如何，我都不会就这样放过他。' },
      { speaker: 'mengpo', text: '我知道了。你也先在这里等候吧。' },
    ],
  },
};

const chapterTwoSummary: StoryLine[] = [
  { speaker: 'mengpo', text: '林秀对女儿的思念看起来并非作假，可她谈起这些年的寻亲经历时，总有些地方让我觉得奇怪。' },
  { speaker: 'mengpo', text: '金万山对财宝的执着远超寻常，似乎还有什么事情不愿意告诉我。' },
  { speaker: 'mengpo', text: '顾沉一再强调朋友的背叛，可他们之间的纠纷，恐怕并没有他说得那么简单。' },
  { speaker: 'mengpo', text: '他们说的似乎都有道理，可我总觉得，他们并没有说出全部实情。' },
  { speaker: 'mengpo', text: '仅凭这些只言片语，我还无法判断他们究竟隐瞒了什么。看来，必须亲自看看他们的记忆。先从金万山开始吧。' },
];

function BridgeWorld({ speed, backgroundColor, heardCount, nearby, blocked, npcsSpread, onNearby, onTalk, chapterTwo = false, interviewPerson = null, availablePeople, canTalk = true }: { speed: number; backgroundColor: string; heardCount: number; nearby: GhostId | null; blocked: boolean; npcsSpread: boolean; onNearby: (id: GhostId | null) => void; onTalk: (id: GhostId) => void; chapterTwo?: boolean; interviewPerson?: GhostId | null; availablePeople?: GhostId[]; canTalk?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const direction = useRef(0);
  const position = useRef(310);
  const nearbyRef = useRef<GhostId | null>(null);
  const speedRef = useRef(speed);
  const blockedRef = useRef(blocked);
  const callbacks = useRef({ onNearby, onTalk });
  const bridgeScale = useRef(1);
  speedRef.current = speed;
  blockedRef.current = blocked;
  callbacks.current = { onNearby, onTalk };
  const person = people.find((entry) => entry.id === nearby);
  const ghostX: Record<GhostId, number> = chapterTwo
    ? interviewPerson === 'lin' ? { lin: 430, jin: 1080, gu: 1290 }
      : interviewPerson === 'jin' ? { lin: 90, jin: 690, gu: 1290 }
        : interviewPerson === 'gu' ? { lin: 90, jin: 300, gu: 1290 }
          : heardCount === 0 ? { lin: 430, jin: 1080, gu: 1290 }
            : { lin: 110, jin: 720, gu: 1250 }
    : npcsSpread ? { lin: 600, jin: 720, gu: 840 } : { lin: 430, jin: 540, gu: 650 };
  const allowedPeople = availablePeople ?? ['lin', 'jin', 'gu'];
  const ghostPositions = useRef(ghostX);
  const allowedPeopleRef = useRef(allowedPeople);
  ghostPositions.current = ghostX;
  allowedPeopleRef.current = allowedPeople;

  useEffect(() => {
    const hostNode = host.current;
    if (!hostNode) return;
    const observer = new ResizeObserver(([entry]) => {
      bridgeScale.current = entry.contentRect.width / 1280;
    });
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
        const viewportWidth = 1280;
        const cameraX = Math.max(0, Math.min(1400 - viewportWidth, position.current - viewportWidth * 0.35));
        player.current.style.left = `${position.current}px`;
        if (direction.current !== 0) {
          player.current.style.transform = `translateX(-50%) scaleX(${direction.current < 0 ? -1 : 1})`;
        }
        player.current.classList.toggle('walking', direction.current !== 0);
        world.current.style.transform = `scale(${bridgeScale.current}) translate3d(${-cameraX}px,0,0)`;
        const nearest = (Object.entries(ghostPositions.current) as Array<[GhostId, number]>)
          .filter(([id]) => allowedPeopleRef.current.includes(id))
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
        <div className="bridge-upper" />
        <div className="bridge-lower" />
        {people.map((entry) => <div className={`world-ghost ghost-${entry.id} ${npcsSpread ? 'npc-settled' : 'npc-gathered'}`} key={entry.id} style={{ left: ghostX[entry.id] }}>
          <span className="ghost-label">{entry.name}</span>
          <img className="ghost-sprite" src={`./art-test/${entry.id}-standing.png`} alt="" draggable={false}/>
        </div>)}
        <div className="world-player" ref={player}>
          <i className="player-sprite"/>
        </div>
      </div>
    </div>
    <div className="walk-hud"><span className="hud-mark"/>{chapterTwo ? '第二章' : '第一章'} <b>{chapterTwo ? '执念 · 引魂廊' : '两碗孟婆汤'}</b><small>{chapterTwo ? '已询问' : '已交谈'} {heardCount} / 3</small></div>
    <div className="world-hint">A / D 或 ← → 移动　·　靠近亡魂后按 E {chapterTwo ? '询问' : '交谈'}{person ? `　·　${person.name}` : ''}</div>
    <div className="touch-controls" onPointerLeave={() => move(0)}>
      <button className="move-button" aria-label="向左移动" onPointerDown={(event) => { prevent(event); event.currentTarget.setPointerCapture(event.pointerId); move(-1); }} onPointerUp={() => move(0)} onLostPointerCapture={() => move(0)}>←</button>
      <button className="move-button" aria-label="向右移动" onPointerDown={(event) => { prevent(event); event.currentTarget.setPointerCapture(event.pointerId); move(1); }} onPointerUp={() => move(0)} onLostPointerCapture={() => move(0)}>→</button>
    </div>
    {canTalk && person && <div className="nearby-prompt"><span>{person.name} · {person.role}</span><button className="primary interact-button" onClick={() => callbacks.current.onTalk(person.id)}>{chapterTwo ? '询问' : '交谈'} <b>E</b></button></div>}
  </>;
}

function VisualNovelDialogue({ line, index, total, onAdvance, eyebrow = '奈何桥 · 对话' }: { line: StoryLine; index: number; total: number; onAdvance: () => void; eyebrow?: string }) {
  const voice = voiceMeta[line.speaker];
  return <div className={`vn-dialogue voice-${line.speaker}`}>
    <img className="vn-bust" src={`./art-test/${voice.portrait}-portrait.png`} alt="" draggable={false}/>
    <div className="vn-box">
      <div className="vn-nameplate"><span className="eyebrow">{eyebrow}</span><strong>{voice.name}</strong><small>{voice.role}</small><span className="dialogue-count">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span></div>
      <p className="vn-text">{line.text}</p>
      <div className="vn-footer"><span>点击继续</span><button className="primary" onClick={onAdvance}>继续 <b>→</b></button></div>
    </div>
  </div>;
}

function InterviewQuestionPanel({ personId, onSelect }: { personId: GhostId; onSelect: (id: QuestionId) => void }) {
  const person = voiceMeta[personId];
  const questions = interviews[personId].questions;
  return <section className="interview-choice-panel" aria-label={`${person.name}的问题选择`}>
    <small>单次问询 · 选择一个问题</small>
    <h2>你想了解什么？</h2>
    {(['A', 'B'] as QuestionId[]).map((id) => <button key={id} onClick={() => onSelect(id)}>
      <b>{id}</b><span>{questions[id].text}</span><i>倾向值 +{questions[id].score}</i>
    </button>)}
  </section>;
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
  const [chapterTwoStage, setChapterTwoStage] = useState<ChapterTwoStage>('intro');
  const [chapterTwoPerson, setChapterTwoPerson] = useState<GhostId | null>(null);
  const [chapterTwoLines, setChapterTwoLines] = useState<StoryLine[]>([]);
  const [chapterTwoIndex, setChapterTwoIndex] = useState(0);
  const [interviewed, setInterviewed] = useState<GhostId[]>([]);
  const [interviewChoices, setInterviewChoices] = useState<Partial<Record<GhostId, QuestionId>>>({});
  const [interviewScores, setInterviewScores] = useState<Record<GhostId, number>>({ lin: 0, jin: 0, gu: 0 });

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
  const chapterTwoLine = chapterTwoLines[chapterTwoIndex];
  const activeLine: StoryLine | undefined = phase === 'prologue'
    ? prologueLines[prologueIndex]
    : phase === 'vote'
      ? voteLines[voteIndex]
      : phase === 'explore' && interviewLine
        ? { speaker: interviewLine.speaker === 'npc' ? speaker! : 'mengpo', text: interviewLine.text }
        : phase === 'chapterTwo' && chapterTwoStage !== 'walk' && chapterTwoStage !== 'choice'
          ? chapterTwoLine
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

  const beginChapterTwo = () => {
    setNearby(null);
    setSpeaker(null);
    setNpcsSpread(true);
    setChapterTwoPerson(null);
    setChapterTwoLines(chapterTwoIntro);
    setChapterTwoIndex(0);
    setChapterTwoStage('intro');
    setInterviewed([]);
    setInterviewChoices({});
    setInterviewScores({ lin: 0, jin: 0, gu: 0 });
    setPhase('chapterTwo');
  };

  const startInterview = (id: GhostId) => {
    if (phase !== 'chapterTwo' || chapterTwoStage !== 'walk' || interviewed.includes(id)) return;
    if (interviewed.length === 0 && id !== 'lin') return;
    setChapterTwoPerson(id);
    setChapterTwoLines(interviews[id].opening);
    setChapterTwoIndex(0);
    setChapterTwoStage('opening');
  };

  const chooseInterviewQuestion = (questionId: QuestionId) => {
    if (!chapterTwoPerson || chapterTwoStage !== 'choice') return;
    const question = interviews[chapterTwoPerson].questions[questionId];
    setInterviewChoices((current) => ({ ...current, [chapterTwoPerson]: questionId }));
    setInterviewScores((current) => ({ ...current, [chapterTwoPerson!]: question.score }));
    setChapterTwoLines(question.lines);
    setChapterTwoIndex(0);
    setChapterTwoStage('branch');
  };

  const advanceChapterTwo = () => {
    if (chapterTwoIndex < chapterTwoLines.length - 1) {
      setChapterTwoIndex((index) => index + 1);
      return;
    }
    if (chapterTwoStage === 'intro') {
      setChapterTwoLines([]);
      setChapterTwoStage('walk');
    } else if (chapterTwoStage === 'opening') {
      setChapterTwoLines([]);
      setChapterTwoStage('choice');
    } else if (chapterTwoStage === 'branch' && chapterTwoPerson) {
      setChapterTwoLines(interviews[chapterTwoPerson].closing);
      setChapterTwoIndex(0);
      setChapterTwoStage('closing');
    } else if (chapterTwoStage === 'closing' && chapterTwoPerson) {
      const done = [...interviewed, chapterTwoPerson];
      setInterviewed(done);
      setChapterTwoPerson(null);
      setChapterTwoIndex(0);
      if (done.length === 3) {
        setChapterTwoLines(chapterTwoSummary);
        setChapterTwoStage('summary');
      } else {
        setChapterTwoLines([]);
        setChapterTwoStage('walk');
      }
    } else if (chapterTwoStage === 'summary') {
      setPhase('jinChapter');
    }
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
    } else if (phase === 'chapterTwo') advanceChapterTwo();
    else advanceConversation();
  };
  const continueDiary = () => {
    if (diaryVisible < diaryCharacters.length) setDiaryVisible(diaryCharacters.length);
    else { setPrologueIndex(0); setPhase('prologue'); }
  };
  const updateSpeed = (value: number) => {
    setSpeed(value);
    localStorage.setItem('wangchuan.moveSpeed', String(value));
  };
  const chapterTwoAvailablePeople: GhostId[] = interviewed.length === 0
    ? ['lin']
    : (['lin', 'jin', 'gu'] as GhostId[]).filter((id) => !interviewed.includes(id));

  return <main className="app" style={palette}>
    {phase === 'menu' && <section className="menu-screen">
      <div className="menu-copy"><div className="eyebrow">忘川 · 记忆录</div><h1>忘川录</h1><p className="subtitle">亡魂未尽的人间事</p><p className="menu-description">选择一段记忆进入，继续调试章节内容。</p><div className="menu-chapters">
        <button className="chapter-entry" onClick={beginGame}><span className="chapter-index">第一章</span><span className="chapter-title">两碗孟婆汤</span><small>奈何桥 · 对话与投票</small><b>→</b></button>
        <button className="chapter-entry chapter-interview" onClick={beginChapterTwo}><span className="chapter-index">第二章</span><span className="chapter-title">执念</span><small>引魂廊 · 单独问询 · 倾向记录</small><b>→</b></button>
        <button className="chapter-entry chapter-debug" onClick={() => { setInterviewScores({ lin: 0, jin: 0, gu: 0 }); setPhase('jinChapter'); }}><span className="chapter-index">第三章 · 调试入口</span><span className="chapter-title">金万山的记忆</span><small>家中探索 · 山洞祭祀 · 背包</small><b>→</b></button>
        <button className="chapter-entry chapter-debug chapter-lin-entry" onClick={() => setPhase('linMemory')}><span className="chapter-index">第三章 · Demo</span><span className="chapter-title">林秀的记忆</span><small>街巷 · 寻亲节目 · 旧居与办公室</small><b>→</b></button>
        <button className="chapter-entry chapter-debug" onClick={() => setPhase('guMemory')}><span className="chapter-index">第三章 · Demo</span><span className="chapter-title">顾沉的记忆</span><small>限时调查 · 反向回溯 · 记忆震荡</small><b>→</b></button>
      </div><div className="menu-actions"><button className="quiet-button" onClick={() => setPhase('settings')}>设置 <span>＋</span></button></div><div className="menu-controls">横屏游玩　·　键盘 / 触屏移动</div></div>
      <div className="menu-block-scene" aria-hidden="true"><div className="menu-slab slab-one"/><div className="menu-slab slab-two"/><div className="menu-slab slab-three"/><div className="menu-player"><i/><b/></div><span>奈何桥</span></div>
      <div className="menu-corner">WANGCHUAN CHRONICLES <b>·</b> PROTOTYPE</div>
    </section>}

    {phase === 'settings' && <section className="subpage"><div className="eyebrow">设置 / SETTINGS</div><h2>游玩设置</h2><div className="setting-row"><div><strong>移动速度</strong><small>调整小孟婆在奈何桥上的行走速度</small></div><output>{speed}</output><input aria-label="移动速度" type="range" min="120" max="360" step="10" value={speed} onChange={(event) => updateSpeed(Number(event.target.value))}/></div><div className="setting-help"><b>操作方式</b><span>电脑：A / D 或方向键移动，E 或空格交谈</span><span>手机：按住左右方块行走，靠近亡魂后点击“交谈”</span></div><button className="secondary-button" onClick={() => setPhase('menu')}>返回主页面</button></section>}

    {phase === 'diary' && <section className="diary-screen">
      <div className="diary-sheet"><div className="diary-heading"><span className="eyebrow">忘川值事录 · 第一日</span><span>新任孟婆手记</span></div><div className="diary-copy">{diaryCharacters.slice(0, diaryVisible).join('')}{diaryVisible < diaryCharacters.length && <i className="diary-caret"/>}</div><div className="diary-footer"><span>{diaryVisible < diaryCharacters.length ? '墨迹未干……' : '手记已毕'}</span><button className="primary" onClick={continueDiary}>{diaryVisible < diaryCharacters.length ? '显示全部文字' : '走上奈何桥'} <span>→</span></button></div></div>
    </section>}

    {(['prologue', 'explore', 'vote', 'chapterTwo'] as Phase[]).includes(phase) && <section className="explore-screen">
      <BridgeWorld speed={speed} backgroundColor={config.ui_background?.value ?? '#17161d'} heardCount={phase === 'chapterTwo' ? interviewed.length : heard.length} nearby={nearby} blocked={phase === 'chapterTwo' ? chapterTwoStage !== 'walk' : phase !== 'explore' || Boolean(speaker)} npcsSpread={phase === 'chapterTwo' ? true : npcsSpread} onNearby={setNearby} onTalk={phase === 'chapterTwo' ? startInterview : startConversation} chapterTwo={phase === 'chapterTwo'} interviewPerson={chapterTwoPerson} availablePeople={phase === 'chapterTwo' ? chapterTwoStage === 'walk' ? chapterTwoAvailablePeople : [] : undefined} canTalk={phase === 'explore' || (phase === 'chapterTwo' && chapterTwoStage === 'walk')}/>
      {phase === 'explore' && <aside className="quest-tracker"><span className="eyebrow">本章目标</span><strong>听听三位亡魂的故事</strong><p>请和林秀、金万山、顾沉分别对话，了解他们的人生经历。</p><ul>{people.map((person) => <li className={heard.includes(person.id) ? 'complete' : ''} key={person.id}><i/>{person.name}<span>{heard.includes(person.id) ? '已了解' : '待交谈'}</span></li>)}</ul></aside>}
      {phase === 'chapterTwo' && chapterTwoStage === 'walk' && <aside className="quest-tracker chapter-two-tracker"><span className="eyebrow">第二章目标</span><strong>逐一了解他们的执念</strong><p>{interviewed.length === 0 ? '先与林秀单独谈谈。每个人只能选择一个问题。' : '继续询问金万山与顾沉，每人只能选择一个问题。'}</p><ul>{people.map((person) => { const selected = interviewChoices[person.id]; return <li className={interviewed.includes(person.id) ? 'complete' : ''} key={person.id}><i/>{person.name}<span>{selected ? `问题${selected} · +${interviewScores[person.id]}` : interviewed.includes(person.id) ? '已询问' : '待询问'}</span></li>; })}</ul></aside>}
      {phase === 'chapterTwo' && chapterTwoStage === 'summary' && <aside className="chapter-two-scoreboard"><span className="eyebrow">第二章 · 倾向记录</span><strong>三人的回答</strong><ul>{people.map((person) => <li key={person.id}><b>{person.name}</b><span>问题 {interviewChoices[person.id]} · +{interviewScores[person.id]}</span></li>)}</ul><small>第三章还会继续累积倾向值</small></aside>}
      {phase === 'explore' && heard.length === 3 && !speaker && <button className="call-vote" onClick={() => { setVoteIndex(0); setPhase('vote'); }}>三人都已陈述　·　开始投票 <span>→</span></button>}
      {phase === 'chapterTwo' && chapterTwoStage === 'choice' && chapterTwoPerson && <InterviewQuestionPanel personId={chapterTwoPerson} onSelect={chooseInterviewQuestion}/>}
      {phase === 'prologue' && activeLine && <VisualNovelDialogue line={activeLine} index={prologueIndex} total={prologueLines.length} onAdvance={advanceStory}/>}
      {phase === 'explore' && speaker && currentPerson && activeLine && <VisualNovelDialogue line={activeLine} index={dialoguePage} total={dialogueLines.length} onAdvance={advanceStory}/>}
      {phase === 'vote' && activeLine && <VisualNovelDialogue line={activeLine} index={voteIndex} total={voteLines.length} onAdvance={advanceStory}/>}
      {phase === 'chapterTwo' && activeLine && <VisualNovelDialogue line={activeLine} index={chapterTwoIndex} total={chapterTwoLines.length} onAdvance={advanceChapterTwo} eyebrow={chapterTwoStage === 'summary' ? '第二章 · 小孟婆的判断' : '引魂廊 · 单独问询'}/>}
    </section>}

    {phase === 'ending' && <section className="chapter-end"><div className="end-seal">忘川</div><h2>第一章终了</h2><span className="end-rule"/><button className="ending-return" onClick={() => setPhase('menu')}>返回标题</button></section>}
    {phase === 'jinChapter' && <JinChapter onExit={() => setPhase('menu')} initialAffinity={interviewScores.jin}/>}
    {phase === 'linMemory' && <LinMemoryChapter onExit={() => setPhase('menu')} initialAffinity={interviewScores.lin} chaseSpeed={config.lin_chase_speed?.value ?? 90}/>}
    {phase === 'guMemory' && <GuMemoryChapter onExit={() => setPhase('menu')} settings={{
      hapticEnabled: config.gu_vibration_enabled?.value ?? true,
      screenShakeEnabled: config.gu_shake_enabled?.value ?? true,
      earlyInterval: config.gu_early_shake_interval?.value ?? 2.5,
      earlyStrength: config.gu_early_shake_strength?.value ?? 12,
    }}/>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);

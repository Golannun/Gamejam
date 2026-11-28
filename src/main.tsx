import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import JinChapter from './JinChapter';
import LinMemoryChapter from './LinMemoryChapter';
import GuMemoryChapter from './GuMemoryChapter';
import './style.css';

type GhostId = 'lin' | 'jin' | 'gu';
type Phase = 'menu' | 'settings' | 'diary' | 'prologue' | 'explore' | 'vote' | 'ending' | 'chapterTwo' | 'chapterTwoEnding' | 'jinChapter' | 'linMemory' | 'guMemory';
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
  audio_music_enabled?: { value: boolean };
  bgm_volume?: { value: number };
  bgm_chapter_one?: { value: string };
  bgm_chapter_two?: { value: string };
  image_diary_backdrop?: { value: string };
  image_diary_paper?: { value: string };
  image_ui_dialogue?: { value: string };
  image_ui_option?: { value: string };
};
type DialogueLine = { speaker: 'mengpo' | 'npc'; text: string };
type Person = { id: GhostId; name: string; role: string; dialogue: DialogueLine[] };
type VoiceId = 'mengpo' | GhostId;
type StoryLine = { speaker: VoiceId; text: string };
type QuestionId = 'A' | 'B';
type InterviewQuestion = { text: string; score: number; lines: StoryLine[] };
type InterviewScript = { opening: StoryLine[]; questions: Record<QuestionId, InterviewQuestion>; closing: StoryLine[] };
type ChapterTwoStage = 'intro' | 'walk' | 'opening' | 'choice' | 'branch' | 'closing' | 'summary';
const chapterOnePhases = new Set<Phase>(['diary', 'prologue', 'explore', 'vote', 'ending']);

const diaryText = '　　守在忘川边，我端起那碗孟婆汤待人接过——一日一日，我在人类执念的间隙，听过许多他人的故事。\n\n　　一碗汤下肚，讲述者归于沉默，故事也随之淡忘，接下来只需将亡魂一一引渡——凡人的人生随着神明的一天落下帷幕，简单而繁琐。\n\n　　忘川平静依旧，无望首尾，汤锅里的汤却不知不觉减少着。\n\n　　生命投入忘川，如同热汤灌入脏腑，最终消逝，了无痕迹。';

const defaultDiaryBackdrop = 'https://game-asset.evomeme.com/canvas/0d173e78-4196-4e33-8031-4d9c80624802.png';
const defaultDiaryPaper = 'https://game-asset.evomeme.com/canvas/fb244625-9865-4d48-8214-4b7bd0e2059b.png';
const defaultDialogueUi = './ui/dialogue-panel.png';
const defaultOptionUi = './ui/small-choice-button.png';

const prologueLines: StoryLine[] = [
  { speaker: 'lin', text: '请问，这里就是奈何桥吗？' },
  { speaker: 'mengpo', text: '正是。三位是来投胎的亡魂吧？请随我来。' },
  { speaker: 'mengpo', text: '三位稍等，我这就为你们准备孟婆汤。' },
  { speaker: 'mengpo', text: '（小孟婆拿起汤勺，从锅中舀出孟婆汤，依次盛入碗中。打到第三碗时，汤锅已经见底。桌上只摆着两碗孟婆汤。）' },
  { speaker: 'mengpo', text: '咦？怎么只剩两碗了？' },
  { speaker: 'jin', text: '两碗？你没弄错吧？我们可是三个人！这要怎么分？' },
  { speaker: 'lin', text: '那……是不是有一个人就没法喝汤了？！' },
  { speaker: 'gu', text: '先别急。孟婆大人，照规矩来说，少一碗汤会有什么后果？' },
  { speaker: 'mengpo', text: '有人将无法抹去执念再入轮回。孟婆汤需要特殊材料熬制，现有材料已经用完，短时间内无法重新熬制。亡魂又不能长时间滞留奈何桥，必须尽快完成引渡，否则你们的魂魄将会残损，即使重入轮回也无法修补。' },
  { speaker: 'gu', text: '所以，有一个人可以不用喝汤？' },
  { speaker: 'mengpo', text: '是的。三位之中，两人需要喝下孟婆汤，忘却前世；只有一人能够保留记忆，带着记忆转世。' },
  { speaker: 'lin', text: '那我不喝！我还要找我的女儿！' },
  { speaker: 'jin', text: '我也不想喝汤！我辛辛苦苦攒下的家业，怎么能说忘就忘？' },
  { speaker: 'gu', text: '看来，我们三个都不打算让步。' },
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
  { speaker: 'mengpo', text: '如果你愿意在所有人面前谈起你的宝藏的话，一起问询也没有问题。' },
  { speaker: 'jin', text: '（噤声）' },
  { speaker: 'mengpo', text: '没有异议的话，按照来到奈何桥的顺序开始吧。\n（小孟婆示意林秀先跟随自己来到引魂廊，另外两位留在孟婆亭等候。）' },
];

const interviews: Record<GhostId, InterviewScript> = {
  lin: {
    opening: [
      { speaker: 'mengpo', text: '林秀，我想再了解一些你和女儿的事情。' },
      { speaker: 'lin', text: '孟婆大人想知道什么？' },
    ],
    questions: {
      A: { text: '你在寻找女儿的过程中负担了很多吧。', score: 2, lines: [
        { speaker: 'mengpo', text: '你找了女儿这么多年，经济和精神上的负担应当不小吧。' },
        { speaker: 'lin', text: '中间有几年确实不堪重负。最初家里人对找孩子的事情也还算配合，但找了几个月之后渐渐也都有些灰心了，只剩我还一直坚持。' },
        { speaker: 'lin', text: '为此我和丈夫还有父母吵了不少架，最后闹得离了婚。我在家和父母住不下去，找工作又没有起色，一直发寻亲启事也几乎没有得到过什么回应，那个时候几乎就要放弃了。' },
        { speaker: 'mengpo', text: '后来遇到了转机？' },
        { speaker: 'lin', text: '是的，有一档寻亲节目看到了我发的寻人启事，主动提出邀请我上节目，还负担了我的勤务费用，甚至无偿帮我募捐。' },
        { speaker: 'lin', text: '也是多亏这份善举，我才撑过了经济困难期，得以有心力供养父母、负担自己的食宿、继续寻找女儿。' },
        { speaker: 'mengpo', text: '你已经十分困难，却依旧要养活全家人吗？' },
        { speaker: 'lin', text: '是的......我父母都是农村人，老了腿脚不好收入也近乎于无，所以我很感谢第一个找到我的那档寻亲节目。' },
        { speaker: 'lin', text: '多亏他们的宣传，我才得以被许多好心人看见、结识了许多无偿协助寻人的公益组织。' },
        { speaker: 'lin', text: '而且自从我得到了资助，我父母和我的争吵也减少了，大概是他们不希望我成为拖累吧。' },
        { speaker: 'mengpo', text: '（小孟婆内心：她明明遭遇了种种阻碍，却还是始终不愿放弃吗，支撑着她的究竟是？）' },
      ] },
      B: { text: '你花了很长时间寻找女儿吧。', score: 1, lines: [
        { speaker: 'mengpo', text: '你花了多长时间找你的女儿呢？' },
        { speaker: 'lin', text: '从她7岁那年算起，至今应该有五十余年了。' },
        { speaker: 'mengpo', text: '你似乎一直带着那张照片，这么多年，应该有不少人看过这张照片吧？' },
        { speaker: 'lin', text: '是啊，这样也方便我随时向人问起我女儿。不过数十年的时光，她的容颜怎么可能没有改变，我想，我更多是想要自己别忘了她吧。' },
        { speaker: 'mengpo', text: '你如此执着，难道还会忘记吗？' },
        { speaker: 'lin', text: '我......我肯定不愿意忘了她，可好像除了我，就没有人记得她了......我必须、必须要记得她！' },
        { speaker: 'mengpo', text: '（小孟婆内心：她的坚持里，似乎有某种超越思念的执念。）' },
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
      { speaker: 'jin', text: '我可以回答，不过，我可得先说好，藏宝的具体地点，我是绝不会告诉任何人的。' },
      { speaker: 'mengpo', text: '我并不是想问你藏宝的地点。' },
    ],
    questions: {
      A: { text: '你看起来似乎相当抗拒失去记忆进入轮回。', score: 1, lines: [
        { speaker: 'mengpo', text: '讨论谁可以带着记忆重入轮回的时候，你似乎是最激动的。' },
        { speaker: 'jin', text: '能有办法享受上辈子没能享受的家财，不管是谁都会激动的吧？' },
        { speaker: 'mengpo', text: '真的只是这么简单？' },
        { speaker: 'jin', text: '我看不出我的想法有什么问题，属于我的东西，我当然有权取回来，难道还应该大方地拱手让人吗？您是神仙，当然不懂，有的东西理所应当就该掌握在自己手里。' },
        { speaker: 'mengpo', text: '（小孟婆内心：这听起来可不是财宝那么简单，他似乎话里有话。）' },
      ] },
      B: { text: '你看起来似乎相当在意自己留下的财富。', score: 2, lines: [
        { speaker: 'mengpo', text: '你似乎把自己藏起来的财宝看得很重要。' },
        { speaker: 'jin', text: '这是当然的，我年轻的时候曾穷困潦倒，那个时候一件干净的衣服、一顿饱饭都是奢侈的妄想。' },
        { speaker: 'jin', text: '也是我命不好，从前倒霉欠了不该欠的钱，我生不如死的时候，逼着我去死的人却过得丰衣足食、尽享安乐，这叫我如何能甘心？' },
        { speaker: 'jin', text: '我把财宝藏起来时，抱的不过是不愿便宜了别人的想法，我苦了那么多年，牺牲了那么多才得到的东西，怎么能让别人坐享其成？' },
        { speaker: 'mengpo', text: '牺牲？' },
        { speaker: 'jin', text: '我、我那都是靠自己赚来的，体力上的牺牲就不叫牺牲吗？总之那都是我的心血，我绝对不会松口的！' },
        { speaker: 'mengpo', text: '（小孟婆内心：他似乎隐瞒了什么，难道那些钱财的来源有蹊跷？）' },
      ] },
    },
    closing: [
      { speaker: 'jin', text: '孟婆大人，您可千万别把我的财宝当成身外之物。那可是我一辈子的心血！' },
      { speaker: 'mengpo', text: '我知道了。你也先在这里等着吧。' },
    ],
  },
  gu: {
    opening: [
      { speaker: 'mengpo', text: '顾沉，你说自己要复仇。我想再了解一些你和你的仇人们之间的事情。' },
      { speaker: 'gu', text: '孟婆大人想问什么？' },
    ],
    questions: {
      A: { text: '杀害你的人和你曾是亲密的朋友？', score: 2, lines: [
        { speaker: 'mengpo', text: '你说把他当作兄弟，你们以前关系很好吗？' },
        { speaker: 'gu', text: '当然。我们一起经营事业，经历过不少事情。那时候，我很信任他，很多事情都愿意和他商量。' },
        { speaker: 'mengpo', text: '既然如此，你们理应不会走入当下这个结局吧？' },
        { speaker: 'gu', text: '您不知道，他是个交游很广的人，当初我们这个企业成立时，各方资源也多是他协调的。' },
        { speaker: 'gu', text: '从大学时起我就认识他了，他这个人一直都是这样，在人群里是风云人物，虽然善于交际，却总是不够谨慎，盲信他人。' },
        { speaker: 'gu', text: '除了和我的企业，他在外也有许多投资项目，他杀害我的时候，我刚好打听到他手里的好几个项目都砸了，大概他对我动手，是因为接受不了自己如今和我之间的落差吧。' },
        { speaker: 'mengpo', text: '所以你的意思是，你认为他是因为嫉妒才对你痛下杀手吗？' },
        { speaker: 'gu', text: '我想是的。其实他手里砸的那几个项目，还不至于让他完全翻不了身，拿得到足够的流动资金的话，还是有机会盘活的。' },
        { speaker: 'gu', text: '如果不是因为嫉妒我，为什么要因为自己一时的失败就拉着我陪葬？' },
        { speaker: 'mengpo', text: '（小孟婆内心：他在出事前打听了对方的经济状况，是巧合吗？）' },
      ] },
      B: { text: '杀害你的人有表现出为什么要杀你吗？', score: 1, lines: [
        { speaker: 'mengpo', text: '你们明明是一起经营事业的伙伴，你死了，对公司的经营应该没有好处。' },
        { speaker: 'gu', text: '别说您了，我对此也很不解。但我之前隐约听到一点风声......' },
        { speaker: 'mengpo', text: '什么风声？' },
        { speaker: 'gu', text: '他在外的资金链似乎出了问题，背上了大笔债务。' },
        { speaker: 'mengpo', text: '这似乎与你没有关系？' },
        { speaker: 'gu', text: '大概是因为我是他最亲近的朋友吧，他本来是来找我商借资金的，还为此就公司的资金流动大吵一架，我拒绝借钱，他一怒之下就对我动了手。' },
        { speaker: 'gu', text: '（顾沉嘴上不停，却避开小孟婆的目光。）' },
        { speaker: 'mengpo', text: '（小孟婆内心：他似乎隐瞒了一些实情，看来这不是简单的受害与寻仇。）' },
      ] },
    },
    closing: [
      { speaker: 'gu', text: '孟婆大人，有些事情不是一句背叛就能说清的。但无论如何，我都不会就这样放过他。' },
      { speaker: 'mengpo', text: '我知道了。你也先在这里等候吧。' },
    ],
  },
};

const chapterTwoSummary: StoryLine[] = [
  { speaker: 'mengpo', text: '（小孟婆内心：林秀对女儿的思念是真的，但她身边的环境对她寻亲的态度似乎也很复杂，这会对她有所影响吗？）' },
  { speaker: 'mengpo', text: '（小孟婆内心：金万山对财宝的执着远超寻常，话里话外又暗藏玄机，他真的只藏起了财宝吗？）' },
  { speaker: 'mengpo', text: '（小孟婆内心：顾沉始终强调自己的无辜，却又避开了谈起行凶当晚的事，他所说的背叛恐怕另有隐情。）' },
  { speaker: 'mengpo', text: '（小孟婆内心：他们说的似乎都有道理，可我总觉得，他们并没有说出全部实情。）' },
  { speaker: 'mengpo', text: '（小孟婆内心：仅凭这些只言片语，我还无法判断他们究竟隐瞒了什么。虽然这样会辛苦很多，但我必须亲自看看他们的记忆了。）' },
];

function BridgeWorld({ speed, backgroundColor, heardCount, nearby, blocked, npcsSpread, onNearby, onTalk, chapterTwo = false, interviewPerson = null, availablePeople, canTalk = true }: { speed: number; backgroundColor: string; heardCount: number; nearby: GhostId | null; blocked: boolean; npcsSpread: boolean; onNearby: (id: GhostId | null) => void; onTalk: (id: GhostId) => void; chapterTwo?: boolean; interviewPerson?: GhostId | null; availablePeople?: GhostId[]; canTalk?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const direction = useRef(0);
  const position = useRef(chapterTwo ? 310 : 890);
  const facing = useRef<'left' | 'right'>(chapterTwo ? 'right' : 'left');
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
    : npcsSpread ? { lin: 760, jin: 610, gu: 460 } : { lin: 755, jin: 620, gu: 480 };
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
        if (direction.current !== 0) facing.current = direction.current < 0 ? 'left' : 'right';
        player.current.style.transform = `translateX(-50%) scaleX(${facing.current === 'left' ? -1 : 1})`;
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
  const textDensity = line.text.length > 180 ? ' very-long' : line.text.length > 100 ? ' long' : '';
  return <div className={`vn-dialogue voice-${line.speaker}`}>
    <img className="vn-bust" src={`./art-test/${voice.portrait}-portrait.png`} alt="" draggable={false}/>
    <div className="vn-box">
      <div className="vn-nameplate"><span className="eyebrow">{eyebrow}</span><strong>{voice.name}</strong><small>{voice.role}</small><span className="dialogue-count">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span></div>
      <p className={`vn-text${textDensity}`}>{line.text}</p>
      <div className="vn-footer"><span>点击继续</span><button className="primary" onClick={onAdvance}>继续 <b>→</b></button></div>
    </div>
  </div>;
}

function InterviewQuestionPanel({ personId, onSelect }: { personId: GhostId; onSelect: (id: QuestionId) => void }) {
  const person = voiceMeta[personId];
  const questions = interviews[personId].questions;
  return <section className="interview-choice-panel" aria-label={`${person.name}的问题选择`}>
    <header className="interview-choice-heading">
      <small>单次问询 · 选择一个问题</small>
      <h2>你想了解什么？</h2>
    </header>
    <div className="interview-choice-duo">
      {(['A', 'B'] as QuestionId[]).map((id) => <button key={id} onClick={() => onSelect(id)}>
        <b>{id}</b><span>{questions[id].text}</span><i>倾向值 +{questions[id].score}</i>
      </button>)}
    </div>
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
  const chapterOneBgmRef = useRef<HTMLAudioElement>(null);
  const chapterTwoBgmRef = useRef<HTMLAudioElement>(null);

  const diaryCharacters = Array.from(diaryText);
  const chapterOneBgmSrc = config.bgm_chapter_one?.value ?? './audio/wangchuan-chapter-one.mp3';
  const chapterTwoBgmSrc = config.bgm_chapter_two?.value ?? './audio/wangchuan-variation-chapter-two.mp3';

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

  useEffect(() => {
    const audio = chapterOneBgmRef.current;
    if (!audio) return;

    if (!chapterOnePhases.has(phase) || !(config.audio_music_enabled?.value ?? true)) {
      audio.pause();
      if (!chapterOnePhases.has(phase)) audio.currentTime = 0;
      return;
    }

    const volume = Math.min(1, Math.max(0, config.bgm_volume?.value ?? .45));
    audio.volume = volume;
    if (audio.paused) {
      void audio.play().catch((error) => console.warn('[BGM] chapter one playback failed', error));
    }
  }, [chapterOneBgmSrc, config.audio_music_enabled?.value, config.bgm_volume?.value, phase]);

  useEffect(() => {
    const audio = chapterTwoBgmRef.current;
    if (!audio) return;
    const active = (phase === 'chapterTwo' || phase === 'chapterTwoEnding') && (config.audio_music_enabled?.value ?? true);

    if (!active) {
      audio.pause();
      if (phase !== 'chapterTwo' && phase !== 'chapterTwoEnding') audio.currentTime = 0;
      return;
    }

    audio.volume = Math.min(1, Math.max(0, config.bgm_volume?.value ?? .45));
    if (audio.paused) {
      void audio.play().catch((error) => console.warn('[BGM] chapter two playback failed', error));
    }
  }, [chapterTwoBgmSrc, config.audio_music_enabled?.value, config.bgm_volume?.value, phase]);

  const palette = {
    '--bg': config.ui_background?.value ?? '#17161d',
    '--panel': config.ui_panel?.value ?? '#24232c',
    '--accent': config.ui_accent?.value ?? '#e3b86f',
    '--ink': config.ui_text?.value ?? '#f3eee5',
    '--diary-backdrop-image': `url("${config.image_diary_backdrop?.value ?? defaultDiaryBackdrop}")`,
    '--diary-paper-image': `url("${config.image_diary_paper?.value ?? defaultDiaryPaper}")`,
    '--dialogue-ui-image': `url("${config.image_ui_dialogue?.value ?? defaultDialogueUi}")`,
    '--option-ui-image': `url("${config.image_ui_option?.value ?? defaultOptionUi}")`,
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

  useEffect(() => {
    if (phase !== 'ending') return;
    const transitionTimer = window.setTimeout(beginChapterTwo, 5000);
    return () => window.clearTimeout(transitionTimer);
  }, [phase]);

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
      setPhase('chapterTwoEnding');
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
    setPrologueIndex(0);
    setPhase('prologue');
  };
  const updateSpeed = (value: number) => {
    setSpeed(value);
    localStorage.setItem('wangchuan.moveSpeed', String(value));
  };
  const chapterTwoAvailablePeople: GhostId[] = interviewed.length === 0
    ? ['lin']
    : (['lin', 'jin', 'gu'] as GhostId[]).filter((id) => !interviewed.includes(id));
  const visibleDiaryParagraphs = diaryCharacters.slice(0, diaryVisible).join('').split('\n\n');

  return <main className="app" style={palette}>
    <audio ref={chapterOneBgmRef} src={chapterOneBgmSrc} loop preload="auto" hidden />
    <audio ref={chapterTwoBgmRef} src={chapterTwoBgmSrc} loop preload="auto" hidden />
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
      <div className="diary-sheet"><div className="diary-heading"><span className="diary-title">忘川值事录　扉页</span></div><div className={`diary-copy ${diaryVisible >= diaryCharacters.length ? 'complete' : ''}`}>{visibleDiaryParagraphs.map((paragraph, index) => <p key={index}>{paragraph}{index === visibleDiaryParagraphs.length - 1 && diaryVisible < diaryCharacters.length && <i className="diary-caret"/>}</p>)}</div><div className="diary-footer">{diaryVisible >= diaryCharacters.length && <button className="primary" onClick={continueDiary}>走上奈何桥 <span>→</span></button>}</div></div>
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

    {phase === 'ending' && <section className="chapter-end"><div className="end-seal">忘川</div><h2>第一章终了</h2><span className="end-rule"/></section>}
    {phase === 'chapterTwoEnding' && <section className="chapter-end"><div className="end-seal">忘川</div><h2>第二章终了</h2><span className="end-rule"/></section>}
    {phase === 'jinChapter' && <JinChapter onExit={() => setPhase('menu')} initialAffinity={interviewScores.jin}/>}
    {phase === 'linMemory' && <LinMemoryChapter onExit={() => setPhase('menu')} initialAffinity={interviewScores.lin} chaseSpeed={config.lin_chase_speed?.value ?? 90}/>}
    {phase === 'guMemory' && <GuMemoryChapter onExit={() => setPhase('menu')} settings={{
      hapticEnabled: config.gu_vibration_enabled?.value ?? true,
      screenShakeEnabled: config.gu_shake_enabled?.value ?? true,
      earlyInterval: config.gu_early_shake_interval?.value ?? 2.5,
      earlyStrength: config.gu_early_shake_strength?.value ?? 12,
    }}/>}
    {phase === 'chapterTwo' && <div className="chapter-two-fade" aria-hidden="true"/>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);

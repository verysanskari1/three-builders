import { AppState, Phase, Task, Reminder, PMRole, ContestantTask, PhaseId } from './types'

let taskCounter = 0
function t(text: string, owner: '' | 'Kanishkar' | 'Sanskar' | 'Shared', note: string): Task {
  taskCounter++
  return { id: `t${taskCounter}`, text, owner, done: false, note }
}

// Recording checklist tagged by phase. Items without a phase show in every phase.
type SeedItem = { text: string; phase?: PhaseId }
const RECORDING_CHECKLIST_SEED: SeedItem[] = [
  { text: 'Introduced yourself to camera before starting',                    phase: 'plan' },
  { text: 'Walked through your plan out loud before writing any code',        phase: 'plan' },
  { text: 'Talked to camera just before the first prompt',                    phase: 'plan' },
  { text: 'Narrated what you were doing during the build',                    phase: 'build1' },
  { text: 'Reacted on camera when something went wrong',                      phase: 'build1' },
  { text: 'Reacted on camera when the AI did something impressive',           phase: 'build1' },
  { text: 'Did a mid-build check-in: how is it going?',                       phase: 'build1' },
  { text: 'Talked to camera after a major milestone was hit',                 phase: 'build2' },
  { text: 'Demoed the final build to camera',                                 phase: 'build2' },
  { text: 'Gave your final confidence rating on camera',                      phase: 'build2' },
]
const RECORDING_CHECKLIST: ContestantTask[] = RECORDING_CHECKLIST_SEED.map((item, i) => ({
  id: `ct${i + 1}`,
  text: item.text,
  phase: item.phase,
  done: false,
}))

const PHASES: Phase[] = [
  {
    id: 'bf-creative',
    title: '1. BEFORE FRIDAY: Creative & content (Sanskar)',
    time: 'Before Friday',
    group: '1. BEFORE FRIDAY',
    tasks: [
      t('Finalise the build prompt / problem statement', 'Sanskar', ''),
      t('Write the evaluation rubric Chakra will use', 'Sanskar', ''),
      t('Draft Chakra interview questions in 3 levels (easy / medium / hard)', 'Sanskar', 'Per contestant'),
      t('Write and print rules of the challenge (1 large card)', 'Sanskar', 'Host reads on camera'),
      t('Generate Chakra voice samples in ElevenLabs and test playback', 'Sanskar', ''),
      t('Brief yourself on the PM (villain) bit: feedback / can-stacking / code-shipping beats', 'Sanskar', "You're the villain"),
      t('Write skeleton host script + lighting plan per room / production sheet', 'Kanishkar', ''),
      t('Send TellaTV credentials', '', ''),
    ],
  },
  {
    id: 'bf-comms',
    title: '1. BEFORE FRIDAY: Contestant comms & decisions (Shared)',
    time: 'Before Friday',
    group: '1. BEFORE FRIDAY',
    tasks: [
      t('Confirm with each contestant which AI accounts/models they want', 'Sanskar', ''),
      t('Ask each contestant about allergies and dietary preferences', 'Sanskar', ''),
      t('Send each contestant a calm brief: arrival time, dress code, what to bring', 'Sanskar', ''),
      t('Confirm staggered arrival times between 9:30–10:30 AM', 'Sanskar', ''),
      t('Wednesday briefing call: full team together', 'Shared', ''),
      t('Create WhatsApp group with all ADs', 'Kanishkar', ''),
      t('Production Plan finalised and shared', 'Kanishkar', ''),
      t('Call Sheet finalised and shared', 'Kanishkar', 'See dedicated tab: Kanishkar to build before event'),
    ],
  },
  {
    id: 'bf-ai',
    title: '1. BEFORE FRIDAY: AI accounts & tools (Kanishkar)',
    time: 'Before Friday',
    group: '1. BEFORE FRIDAY',
    tasks: [
      t('Buy / provision the required AI accounts: paid plans on contestant logins', 'Sanskar', ''),
      t("Test each login on the actual build machine they'll use", 'Sanskar', ''),
      t('Verify token / cost tracking can be pulled live for The Receipt', 'Sanskar', ''),
    ],
  },
  {
    id: 'bf-props',
    title: '1. BEFORE FRIDAY: Props to buy / print (Kanishkar)',
    time: 'Before Friday',
    group: '1. BEFORE FRIDAY',
    tasks: [
      t('Print problem statement (1 sealed envelope per contestant)', 'Sanskar', ''),
      t("Name tags: 'HI my name is Vibe Coder', 'Junior Dev', 'Senior Dev'", 'Sanskar', ''),
      t('Fake moustache for Sanskar (PM character)', 'Sanskar', ''),
      t('PM costume: suit jacket and tie for Sanskar', 'Sanskar', ''),
      t('Optional PM props: clipboard, fake corporate lanyard, big mug', 'Sanskar', ''),
      t("Cans of Diet Coke (for PM 'stack the cans' bit + lifeline)", 'Sanskar', ''),
    ],
  },
  {
    id: 'bf-rooms',
    title: '1. BEFORE FRIDAY: Rooms & studio (Kanishkar)',
    time: 'Before Friday',
    group: '1. BEFORE FRIDAY',
    tasks: [
      t('Book all rooms in calendar', 'Sanskar', ''),
      t("Set up speakers in long meeting room for Chakra's voice", 'Kanishkar', ''),
    ],
  },
  {
    id: 'bf-equipment',
    title: '1. BEFORE FRIDAY: Equipment (Kanishkar)',
    time: 'Before Friday',
    group: '1. BEFORE FRIDAY',
    tasks: [
      t('Confirm and test all camera equipment', 'Kanishkar', ''),
      t('2 roaming cams for build floor', 'Kanishkar', ''),
      t('1 locked-off cam per build station (over-the-shoulder)', 'Kanishkar', ''),
      t('1 cam in Vibe Check room', 'Kanishkar', ''),
      t('1 locked-off cam in Confession Cam booth', 'Kanishkar', ''),
      t('1 cam in Chakra interview room', 'Kanishkar', ''),
      t('Lav mics: one per contestant + host + PM (Sanskar)', 'Kanishkar', ''),
      t('Backup batteries + SD cards for all cameras', 'Kanishkar', ''),
      t('Tella TV / screen recording installed on each build machine', 'Sanskar', 'Split recording every 1 hour'),
      t('Live token/cost tracking dashboard ready (The Receipt)', 'Sanskar', ''),
    ],
  },
  {
    id: 'bf-logistics',
    title: '1. BEFORE FRIDAY: Logistics & people (Kanishkar)',
    time: 'Before Friday',
    group: '1. BEFORE FRIDAY',
    tasks: [
      t("Book Ohshin's return flight", 'Sanskar', ''),
      t('Email building security with names of everyone entering', 'Sanskar', ''),
      t('Order lunch (covering all dietary needs)', 'Sanskar', ''),
      t('Stock fridge with water, energy drinks, Diet Coke', 'Sanskar', ''),
      t('Snacks at each build station (avoid crunchy wrappers: audio)', 'Sanskar', ''),
    ],
  },
  {
    id: 'fm-setup',
    title: '2. FRIDAY MORNING: Before contestants arrive',
    time: '9:00–9:30 AM',
    group: '2. FRIDAY MORNING',
    tasks: [
      t('All cameras powered on, white-balanced, framed', 'Kanishkar', ''),
      t('All build machines logged in, AI accounts open', 'Kanishkar', ''),
      t('Screen recording tested and rolling on every build machine', 'Kanishkar', ''),
      t('Audio check: every lav, every room', 'Kanishkar', ''),
      t('The Receipt tracking system live and verified', 'Kanishkar', ''),
      t("Sanskar in PM costume staged: moustache and suit on standby (don't reveal)", 'Sanskar', ''),
      t('Sealed problem statement envelopes ready', 'Sanskar', ''),
      t('Name tags laid out, ready to hand over on arrival', 'Sanskar', ''),
    ],
  },
  {
    id: 'pre-arrival',
    title: '3. BEFORE ARRIVAL PHASE',
    time: '9:30 AM',
    group: '3. ARRIVAL',
    tasks: [
      t('Vibe Check room camera rolling', 'Kanishkar', ''),
      t('Build floor roaming cams rolling for arrival B-roll', 'Kanishkar', ''),
    ],
  },
  {
    id: 'during-arrival',
    title: '3. DURING ARRIVAL',
    time: '9:30–10:30 AM',
    group: '3. ARRIVAL',
    tasks: [
      t('Hand out name tags: capture B-roll of them putting tags on', 'Kanishkar', ''),
      t('Mic everyone up: lavs ON and recording', 'Kanishkar', ''),
      t('Shoot intros to camera: name / role / years coding', 'Kanishkar', ''),
      t('Capture arrival shots: walking in, sitting down, looking around', 'Kanishkar', ''),
      t('Hype video / Mortal Kombat-style poses for each contestant', 'Kanishkar', ''),
      t('Help each contestant set up at their station', 'Kanishkar', ''),
    ],
  },
  {
    id: 'pre-plan',
    title: '4. BEFORE PLAN PHASE',
    time: '10:30 AM',
    group: '4. PLAN PHASE',
    tasks: [
      t('Vibe Check room set, branded backdrop visible', 'Kanishkar', ''),
      t("Camera rolling in each contestant's room", 'Kanishkar', ''),
      t('Screen recording confirmed on every machine', 'Kanishkar', ''),
      t("Printed rules card in host's hand", 'Sanskar', ''),
      t('3 lifeline cards ready to present', 'Sanskar', ''),
    ],
  },
  {
    id: 'vibe-check',
    title: '4. DURING THE VIBE CHECK (pre-Plan)',
    time: '10:30 AM',
    group: '4. PLAN PHASE',
    tasks: [
      t('Each contestant picks their AI model on camera', 'Sanskar', 'Ask: Which model? Why? What can go wrong?'),
      t('If Claude → ask about the 5-hour rate limits', 'Sanskar', ''),
      t('Capture first Confidence Meter score (1–10)', 'Sanskar', ''),
      t('Ask: Who are you most worried about? What position will you place?', 'Sanskar', ''),
      t('Read the rules out one by one, on camera', 'Sanskar', ''),
      t('Offer the 3 lifelines', 'Sanskar', ''),
    ],
  },
  {
    id: 'during-plan',
    title: '4. DURING PLAN PHASE',
    time: '10:30–11:00 AM',
    group: '4. PLAN PHASE',
    tasks: [
      t('Camera records each contestant the full 30 minutes', 'Kanishkar', ''),
      t("Producer prompts Vibe Coder: 'Are you just starting like this?'", 'Sanskar', ''),
      t('Capture Junior Dev making a CLAUDE.md', 'Kanishkar', ''),
      t('Capture Senior Dev building a SKILLS.md', 'Kanishkar', ''),
      t('Check API/token usage at end of Plan Phase', 'Kanishkar', ''),
      t('Plan Cam piece-to-camera at the end: 90 seconds each', 'Sanskar', ''),
      t('Each contestant walks through plan + UI sketch to camera', 'Sanskar', ''),
    ],
  },
  {
    id: 'pre-build1',
    title: '5. BEFORE BUILD PHASE 1',
    time: '11:00 AM',
    group: '5. BUILD PHASE 1',
    tasks: [
      t('Bring all contestants back to Vibe Check room', 'Sanskar', ''),
      t('Second Confidence Meter reading on camera', 'Sanskar', ''),
      t('Ask: Who worries you most? What position? Anything going wrong or better?', 'Sanskar', ''),
      t('Confirm model choice for build phase', 'Sanskar', ''),
      t('Two roaming cams ready on the build floor', 'Kanishkar', ''),
      t('Screen captures rolling on every machine', 'Kanishkar', ''),
      t('Host commentary mic separate and recording', 'Kanishkar', ''),
    ],
  },
  {
    id: 'during-build1',
    title: '5. DURING BUILD PHASE 1',
    time: '11:00 AM – 1:30 PM',
    group: '5. BUILD PHASE 1',
    tasks: [
      t('Quick on-cam check-ins at 12:00 PM and 1:00 PM', 'Sanskar', ''),
      t('Encourage contestants to talk to camera about AI wins/fails', 'Sanskar', ''),
      t('Check token usage every 30 minutes (for The Receipt)', 'Kanishkar', ''),
    ],
  },
  {
    id: 'pm-round',
    title: '5. PM ROUND: Sanskar enters in costume',
    time: 'During Build Phase 1',
    group: '5. BUILD PHASE 1',
    tasks: [
      t('Give one contestant 15 minutes of pointless feedback', 'Sanskar', ''),
      t("Tell another to stack Diet Coke cans 'because it talks about architecture'", 'Sanskar', ''),
      t('Sit with the third and start shipping code: helpful but disruptive', 'Sanskar', ''),
    ],
  },
  {
    id: 'pre-lunch',
    title: '6. BEFORE LUNCH',
    time: '1:30 PM',
    group: '6. LUNCH',
    tasks: [
      t('Lunch confirmed delivered, allergies respected', 'Kanishkar', ''),
      t('Camera rolling for casual lunch B-roll', 'Kanishkar', ''),
      t('Crew break scheduled and communicated', 'Kanishkar', ''),
    ],
  },
  {
    id: 'pre-build2',
    title: '7. BEFORE BUILD PHASE 2',
    time: '2:00 PM',
    group: '7. BUILD PHASE 2',
    tasks: [
      t('All contestants back at stations', 'Kanishkar', ''),
      t('Screen recording resumed on every machine', 'Kanishkar', ''),
      t('Bug Bounty PR ready to drop at 3:00 PM', 'Sanskar', ''),
      t('Countdown timer / clock prepared for final stretch', 'Kanishkar', ''),
    ],
  },
  {
    id: 'during-build2',
    title: '7. DURING BUILD PHASE 2',
    time: '2:00–4:00 PM',
    group: '7. BUILD PHASE 2',
    tasks: [
      t('On-cam check-ins at 2:30 PM and 3:30 PM', 'Sanskar', ''),
      t('3:00 PM: host PRs pre-written Bug Bounty bug into each repo', 'Sanskar', ''),
      t('Capture any lifeline usage on camera', 'Kanishkar', ''),
      t('Towards the end: visible countdown, ramp the urgency', 'Sanskar', ''),
      t('Call out time remaining: "20 mins to go" to everyone: capture reactions', 'Sanskar', ''),
    ],
  },
  {
    id: 'pre-demos',
    title: '8. BEFORE THE DEMOS',
    time: '4:00 PM',
    group: '8. DEMOS',
    tasks: [
      t('Crew reset: Vibe Check room ready', 'Kanishkar', ''),
      t('Clean screen recording set up for each demo', 'Kanishkar', ''),
      t('Reaction cam ready for opponents watching the demo', 'Kanishkar', ''),
    ],
  },
  {
    id: 'during-demos',
    title: '8. DURING THE DEMOS',
    time: '4:00 PM',
    group: '8. DEMOS',
    tasks: [
      t('Final Confidence Meter score from each contestant', 'Sanskar', ''),
      t('Show what they built, which test cases passed', 'Sanskar', ''),
      t('Ask: Any regrets? Model choice? Lifeline?', 'Sanskar', ''),
      t('Function check: print random function, ask what it does', 'Sanskar', ''),
    ],
  },
  {
    id: 'pre-interview',
    title: '9. BEFORE CHAKRA INTERVIEW',
    time: '4:30 PM',
    group: '9. CHAKRA INTERVIEW',
    tasks: [
      t('Feed Chakra: codebase + prompt history + final website for each contestant', 'Sanskar', ''),
      t('3-level interview questions queued (easy / medium / hard)', 'Sanskar', ''),
      t("Sanskar's laptop set up in long meeting room with speakers", 'Kanishkar', ''),
      t('Camera and clean audio rolling in interview room', 'Kanishkar', ''),
      t('FLAG: confirm interview length: 30 min vs 10 min × 3 parallel', 'Sanskar', 'Open question to resolve'),
    ],
  },
  {
    id: 'during-interview',
    title: '9. DURING THE INTERVIEW',
    time: '4:30 PM',
    group: '9. CHAKRA INTERVIEW',
    tasks: [
      t('Capture every interview on camera', 'Kanishkar', ''),
      t("Capture each contestant's reaction immediately after their interview", 'Sanskar', ''),
      t('Get one positive + one piece of feedback about Chakra from each', 'Sanskar', ''),
      t('Capture any jokes about the interviewer', 'Sanskar', ''),
    ],
  },
  {
    id: 'pre-announce',
    title: '10. BEFORE WINNER ANNOUNCEMENT',
    time: '5:00 PM',
    group: '10. WINNER ANNOUNCEMENT',
    tasks: [
      t('Feed meeting transcript into Claude → ask for winner + reasoning', 'Sanskar', ''),
      t("Generate Chakra's announcement voice line in ElevenLabs", 'Sanskar', ''),
      t('Over-the-shoulder shot of laptop in collab area set up', 'Kanishkar', ''),
      t('All three contestants in frame for the wide shot', 'Kanishkar', ''),
    ],
  },
  {
    id: 'during-announce',
    title: '10. DURING THE ANNOUNCEMENT',
    time: '5:00 PM',
    group: '10. WINNER ANNOUNCEMENT',
    tasks: [
      t('Chakra announces the result via ElevenLabs voice', 'Sanskar', ''),
      t('One good thing + one bad thing said about each contestant before reveal', 'Sanskar', ''),
      t('Host closing monologue: multiple takes', 'Sanskar', ''),
      t('Capture contestant reactions live and again as pickups', 'Kanishkar', ''),
      t('2 lines from the winner themselves', 'Sanskar', ''),
      t('Winner shakes Diet Coke like champagne: confetti pop', 'Sanskar', ''),
    ],
  },
  {
    id: 'before-wrap',
    title: '11. BEFORE WRAP',
    time: '6:30 PM',
    group: '11. WRAP',
    tasks: [
      t('Exit interview with each contestant', 'Sanskar', ''),
      t('Sign-off to camera from each contestant', 'Sanskar', ''),
      t('Final B-roll pass: see Shot List tab', 'Kanishkar', ''),
      t('Back up all footage to drives before crew leaves', 'Kanishkar', ''),
    ],
  },
]

const REMINDERS: Reminder[] = [
  {
    id: 'r1',
    text: 'Screenshot token usage on each machine: file as: vibe-HHMM, junior-HHMM, senior-HHMM',
    time: '11:30',
    fired: false,
    repeatMinutes: 30,
    repeatUntil: '16:00',
  },
  { id: 'r2', text: 'PM enters in 5 minutes: Sanskar get in costume', time: '11:55', fired: false },
  { id: 'r3', text: 'Mid-Build 1 check-in on camera', time: '12:00', fired: false },
  { id: 'r4', text: '1:00 PM Build 1 check-in on camera', time: '13:00', fired: false },
  { id: 'r5', text: 'Build Phase 1 ending in 5 minutes', time: '13:25', fired: false, broadcastToContestants: true },
  { id: 'r6', text: 'Lunch break: pause timers', time: '13:30', fired: false, broadcastToContestants: true },
  { id: 'r7', text: 'Resume timers: Build Phase 2 starts now', time: '14:00', fired: false, broadcastToContestants: true },
  { id: 'r8', text: '2:30 PM Build 2 check-in on camera', time: '14:30', fired: false },
  { id: 'r9', text: 'Drop the Bug Bounty PR into each repo NOW', time: '15:00', fired: false },
  { id: 'r10', text: '3:30 PM Build 2 check-in on camera', time: '15:30', fired: false },
  { id: 'r11', text: '20 MINS LEFT: call it out loud to everyone, capture reactions', time: '15:40', fired: false, broadcastToContestants: true },
  { id: 'r12', text: 'Build Phase 2 ending in 5 minutes', time: '15:55', fired: false, broadcastToContestants: true },
  { id: 'r13', text: 'Demos start: final Confidence Meter', time: '16:00', fired: false },
  { id: 'r14', text: 'Chakra interview prep: feed it the codebases', time: '16:30', fired: false },
  { id: 'r15', text: 'Winner monologue: multiple takes', time: '17:00', fired: false },
]

const PM_ROLES: PMRole[] = [
  {
    label: 'Contestant 1: pointless feedback',
    text: "Pull up a chair. Ask what their architecture is. Give useless feedback: 'Have we thought about the user\'s emotional journey through the ticket?' / 'I\'m not feeling the synergy between the frontend and the backend.' / 'Can you make the buttons feel more… premium?' / 'This is great. Can you do it again, but bolder?' / 'Make it dark mode. Actually light mode. Actually both, with a toggle.' / 'Is this scalable to a billion users?' Walk away without resolving anything.",
  },
  {
    label: 'Contestant 2: stack the Diet Cokes',
    text: "Tell them you need to see their 'systems thinking' demonstrated physically. Hand them Diet Coke cans. Tell them to stack them in a pyramid in the pantry area. When they ask why: 'Because it\'ll teach you about architecture.' Watch them do it.",
  },
  {
    label: 'Contestant 3: helpful but disruptive',
    text: "Sit down at their machine. Write one big prompt: something like 'Refactor the entire codebase into microservices' or 'Rewrite all of this in Rust for performance' or 'Convert this into a multi-agent system with at least five agents.' Push commits. Refuse to leave. When they protest: 'I\'m just trying to help unblock you.'",
  },
]

const emptyPhaseTimer = () => ({ elapsed: 0, running: false, startedAt: null })
const emptyContestantTimers = () => ({
  currentPhase: 'plan' as PhaseId,
  plan:   emptyPhaseTimer(),
  build1: emptyPhaseTimer(),
  build2: emptyPhaseTimer(),
})

export function getSeedState(): AppState {
  taskCounter = 0
  return {
    phases: PHASES,
    reminders: REMINDERS,
    pmRoles: PM_ROLES,
    timers: {
      vibe:   emptyContestantTimers(),
      junior: emptyContestantTimers(),
      senior: emptyContestantTimers(),
    },
    notifications: [],
    pauseRequests: [],
    contestantNotes: { vibe: '', junior: '', senior: '' },
    contestantChecklists: {
      vibe:   RECORDING_CHECKLIST.map(t => ({ ...t, id: `vibe-${t.id}` })),
      junior: RECORDING_CHECKLIST.map(t => ({ ...t, id: `junior-${t.id}` })),
      senior: RECORDING_CHECKLIST.map(t => ({ ...t, id: `senior-${t.id}` })),
    },
    sharedInfo: '',
  }
}

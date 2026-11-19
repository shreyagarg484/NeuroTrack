import type { Insight, LearningContent, RecipeSet } from './gemini.js';

export type SignalSession = {
  createdAt: string;
  task: string;
  accuracy: number;
  medianRt: number;
  misses?: number;
};

export type PersonalSignals = {
  sessions: SignalSession[];
  context: Array<Record<string, unknown>>;
  habits: Array<Record<string, unknown>>;
  checkin: Record<string, unknown> | null;
};

export const taskTopics: Record<string, string> = {
  'n-back': 'Working memory and the N-back task',
  'digit-span': 'Working memory and the N-back task',
  'simple-reaction': 'Processing speed and reaction time',
  'choice-reaction': 'Processing speed and response selection',
  stroop: 'Selective attention and response inhibition',
  'go-no-go': 'Selective attention and response inhibition',
  'corsi-spatial': 'Spatial memory and visual scanning',
  'visual-search': 'Spatial memory and visual scanning',
  'time-perception': 'Time perception and effort',
  'trail-making': 'Sequencing and task switching'
};

const learningLibrary: LearningContent[] = [
  {
    title: 'Working memory and updating',
    explanation:
      'Working memory keeps a small amount of information available while you use it. N-back and Digit Span tasks explore different aspects of short-term maintenance and updating: holding items in mind, comparing them with new input, and reordering them when asked.',
    processes: ['Maintaining recent information', 'Updating what is currently relevant', 'Selective attention', 'Response control'],
    evidence:
      'N-back and digit-span tasks are commonly used in cognitive science to study working-memory demands. Performance reflects several interacting skills and task conditions, so a single score is a snapshot rather than a fixed trait.',
    limitations:
      'Short browser tasks are affected by practice, sleep, device latency, motivation and task settings. They are educational observations, not a diagnosis or a standalone clinical assessment.'
  },
  {
    title: 'Selective attention and response inhibition',
    explanation:
      'Selective attention is the ability to focus on what matters while ignoring competing information. Stroop and Go/No-Go tasks create conflict or require withholding a prepared response, which makes the effort of inhibition visible in accuracy and response time.',
    processes: ['Selective attention', 'Response inhibition', 'Conflict monitoring', 'Sustained attention'],
    evidence:
      'Stroop-like interference and Go/No-Go commission errors are widely used in cognitive research. Effects depend on task design, practice and context, and they are not specific to any diagnosis.',
    limitations:
      'A short browser task cannot measure attention in daily life. Results are influenced by device latency, distractions and how the task was explained.'
  },
  {
    title: 'Processing speed and task switching',
    explanation:
      'Processing speed describes how quickly you can perceive a cue and produce a response. Reaction-time and trail-making tasks add decision and sequencing steps, showing how speed changes when a task becomes more complex.',
    processes: ['Perceptual speed', 'Response selection', 'Task switching', 'Visual search', 'Sequencing'],
    evidence:
      'Simple and choice reaction-time tasks, along with trail-making tasks, are used to describe performance under specific conditions. They are useful for personal comparison over time, not as standalone measures of ability.',
    limitations:
      'Browser timing is approximate and depends on the device and input method. Small differences are usually not meaningful without repeated sessions.'
  },
  {
    title: 'Spatial memory and visual scanning',
    explanation:
      'Spatial memory holds the location and order of visual information for a short time. Corsi and visual-search tasks ask you to reproduce a sequence or find a target among distractors, which draws on scanning, memory and selective attention.',
    processes: ['Spatial short-term memory', 'Visual scanning', 'Selective attention', 'Sequence reproduction'],
    evidence:
      'Corsi blocks and visual-search paradigms are used in cognitive research to explore spatial memory and attention. Performance varies with sequence length, clutter and task instructions.',
    limitations:
      'Screen size, touch or mouse input and distractions affect these tasks. Results describe a moment, not a diagnosis.'
  },
  {
    title: 'Time perception and effort',
    explanation:
      'Time perception is your sense of how long an interval lasts. Estimating time without a clock depends on attention, arousal and how demanding the situation feels, so estimates can drift when you are tired or busy.',
    processes: ['Interval estimation', 'Attention allocation', 'Arousal and effort', 'Working memory'],
    evidence:
      'Time-estimation tasks are used to study how subjective duration changes with task demands. Accuracy varies widely between people and days, and it is not a clinical measure.',
    limitations:
      'A single estimate is noisy. Device timers, counting strategies and expectations can all shape the result.'
  },
  {
    title: 'Sequencing and task switching',
    explanation:
      'Sequencing means holding a goal and completing steps in the right order. Trail-making and multi-step tasks show how visual search, switching and persistence combine when a task has to be finished correctly.',
    processes: ['Goal maintenance', 'Task switching', 'Visual search', 'Error monitoring'],
    evidence:
      'Trail-making tasks are used to observe sequencing and flexibility under controlled conditions. Completion time and errors both matter, and practice usually changes performance.',
    limitations:
      'These tasks are sensitive to device input and familiarity. They are educational observations, not a diagnosis.'
  }
];

export function learningForTopic(topic: string): LearningContent {
  const normalised = topic.trim().toLowerCase();
  const match = learningLibrary.find((item) => normalised.includes(item.title.toLowerCase()) || item.title.toLowerCase().includes(normalised));
  return match ?? learningLibrary[0];
}

export const builtinRecipes: Record<'high' | 'moderate' | 'low', RecipeSet> = {
  high: {
    band: 'High Focus',
    items: [
      { category: 'Hostel Budget', title: 'Roasted Chana & Green Tea', price: '₹20', detail: 'Chana adds plant protein and fiber; green tea naturally contains caffeine and L-theanine. Nutrient content does not guarantee a focus effect.' },
      { category: 'Fresh Fruit', title: 'Bananas with Peanut Butter', price: '₹30', detail: 'A convenient mix of fruit carbohydrate with filling fats and protein from peanut butter.' },
      { category: 'Nutrient-Dense', title: 'Walnuts & Dark Chocolate (70%)', detail: 'Walnuts provide unsaturated fats; cocoa contains flavanols. These are food nutrients, not a promise of faster cognitive processing.' }
    ]
  },
  moderate: {
    band: 'Moderate Focus / Strain',
    items: [
      { category: 'Hostel Budget', title: 'Sprouted Moong Salad & Lemon', price: '₹25', detail: 'Moong provides plant protein and carbohydrate; add lemon and vegetables if available for a simple, filling snack.' },
      { category: 'Fresh Fruit', title: 'Apple Slices with Almonds', price: '₹35', detail: 'Fruit with nuts can make a convenient snack with fiber, fats and some protein.' },
      { category: 'Nutrient-Dense', title: 'Pumpkin Seeds & Curd', detail: 'A practical combination of protein plus minerals such as zinc and magnesium; it is not a treatment for fatigue.' }
    ]
  },
  low: {
    band: 'Low Focus / High Fatigue',
    items: [
      { category: 'Hostel Budget', title: 'Electrolyte Coconut Water', price: '₹40', detail: 'A drink that supplies fluid and some electrolytes, including potassium. Choose it if it suits you and is available.' },
      { category: 'Fresh Fruit', title: 'Orange & Mixed Berries', price: '₹45', detail: 'Fruit provides fluid, carbohydrate and vitamin C; fresh, frozen or seasonal options can work.' },
      { category: 'Nutrient-Dense', title: 'Boiled Eggs / Tofu with Pepper', detail: 'Eggs and tofu provide protein; eggs also contain choline. Food choices do not diagnose or correct cognitive symptoms.' }
    ]
  }
};

export function bandForScore(score: number): 'high' | 'moderate' | 'low' {
  if (score >= 80) return 'high';
  if (score >= 60) return 'moderate';
  return 'low';
}

const round = (value: number) => Math.round(value);
const mean = (values: number[]) => (values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : null);

function localInsight(signals: PersonalSignals): Insight {
  const sessions = signals.sessions;
  const averageAccuracy = mean(sessions.map((session) => session.accuracy));
  const averageRt = mean(sessions.map((session) => session.medianRt));
  const latest = sessions[0];
  const oldest = sessions[sessions.length - 1];

  const observations: string[] = [];
  if (averageAccuracy !== null) {
    observations.push(`Across ${sessions.length} saved non-synthetic session${sessions.length === 1 ? '' : 's'}, average accuracy is ${averageAccuracy}%${averageRt !== null ? ` with a ${averageRt} ms median response` : ''}.`);
  }
  if (latest) {
    observations.push(`Most recently, ${latest.task} recorded ${latest.accuracy}% accuracy${typeof latest.misses === 'number' ? ` with ${latest.misses} missed response${latest.misses === 1 ? '' : 's'}` : ''}.`);
  }
  if (oldest && latest && oldest.createdAt !== latest.createdAt && oldest.accuracy !== latest.accuracy) {
    const change = latest.accuracy - oldest.accuracy;
    observations.push(`Comparing the earliest and latest saved sessions, accuracy moved ${change > 0 ? 'up' : 'down'} by ${Math.abs(change)} percentage points.`);
  }
  const sleep = signals.context.flatMap((row) => typeof row.sleepDuration === 'number' && Number.isFinite(row.sleepDuration) ? [row.sleepDuration] : []);
  const lowSleepDays = sleep.filter((hours) => hours < 6).length;
  if (sleep.length) {
    observations.push(`Across ${sleep.length} journal day${sleep.length === 1 ? '' : 's'}, average recorded sleep duration is ${mean(sleep) ?? 0} hours${lowSleepDays ? `, with ${lowSleepDays} day${lowSleepDays === 1 ? '' : 's'} under 6 hours` : ''}.`);
  }
  const stress = signals.context.flatMap((row) => typeof row.stress === 'number' && Number.isFinite(row.stress) ? [row.stress] : []);
  if (stress.length) {
    observations.push(`Average recorded stress across ${stress.length} journal day${stress.length === 1 ? '' : 's'} is ${mean(stress) ?? 0} out of 5.`);
  }
  const away = signals.habits.filter((row) => row.phoneEnvironment === 'In another room').length;
  if (signals.habits.length) {
    observations.push(`${away} of ${signals.habits.length} habit log${signals.habits.length === 1 ? '' : 's'} recorded the phone in another room.`);
  }
  if (!observations.length) observations.push('No personal sessions are saved yet, so this is a general overview rather than a personal comparison.');

  const suggestions: string[] = [];
  if (lowSleepDays > 0) suggestions.push('Treat consistent sleep as the first experiment: keep a similar bedtime for a week and compare your next session scores.');
  if (stress.length && (mean(stress) ?? 0) >= 4) suggestions.push('On higher-stress days, try a shorter task or a brief walk before testing, then note whether response time changes.');
  if (away > 0) suggestions.push('Compare sessions on days when your phone was in another room with days when it was nearby.');
  suggestions.push('Keep task difficulty, trials and device consistent so changes are easier to interpret.');
  if (suggestions.length < 2) suggestions.push('Add one context note per day, such as caffeine or interruptions, to give future comparisons more detail.');

  return {
    headline: sessions.length ? `Your ${sessions.length} saved session${sessions.length === 1 ? '' : 's'} show a personal baseline.` : 'Start with a few sessions to build a baseline.',
    summary:
      sessions.length && averageAccuracy !== null
        ? `Your saved sessions average ${averageAccuracy}% accuracy. Use the observations below as questions to explore, not as conclusions about ability. Small day-to-day changes are normal and depend on sleep, context, practice and device timing.`
        : 'There are no personal sessions saved yet. Complete a short cognitive task and add a daily context note, then return here for a personal summary.',
    observations: observations.slice(0, 5),
    suggestions: suggestions.slice(0, 4),
    caution:
      'These are descriptive observations from your own logs. They do not establish cause, diagnose a condition, or replace advice from a qualified professional.'
  };
}

export { localInsight };

const SUBJECTS = [
    "en halvspist brødskive", "Bjørn Eidsvåg", "en gretten elg", "naboens katt",
    "frossenpizza", "brunost", "en sliten hipster", "Kong Harald", "en Tesla i ladekø",
    "en bortkommen turist", "Kurt Nilsen", "Kygo på ferie", "en gjeng med måker"
];

const ACTIONS = [
    "prøver å danse", "spiser taco", "går på ski innendørs", "klager på været",
    "drømmer om syden", "ser på Dagsrevyen", "finner opp kruttet på nytt",
    "kjører i kollektivfeltet", "kjemper mot vindmøller", "lager vafler uten rømme"
];

const CONTEXTS = [
    "midt på Karl Johan.", "under nordlyset.", "i kø på polet.", "på toppen av Galdhøpiggen.",
    "hos tannlegen.", "i en badstue.", "på hytta (uten strøm).", "i en rundkjøring i Drammen.",
    "bak en pølsebod i Narvik.", "på Afterski i Hemsedal."
];

const AI_THOUGHTS = [
    "Analyzing pixels... detected traces of heavy metal and happiness.",
    "Scanning for Vikings... Found 3 potential candidates.",
    "Calculating chaos levels... Result: 110% KOS.",
    "Detecting high levels of 'Hygge' mixed with mild despair.",
    "Visual cortex overload. Rebooting aesthetics engine...",
    "Interpreting abstract shapes... Is that a Lutefisk?"
];

export const getRandomStory = () => {
    // 30% chance of a "fake AI" technical analysis message
    if (Math.random() < 0.3) {
        return `[AI LOG]: ${AI_THOUGHTS[Math.floor(Math.random() * AI_THOUGHTS.length)]}`;
    }

    const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const context = CONTEXTS[Math.floor(Math.random() * CONTEXTS.length)];

    return `AI Vision: Jeg ser ${subject} som ${action} ${context}`;
};


export const CHAOS_STORIES = [
    "Once upon a time in Drammen, a moose walked into a bar. It ordered a waffle.",
    "There is a legend that if you stare at this collage long enough, it stares back.",
    "Denne collagen er sponset av Grandiosa. Respekt for Grandiosa.",
    "I tried to make art, but then I remembered I'm just a JavaScript function.",
    "If chaos had a face, it would look exactly like this. Or maybe like Erna Solberg dancing.",
    "Warning: This image may contain traces of brown cheese and cross-country skiing.",
    "Har du hørt om hunden som gikk over veien? Den ville til den andre siden. (Classic dad joke)",
    "This is what happens when you let a Viking verify his own code.",
    "Lagd med kjærlighet, kaffe, og en dæsj bug-fixing."
];

export const getRandomStory = () => {
    return CHAOS_STORIES[Math.floor(Math.random() * CHAOS_STORIES.length)];
};

import { generateVisionCaption } from './generators';

export const getRandomStory = () => {
    const caption = generateVisionCaption();
    // Add a cool prefix or just return the separate caption if UI handles labeling.
    // User requested "Replace 'AI Vision' label... Update label and improve caption...".
    // I will return a string that includes a cooler label/prefix.
    return `🤖 Vision: ${caption}`;
};

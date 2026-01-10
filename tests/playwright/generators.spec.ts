import { test, expect } from '@playwright/test';
import { generateKurtWisdom, generateTileContent, generateVisionCaption } from '../../src/utils/generators';

test.describe('Generators', () => {

    test('generateKurtWisdom produces safe content from allowed list', () => {
        for (let i = 0; i < 50; i++) {
            const wisdom = generateKurtWisdom(i);
            expect(wisdom).toContain("Kurt says:");
            expect(wisdom.length).toBeGreaterThan(10);

            // Basic safety check (though our list is safe, this confirms logic)
            const forbidden = ["hate", "violence"];
            const hasForbidden = forbidden.some(f => wisdom.toLowerCase().includes(f));
            expect(hasForbidden).toBe(false);
        }
    });

    test('generateTileContent produces consistent output for same seed', () => {
        const seed = 12345;
        const c1 = generateTileContent('test', seed);
        const c2 = generateTileContent('test', seed);
        expect(c1).toEqual(c2);
        expect(c1.title.length).toBeGreaterThan(0);
        expect(c1.body.length).toBeGreaterThan(0);
    });

    test('generateVisionCaption updates text and removes label', () => {
        // We aren't testing UI here, just the string gen
        const caption = generateVisionCaption(1);
        expect(caption).not.toContain("AI Vision");
        expect(caption.length).toBeGreaterThan(10);
    });
});

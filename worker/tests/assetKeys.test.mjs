import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAssetKeys, getInvalidIdError, isLegacyKeySafe, isValidId, keysMatch } from '../src/assetKeys.ts';

const projectId = 'fd4237ba-f675-4905-b8f4-782b79ec63c8';
const assetId = 'fb77ab5a-f90f-4831-a41b-ee31d68fb541';

test('isValidId accepts uuid', () => {
    assert.equal(isValidId(projectId), true);
});

test('isValidId rejects non-uuid', () => {
    assert.equal(isValidId('not-a-uuid'), false);
});

test('buildAssetKeys returns expected paths', () => {
    const keys = buildAssetKeys(projectId, assetId);
    assert.equal(keys.originalKey, `${projectId}/${assetId}/original`);
    assert.equal(keys.thumbKey, `${projectId}/${assetId}/thumb`);
});

test('keysMatch validates expected keys', () => {
    const keys = buildAssetKeys(projectId, assetId);
    assert.equal(keysMatch(projectId, assetId, keys.originalKey, keys.thumbKey), true);
    assert.equal(keysMatch(projectId, assetId, 'bad', keys.thumbKey), false);
});

test('getInvalidIdError returns message for invalid ids', () => {
    assert.equal(getInvalidIdError('bad', 'projectId'), 'Invalid projectId');
    assert.equal(getInvalidIdError(projectId, 'projectId'), null);
});

test('isLegacyKeySafe requires ids in key', () => {
    assert.equal(isLegacyKeySafe(projectId, assetId, `${projectId}/${assetId}/original`), true);
    assert.equal(isLegacyKeySafe(projectId, assetId, `assets/${projectId}/${assetId}/thumb`), true);
    assert.equal(isLegacyKeySafe(projectId, assetId, `${projectId}/original`), false);
});

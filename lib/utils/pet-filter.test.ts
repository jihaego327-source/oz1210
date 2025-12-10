import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  filterToursByPet,
  isPetAllowedFromText,
  matchesPetSize,
  type TourWithPetInfo,
} from './pet-filter';

const baseItem: TourWithPetInfo = {
  addr1: '서울시 중구 세종대로',
  areacode: '1',
  contentid: '100',
  contenttypeid: '12',
  title: '테스트 관광지',
  mapx: '126000000',
  mapy: '37000000',
  modifiedtime: '20240101',
};

describe('pet-filter utils', () => {
  it('checks pet allowed text', () => {
    assert.equal(isPetAllowedFromText('반려동물 동반 가능'), true);
    assert.equal(isPetAllowedFromText('반려동물 동반 불가'), false);
    assert.equal(isPetAllowedFromText(undefined), false);
  });

  it('matches pet size keywords', () => {
    assert.equal(matchesPetSize('소형·중형견 가능', ['small']), true);
    assert.equal(matchesPetSize('소형·중형견 가능', ['large']), false);
    assert.equal(matchesPetSize(undefined, ['small']), false);
    assert.equal(matchesPetSize('대형견 가능', []), true);
  });

  it('filters tour list by pet options', () => {
    const items: TourWithPetInfo[] = [
      {
        ...baseItem,
        contentid: '200',
        petInfo: {
          contentid: '200',
          contenttypeid: '12',
          chkpetleash: '반려동물 동반 가능',
          chkpetsize: '소형견 가능',
        },
      },
      {
        ...baseItem,
        contentid: '300',
        petInfo: {
          contentid: '300',
          contenttypeid: '12',
          chkpetleash: '동반 불가',
          chkpetsize: '대형견 불가',
        },
      },
    ];

    const filtered = filterToursByPet(items, { petAllowed: true, petSizes: ['small'] });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].contentid, '200');
  });
});


import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  filterToursByPet,
  isPetAllowed,
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
  describe('isPetAllowedFromText', () => {
    it('checks pet allowed text with basic keywords', () => {
      assert.equal(isPetAllowedFromText('반려동물 동반 가능'), true);
      assert.equal(isPetAllowedFromText('반려동물 동반 불가'), false);
      assert.equal(isPetAllowedFromText(undefined), false);
    });

    it('checks pet allowed text with new keywords (Y, yes)', () => {
      assert.equal(isPetAllowedFromText('Y'), true);
      assert.equal(isPetAllowedFromText('y'), true);
      assert.equal(isPetAllowedFromText('yes'), true);
      assert.equal(isPetAllowedFromText('Yes'), true);
      assert.equal(isPetAllowedFromText('YES'), true);
    });

    it('checks pet allowed text with new keywords (동반가능, 소형견)', () => {
      assert.equal(isPetAllowedFromText('동반가능'), true);
      assert.equal(isPetAllowedFromText('동반 가능'), true);
      assert.equal(isPetAllowedFromText('소형견'), true);
      assert.equal(isPetAllowedFromText('중형견'), true);
      assert.equal(isPetAllowedFromText('대형견'), true);
    });

    it('checks pet allowed text with new keywords (가능함, 허용됨)', () => {
      assert.equal(isPetAllowedFromText('가능함'), true);
      assert.equal(isPetAllowedFromText('허용됨'), true);
    });

    it('returns false when disallow keywords are present', () => {
      assert.equal(isPetAllowedFromText('소형견 불가'), false);
      assert.equal(isPetAllowedFromText('동반 가능하지만 금지'), false);
    });
  });

  describe('matchesPetSize', () => {
    it('matches pet size keywords', () => {
      assert.equal(matchesPetSize('소형·중형견 가능', ['small']), true);
      assert.equal(matchesPetSize('소형·중형견 가능', ['large']), false);
      assert.equal(matchesPetSize(undefined, ['small']), false);
      assert.equal(matchesPetSize('대형견 가능', []), true);
    });
  });

  describe('isPetAllowed', () => {
    it('returns false when petInfo is null or undefined', () => {
      assert.equal(isPetAllowed(null), false);
      assert.equal(isPetAllowed(undefined), false);
    });

    it('checks pet allowed with chkpetleash only', () => {
      const petInfo = {
        contentid: '100',
        contenttypeid: '12',
        chkpetleash: '반려동물 동반 가능',
      };
      assert.equal(isPetAllowed(petInfo), true);
    });

    it('checks pet allowed with chkpetsize included', () => {
      const petInfo1 = {
        contentid: '100',
        contenttypeid: '12',
        chkpetsize: '소형견 가능',
      };
      assert.equal(isPetAllowed(petInfo1), true);

      const petInfo2 = {
        contentid: '200',
        contenttypeid: '12',
        chkpetleash: 'Y',
        chkpetsize: '소형견',
      };
      assert.equal(isPetAllowed(petInfo2), true);
    });

    it('checks pet allowed with multiple fields merged', () => {
      const petInfo = {
        contentid: '100',
        contenttypeid: '12',
        chkpetleash: '동반',
        chkpetsize: '소형견',
        chkpetplace: '실내 가능',
        chkpetfee: '무료',
      };
      assert.equal(isPetAllowed(petInfo), true);
    });

    it('returns false when disallow keywords are present', () => {
      const petInfo = {
        contentid: '100',
        contenttypeid: '12',
        chkpetleash: '동반 불가',
        chkpetsize: '소형견',
      };
      assert.equal(isPetAllowed(petInfo), false);
    });

    it('checks pet allowed with new keywords (Y, yes)', () => {
      const petInfo1 = {
        contentid: '100',
        contenttypeid: '12',
        chkpetleash: 'Y',
      };
      assert.equal(isPetAllowed(petInfo1), true);

      const petInfo2 = {
        contentid: '200',
        contenttypeid: '12',
        chkpetleash: 'yes',
      };
      assert.equal(isPetAllowed(petInfo2), true);
    });
  });

  describe('filterToursByPet', () => {
    it('filters tour list by pet options when petAllowed is true', () => {
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

    it('does not filter when petAllowed is false', () => {
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
        {
          ...baseItem,
          contentid: '400',
          petInfo: null,
        },
      ];

      const filtered = filterToursByPet(items, { petAllowed: false, petSizes: [] });
      assert.equal(filtered.length, 3);
    });

    it('filters by petAllowed when petAllowed is true but petSizes is empty', () => {
      const items: TourWithPetInfo[] = [
        {
          ...baseItem,
          contentid: '200',
          petInfo: {
            contentid: '200',
            contenttypeid: '12',
            chkpetleash: '반려동물 동반 가능',
          },
        },
        {
          ...baseItem,
          contentid: '300',
          petInfo: {
            contentid: '300',
            contenttypeid: '12',
            chkpetleash: '동반 불가',
          },
        },
      ];

      const filtered = filterToursByPet(items, { petAllowed: true, petSizes: [] });
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].contentid, '200');
    });

    it('filters by chkpetsize when only chkpetsize has allowed keyword', () => {
      const items: TourWithPetInfo[] = [
        {
          ...baseItem,
          contentid: '200',
          petInfo: {
            contentid: '200',
            contenttypeid: '12',
            chkpetsize: '소형견 가능',
          },
        },
        {
          ...baseItem,
          contentid: '300',
          petInfo: {
            contentid: '300',
            contenttypeid: '12',
            chkpetsize: '대형견 불가',
          },
        },
      ];

      const filtered = filterToursByPet(items, { petAllowed: true, petSizes: [] });
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].contentid, '200');
    });

    it('filters with new keywords (Y, yes, 소형견)', () => {
      const items: TourWithPetInfo[] = [
        {
          ...baseItem,
          contentid: '200',
          petInfo: {
            contentid: '200',
            contenttypeid: '12',
            chkpetleash: 'Y',
          },
        },
        {
          ...baseItem,
          contentid: '300',
          petInfo: {
            contentid: '300',
            contenttypeid: '12',
            chkpetleash: 'yes',
          },
        },
        {
          ...baseItem,
          contentid: '400',
          petInfo: {
            contentid: '400',
            contenttypeid: '12',
            chkpetsize: '소형견',
          },
        },
        {
          ...baseItem,
          contentid: '500',
          petInfo: {
            contentid: '500',
            contenttypeid: '12',
            chkpetleash: '동반 불가',
          },
        },
      ];

      const filtered = filterToursByPet(items, { petAllowed: true, petSizes: [] });
      assert.equal(filtered.length, 3);
      assert.equal(filtered[0].contentid, '200');
      assert.equal(filtered[1].contentid, '300');
      assert.equal(filtered[2].contentid, '400');
    });
  });
});


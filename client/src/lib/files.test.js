import { isTxtOrMd } from './files';

describe('isTxtOrMd', () => {
  describe('positive', () => {
    it('accepts .txt by name', () => {
      expect(isTxtOrMd({ name: 'req.txt', type: '' })).toBe(true);
    });

    it('accepts .md by name', () => {
      expect(isTxtOrMd({ name: 'notes.MD', type: '' })).toBe(true);
    });

    it('accepts text/plain', () => {
      expect(isTxtOrMd({ name: 'untitled', type: 'text/plain' })).toBe(true);
    });
  });

  describe('negative', () => {
    it('rejects null', () => {
      expect(isTxtOrMd(null)).toBe(false);
    });

    it('rejects pdf', () => {
      expect(isTxtOrMd({ name: 'x.pdf', type: 'application/pdf' })).toBe(false);
    });

    it('rejects empty name without a matching type', () => {
      expect(isTxtOrMd({ name: '', type: '' })).toBe(false);
    });
  });
});

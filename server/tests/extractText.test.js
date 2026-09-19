import { extractText } from '../src/services/extractText.js';

describe('extractText', () => {
  describe('positive', () => {
    it('reads a .txt buffer', () => {
      expect(extractText({ originalname: 'n.txt', buffer: Buffer.from(' hello ') })).toBe('hello');
    });

    it('reads a .md buffer', () => {
      expect(extractText({ originalname: 'n.md', buffer: Buffer.from('# Title') })).toBe('# Title');
    });
  });

  describe('negative', () => {
    it('returns empty string when file is missing', () => {
      expect(extractText(null)).toBe('');
    });

    it('rejects the wrong extension', () => {
      expect(() => extractText({ originalname: 'n.pdf', buffer: Buffer.from('x') })).toThrow(
        'Please attach a .txt or .md file.'
      );
    });

    it('rejects empty content', () => {
      expect(() => extractText({ originalname: 'n.txt', buffer: Buffer.from('  ') })).toThrow(
        'The attached file is empty.'
      );
    });
  });
});

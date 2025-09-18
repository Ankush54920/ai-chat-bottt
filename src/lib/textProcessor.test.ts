import { cleanModelOutput } from './textProcessor';

describe('cleanModelOutput', () => {
  test('should convert HTML strong tags to markdown', () => {
    const input = '<strong>Bold text</strong>';
    const expected = '**Bold text**';
    expect(cleanModelOutput(input)).toBe(expected);
  });

  test('should preserve existing markdown bold', () => {
    const input = '**Already bold**';
    const expected = '**Already bold**';
    expect(cleanModelOutput(input)).toBe(expected);
  });

  test('should preserve LaTeX fractions', () => {
    const input = '\\frac{1}{2}';
    const expected = '\\frac{1}{2}';
    expect(cleanModelOutput(input)).toBe(expected);
  });

  test('should remove citation markers', () => {
    const input = 'This is text [5] with citation';
    const expected = 'This is text with citation';
    expect(cleanModelOutput(input)).toBe(expected);
  });

  test('should convert HTML paragraphs and line breaks', () => {
    const input = '<p>Paragraph</p><br>Line break';
    const expected = 'Paragraph\n\nLine break';
    expect(cleanModelOutput(input)).toBe(expected);
  });

  test('should preserve LaTeX display math', () => {
    const input = '$$x = \\frac{a}{b}$$';
    const expected = '$$x = \\frac{a}{b}$$';
    expect(cleanModelOutput(input)).toBe(expected);
  });

  test('should handle mixed HTML and markdown', () => {
    const input = '<strong>Bold</strong> and *italic* text with [1] citation';
    const expected = '**Bold** and *italic* text with citation';
    expect(cleanModelOutput(input)).toBe(expected);
  });

  test('should normalize whitespace', () => {
    const input = 'Text   with    multiple   spaces\n\n\n\nand newlines';
    const expected = 'Text with multiple spaces\n\nand newlines';
    expect(cleanModelOutput(input)).toBe(expected);
  });

  test('should remove empty markdown markers', () => {
    const input = '** ** and * *';
    const expected = 'and';
    expect(cleanModelOutput(input)).toBe(expected);
  });

  test('should handle complex LaTeX with citations', () => {
    const input = 'The equation [3] is $$\\frac{d}{dx}\\sin(x) = \\cos(x)$$ as shown.';
    const expected = 'The equation is $$\\frac{d}{dx}\\sin(x) = \\cos(x)$$ as shown.';
    expect(cleanModelOutput(input)).toBe(expected);
  });
});
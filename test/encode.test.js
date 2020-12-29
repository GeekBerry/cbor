const url = require('url');
const BigNumber = require('bignumber.js');
const { CONST, Simple, Tagged, Indefinite, encode, decode } = require('../src/index');

class URL extends String {
  toCBOR() {
    return new Tagged(CONST.TAG.URI, this.toString());
  }
}

test('encode === decode', () => {
  const array = [
    Number.MIN_SAFE_INTEGER, -0x1000, -1, 0, 0x10000, 1, Number.MAX_SAFE_INTEGER,
    -Infinity, -Math.PI, -1.25, -Number.MIN_VALUE, NaN, Number.MIN_VALUE, 1.25, Math.PI, Infinity,
    true, false, null, undefined,
    new Date(),
    /0x[0-9a-f]+/,
    Buffer.from('buffer'),
    new Simple(255),
    new Tagged(24, 'tagged'),

    BigInt(-20), BigInt(-1), BigInt(0), BigInt(1), BigInt(20),
    BigInt(Number.MIN_SAFE_INTEGER) * BigInt(1e6), BigInt(Number.MAX_SAFE_INTEGER) * BigInt(1e6),

    BigNumber(-Math.PI).pow(3),
    BigNumber(-12.34), // exponent < 0, padStart with '0', but 1 - exponent < string.length
    BigNumber(-Math.PI),
    BigNumber(0),
    BigNumber(100),
    BigNumber(Math.PI),
    BigNumber(Number.MIN_SAFE_INTEGER).times(Math.PI).pow(3),
    BigNumber(Number.MAX_SAFE_INTEGER).times(1e6),

    new Map([[1, 100], [2, 200]]),
    { a: 1, b: [1, 3] },
  ];

  for (const each of array) {
    const buffer = encode(each);
    const result = decode(buffer);
    expect(result).toEqual(each);
  }
});

test('Indefinite', () => {
  const array = [
    Buffer.from('buffer'),
    'string',
    [1, 2, 3],
    { a: 1, b: 2 },
    new Map([[1, 100], [2, 200]]),
    new Tagged(24, 'tagged'),
  ];

  for (const each of array) {
    const value = new Indefinite(each);
    const buffer = encode(value);

    expect(buffer[buffer.length - 1]).toEqual(CONST.BREAK_CODE);

    const result = decode(buffer);
    expect(result).toEqual(each);
  }
});

test('not Indefinite', () => {
  const array = [
    -1, 0, 1,
    -Math.PI, Math.PI,
    true, false, null, undefined,
    BigInt(-1), BigInt(1),
    new Date(),
    /0x[0-9a-f]+/,
    new Simple(100),
  ];

  for (const each of array) {
    const value = new Indefinite(each);
    const buffer = encode(value);

    expect(buffer[buffer.length - 1]).not.toEqual(CONST.BREAK_CODE);

    const result = decode(buffer);
    expect(result).toEqual(each);
  }
});

// ----------------------------------------------------------------------------
test('BigNumber(Infinity)', () => {
  const value = BigNumber(Infinity);
  const buffer = encode(value);
  const result = decode(buffer);
  expect(result).toEqual(Infinity);
});

test('BigNumber(-Infinity)', () => {
  const value = BigNumber(-Infinity);
  const buffer = encode(value);
  const result = decode(buffer);
  expect(result).toEqual(-Infinity);
});

test('BigNumber(NaN)', () => {
  const value = BigNumber(NaN);
  const buffer = encode(value);
  const result = decode(buffer);
  expect(result).toEqual(NaN);
});

test('Set([null,1,"2"])', () => {
  const value = new Set([null, 1, '2']);
  const buffer = encode(value);
  const result = decode(buffer);
  expect(result).toEqual([null, 1, '2']);
});

test('Indefinite Set([null,1,"2"])', () => {
  const value = new Set([null, 1, '2']);
  const buffer = encode(new Indefinite(value));

  expect(buffer[buffer.length - 1]).toEqual(CONST.BREAK_CODE);

  const result = decode(buffer);
  expect(result).toEqual([null, 1, '2']);
});

test('toCBOR', () => {
  const value = new URL('http://localhost:80');
  const buffer = encode(value);
  const result = decode(buffer);
  expect(result).toEqual(url.parse('http://localhost:80'));
});

test('Indefinite toCBOR', () => {
  const value = new URL('http://localhost:80');
  const buffer = encode(new Indefinite(value));

  expect(buffer[buffer.length - 1]).toEqual(CONST.BREAK_CODE);

  const result = decode(buffer);
  expect(result).toEqual(url.parse('http://localhost:80'));
});

test('unsupported simple', () => {
  const value = new Simple(256);
  expect(() => encode(value)).toThrow('unsupported simple 256');
});

test('Symbol', () => {
  const value = Symbol('symbol');
  expect(() => encode(value)).toThrow('Cannot convert a Symbol value to a string');
});

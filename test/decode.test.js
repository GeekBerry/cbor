const url = require('url');
const BigNumber = require('bignumber.js');
const { CONST, Simple, Tagged, decode } = require('../src/index');

// ----------------------------------------------------------------------------
//              https://tools.ietf.org/html/rfc7049#appendix-A
// ----------------------------------------------------------------------------
test('0', () => {
  const buffer = Buffer.from('00', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(0);
});

test('1', () => {
  const buffer = Buffer.from('01', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(1);
});

test('10', () => {
  const buffer = Buffer.from('0a', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(10);
});

test('23', () => {
  const buffer = Buffer.from('17', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(23);
});

test('24', () => {
  const buffer = Buffer.from('1818', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(24);
});

test('25', () => {
  const buffer = Buffer.from('1819', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(25);
});

test('100', () => {
  const buffer = Buffer.from('1864', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(100);
});

test('1000', () => {
  const buffer = Buffer.from('1903e8', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(1000);
});

test('1000000', () => {
  const buffer = Buffer.from('1a000f4240', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(1000000);
});

test('1000000000000', () => {
  const buffer = Buffer.from('1b000000e8d4a51000', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(1000000000000);
});

test('18446744073709551615', () => {
  const buffer = Buffer.from('1bffffffffffffffff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(18446744073709551615);
  expect(result.toString()).toEqual('18446744073709552000'); // unsafe integer
});

test('18446744073709551616', () => {
  const buffer = Buffer.from('c249010000000000000000', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(BigInt('18446744073709551616'));
});

test('-18446744073709551616', () => {
  const buffer = Buffer.from('3bffffffffffffffff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(-18446744073709551616);
});

test('-18446744073709551617', () => {
  const buffer = Buffer.from('c349010000000000000000', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(BigInt('-18446744073709551617'));
});

test('-1', () => {
  const buffer = Buffer.from('20', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(-1);
});

test('-10', () => {
  const buffer = Buffer.from('29', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(-10);
});

test('-100', () => {
  const buffer = Buffer.from('3863', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(-100);
});

test('-1000', () => {
  const buffer = Buffer.from('3903e7', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(-1000);
});

test('0.0', () => {
  const buffer = Buffer.from('f90000', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(0.0);
});

test('-0.0', () => {
  const buffer = Buffer.from('f98000', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(-0.0);
});

test('1.0', () => {
  const buffer = Buffer.from('f93c00', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(1.0);
});

test('1.1', () => {
  const buffer = Buffer.from('fb3ff199999999999a', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(1.1);
});

test('1.5', () => {
  const buffer = Buffer.from('f93e00', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(1.5);
});

test('65504.0', () => {
  const buffer = Buffer.from('f97bff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(65504.0);
});

test('100000.0', () => {
  const buffer = Buffer.from('fa47c35000', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(100000.0);
});

test('3.4028234663852886e+38', () => {
  const buffer = Buffer.from('fa7f7fffff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(3.4028234663852886e+38);
});

test('1.0e+300', () => {
  const buffer = Buffer.from('fb7e37e43c8800759c', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(1.0e+300);
});

test('5.960464477539063e-8', () => {
  const buffer = Buffer.from('f90001', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(5.960464477539063e-8);
});

test('0.00006103515625', () => {
  const buffer = Buffer.from('f90400', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(0.00006103515625);
});

test('-4.0', () => {
  const buffer = Buffer.from('f9c400', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(-4.0);
});

test('-4.1', () => {
  const buffer = Buffer.from('fbc010666666666666', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(-4.1);
});

test('Infinity 16', () => {
  const buffer = Buffer.from('f97c00', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(Infinity);
});

test('NaN 16', () => {
  const buffer = Buffer.from('f97e00', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(NaN);
});

test('-Infinity 16', () => {
  const buffer = Buffer.from('f9fc00', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(-Infinity);
});

test('Infinity 32', () => {
  const buffer = Buffer.from('fa7f800000', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(Infinity);
});

test('NaN 32', () => {
  const buffer = Buffer.from('fa7fc00000', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(NaN);
});

test('-Infinity 32', () => {
  const buffer = Buffer.from('faff800000', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(-Infinity);
});

test('Infinity 64', () => {
  const buffer = Buffer.from('fb7ff0000000000000', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(Infinity);
});

test('NaN 64', () => {
  const buffer = Buffer.from('fb7ff8000000000000', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(NaN);
});

test('-Infinity 64', () => {
  const buffer = Buffer.from('fbfff0000000000000', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(-Infinity);
});

test('false', () => {
  const buffer = Buffer.from('f4', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(false);
});

test('true', () => {
  const buffer = Buffer.from('f5', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(true);
});

test('null', () => {
  const buffer = Buffer.from('f6', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(null);
});

test('undefined', () => {
  const buffer = Buffer.from('f7', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(undefined);
});

test('simple(16)', () => {
  const buffer = Buffer.from('f0', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(new Simple(16));
});

test('simple(24)', () => {
  const buffer = Buffer.from('f818', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(new Simple(24));
});

test('simple(255)', () => {
  const buffer = Buffer.from('f8ff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(new Simple(255));
});

test('0("2013-03-21T20:04:00Z")', () => {
  const buffer = Buffer.from('c074323031332d30332d32315432303a30343a30305a', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(new Date('2013-03-21T20:04:00.000Z'));
});

test('1(1363896240)', () => {
  const buffer = Buffer.from('c11a514b67b0', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(new Date('2013-03-21T20:04:00.000Z'));
});

test('1(1363896240.5)', () => {
  const buffer = Buffer.from('c1fb41d452d9ec200000', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(new Date('2013-03-21T20:04:00.500Z'));
});

test('23(h`01020304`)', () => {
  const buffer = Buffer.from('d74401020304', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(new Tagged(23, Buffer.from('01020304', 'hex')));
});

test('24(h`6449455446`)', () => {
  const buffer = Buffer.from('d818456449455446', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(new Tagged(24, Buffer.from('6449455446', 'hex')));
});

test('32("http://www.example.com")', () => {
  const buffer = Buffer.from('d82076687474703a2f2f7777772e6578616d706c652e636f6d', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(url.parse('http://www.example.com'));
});

test('h``', () => {
  const buffer = Buffer.from('40', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(Buffer.from(''));
});

test('h`01020304`', () => {
  const buffer = Buffer.from('4401020304', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(Buffer.from('01020304', 'hex'));
});

test('""', () => {
  const buffer = Buffer.from('60', 'hex');
  const result = decode(buffer);
  expect(result).toEqual('');
});

test('"a"', () => {
  const buffer = Buffer.from('6161', 'hex');
  const result = decode(buffer);
  expect(result).toEqual('a');
});

test('"IETF"', () => {
  const buffer = Buffer.from('6449455446', 'hex');
  const result = decode(buffer);
  expect(result).toEqual('IETF');
});

test('"\\', () => {
  const buffer = Buffer.from('62225c', 'hex');
  const result = decode(buffer);
  expect(result).toEqual('"\\');
});

test('\u00fc', () => {
  const buffer = Buffer.from('62c3bc', 'hex');
  const result = decode(buffer);
  expect(result).toEqual('\u00fc');
});

test('\u6c34', () => {
  const buffer = Buffer.from('63e6b0b4', 'hex');
  const result = decode(buffer);
  expect(result).toEqual('\u6c34');
});

test('\ud800\udd51', () => {
  const buffer = Buffer.from('64f0908591', 'hex');
  const result = decode(buffer);
  expect(result).toEqual('\ud800\udd51');
});

test('[]', () => {
  const buffer = Buffer.from('80', 'hex');
  const result = decode(buffer);
  expect(result).toEqual([]);
});

test('[1,2,3]', () => {
  const buffer = Buffer.from('83010203', 'hex');
  const result = decode(buffer);
  expect(result).toEqual([1, 2, 3]);
});

test('[1, [2, 3], [4, 5]]', () => {
  const buffer = Buffer.from('8301820203820405', 'hex');
  const result = decode(buffer);
  expect(result).toEqual([1, [2, 3], [4, 5]]);
});

test('[1,,25]', () => {
  const buffer = Buffer.from('98190102030405060708090a0b0c0d0e0f101112131415161718181819', 'hex');
  const result = decode(buffer);
  expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9,
    10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25,
  ]);
});

test('{}', () => {
  const buffer = Buffer.from('a0', 'hex');
  const result = decode(buffer);
  expect(result).toEqual({});
});

test('{1:2,3:4}', () => {
  const buffer = Buffer.from('a201020304', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(new Map([
    [1, 2],
    [3, 4],
  ]));
});

test('{"a": 1, "b": [2, 3]}', () => {
  const buffer = Buffer.from('a26161016162820203', 'hex');
  const result = decode(buffer);
  expect(result).toEqual({
    a: 1,
    b: [2, 3],
  });
});

test('["a", {"b": "c"}]', () => {
  const buffer = Buffer.from('826161a161626163', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(['a', { b: 'c' }]);
});

test('{"a": "A", "b": "B", "c":"C", "d": "D", "e": "E"}', () => {
  const buffer = Buffer.from('a56161614161626142616361436164614461656145', 'hex');
  const result = decode(buffer);
  expect(result).toEqual({ a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' });
});

test('(_ h`0102`,h`030405`)', () => {
  const buffer = Buffer.from('5f42010243030405ff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(Buffer.from('0102030405', 'hex'));
});

test('(_ "strea","ming")', () => {
  const buffer = Buffer.from('7f657374726561646d696e67ff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual('streaming');
});

test('[_]', () => {
  const buffer = Buffer.from('9fff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual([]);
});

test('[_ 1, [2, 3], [_ 4, 5]]', () => {
  const buffer = Buffer.from('9f018202039f0405ffff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual([1, [2, 3], [4, 5]]);
});

test('[_ 1, [2, 3], [4, 5]]', () => {
  const buffer = Buffer.from('9f01820203820405ff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual([1, [2, 3], [4, 5]]);
});

test('[1, [2, 3], [_, 4, 5]]', () => {
  const buffer = Buffer.from('83018202039f0405ff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual([1, [2, 3], [4, 5]]);
});

test('[1, [_ 2, 3], [4, 5]]', () => {
  const buffer = Buffer.from('83019f0203ff820405', 'hex');
  const result = decode(buffer);
  expect(result).toEqual([1, [2, 3], [4, 5]]);
});

test('[_ 1,,25]', () => {
  const buffer = Buffer.from('9f0102030405060708090a0b0c0d0e0f101112131415161718181819ff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9,
    10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25,
  ]);
});

test('{_ "a": 1, "b": [_ 2, 3]}', () => {
  const buffer = Buffer.from('bf61610161629f0203ffff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual({ a: 1, b: [2, 3] });
});

test('["a", {_ "b": "c"}]', () => {
  const buffer = Buffer.from('826161bf61626163ff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(['a', { b: 'c' }]);
});

test('{_ "Fun": true, "Amt": -2}', () => {
  const buffer = Buffer.from('bf6346756ef563416d7421ff', 'hex');
  const result = decode(buffer);
  expect(result).toEqual({ Fun: true, Amt: -2 });
});

// ----------------------------------------------------------------------------
test('BigFloat(1.5)', () => {
  const buffer = Buffer.from('c5822003', 'hex');
  const result = decode(buffer);
  expect(result).toEqual(BigNumber(1.5));
});

test('unexpected value', () => {
  const buffer = Buffer.from([CONST.TYPE.POSITIVE | 28]);
  expect(() => decode(buffer)).toThrow('unexpected value 28');
});

test('unsupported special', () => {
  const buffer = Buffer.from([CONST.TYPE.SPECIAL | 28]);
  expect(() => decode(buffer)).toThrow('unsupported special value 28');
});

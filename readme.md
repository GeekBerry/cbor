# @geekberry/cbor

## Usage
```js
const BigNumber = require('bignumber.js');
const cbor = require('@geekberry/cbor');

const object = {
  i: 1,
  f: -Math.PI,
  s: 'string',
  b: true,
  n: null,
  u: undefined,
  r: /0x[0-9a-f]+/,
  buf: Buffer.from('buffer'),
  set: new Set([1, 2, 3]),
  map: new Map([[1, 100], [2, 200]]),
  array: [BigInt('0xffffffffffffffff'), BigNumber(-Math.PI)],
  simple: new cbor.Simple(255),
  tagged: new cbor.Tagged(40, 'TAGGED'),
};

const buffer = cbor.encode(object);
console.log(buffer);
/*
 <Buffer ad 61 69 01 61 66 fb c0 09 21 fb 54 44 2d 18 61 73 66 73 74 72 69 6e 67 61 62 f5 61 6e f6 61 75 f7 61 72 d8 23 6b 30 78 5b 30 2d 39 61 2d 66 5d 2b 63 ... 83 more bytes>
 */

const result = cbor.decode(buffer);
console.log(result);
/*
{
  i: 1,
  f: -3.141592653589793,
  s: 'string',
  b: true,
  n: null,
  u: undefined,
  r: /0x[0-9a-f]+/,
  buf: <Buffer 62 75 66 66 65 72>,
  set: [ 1, 2, 3 ],
  map: Map(2) { 1 => 100, 2 => 200 },
  array: [ 18446744073709551615n, BigNumber { s: -1, e: 0, c: [Array] } ],
  simple: [Number (Simple): 255],
  tagged: Tagged { tag: 40, value: 'TAGGED' }
}
 */
```

## Reference

* [RFC 7049](https://tools.ietf.org/html/rfc7049)
* [RFC 8152](https://tools.ietf.org/html/rfc8152)
* [CBOR Tags](https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml)

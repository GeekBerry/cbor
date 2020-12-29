/* eslint-disable */
const BigNumber = require('bignumber.js');
const cbor = require('../src');

test('basic encode/decode', () => {
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
    array: [BigInt('0xffffffffffffffff'), BigNumber(-Math.PI).pow(3)],
    simple: new cbor.Simple(255),
    tagged: new cbor.Tagged(40, 'TAGGED'),
  };

  const buffer = cbor.encode(object);
  console.log(buffer);
  /*
   <Buffer ad 61 69 01 61 66 fb c0 09 21 fb 54 44 2d 18 61 73 66 73 74 72 69 6e 67 61 62 f5 61 6e f6 61 75 f7 61 72 d8 23 6b 30 78 5b 30 2d 39 61 2d 66 5d 2b 63 ... 97 more bytes>
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
    array: [ 18446744073709551615n, BigNumber { s: -1, e: 1, c: [Array] } ],
    simple: [Number (Simple): 255],
    tagged: Tagged { tag: 40, value: 'TAGGED' }
  }
   */
});

test('force indefinite', () => {
  console.log(cbor.encode('abcd')); // <Buffer 64 61 62 63 64>
  console.log(cbor.encode(new cbor.Indefinite('abcd'))); // <Buffer 7f 64 61 62 63 64 ff>

  console.log(cbor.encode([1, [2, 3]])); // <Buffer 82 01 82 02 03>
  console.log(cbor.encode(new cbor.Indefinite([1, [2, 3]]))); // <Buffer 9f 01 82 02 03 ff>
  console.log(cbor.encode(new cbor.Indefinite([1, new cbor.Indefinite([2, 3])]))); // <Buffer 9f 01 9f 02 03 ff ff>

  console.log(cbor.encode({ a: 1, b: 2 })); // <Buffer a2 61 61 01 61 62 02>
  console.log(cbor.encode(new cbor.Indefinite({ a: 1, b: 2 }))); // <Buffer bf 61 61 01 61 62 02 ff>
});

test('custom Simple', () => {
  class None {
    toCBOR() {
      return new cbor.Simple(19); // 19 as new special
    }
  }

  class MyDecoder extends cbor.Decoder {
    static decode(...args) {
      const result = super.decode(...args);

      if (result instanceof cbor.Simple) {
        switch (Number(result)) {
          case 19:
            return new None();
          default:
            return result;
        }
      }

      return result;
    }
  }

  const value = new None();
  const buffer = cbor.encode(value);
  console.log(buffer); // <Buffer f3>

  const result = MyDecoder.fromBuffer(buffer);
  console.log(result); // None {}
});

test('custom Tagged', () => {
  class Complex {
    constructor(i, j) {
      this.i = i;
      this.j = j;
    }

    toCBOR() {
      return new cbor.Tagged(6, [this.i, this.j]); // 6 as new tag
    }
  }

  class MyDecoder extends cbor.Decoder {
    static decode(...args) {
      const result = super.decode(...args);

      if (result instanceof cbor.Tagged) {
        switch (result.tag) {
          case 6:
            return new Complex(result.value[0], result.value[1]);
          default:
            return result;
        }
      }

      return result;
    }
  }

  const value = new Complex(0, -1);
  const buffer = cbor.encode(value);
  console.log(buffer); // <Buffer c6 82 00 20>

  const result = MyDecoder.fromBuffer(buffer);
  console.log(result); // Complex { i: 0, j: -1 }
});

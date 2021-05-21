/* eslint-disable no-use-before-define */

const BigNumber = require('bignumber.js');
const { TYPE, TAG, INDEFINITE, BREAK_CODE } = require('./const');
const { Simple, Tagged, Indefinite } = require('./type');
const BufferWriter = require('./writer');

function encode(writer, value, indefinite) {
  switch (value) {
    case false:
      return encodeSimple(writer, 20);
    case true:
      return encodeSimple(writer, 21);
    case null:
      return encodeSimple(writer, 22);
    case undefined:
      return encodeSimple(writer, 23);
    default:
      break;
  }

  switch (typeof value) {
    case 'number':
      return Number.isInteger(value)
        ? encodeInteger(writer, value)
        : encodeFloat(writer, value);
    case 'string':
      return encodeString(writer, value, indefinite);
    case 'bigint':
      return encodeBigInt(writer, value);
    default:
      break;
  }

  switch (value.constructor) {
    case Set:
      return encodeSet(writer, value, indefinite);
    case Map:
      return encodeMap(writer, value, indefinite);
    case Date:
      return encodeDate(writer, value);
    case BigNumber:
      return encodeBigNumber(writer, value);
    case RegExp:
      return encodeRegExp(writer, value);
    case Simple:
      return encodeSimple(writer, value);
    case Tagged:
      return encodeTag(writer, value.tag, value.value, indefinite);
    case Indefinite:
      return encode(writer, value.value, true);
    default:
      break;
  }

  if (Buffer.isBuffer(value)) {
    return encodeBuffer(writer, value, indefinite);
  }
  if (Array.isArray(value)) {
    return encodeArray(writer, value, indefinite);
  }

  if (typeof value.toCBOR === 'function') {
    return encode(writer, value.toCBOR(), indefinite);
  }
  if (typeof value === 'object') {
    return encodeObject(writer, value, indefinite);
  }
  throw new Error(`unsupported value=${value} which typeof === "${typeof value}"`);
}

function encodeHead(writer, type, value) {
  if (0 <= value && value <= 23) {
    writer.writeByte(type | value);
  } else if (24 <= value && value <= 0xff) {
    writer.writeByte(type | 24);
    writer.writeUInt(value, 1);
  } else if (0x100 <= value && value <= 0xffff) {
    writer.writeByte(type | 25);
    writer.writeUInt(value, 2);
  } else if (0x10000 <= value && value <= 0xffffffff) {
    writer.writeByte(type | 26);
    writer.writeUInt(value, 4);
  } else if (0x100000000 <= value) {
    writer.writeByte(type | 27);
    writer.writeUInt(value, 8);
  } else {
    throw new Error(`unexpected positive integer value ${value}`);
  }
}

// --------------------------- POSITIVE & NEGATIVE --------------------------
function encodeInteger(writer, integer) {
  if (integer < 0) {
    encodeHead(writer, TYPE.NEGATIVE, -1 - integer);
  } else {
    encodeHead(writer, TYPE.POSITIVE, integer);
  }
}

// ---------------------------------- BUFFER --------------------------------
function encodeBuffer(writer, buffer, indefinite) {
  indefinite ? writer.writeByte(TYPE.BUFFER | INDEFINITE) : undefined;

  // XXX: as a whole chunk
  encodeHead(writer, TYPE.BUFFER, buffer.length);
  writer.writeBuffer(buffer);

  indefinite ? writer.writeByte(BREAK_CODE) : undefined;
}

// ---------------------------------- STRING --------------------------------
function encodeString(writer, string, indefinite) {
  indefinite ? writer.writeByte(TYPE.STRING | INDEFINITE) : undefined;

  // XXX: as a whole chunk
  encodeHead(writer, TYPE.STRING, string.length);
  writer.writeBuffer(Buffer.from(string));

  indefinite ? writer.writeByte(BREAK_CODE) : undefined;
}

// ---------------------------------- ARRAY ---------------------------------
function encodeArray(writer, array, indefinite) {
  indefinite ? writer.writeByte(TYPE.ARRAY | INDEFINITE) : encodeHead(writer, TYPE.ARRAY, array.length);

  array.forEach((each) => encode(writer, each));

  indefinite ? writer.writeByte(BREAK_CODE) : undefined;
}

function encodeSet(writer, set, indefinite) {
  indefinite ? writer.writeByte(TYPE.ARRAY | INDEFINITE) : encodeHead(writer, TYPE.ARRAY, set.size);

  set.forEach((each) => encode(writer, each));

  indefinite ? writer.writeByte(BREAK_CODE) : undefined;
}

// ----------------------------------- MAP ----------------------------------
function encodeMap(writer, map, indefinite) {
  indefinite ? writer.writeByte(TYPE.MAP | INDEFINITE) : encodeHead(writer, TYPE.MAP, map.size);

  for (const [k, v] of map.entries()) {
    encode(writer, k);
    encode(writer, v);
  }

  indefinite ? writer.writeByte(BREAK_CODE) : undefined;
}

function encodeObject(writer, object, indefinite) {
  indefinite ? writer.writeByte(TYPE.MAP | INDEFINITE) : encodeHead(writer, TYPE.MAP, Object.keys(object).length);

  for (const [k, v] of Object.entries(object)) {
    encode(writer, k);
    encode(writer, v);
  }

  indefinite ? writer.writeByte(BREAK_CODE) : undefined;
}

// ----------------------------------- TAG ----------------------------------
function encodeTag(writer, tag, value, indefinite) {
  encodeHead(writer, TYPE.TAG, tag);
  encode(writer, value, indefinite);
}

function encodeDate(writer, date) {
  encodeTag(writer, TAG.DATE_TIMESTAMP, Number(date) / 1000);
}

function encodeBigInt(writer, bigInt) {
  if (bigInt < BigInt(0)) {
    const hex = (BigInt(-1) - bigInt).toString(16);
    const buffer = Buffer.from(hex.length % 2 ? `0${hex}` : hex, 'hex');
    encodeTag(writer, TAG.NEGATIVE_BIGINT, buffer);
  } else {
    const hex = bigInt.toString(16);
    const buffer = Buffer.from(hex.length % 2 ? `0${hex}` : hex, 'hex');
    encodeTag(writer, TAG.POSITIVE_BIGINT, buffer);
  }
}

function encodeBigNumber(writer, bigNumber) {
  if (bigNumber.isNaN()) {
    encodeFloat(writer, NaN);
  } else if (!bigNumber.isFinite()) {
    encodeFloat(writer, bigNumber.isNegative() ? -Infinity : Infinity);
  } else {
    let dp = bigNumber.decimalPlaces();
    let bigInt = BigInt(bigNumber.times(BigNumber(10).pow(dp)).toFixed());
    while (bigInt && !(bigInt % BigInt(10))) {
      dp -= 1;
      bigInt /= BigInt(10);
    }

    encodeTag(writer, TAG.BIG_NUMBER, [-dp, bigInt]);
  }
}

function encodeRegExp(writer, regex) {
  encodeTag(writer, TAG.REGEXP, regex.source);
}

// --------------------------------- SPECIAL --------------------------------
function encodeSimple(writer, simple) {
  if (0 <= simple && simple <= 0xff) {
    encodeHead(writer, TYPE.SPECIAL, simple);
  } else {
    throw new Error(`unsupported simple ${simple}`);
  }
}

function encodeFloat(writer, float) {
  if (!Number.isFinite(float)) {
    writer.writeByte(TYPE.SPECIAL | 25);
    writer.writeFloat(float, 2);
  } else if (Math.fround(float) === float) {
    // XXX: not check float16
    writer.writeByte(TYPE.SPECIAL | 26);
    writer.writeFloat(float, 4);
  } else {
    writer.writeByte(TYPE.SPECIAL | 27);
    writer.writeFloat(float, 8);
  }
}

module.exports = (value) => {
  const writer = new BufferWriter();
  encode(writer, value);
  return writer.toBuffer();
};

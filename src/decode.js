/* eslint-disable no-use-before-define */
const url = require('url');
const BigNumber = require('bignumber.js');
const { TYPE, TAG, INDEFINITE, BREAK_CODE } = require('./const');
const { Simple, Tagged } = require('./type');
const BufferReader = require('./reader');

const taggedMap = new Map();
const simpleMap = new Map();

// -----------------------------------------------------------------------------
function decode(reader) {
  const byte = reader.readByte();
  const type = byte & 0b11100000;
  const value = byte & 0b00011111;
  switch (type) {
    case TYPE.POSITIVE:
      return decodePositive(reader, value);
    case TYPE.NEGATIVE:
      return decodeNegative(reader, value);
    case TYPE.BUFFER:
      return decodeBuffer(reader, value);
    case TYPE.STRING:
      return decodeString(reader, value);
    case TYPE.ARRAY:
      return decodeArray(reader, value);
    case TYPE.MAP:
      return decodeMap(reader, value);
    case TYPE.TAG:
      return decodeTag(reader, value);
    case TYPE.SPECIAL:
      return decodeSpecial(reader, value);
    default:
      throw new Error(`unexpected major type ${type >> 5}`);
  }
}

function decodePositive(reader, value) {
  let integer;
  if (0 <= value && value <= 23) {
    integer = value;
  } else if (value === 24) {
    integer = reader.readUInt(1);
  } else if (value === 25) {
    integer = reader.readUInt(2);
  } else if (value === 26) {
    integer = reader.readUInt(4);
  } else if (value === 27) {
    integer = Number(reader.readUInt(8)); // FIXME: BigInt => Number is unsafe
  } else {
    throw new Error(`unexpected value ${value}`);
  }
  return integer;
}

function decodeNegative(reader, value) {
  const num = decodePositive(reader, value);
  return -1 - num;
}

function decodeBuffer(reader, value) {
  if (value === INDEFINITE) {
    const array = [];
    while (reader.pickByte() !== BREAK_CODE) {
      array.push(decode(reader));
    }
    reader.readByte();
    return Buffer.concat(array);
  }

  const size = decodePositive(reader, value);
  return reader.readBuffer(size);
}

function decodeString(reader, value) {
  if (value === INDEFINITE) {
    const array = [];
    while (reader.pickByte() !== BREAK_CODE) {
      array.push(decode(reader));
    }
    reader.readByte();
    return array.join('');
  }

  const buffer = decodeBuffer(reader, value);
  return buffer.toString();
}

function decodeArray(reader, value) {
  const size = value === INDEFINITE ? Infinity : decodePositive(reader, value);

  const array = [];
  for (let i = 0; i < size; i += 1) {
    if (value === INDEFINITE && reader.pickByte() === BREAK_CODE) {
      reader.readByte();
      break;
    }

    array.push(decode(reader));
  }
  return array;
}

function decodeMap(reader, value) {
  const size = value === INDEFINITE ? Infinity : decodePositive(reader, value);

  let isObject = true;
  const pairArray = [];
  const object = {};
  for (let i = 0; i < size; i += 1) {
    if (value === INDEFINITE && reader.pickByte() === BREAK_CODE) {
      reader.readByte();
      break;
    }

    const k = decode(reader);
    const v = decode(reader);
    isObject = isObject && (typeof k === 'string');
    pairArray.push([k, v]);
    if (isObject) {
      object[k] = v;
    }
  }

  return isObject ? object : new Map(pairArray);
}

// ----------------------------------- TAG -------------------------------------
function decodeTag(reader, value) {
  const tag = decodePositive(reader, value);

  switch (tag) {
    case TAG.DATE_ISO:
    case TAG.DATE_TIMESTAMP:
      return decodeDate(reader, tag);
    case TAG.POSITIVE_BIGINT:
    case TAG.NEGATIVE_BIGINT:
      return decodeBigInt(reader, tag);
    case TAG.BIG_NUMBER:
    case TAG.BIG_FLOAT: // TODO: Implement 2 base BigNumber
      return decodeBigNumber(reader, tag);
    case TAG.URI:
      return decodeURL(reader, tag);
    case TAG.REGEXP:
      return decodeRegex(reader, tag);
    default:
      return decodeCustomTag(reader, tag);
  }
}

function decodeDate(reader, tag) {
  const timestamp = decode(reader);
  return tag === TAG.DATE_ISO ? new Date(timestamp) : new Date(timestamp * 1000);
}

function decodeBigInt(reader, tag) {
  const buffer = decode(reader);
  const bigInt = BigInt(`0x${buffer.toString('hex')}`);
  return tag === TAG.POSITIVE_BIGINT ? bigInt : BigInt(-1) - bigInt;
}

function decodeBigNumber(reader, tag) {
  const [exponent, bigInt] = decode(reader);
  const base = tag === TAG.BIG_FLOAT ? 2 : 10;

  const isNegative = bigInt < BigInt(0);
  let string = isNegative ? (-bigInt).toString(base) : bigInt.toString(base);
  if (exponent < 0) {
    string = string.padStart(1 - exponent, '0'); // `1 - exponent < string.length` is ok
    string = `${string.slice(0, exponent)}.${string.slice(exponent)}`;
  } else if (exponent > 0) {
    string = string.padEnd(string.length + exponent, '0');
  } // exponent === 0 pass

  const bigNumber = base === 2 ? BigNumber(`0b${string}`) : BigNumber(string); // BigNumber(string, base) will lose precision
  return isNegative ? bigNumber.negated() : bigNumber;
}

function decodeURL(reader) {
  const string = decode(reader);
  return url.parse(string);
}

function decodeRegex(reader) {
  const string = decode(reader);
  return new RegExp(string);
}

function decodeCustomTag(reader, tag) {
  const value = decode(reader);
  const func = taggedMap.get(tag);
  return func ? func(value) : new Tagged(tag, value);
}

// --------------------------------- SPECIAL -----------------------------------
function decodeSpecial(reader, value) {
  let result;
  if (0 <= value && value <= 19) {
    result = decodeSimple(reader, value);
  } else if (value === 20) {
    result = false;
  } else if (value === 21) {
    result = true;
  } else if (value === 22) {
    result = null;
  } else if (value === 23) {
    result = undefined;
  } else if (value === 24) {
    result = decodeSimple(reader, reader.readByte());
  } else if (value === 25) {
    result = reader.readFloat(2);
  } else if (value === 26) {
    result = reader.readFloat(4);
  } else if (value === 27) {
    result = reader.readFloat(8);
  } else {
    throw new Error(`unsupported special value ${value}`);
  }
  return result;
}

function decodeSimple(reader, value) {
  const func = simpleMap.get(value);
  return func ? func() : new Simple(value);
}

// =============================================================================
module.exports = (buffer, index) => {
  const reader = new BufferReader(buffer, index);
  return decode(reader);
};

module.exports.simpleMap = simpleMap;
module.exports.taggedMap = taggedMap;

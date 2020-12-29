const url = require('url');
const BigNumber = require('bignumber.js');
const { TYPE, TAG, INDEFINITE, BREAK_CODE } = require('./const');
const { Simple, Tagged } = require('./type');
const BufferReader = require('./reader');

class Decoder {
  static fromBuffer(buffer, index) {
    return this.decode(new BufferReader(buffer, index));
  }

  // --------------------------------------------------------------------------
  static decode(reader) {
    const byte = reader.readByte();
    const type = byte & 0b11100000;
    const value = byte & 0b00011111;
    switch (type) {
      case TYPE.POSITIVE:
        return this.decodePositive(reader, value);
      case TYPE.NEGATIVE:
        return this.decodeNegative(reader, value);
      case TYPE.BUFFER:
        return this.decodeBuffer(reader, value);
      case TYPE.STRING:
        return this.decodeString(reader, value);
      case TYPE.ARRAY:
        return this.decodeArray(reader, value);
      case TYPE.MAP:
        return this.decodeMap(reader, value);
      case TYPE.TAG:
        return this.decodeTag(reader, value);
      case TYPE.SPECIAL:
        return this.decodeSpecial(reader, value);
      default:
        throw new Error(`unexpected major type ${type >> 5}`);
    }
  }

  static decodePositive(reader, value) {
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

  static decodeNegative(reader, value) {
    const num = this.decodePositive(reader, value);
    return -1 - num;
  }

  static decodeBuffer(reader, value) {
    if (value === INDEFINITE) {
      const array = [];
      while (reader.pickByte() !== BREAK_CODE) {
        array.push(this.decode(reader));
      }
      reader.readByte();
      return Buffer.concat(array);
    }

    const size = this.decodePositive(reader, value);
    return reader.readBuffer(size);
  }

  static decodeString(reader, value) {
    if (value === INDEFINITE) {
      const array = [];
      while (reader.pickByte() !== BREAK_CODE) {
        array.push(this.decode(reader));
      }
      reader.readByte();
      return array.join('');
    }

    const buffer = this.decodeBuffer(reader, value);
    return buffer.toString();
  }

  static decodeArray(reader, value) {
    const size = value === INDEFINITE ? Infinity : this.decodePositive(reader, value);

    const array = [];
    for (let i = 0; i < size; i += 1) {
      if (value === INDEFINITE && reader.pickByte() === BREAK_CODE) {
        reader.readByte();
        break;
      }

      array.push(this.decode(reader));
    }
    return array;
  }

  static decodeMap(reader, value) {
    const size = value === INDEFINITE ? Infinity : this.decodePositive(reader, value);

    let isObject = true;
    const pairArray = [];
    const object = {};
    for (let i = 0; i < size; i += 1) {
      if (value === INDEFINITE && reader.pickByte() === BREAK_CODE) {
        reader.readByte();
        break;
      }

      const k = this.decode(reader);
      const v = this.decode(reader);
      isObject = isObject && (typeof k === 'string');
      pairArray.push([k, v]);
      if (isObject) {
        object[k] = v;
      }
    }

    return isObject ? object : new Map(pairArray);
  }

  // ----------------------------------- TAG ----------------------------------
  static decodeTag(reader, value) {
    const tag = this.decodePositive(reader, value);

    switch (tag) {
      case TAG.DATE_ISO:
      case TAG.DATE_TIMESTAMP:
        return this.decodeDate(reader, tag);
      case TAG.POSITIVE_BIGINT:
      case TAG.NEGATIVE_BIGINT:
        return this.decodeBigInt(reader, tag);
      case TAG.BIG_NUMBER:
      case TAG.BIG_FLOAT: // TODO: Implement 2 base BigNumber
        return this.decodeBigNumber(reader, tag);
      case TAG.URI:
        return this.decodeURL(reader, tag);
      case TAG.REGEXP:
        return this.decodeRegex(reader, tag);
      default:
        return new Tagged(tag, this.decode(reader));
    }
  }

  static decodeDate(reader, tag) {
    const timestamp = this.decode(reader);
    return tag === TAG.DATE_ISO ? new Date(timestamp) : new Date(timestamp * 1000);
  }

  static decodeBigInt(reader, tag) {
    const buffer = this.decode(reader);
    const bigInt = BigInt(`0x${buffer.toString('hex')}`);
    return tag === TAG.POSITIVE_BIGINT ? bigInt : BigInt(-1) - bigInt;
  }

  static decodeBigNumber(reader, tag) {
    const [exponent, bigInt] = this.decode(reader);
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

  static decodeURL(reader) {
    const string = this.decode(reader);
    return url.parse(string);
  }

  static decodeRegex(reader) {
    const string = this.decode(reader);
    return new RegExp(string);
  }

  // --------------------------------- SPECIAL --------------------------------
  static decodeSpecial(reader, value) {
    let result;
    if (0 <= value && value <= 19) {
      result = this.decodeSimple(reader, value);
    } else if (value === 20) {
      result = false;
    } else if (value === 21) {
      result = true;
    } else if (value === 22) {
      result = null;
    } else if (value === 23) {
      result = undefined;
    } else if (value === 24) {
      result = this.decodeSimple(reader, reader.readByte());
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

  static decodeSimple(reader, value) {
    return new Simple(value);
  }
}

module.exports = Decoder;

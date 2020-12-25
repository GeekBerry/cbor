const BigNumber = require('bignumber.js');
const { TYPE, TAG } = require('./const');
const Simple = require('./Simple');
const Tagged = require('./Tagged');
const BufferWriter = require('./writer');

class Encoder {
  static encode(value) {
    const writer = new BufferWriter();
    const encoder = new this();
    encoder.encode(writer, value);
    return writer.toBuffer();
  }

  encode(writer, value) {
    switch (value) {
      case false:
        return this.encodeSimple(writer, 20);
      case true:
        return this.encodeSimple(writer, 21);
      case null:
        return this.encodeSimple(writer, 22);
      case undefined:
        return this.encodeSimple(writer, 23);
      default:
        break;
    }

    switch (typeof value) {
      case 'number':
        return Number.isInteger(value)
          ? this.encodeInteger(writer, value)
          : this.encodeFloat(writer, value);
      case 'string':
        return this.encodeString(writer, value);
      case 'bigint':
        return this.encodeBigInt(writer, value);
      default:
        break;
    }

    switch (value.constructor) {
      case Set:
        return this.encodeSet(writer, value);
      case Map:
        return this.encodeMap(writer, value);
      case Date:
        return this.encodeDate(writer, value);
      case BigNumber:
        return this.encodeBigNumber(writer, value);
      case RegExp:
        return this.encodeRegExp(writer, value);
      case Simple:
        return this.encodeSimple(writer, value);
      case Tagged:
        return this.encodeTag(writer, value.tag, value.value);
      default:
        break;
    }

    if (Buffer.isBuffer(value)) {
      return this.encodeBuffer(writer, value);
    }
    if (Array.isArray(value)) {
      return this.encodeArray(writer, value);
    }

    if (typeof value.toCBOR === 'function') {
      return this.encode(writer, value.toCBOR());
    }
    if (typeof value === 'object') {
      return this.encodeObject(writer, value);
    }
    throw new Error(`unsupported value=${value} which typeof === "${typeof value}"`);
  }

  encodeHead(writer, type, value) {
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
  encodeInteger(writer, integer) {
    if (integer < 0) {
      this.encodeHead(writer, TYPE.NEGATIVE, -1 - integer);
    } else {
      this.encodeHead(writer, TYPE.POSITIVE, integer);
    }
  }

  // ---------------------------------- BUFFER --------------------------------
  encodeBuffer(writer, buffer) {
    this.encodeHead(writer, TYPE.BUFFER, buffer.length);
    writer.writeBuffer(buffer);
  }

  // ---------------------------------- STRING --------------------------------
  encodeString(writer, string) {
    this.encodeHead(writer, TYPE.STRING, string.length);
    writer.writeBuffer(Buffer.from(string));
  }

  // ---------------------------------- ARRAY ---------------------------------
  encodeArray(writer, array) {
    this.encodeHead(writer, TYPE.ARRAY, array.length);
    array.forEach((each) => this.encode(writer, each));
  }

  encodeSet(writer, set) {
    this.encodeHead(writer, TYPE.ARRAY, set.size);
    set.forEach((each) => {
      this.encode(writer, each);
    });
  }

  // ----------------------------------- MAP ----------------------------------
  encodeMap(writer, map) {
    this.encodeHead(writer, TYPE.MAP, map.size);
    for (const [k, v] of map.entries()) {
      this.encode(writer, k);
      this.encode(writer, v);
    }
  }

  encodeObject(writer, object) {
    this.encodeHead(writer, TYPE.MAP, Object.keys(object).length);
    for (const [k, v] of Object.entries(object)) {
      this.encode(writer, k);
      this.encode(writer, v);
    }
  }

  // ----------------------------------- TAG ----------------------------------
  encodeTag(writer, tag, value) {
    this.encodeHead(writer, TYPE.TAG, tag);
    this.encode(writer, value);
  }

  encodeDate(writer, date) {
    this.encodeTag(writer, TAG.DATE_TIMESTAMP, Number(date) / 1000);
  }

  encodeBigInt(writer, bigInt) {
    if (bigInt < BigInt(0)) {
      const hex = (BigInt(-1) - bigInt).toString(16);
      const buffer = Buffer.from(hex.length % 2 ? `0${hex}` : hex, 'hex');
      this.encodeTag(writer, TAG.NEGATIVE_BIGINT, buffer);
    } else {
      const hex = bigInt.toString(16);
      const buffer = Buffer.from(hex.length % 2 ? `0${hex}` : hex, 'hex');
      this.encodeTag(writer, TAG.POSITIVE_BIGINT, buffer);
    }
  }

  encodeBigNumber(writer, bigNumber) {
    if (bigNumber.isNaN()) {
      this.encodeFloat(writer, NaN);
    } else if (!bigNumber.isFinite()) {
      this.encodeFloat(writer, bigNumber.isNegative() ? -Infinity : Infinity);
    } else {
      let dp = bigNumber.decimalPlaces();
      let bigInt = BigInt(bigNumber.times(BigNumber(10).pow(dp)).toFixed());
      while (bigInt && !(bigInt % BigInt(10))) {
        dp -= 1;
        bigInt /= BigInt(10);
      }

      this.encodeTag(writer, TAG.BIG_NUMBER, [-dp, bigInt]);
    }
  }

  encodeRegExp(writer, regex) {
    this.encodeTag(writer, TAG.REGEXP, regex.source);
  }

  // --------------------------------- SPECIAL --------------------------------
  encodeSimple(writer, simple) {
    if (0 <= simple && simple <= 0xff) {
      this.encodeHead(writer, TYPE.SPECIAL, simple);
    } else {
      throw new Error(`unsupported simple ${simple}`);
    }
  }

  encodeFloat(writer, float) {
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
}

module.exports = Encoder;

const ieee754 = require('ieee754');

class BufferReader {
  constructor(buffer, index = 0) {
    this.buffer = buffer;
    this.index = index;
  }

  pickByte() {
    return this.buffer[this.index];
  }

  readByte() {
    return this.buffer[this.index++]; // eslint-disable-line no-plusplus
  }

  readBuffer(size) {
    const buffer = this.buffer.slice(this.index, this.index + size);
    this.index += buffer.length;
    return buffer;
  }

  readUInt(size) {
    let value;
    switch (size) {
      case 1:
        value = this.buffer.readUInt8(this.index);
        break;
      case 2:
        value = this.buffer.readUInt16BE(this.index);
        break;
      case 4:
        value = this.buffer.readUInt32BE(this.index);
        break;
      case 8:
        value = this.buffer.readBigUInt64BE(this.index);
        break;
      default:
        throw new Error(`unsupported unsigned int size ${size}`);
    }
    this.index += size;
    return value;
  }

  readFloat(size) {
    let value;
    switch (size) {
      case 2:
        value = ieee754.read(this.buffer, this.index, false, 10, size); // sign:1,exponent:5,fraction:10
        break;
      case 4:
        value = ieee754.read(this.buffer, this.index, false, 23, size); // sign:1,exponent:8,fraction:23
        break;
      case 8:
        value = ieee754.read(this.buffer, this.index, false, 52, size); // sign:1,exponent:11,fraction:52
        break;
      default:
        throw new Error(`unsupported float size ${size}`);
    }
    this.index += size;
    return value;
  }
}

module.exports = BufferReader;

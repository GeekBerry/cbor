const ieee754 = require('ieee754');

class BufferWriter {
  constructor() {
    this.bufferArray = [];
  }

  writeByte(byte) {
    this.bufferArray.push(Buffer.from([byte]));
  }

  writeBuffer(buffer) {
    this.bufferArray.push(buffer);
  }

  writeUInt(value, size) {
    const buffer = Buffer.allocUnsafe(size);

    switch (size) {
      case 1:
        buffer.writeUInt8(value);
        break;
      case 2:
        buffer.writeUInt16BE(value);
        break;
      case 4:
        buffer.writeUInt32BE(value);
        break;
      case 8:
        buffer.writeBigUInt64BE(BigInt(value));
        break;
      default:
        throw new Error(`unsupported unsigned int size ${size}`);
    }

    this.writeBuffer(buffer);
  }

  writeFloat(value, size) {
    const buffer = Buffer.allocUnsafe(size);

    switch (size) {
      case 2:
        ieee754.write(buffer, value, 0, false, 10, size); // sign:1,exponent:5,fraction:10
        break;
      case 4:
        ieee754.write(buffer, value, 0, false, 23, size); // sign:1,exponent:8,fraction:23
        break;
      case 8:
        ieee754.write(buffer, value, 0, false, 52, size); // sign:1,exponent:11,fraction:52
        break;
      default:
        throw new Error(`unsupported float size ${size}`);
    }

    this.writeBuffer(buffer);
  }

  toBuffer() {
    return Buffer.concat(this.bufferArray);
  }
}

module.exports = BufferWriter;

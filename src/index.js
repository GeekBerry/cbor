const CONST = require('./const');
const Simple = require('./Simple');
const Tagged = require('./Tagged');
const Encoder = require('./Encoder');
const Decoder = require('./Decoder');

module.exports = {
  CONST,
  Simple,
  Tagged,
  Encoder,
  Decoder,

  encode: (...args) => Encoder.encode(...args),
  decode: (...args) => Decoder.decode(...args),
};

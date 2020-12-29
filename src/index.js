const CONST = require('./const');
const { Indefinite, Simple, Tagged } = require('./type');
const Encoder = require('./Encoder');
const Decoder = require('./Decoder');

module.exports = {
  CONST,
  Indefinite,
  Simple,
  Tagged,
  Encoder,
  Decoder,

  encode: (...args) => Encoder.toBuffer(...args),
  decode: (...args) => Decoder.fromBuffer(...args),
};

/* eslint-disable max-classes-per-file */
class Simple extends Number {}

class Tagged {
  constructor(tag, value) {
    this.tag = tag; // TODO: check tag uint
    this.value = value;
  }
}

module.exports = {
  Simple,
  Tagged,
};

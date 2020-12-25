module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    jest: true,
  },
  extends: 'airbnb-base',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    BigInt: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'class-methods-use-this': 0,
    'linebreak-style': 0, // for windows and mac
    'max-len': 0, // for jsdoc
    'no-bitwise': 0,
    'no-restricted-syntax': 0, // for `for(... of ...)`
    'object-curly-newline': 0, // for object in one line
    'yoda': 0, // for `min < number && number < max`
  },
};

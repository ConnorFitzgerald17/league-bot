module.exports = {
  extends: 'airbnb-base',
  rules: {
    'comma-dangle': 'off',
    'no-underscore-dangle': 'off',
    'max-len': ['error', { code: 120 }],
    'arrow-parens': ['error', 'as-needed'],
    'operator-linebreak': ['error', 'after'],
    'object-curly-newline': 'off',
    'consistent-return': 'off',
  },
};

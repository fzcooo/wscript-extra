module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "REM": "writable",
        "WScript": "readonly",
        "ActiveXObject": "readonly",
        "GetObject": "readonly",
        "VBArray": "readonly",
        "Enumerator": "readonly",
        "GetShell": "readonly",
        "GetVBScript": "readonly",
        "GetShellApp": "readonly",
        "GetFSO": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
        "no-console": 'off'
    }
};
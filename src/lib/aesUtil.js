import { enc, lib } from 'crypto-js/core';
import * as PBKDF2 from 'crypto-js/pbkdf2';
import * as AES from 'crypto-js/aes';
import { getConfig } from '@/lib/util/configUtil';

let instance;

class AesUtil {
  constructor(keySize, iterationCount, salt, iv, passPhrase) {
    if (instance) return instance;
    this.keySize = keySize / 32;
    this.iterationCount = iterationCount;
    this.salt = salt;
    this.iv = iv;
    this.passPhrase = passPhrase;
    instance = this;
  }

  generateKey = () => {
    const key = PBKDF2(this.passPhrase, enc.Hex.parse(this.salt), {
      keySize: this.keySize,
      iterations: this.iterationCount,
    });
    return key;
  };

  encrypt = plainText => {
    const key = this.generateKey(this.salt, this.passPhrase);
    const encrypted = AES.encrypt(plainText, key, {
      iv: enc.Hex.parse(this.iv),
    });
    return encrypted.ciphertext.toString(enc.Base64);
  };

  decrypt = cipherText => {
    const key = this.generateKey(this.salt, this.passPhrase);
    const cipherParams = lib.CipherParams.create({
      ciphertext: enc.Base64.parse(cipherText),
    });
    const decrypted = AES.decrypt(cipherParams, key, {
      iv: enc.Hex.parse(this.iv),
    });
    return decrypted.toString(enc.Utf8);
  };
}

// singleton
export const getAesUtil = () => {
  const {
    KeySize: KEY_SIZE,
    IterationCount: ITERATION_COUNT,
    Salt: SALT,
    Iv: IV,
    PassPhrase: PASS_PHRASE,
  } = getConfig('Crypto');
  return new AesUtil(KEY_SIZE, ITERATION_COUNT, SALT, IV, PASS_PHRASE);
};

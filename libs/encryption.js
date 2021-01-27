module.exports = {Cipher, Decipher, Encryption}

const crypto = require('crypto');

const ENCRYPTION_CIPHER = 0x1;
const ENCRYPTION_DECIPHER = 0x2;


function Cipher(buffer, key, iv) {
    return Encryption(buffer, ENCRYPTION_CIPHER, key, iv)

}

function Decipher(buffer, key, iv) {
    return Encryption(buffer, ENCRYPTION_DECIPHER, key, iv)
}

function Encryption(buffer, way, key, iv) {
    let algorithm = 'aes-128-cbc';
    let cipher

    switch (way) {
        case ENCRYPTION_CIPHER:
            cipher = crypto.createCipheriv(algorithm, key, iv);
            break;
        case ENCRYPTION_DECIPHER:
            cipher = crypto.createDecipheriv(algorithm, key, iv);
            break;
        default:
            throw new Error("Invalid Encryption way, can be " + ENCRYPTION_CIPHER + " for cipher or " + ENCRYPTION_DECIPHER + " for decipher");
    }

    cipher.setAutoPadding(false)

    return Buffer.concat([buffer.subarray(0, 16), cipher.update(buffer.subarray(16))])
}



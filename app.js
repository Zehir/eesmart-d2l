const crypto = require('crypto');
const CRC = require('./libs/crc');
const date = require('./libs/date');
const {Cipher, Decipher} = require('./libs/encryption');
const Parser = require('binary-parser').Parser;
const https = require("https");

const TYPE_COMMANDE = {
    UPDATE_REQUEST: 0x1,
    PUSH_JSON: 0x3,
    GET_HORLOGE: 0x5
};

const DATA_FORMATTERS = {
    "default": "Défaut",
    "raw_array": "Tableau de données brutes"
}

const RESPONSE_TYPE_OFFSET = 0x80;

const GET_FRIMWARE_API_URL = "https://d2lapi.sicame.io/api/D2L/D2Ls/D2LFirmware";

module.exports = class {

    constructor(key = undefined, iv = undefined) {
        this.headers = {};
        this.setKeys(key, iv)
    }

    setKeys(key, iv) {

        switch (typeof (key)) {
            case "string":
                this.key = Buffer.from(key, 'hex');
                break;
            case 'object':
                if (Buffer.isBuffer(key)) {
                    this.key = key
                }
                break;
        }
        switch (typeof (iv)) {
            case "string":
                this.iv = Buffer.from(iv, 'hex');
                break;
            case 'object':
                if (Buffer.isBuffer(iv)) {
                    this.iv = iv
                }
                break;
        }
    }

    parseRequest(buffer, onlyUnencrypted = false, skipChecks = false) {
        if (buffer !== undefined && Buffer.isBuffer(buffer)) {
            this.requestBuffer = buffer;
            this.buffer = Buffer.from(buffer);
        } else {
            let error = new TypeError("La rêquete doit être au format Buffer.");
            error.code = "ERR_PARSE_REQUEST_BAD_FORMAT";
            throw error;
        }
        this.parseUnencryptedHeaders();

        // Check if frame is complete
        if (this.headers.frameSize !== this.buffer.length) {
            let error = new Error("Il manque une partie des données, " + this.buffer.length + "octets reçu et " + this.headers.frameSize + " attendus.");
            error.code = "ERR_PARSE_REQUEST_MISSING_FRAME_DATA";
            error.recieved = this.buffer.length;
            error.expected = this.buffer.length;
            throw error;
        }

        if (onlyUnencrypted === true) {
            return;
        }

        if (this.key === undefined || this.iv === undefined) {
            let error = new Error("Veuillez définir les clés avant de vouloir décoder la requete.");
            error.code = "ERR_PARSE_REQUEST_MISSING_KEYS";
            throw error;
        }

        // Decrypt Buffer
        this.buffer = Decipher(this.buffer, this.key, this.iv)

        this.parseEncryptedHeaders();

        if (skipChecks === false) {
            // Check CRC
            if (this.headers.crc16.readUIntLE(0, 2) !== this.generateCRC(this.buffer)) {
                let error = new Error("Impossible de lire les données, la somme de contrôle est invalide. Veuillez vérifier les clés.");
                error.code = "ERR_PARSE_REQUEST_BAD_CRC";
                throw error;
            }

            if (this.headers.isRequest === false) {
                let error = new Error("Impossible de traiter les messages de type réponse. Merci d'ouvrir une issue sur GitHub si ce message as été envoyé par le D2L.");
                error.code = "ERR_PARSE_REQUEST_IS_RESPONSE";
                throw error;
            }
        }

    }

    parseUnencryptedHeaders() {
        let headers = (new Parser()
                .endianess("little")
                // Version du protocole, toujours égale à 3
                .uint8('protocolVersion', {assert: 3})
                .seek(1) // Not Used
                // Taille de la trame
                .uint16('frameSize')
                // Identifiant du D2L
                .uint64('idD2L', {
                    formatter: function (id) {
                        return String(id).padStart(12, '0');
                    }
                })
                // Clef AES utilisé, toujours égale à 1
                .bit3('encryptionMethod')
                .bit5('not_used')
                .seek(3) // Not Used
        ).parse(this.buffer.subarray(0, 16));

        delete headers.not_used

        Object.assign(this.headers, headers);

    }


    parseEncryptedHeaders() {

        let headers = (new Parser()
                .endianess("little")
                // Nombre aléatoire
                .buffer("randomNumber", {length: 16})
                // Checksum
                .buffer("crc16", {length: 2})
                // Taille du payload
                .uint16("payloadSize")
                .seek(0) // See https://github.com/keichi/binary-parser/issues/46#issuecomment-738818948
                // Type de payload
                .bit7("payloadType")
                // Requete (valeur 0) ou Reponse (valeur 1)
                .bit1("requestType")
                .seek(0)
                // Commande suivante (force le D2L à exécuter une fonction) (non documenté)
                .bit7("nextQuery")
                .bit1("isErrorOrSuccess")
        ).parse(this.buffer.subarray(16, 38));

        // Taille du headers
        headers.headerSize = 38;

        // Requete (valeur 0) ou Reponse (valeur 1)
        if (headers.requestType === 0) {
            headers.isRequest = true
            headers.isResponse = false
        } else {
            headers.isRequest = false
            headers.isResponse = true
        }
        // Réussie (valeur 0), Erreur (valeur 1)
        if (headers.isErrorOrSuccess === 1) {
            headers.isSuccess = false
            headers.isError = true
        } else {
            headers.isSuccess = true
            headers.isError = false
        }

        delete headers.requestType
        delete headers.isErrorOrSuccess

        Object.assign(this.headers, headers);

    }


    getPayloadType() {
        for (const [key, value] of Object.entries(TYPE_COMMANDE)) {
            if (value === this.headers.payloadType) {
                return key;
            }
        }
    }

    getFormatters() {
        return DATA_FORMATTERS;
    }

    getPayloadRaw() {
        if (this.headers.payloadSize === 0) {
            let error = new Error("Impossible de lire la charge utile, sa taille est de 0.");
            error.code = "ERR_GET_PAYLOAD_EMPTY";
            throw error;
        }

        return this.buffer.subarray(this.headers.headerSize, this.headers.headerSize + this.headers.payloadSize);
    }

    getPayloadString() {
        return this.getPayloadRaw().toString('utf8');
    }


    getPayload(format = "default") {
        switch (this.headers.payloadType) {
            case TYPE_COMMANDE.PUSH_JSON:

                if (this.getFormatters()[format] === undefined) {
                    let error = new Error("Le format '" + format + "' n'existe pas.");
                    error.code = "ERR_GET_PAYLOAD_FORMATTER_NOT_EXIST";
                    throw error;
                }

                let data = JSON.parse(this.getPayloadString());

                const formatter = require('./formatters/' + format);

                return formatter(data);
            default:
                return this.getPayloadRaw();
        }
    }

    getResponse() {

        let responsePayload = Buffer.alloc(4)
        responsePayload.writeUIntLE(date.dateToClock(Date.now()), 0, 4)

        let buffer = Buffer.concat([Buffer.alloc(16), crypto.randomBytes(16), Buffer.alloc(6), responsePayload])

        let missingBytes = 16 - Buffer.byteLength(buffer) % 16
        if (missingBytes > 0) {
            buffer = Buffer.concat([buffer, Buffer.alloc(missingBytes)])
        }

        buffer.writeUIntLE(0x3, 0, 1) // protocolVersion
        buffer.writeUIntLE(Buffer.byteLength(buffer), 2, 2) // frameSize
        buffer.writeBigUInt64LE(BigInt(this.headers.idD2L), 4) // idD2L
        buffer.writeUIntLE(0x1, 12, 1) // encryptionMethod
        buffer.writeUIntLE(0x1, 12, 1) // randomNumber
        buffer.writeUIntLE(Buffer.byteLength(responsePayload), 34, 2) // payloadSize
        buffer.writeUIntLE(this.headers.payloadType + RESPONSE_TYPE_OFFSET, 36, 2) // payloadType + response

        // Generate CRC at the end
        buffer.writeUIntLE(this.generateCRC(buffer), 32, 2) // crc16

        return Cipher(buffer, this.key, this.iv);
    }

    getFrimwareUpdatePromise() {
        return new Promise((resolve, reject) => {

            let url = new URL(GET_FRIMWARE_API_URL)
            url.searchParams.append("base64Request", this.requestBuffer.toString('base64'))

            let options = {
                method: "GET",
                headers: {accept: "text/plain"}
            }

            https.get(url, options, (response) => {
                let chunks_of_data = [];

                response.on('data', (fragments) => {
                    chunks_of_data.push(fragments);
                });

                response.on('end', () => {
                    let response_body = Buffer.concat(chunks_of_data);

                    // promise resolved on success
                    resolve(response_body.toString());
                });

                response.on('error', (error) => {
                    // promise rejected on error
                    reject(error);
                });
            });
        });

    }

    generateCRC(buffer) {
        return CRC(Buffer.concat([buffer.subarray(0, 32), buffer.subarray(34)]));
    }


}


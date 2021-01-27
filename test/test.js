const assert = require('assert');
const CRC = require('../libs/crc');
const date = require('../libs/date');
const {Cipher, Decipher, Encryption} = require('../libs/encryption');
const D2L = require('../app')

const SampleData = {
    GET_HORLOGE: {
        crypted: "03003000413679B30200000001000000689FC5F6E110E64D14FAF81EEE156C55B4F26EB04C1DD59D91306745D0E00CC4",
        uncrypted: "03003000413679B3020000000100000040FBB297FC22CD014D997E39808FCBB30A130000050000000000000000000000",
        key: "12341234123412341234123412341234",
        iv: "fc91837fa2bdba1f9fe985452fdb925e",
    },
    PUSH_JSON: {
        crypted: "03008001413679B3020000000100000084223BE45BBC95E9C44B6391FDDEB455B9D8EE380D2CAFCD69972F906741B6A3F6749D70607FA0F2A36246829141DF3DDB5F151436EB82C9EB913F790BF317368C1B3CA94FBE36CF32D47BE24482A214B76BADC56A1E79099583670036462F38F9E539DDF727CC0E2117AAE7526AEDFCAD3796621EBF718593DD4CF8962E50172D5799F9284CE62B4855E0D3DA77BA0D7FC445173654943B7AAACEEDA220C2F9AAE195947EDA034FD1DF2D3D26238EF14967DBFB42B64C2B21A65BD8C4FF92FAFAE1C18D5DC86002DB903ABAFE6E5C8B9456A4F9C51F2C8C795A0A8CD04E037734B2CD50F7363FAC6AD3E0D579E2C41EE6FC9D69A0E2CAACACA2F20C0F52AADC758A00F370D93EBCBC7474090130B0521F287AE0D073AF6651245594654A31C5C36015E68C0A6E3B350ADE7543A6DC3A4B093C9C85B13C18A97BF5C266E465F606F0744FD7BD28E4C4F743FDAD241103A11550CF4C20754F39CA6EF363CADBEA75632AB85D94D5CA038D8DA34DDDD9F7",
        uncrypted: "03008001413679B30200000001000000D97561728A923D6BA9DD733D350B04BEE770520103007B20225F545950455F5452414D45223A22484953544F5249515545222C20225F49445F44324C223A22303131363031303030303031222C20225F444154455F4649524D57415245223A224465632032302032303136222C20224144434F223A22303431303638303136343839222C20224F505441524946223A2248432E2E222C202249534F555343223A223830222C2022494D4158223A22222C202242415345223A22222C202248434843223A22303033383230363631222C202248434850223A22303037363233343039222C202242425248434A42223A22222C202242425248434A52223A22222C202242425248434A57223A22222C202242425248504A42223A22222C202242425248504A52223A22222C202242425248504A57223A22222C2022454A50484E223A22222C2022454A5048504D223A22222C20225F484F524C4F4745223A22333735333734373322207D0000000000000000",
        payload_raw: "7b20225f545950455f5452414d45223a22484953544f5249515545222c20225f49445f44324c223a22303131363031303030303031222c20225f444154455f4649524d57415245223a224465632032302032303136222c20224144434f223a22303431303638303136343839222c20224f505441524946223a2248432e2e222c202249534f555343223a223830222c2022494d4158223a22222c202242415345223a22222c202248434843223a22303033383230363631222c202248434850223a22303037363233343039222c202242425248434a42223a22222c202242425248434a52223a22222c202242425248434a57223a22222c202242425248504a42223a22222c202242425248504a52223a22222c202242425248504a57223a22222c2022454a50484e223a22222c2022454a5048504d223a22222c20225f484f524c4f4745223a22333735333734373322207d",
        payload_string: "{ \"_TYPE_TRAME\":\"HISTORIQUE\", \"_ID_D2L\":\"011601000001\", \"_DATE_FIRMWARE\":\"Dec 20 2016\", \"ADCO\":\"041068016489\", \"OPTARIF\":\"HC..\", \"ISOUSC\":\"80\", \"IMAX\":\"\", \"BASE\":\"\", \"HCHC\":\"003820661\", \"HCHP\":\"007623409\", \"BBRHCJB\":\"\", \"BBRHCJR\":\"\", \"BBRHCJW\":\"\", \"BBRHPJB\":\"\", \"BBRHPJR\":\"\", \"BBRHPJW\":\"\", \"EJPHN\":\"\", \"EJPHPM\":\"\", \"_HORLOGE\":\"37537473\" }",
        key: "12341234123412341234123412341234",
        iv: "fc91837fa2bdba1f9fe985452fdb925e",
    },
}


describe('Date', function () {
    describe('Horloge', function () {

        it('Date vers Horloge', function () {
            assert.strictEqual(date.dateToClock(new Date('2017-03-10T11:04:33.000Z')), 37537473);
        });

        it('Horloge vers Date', function () {
            assert.strictEqual(date.clockToDate(37537473).toISOString(), '2017-03-10T11:04:33.000Z');
        });

        it('Horloge vers Date charge utile', function () {
            assert.strictEqual(date.clockToDate(0x02787B07).toISOString(), '2017-04-24T17:57:27.000Z');
        });

        it('Date vers Horloge vers Date', function () {
            let src = new Date();
            src.setUTCMilliseconds(0); // On ne garde pas les millisecondes en format horloge
            let result = date.clockToDate(date.dateToClock(src));
            assert.strictEqual(src.getTime(), result.getTime());
        });

    });

    describe('Horodate', function () {

        it('Conversion heure hiver', function () {
            let result = date.horodateToDate('H081225223518')
            assert.strictEqual(result.date.toLocaleString('fr-FR', {timeZone: 'Europe/Paris'}), '25/12/2008 à 22:35:18');
            assert.strictEqual(result.date_degrade, false);
        });

        it('Conversion heure été', function () {
            let result = date.horodateToDate('E090714074553')
            assert.strictEqual(result.date.toLocaleString('fr-FR', {timeZone: 'Europe/Paris'}), '14/07/2009 à 07:45:53');
            assert.strictEqual(result.date_degrade, false);
        });

        it('Conversion heure hiver mode dégradé', function () {
            let result = date.horodateToDate('h081225223518')
            assert.strictEqual(result.date.toLocaleString('fr-FR', {timeZone: 'Europe/Paris'}), '25/12/2008 à 22:35:18');
            assert.strictEqual(result.date_degrade, true);
        });

        it('Conversion heure été mode dégradé', function () {
            let result = date.horodateToDate('e090714074553')
            assert.strictEqual(result.date.toLocaleString('fr-FR', {timeZone: 'Europe/Paris'}), '14/07/2009 à 07:45:53');
            assert.strictEqual(result.date_degrade, true);
        });

    });

});


describe('CRC', function () {
    it('CRC de 123456789 vaut 0x4B37', function () {
        assert.strictEqual(CRC(Buffer.from('123456789')), 0x4B37);
    });
});

describe('Encryption', function () {
    let key = Buffer.from(SampleData.GET_HORLOGE.key, 'hex');
    let iv = Buffer.from(SampleData.GET_HORLOGE.iv, 'hex');

    it('Cipher', function () {
        assert.strictEqual(Cipher(Buffer.from(SampleData.GET_HORLOGE.uncrypted, 'hex'), key, iv).toString('hex').toUpperCase(), SampleData.GET_HORLOGE.crypted);
    });

    it('Decipher', function () {
        assert.strictEqual(Decipher(Buffer.from(SampleData.GET_HORLOGE.crypted, 'hex'), key, iv).toString('hex').toUpperCase(), SampleData.GET_HORLOGE.uncrypted);
    });

    it('Error on invalid encryption way', function () {
        assert.throws(() => {
            Encryption(Buffer.from(SampleData.GET_HORLOGE.crypted, 'hex'), undefined, key, iv)
        }, Error, "Invalid Encryption way");
    });


});


describe('D2L', function () {


    describe('GET_HORLOGE', function () {
        let d2l;

        beforeEach('Parse Request', function () {
            d2l = new D2L(SampleData.GET_HORLOGE.key, SampleData.GET_HORLOGE.iv)
            d2l.parseRequest(Buffer.from(SampleData.GET_HORLOGE.crypted, 'hex'))
        });

        it('Version protocole', function () {
            assert.strictEqual(d2l.headers.protocolVersion, 3);
        });

        it('CRC 16', function () {
            assert.strictEqual(d2l.headers.crc16.readUIntLE(0, 2), 0x130A);
        });

        it('Methode Encryption', function () {
            assert.strictEqual(d2l.headers.encryptionMethod, 1);
        });

        it('Taille tramme', function () {
            assert.strictEqual(d2l.headers.frameSize, 48);
        });

        it('Taille entête', function () {
            assert.strictEqual(d2l.headers.headerSize, 38);
        });

        it('ID D2L', function () {
            assert.strictEqual(d2l.headers.idD2L, '011601000001');
        });

        it('est erreur', function () {
            assert.strictEqual(d2l.headers.isError, false);
        });

        it('est requete', function () {
            assert.strictEqual(d2l.headers.isRequest, true);
        });

        it('est réponse', function () {
            assert.strictEqual(d2l.headers.isResponse, false);
        });

        it('est réussie', function () {
            assert.strictEqual(d2l.headers.isSuccess, true);
        });

        it('prochaine commande', function () {
            assert.strictEqual(d2l.headers.nextQuery, 0);
        });

        it('Taille charge utile', function () {
            assert.strictEqual(d2l.headers.payloadSize, 0);
        });

        it('Type charge utile', function () {
            assert.strictEqual(d2l.headers.payloadType, 0x5);
        });

        it('Type charge utile fonction', function () {
            assert.strictEqual(d2l.getPayloadType(), 'GET_HORLOGE');
        });

    });

    describe('PUSH_JSON', function () {

        let d2l;

        beforeEach('Parse Request', function () {
            d2l = new D2L(SampleData.PUSH_JSON.key, SampleData.PUSH_JSON.iv)
            d2l.parseRequest(Buffer.from(SampleData.PUSH_JSON.crypted, 'hex'))
        });

        it('Type charge utile', function () {
            assert.strictEqual(d2l.headers.payloadType, 0x3);
        });

        it('Charge utile raw', function () {
            assert.strictEqual(d2l.getPayloadRaw().toString('hex'), SampleData.PUSH_JSON.payload_raw);
        });

        it('Charge utile string', function () {
            assert.strictEqual(d2l.getPayloadString(), SampleData.PUSH_JSON.payload_string);
        });

        describe('Charge utile format', function () {

            it('consommation heures_creuses', function () {
                assert.strictEqual(d2l.getPayload()["consommation"]["heures_creuses"], 3820661);
            });

            it('consommation heures_pleines', function () {
                assert.strictEqual(d2l.getPayload()["consommation"]["heures_pleines"], 7623409);
            });

            it('consommation total', function () {
                assert.strictEqual(d2l.getPayload()["consommation"]["total"], 11444070);
            });

        });

    });

    describe('Réponse GET_HORLOGE', function () {

        let d2l;
        let d2l_response;

        beforeEach('Parse Request', function () {
            d2l = new D2L(SampleData.GET_HORLOGE.key, SampleData.GET_HORLOGE.iv)
            d2l.parseRequest(Buffer.from(SampleData.GET_HORLOGE.crypted, 'hex'))

            d2l_response = new D2L(SampleData.GET_HORLOGE.key, SampleData.GET_HORLOGE.iv)
            d2l_response.parseRequest(d2l.getResponse(), false, true)

        });

        it('Charge utile contenant la date à 60 secondes près', function () {
            let payload = d2l_response.getPayloadRaw().readUIntLE(0, 4)
            assert.strictEqual(Math.abs(date.clockToDate(payload).getTime() - Date.now()) < 1000 * 60, true);
        });

        it('payload type', function () {
            assert.strictEqual(d2l_response.headers.payloadType, d2l.headers.payloadType);
        });

        it('est erreur', function () {
            assert.strictEqual(d2l_response.headers.isError, false);
        });

        it('est requete', function () {
            assert.strictEqual(d2l_response.headers.isRequest, false);
        });

        it('est réponse', function () {
            assert.strictEqual(d2l_response.headers.isResponse, true);
        });

        it('est réussie', function () {
            assert.strictEqual(d2l_response.headers.isSuccess, true);
        });

        it('Nombre aléatoires différents', function () {
            assert.notStrictEqual(d2l_response.headers.randomNumber.toString('hex'), d2l.headers.randomNumber.toString('hex'));
        });

    });

});


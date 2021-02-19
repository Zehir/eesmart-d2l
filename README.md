# Node-Red eeSmart D2L
[![GitHub](https://img.shields.io/github/license/zehir/eesmart-d2l)](https://github.com/Zehir/eesmart-d2l/blob/main/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/Zehir/eesmart-d2l/NPM%20Publish)](https://github.com/Zehir/eesmart-d2l/actions)
[![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/zehir/eesmart-d2l?include_prereleases&label=github&sort=semver)](https://github.com/Zehir/eesmart-d2l/releases)
[![npm](https://img.shields.io/npm/v/eesmart-d2l)](https://www.npmjs.com/package/eesmart-d2l)
[![dependencies](https://status.david-dm.org/gh/Zehir/eesmart-d2l.svg)](https://david-dm.org/Zehir/eesmart-d2l)
[![GitHub issues](https://img.shields.io/github/issues/Zehir/eesmart-d2l)](https://github.com/Zehir/eesmart-d2l/issues)
[![Liberapay giving](https://img.shields.io/liberapay/gives/Zehir)](https://liberapay.com/Zehir)
[![Discord](https://img.shields.io/discord/779386253912047647?label=discord)](https://discord.gg/qTd363NKeu)

>N.B: Because this tool is targeted for french people, the documentation is in french. The Linky are only installed in France.

Noeud pour traduire les données envoyées par le D2L d'eeSmart Linky.

Convertit les données brutes en données lisibles.

## Prérequis
- Un compteur [Linky](https://www.enedis.fr/linky-compteur-communicant).
- Un boitier [eeSmart D2L](http://eesmart.fr/modulesd2l/erl-wifi-compteur-linky/).
- Les clés de communication applicative et IV de votre D2L.

### Récupération des clés
Pour récupérer vos clés pour le serveur local il faut envoyer un mail à [support@eesmart.fr](mailto:support@eesmart.fr) avec ces informations :
- L'identifiant unique de votre D2L (Un nombre écrit en dessous du QR Code)
- Votre preuve d'achat (optionnel ?)

[Modèle de mail](mailto:support@eesmart.fr?subject=Demande%20des%20cl%C3%A9s%20pour%20la%20configuration%20d'un%20serveur%20local&body=Bonjour%2CJ'aimerais%20recevoir%20mes%20cl%C3%A9s%20pour%20configurer%20un%20serveur%20local%20pour%20mon%20D2L.Sont%20identifiant%20unique%20est%20%3A%20XXXXXXXXXXXXJe%20l'ai%20achet%C3%A9%20sur%20XXXXXXXXXXX%2C%20vous%20trouverez%20ci-joint%20la%20facture.Cordialement%2C%20XXXXX)

## Utilisation
Fonctionnement de base
```javascript
const D2L = require('eesmart-d2l')
const keys = {
    "011601000001": {
        key: "12341234123412341234123412341234",
        iv: "fc91837fa2bdba1f9fe985452fdb925e"
    }
}

let d2l = new D2L();
// Données envoyés par le D2L.
let dataBuffer = Buffer.from("03003000413679B30200000001000000689FC5F6E110E64D14FAF81EEE156C55B4F26EB04C1DD59D91306745D0E00CC4", 'hex')

// Décoder uniquement les valeurs non cryptés
d2l.parseRequest(dataBuffer, true)

if (keys[d2l.headers.idD2L] !== undefined) {
    d2l.setKeys(keys[d2l.headers.idD2L].key, keys[d2l.headers.idD2L].iv)
} else {
    console.log("Clés non trouvés")
    return;
}

// On décode tout
d2l.parseRequest(dataBuffer)

switch (d2l.getPayloadType()) {
    case 'PUSH_JSON':
        let format = "default" // Peut être default ou raw_array.
        console.log(d2l.getPayload(format)) // Données utiles.

        // Dans tous les cas il faut renvoyer l'horloge alors on ne 'break' pas.
    case 'GET_HORLOGE':
        // Données à renvoyer au D2L, cela contient l'heure actuelle.
        // Attention il faut renvoyer les données dans la même connexion qui vous as permis de recevoir les données envoyées par le D2L.
        console.log(d2l.getResponse().toString('base64'))
        break;

    case 'UPDATE_REQUEST':
        d2l.getFrimwareUpdatePromise().then(value => {
            // Données à renvoyer au D2L pour la mise à jour logicielle.
            console.log(Buffer.from(value.toString(), 'base64'))
        })
        break;
}
```

## Références
- [Documentation Enedis](https://www.enedis.fr/sites/default/files/Enedis-NOI-CPT_54E.pdf) - description complète des données envoyés par le Linky via le D2L.
- [Notice d'installation D2L](http://eesmart.fr/wp-content/uploads/eeSmart-D2L-Notice-dinstallation.pdf) - comment configurer votre D2L.
- [Discord](https://discord.gg/qTd363NKeu) - vous pouvez nous rejoindre sur discord.

## Projets liés
- [Node-red-contrib-eesmart-d2l](https://github.com/Zehir/node-red-contrib-eesmart-d2l) - utilisation avec [Node-Red](https://nodered.org/).

const date = require('../libs/date');
const Parser = require('binary-parser').Parser;
const {injector, extractor, pathExist} = require('../libs/object');

module.exports = function (data) {

    // Format with raw_array first
    data = require('./raw_array')(data);

    let _data = {}

    injector(_data, "info.d2l_id", data["_ID_D2L"])
    injector(_data, "info.d2l_firmware", data["_DATE_FIRMWARE"])
    injector(_data, "info.type_trame", data["_TYPE_TRAME"])

    switch (data["_TYPE_TRAME"]) {
        case 'HISTORIQUE':
            injector(_data, "date", data._HORLOGE);

            injector(_data, "abonnement.option_tarifaire", data["OPTARIF"]);
            injector(_data, "abonnement.intensite", data["ISOUSC"], parseInt, 10);

            injector(_data, "info.adresse_compteur", data["ADCO"]);
            injector(_data, "info.periode_tarifaire", data["PTEC"]);
            injector(_data, "info.tempo_couleur_demain", data["DEMAIN"]);
            injector(_data, "info.horaire_heures_pleines_heures_creuses", data["HHPHC"]);
            injector(_data, "info.etat_compteur", data["MOTDETAT"]);

            // Option Base
            injector(_data, "consommation.base", data["BASE"], parseInt, 10);

            // Option Heures Creuses
            injector(_data, "consommation.heures_creuses", data["HCHC"], parseInt, 10);
            injector(_data, "consommation.heures_pleines", data["HCHP"], parseInt, 10);

            // Option EJP
            injector(_data, "consommation.ejp_preavis", data["PEJP"], parseInt, 10);
            injector(_data, "consommation.ejp_heures_normales", data["EJPHN"], parseInt, 10);
            injector(_data, "consommation.ejp_heures_pointe_mobile", data["EJPHPM"], parseInt, 10);

            // Option Tempo
            injector(_data, "consommation.tempo_heures_creuses_bleus", data["BBRHCJB"], parseInt, 10);
            injector(_data, "consommation.tempo_heures_pleines_bleus", data["BBRHPJB"], parseInt, 10);
            injector(_data, "consommation.tempo_heures_creuses_blancs", data["BBRHCJW"], parseInt, 10);
            injector(_data, "consommation.tempo_heures_pleines_blancs", data["BBRHPJW"], parseInt, 10);
            injector(_data, "consommation.tempo_heures_creuses_rouges", data["BBRHCJR"], parseInt, 10);
            injector(_data, "consommation.tempo_heures_pleines_rouges", data["BBRHPJR"], parseInt, 10);

            let total = 0;
            for (const key in _data["consommation"]) {
                if (!isNaN(_data["consommation"][key])) {
                    total += _data["consommation"][key];
                }
            }
            injector(_data, "consommation.total", total);

            // Phases
            for (let i = 1; i <= 3; i++) {
                injector(_data, "phases.phase_" + i + ".courant_efficace", data["IINST" + i], parseInt, 10);
                injector(_data, "phases.phase_" + i + ".intensite_maximale", data["IMAX" + i], parseInt, 10);
            }

            if (!pathExist(_data, 'phases.phase_1.courant_efficace')) {
                injector(_data, "phases.phase_1.courant_efficace", data["IINST"], parseInt, 10);
            }

            if (!pathExist(_data, 'phases.phase_1.intensite_maximale')) {
                injector(_data, "phases.phase_1.intensite_maximale", data["IMAX"], parseInt, 10);
            }

            injector(_data, "puissance.avertissement_depassement", data["ADPS"], parseInt, 10);
            injector(_data, "puissance.maximale_atteinte", data["PMAX"], parseInt, 10);
            injector(_data, "puissance.apparente", data["PAPP"], parseInt, 10);

            if (data["PPAP"] !== undefined) {
                let ppot = parseInt(data["PPOT"], 10);
                injector(_data, "phases.phase_1.presence_potentiel", !((ppot & 0b0001) === 0b0001));
                injector(_data, "phases.phase_2.presence_potentiel", !((ppot & 0b0010) === 0b0010));
                injector(_data, "phases.phase_3.presence_potentiel", !((ppot & 0b0100) === 0b0100));
            }

            break;
        case 'STANDARD':
            let d = date.horodateToDate(data["DATE"])
            injector(_data, "info.date", d.date);
            injector(_data, "info.date_degrade", d.date_degrade);

            injector(_data, "info.point_reference_mesure", data["PRM"]);
            injector(_data, "info.adresse_compteur", data["ADSC"]);
            injector(_data, "info.version_tic", data["VTIC"]);

            let status = (new Parser()
                    .bit2('pointe_mobile')
                    .bit2('preavis_pointes_mobiles')
                    .bit2('couleur_demain')
                    .bit2('couleur_jour')
                    .bit1('synchonisation_cpl')
                    .bit2('statut_cpl')
                    .bit2('etat_sortie_communication')
                    .bit1('non_utilise_2')
                    .bit1('sortie_tic')
                    .bit1('horloge_degradee')
                    .bit2('tarif_en_cours_distributeur')
                    .bit4('tarif_en_cours_fournisseur')
                    .bit1('sens_energie')
                    .bit1('fonctionnement')
                    .bit1('depassement')
                    .bit1('surtension')
                    .bit1('non_utilise_1')
                    .bit1('etat_cache_bornes_distributeur')
                    .bit3('organe_coupure')
                    .bit1('contact_sec')
            ).parse(Buffer.from(data["STGE"], 'hex'));
            delete status.non_utilise_1;
            delete status.non_utilise_2;

            injector(_data, "info.status", status);
            injector(_data, "info.message_court", data["MSG1"]);
            injector(_data, "info.message_ultra_court", data["MSG2"]);

            let relais = (new Parser()
                    .bit1('relai_8')
                    .bit1('relai_7')
                    .bit1('relai_6')
                    .bit1('relai_5')
                    .bit1('relai_4')
                    .bit1('relai_3')
                    .bit1('relai_2')
                    .bit1('relai_1')
            ).parse(Buffer.from([parseInt(data["RELAIS"], 10)]));

            injector(_data, "info.relais", relais);

            injector(_data, "info.index_tarifaire_en_cours", data["NTARF"]);
            injector(_data, "info.numero_jour_en_cours_calendrier_fournisseur", data["NJOURF"]);
            injector(_data, "info.numero_prochain_jour_calendrier_fournisseur", data["NJOURF+1"]);

            let parserProfilCalendrier = (new Parser()
                    .bit2('gestion_contact_sec')
                    .bit3('non_utilise')
                    .bit7('pilotage_contacts_virtuels')
                    .bit4('index_ventilation')
            );

            let parseDataProfil = function (profil) {
                let result = {}
                if (profil.length === 98) {
                    profil.split(' ').forEach(function (item, index) {
                        if (item !== 'NONUTILE') {
                            result['profil_' + index] = {
                                heure: parseInt(item.substring(0, 2), 10),
                                minute: parseInt(item.substring(2, 4), 10),
                                actions: parserProfilCalendrier.parse(Buffer.from(item.substring(4, 8), 'hex')),
                            }
                            delete result['profil_' + index].actions["non_utilise"]
                        }
                    });
                }
                return result;
            }

            injector(_data, "info.profil_prochain_calendrier_fournisseur", parseDataProfil(data["PJOURF+1"]));
            injector(_data, "info.profil_prochain_jour_de_pointe", parseDataProfil(data["PPOINTE"]));

            for (let i = 1; i <= 3; i++) {
                injector(_data, "info.pointes.pointe_" + i, {
                    debut: date.getHorodateValue(data["DPM" + i], parseInt, 10),
                    fin: date.getHorodateValue(data["FPM" + i], parseInt, 10),
                });
            }


            injector(_data, "abonnement.nom_calendrier_fournisseur", data["NGTF"]);
            injector(_data, "abonnement.libelle_tarif_fournisseur", data["LTARF"]);


            injector(_data, "consommation.total", data["EAST"], parseInt, 10);

            // Consommation fournisseur
            for (let i = 1; i <= 10; i++) {
                let prefix = i.toString().padStart(2, "0")
                let value = parseInt(data["EASF" + prefix], 10)
                if (value > 0) {
                    injector(_data, "consommation.fournisseur.index_" + prefix, value);
                }
            }
            // Consommation distributeur
            for (let i = 1; i <= 4; i++) {
                let prefix = i.toString().padStart(2, "0")
                let value = parseInt(data["EASD" + prefix], 10)
                if (value > 0) {
                    injector(_data, "consommation.distributeur.index_" + prefix, value);
                }
            }


            // Producteur seulement
            injector(_data, "production.energie_active_injectee", data["EAIT"], parseInt, 10);

            injector(_data, "production.puissance.instantanee_injectee", data["SINSTI"], parseInt, 10);
            injector(_data, "production.puissance.max_soutiree_n", data["SMAXIN"], date.getHorodateValue, parseInt, 10);
            injector(_data, "production.puissance.max_soutiree_n1", data["SMAXIN-1"], date.getHorodateValue, parseInt, 10);
            injector(_data, "production.puissance.pointn_courbe_charge_active_injectee", data["CCAIN"], date.getHorodateValue, parseInt, 10);
            injector(_data, "production.puissance.pointn1_courbe_charge_active_injectee", data["CCAIN-1"], date.getHorodateValue, parseInt, 10);

            injector(_data, "production.energie_active_injectee", data["EAIT"], parseInt, 10);

            for (let i = 1; i <= 4; i++) {
                injector(_data, "production.energie_reactive.index_" + i, data["ERQ" + i], parseInt, 10);
            }

            // Phases
            for (let i = 1; i <= 3; i++) {
                injector(_data, "phases.phase_" + i + ".courant_efficace", data["IRMS" + i], parseInt, 10);
                injector(_data, "phases.phase_" + i + ".tension_efficace", data["URMS" + i], parseInt, 10);
                injector(_data, "phases.phase_" + i + ".tension_moyenne", data["UMOY" + i], date.getHorodateValue, parseInt, 10);

                injector(_data, "phases.phase_" + i + ".puissance.instantanee_soutiree", data["SINSTS" + i], parseInt, 10);
                injector(_data, "phases.phase_" + i + ".puissance.max_soutiree_n", data["SMAXSN" + i], date.getHorodateValue, parseInt, 10);
                injector(_data, "phases.phase_" + i + ".puissance.max_soutiree_n1", data["SMAXSN" + i + "-1"], date.getHorodateValue, parseInt, 10);
            }

            if (!pathExist(_data, 'phases.phase_1.puissance.instantanee_soutiree')) {
                injector(_data, "phases.phase_1.puissance.instantanee_soutiree", data["SINSTS"], parseInt, 10);
            }

            if (!pathExist(_data, 'phases.phase_1.puissance.max_soutiree_n')) {
                injector(_data, "phases.phase_1.puissance.max_soutiree_n", data["SMAXSN"], parseInt, 10);
            }

            if (!pathExist(_data, 'phases.phase_1.puissance.max_soutiree_n1')) {
                injector(_data, "phases.phase_1.puissance.max_soutiree_n1", data["SMAXSN-1"], parseInt, 10);
            }

            injector(_data, "phases.puissance.instantanee_soutiree", data["SINSTS"], parseInt, 10);
            injector(_data, "phases.puissance.max_soutiree_n", data["SMAXSN"], date.getHorodateValue, parseInt, 10);
            injector(_data, "phases.puissance.max_soutiree_n1", data["SMAXSN-1"], date.getHorodateValue, parseInt, 10);

            injector(_data, "phases.puissance.appelee.reference", data["PREF"], parseInt, 10);
            injector(_data, "phases.puissance.appelee.coupure", data["PCOUP"], parseInt, 10);

            injector(_data, "phases.puissance.pointn_courbe_charge_active_soutiree", data["CCASN"], parseInt, 10);
            injector(_data, "phases.puissance.pointn1_courbe_charge_active_soutiree", data["CCASN-1"], parseInt, 10);

            // Nettoyage des espaces
            [
                "info.message_court",
                "info.message_ultra_court",
                "abonnement.nom_calendrier_fournisseur",
                "abonnement.libelle_tarif_fournisseur"
            ].forEach(function (path) {
                if (pathExist(_data, path)) {
                    injector(_data, path, extractor(_data, path).replace(/ +(?= )/g, '').trim())
                }
            })

            injector(_data, "raw", data);

    }

    return _data
}
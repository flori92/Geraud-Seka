"""
Service SYSCOHADA - Plan Comptable et Normes Comptables OHADA
Système Comptable OHADA pour l'Afrique de l'Ouest et Centrale
"""

from typing import List, Dict, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from uuid import UUID


SYSCOHADA_ACCOUNTS = [
    {"number": "10", "name": "Capital", "class": "1", "type": "equity", "group": True},
    {"number": "101", "name": "Capital social", "class": "1", "type": "equity"},
    {"number": "1011", "name": "Capital souscrit, non appelé", "class": "1", "type": "equity"},
    {"number": "1012", "name": "Capital souscrit, appelé, non versé", "class": "1", "type": "equity"},
    {"number": "1013", "name": "Capital souscrit, appelé, versé", "class": "1", "type": "equity"},
    {"number": "102", "name": "Capital par dotation", "class": "1", "type": "equity"},
    {"number": "103", "name": "Capital personnel", "class": "1", "type": "equity"},
    {"number": "104", "name": "Compte de l'exploitant", "class": "1", "type": "equity"},
    {"number": "109", "name": "Actionnaires, capital souscrit non appelé", "class": "1", "type": "equity"},
    
    {"number": "11", "name": "Réserves", "class": "1", "type": "equity", "group": True},
    {"number": "111", "name": "Réserve légale", "class": "1", "type": "equity"},
    {"number": "112", "name": "Réserves statutaires ou contractuelles", "class": "1", "type": "equity"},
    {"number": "113", "name": "Réserves réglementées", "class": "1", "type": "equity"},
    {"number": "118", "name": "Autres réserves", "class": "1", "type": "equity"},
    
    {"number": "12", "name": "Report à nouveau", "class": "1", "type": "equity", "group": True},
    {"number": "121", "name": "Report à nouveau créditeur", "class": "1", "type": "equity"},
    {"number": "129", "name": "Report à nouveau débiteur", "class": "1", "type": "equity"},
    
    {"number": "13", "name": "Résultat net de l'exercice", "class": "1", "type": "equity", "group": True},
    {"number": "131", "name": "Résultat net: Bénéfice", "class": "1", "type": "equity"},
    {"number": "139", "name": "Résultat net: Perte", "class": "1", "type": "equity"},
    
    {"number": "14", "name": "Subventions d'investissement", "class": "1", "type": "equity", "group": True},
    {"number": "141", "name": "Subventions d'équipement", "class": "1", "type": "equity"},
    
    {"number": "16", "name": "Emprunts et dettes assimilées", "class": "1", "type": "liability", "group": True},
    {"number": "161", "name": "Emprunts obligataires", "class": "1", "type": "liability"},
    {"number": "162", "name": "Emprunts et dettes auprès des établissements de crédit", "class": "1", "type": "liability"},
    {"number": "163", "name": "Avances reçues de l'État", "class": "1", "type": "liability"},
    {"number": "164", "name": "Avances reçues et comptes courants bloqués", "class": "1", "type": "liability"},
    {"number": "165", "name": "Dépôts et cautionnements reçus", "class": "1", "type": "liability"},
    {"number": "166", "name": "Intérêts courus", "class": "1", "type": "liability"},
    
    {"number": "17", "name": "Dettes de crédit-bail et contrats assimilés", "class": "1", "type": "liability", "group": True},
    {"number": "18", "name": "Dettes liées à des participations", "class": "1", "type": "liability", "group": True},
    {"number": "19", "name": "Provisions financières pour risques et charges", "class": "1", "type": "liability", "group": True},
    
    {"number": "20", "name": "Charges immobilisées", "class": "2", "type": "asset", "group": True},
    {"number": "201", "name": "Frais d'établissement", "class": "2", "type": "asset"},
    {"number": "202", "name": "Charges à répartir sur plusieurs exercices", "class": "2", "type": "asset"},
    {"number": "206", "name": "Primes de remboursement des obligations", "class": "2", "type": "asset"},
    
    {"number": "21", "name": "Immobilisations incorporelles", "class": "2", "type": "asset", "group": True},
    {"number": "211", "name": "Frais de recherche et de développement", "class": "2", "type": "asset"},
    {"number": "212", "name": "Brevets, licences, concessions", "class": "2", "type": "asset"},
    {"number": "213", "name": "Logiciels", "class": "2", "type": "asset"},
    {"number": "214", "name": "Marques", "class": "2", "type": "asset"},
    {"number": "215", "name": "Fonds commercial", "class": "2", "type": "asset"},
    {"number": "216", "name": "Droit au bail", "class": "2", "type": "asset"},
    {"number": "217", "name": "Investissements de création", "class": "2", "type": "asset"},
    {"number": "218", "name": "Autres droits et valeurs incorporels", "class": "2", "type": "asset"},
    {"number": "219", "name": "Immobilisations incorporelles en cours", "class": "2", "type": "asset"},
    
    {"number": "22", "name": "Terrains", "class": "2", "type": "asset", "group": True},
    {"number": "221", "name": "Terrains agricoles et forestiers", "class": "2", "type": "asset"},
    {"number": "222", "name": "Terrains nus", "class": "2", "type": "asset"},
    {"number": "223", "name": "Terrains bâtis", "class": "2", "type": "asset"},
    {"number": "224", "name": "Travaux de mise en valeur des terrains", "class": "2", "type": "asset"},
    {"number": "225", "name": "Terrains de gisement", "class": "2", "type": "asset"},
    {"number": "226", "name": "Terrains aménagés", "class": "2", "type": "asset"},
    {"number": "227", "name": "Terrains mis en concession", "class": "2", "type": "asset"},
    {"number": "228", "name": "Autres terrains", "class": "2", "type": "asset"},
    
    {"number": "23", "name": "Bâtiments, installations techniques et agencements", "class": "2", "type": "asset", "group": True},
    {"number": "231", "name": "Bâtiments industriels, agricoles, administratifs et commerciaux sur sol propre", "class": "2", "type": "asset"},
    {"number": "232", "name": "Bâtiments industriels, agricoles, administratifs et commerciaux sur sol d'autrui", "class": "2", "type": "asset"},
    {"number": "233", "name": "Ouvrages d'infrastructure", "class": "2", "type": "asset"},
    {"number": "234", "name": "Installations techniques", "class": "2", "type": "asset"},
    {"number": "235", "name": "Aménagements de bureaux", "class": "2", "type": "asset"},
    {"number": "237", "name": "Bâtiments industriels, agricoles, administratifs et commerciaux mis en concession", "class": "2", "type": "asset"},
    {"number": "238", "name": "Autres installations et agencements", "class": "2", "type": "asset"},
    {"number": "239", "name": "Bâtiments et installations en cours", "class": "2", "type": "asset"},
    
    {"number": "24", "name": "Matériel", "class": "2", "type": "asset", "group": True},
    {"number": "241", "name": "Matériel et outillage industriel et commercial", "class": "2", "type": "asset"},
    {"number": "242", "name": "Matériel et outillage agricole", "class": "2", "type": "asset"},
    {"number": "243", "name": "Matériel d'emballage récupérable et identifiable", "class": "2", "type": "asset"},
    {"number": "244", "name": "Matériel et mobilier de bureau", "class": "2", "type": "asset"},
    {"number": "245", "name": "Matériel de transport", "class": "2", "type": "asset"},
    {"number": "246", "name": "Immobilisations animales et agricoles", "class": "2", "type": "asset"},
    {"number": "247", "name": "Agencements et aménagements du matériel", "class": "2", "type": "asset"},
    {"number": "248", "name": "Autres matériels", "class": "2", "type": "asset"},
    {"number": "249", "name": "Matériel en cours", "class": "2", "type": "asset"},
    
    {"number": "25", "name": "Avances et acomptes versés sur immobilisations", "class": "2", "type": "asset", "group": True},
    {"number": "26", "name": "Titres de participation", "class": "2", "type": "asset", "group": True},
    {"number": "27", "name": "Autres immobilisations financières", "class": "2", "type": "asset", "group": True},
    {"number": "28", "name": "Amortissements", "class": "2", "type": "contra", "group": True},
    {"number": "281", "name": "Amortissements des immobilisations incorporelles", "class": "2", "type": "contra"},
    {"number": "282", "name": "Amortissements des terrains", "class": "2", "type": "contra"},
    {"number": "283", "name": "Amortissements des bâtiments", "class": "2", "type": "contra"},
    {"number": "284", "name": "Amortissements du matériel", "class": "2", "type": "contra"},
    {"number": "29", "name": "Provisions pour dépréciation", "class": "2", "type": "contra", "group": True},
    
    {"number": "31", "name": "Marchandises", "class": "3", "type": "asset", "group": True},
    {"number": "311", "name": "Marchandises A", "class": "3", "type": "asset"},
    {"number": "312", "name": "Marchandises B", "class": "3", "type": "asset"},
    
    {"number": "32", "name": "Matières premières et fournitures liées", "class": "3", "type": "asset", "group": True},
    {"number": "321", "name": "Matières premières", "class": "3", "type": "asset"},
    {"number": "322", "name": "Matières et fournitures consommables", "class": "3", "type": "asset"},
    {"number": "323", "name": "Emballages", "class": "3", "type": "asset"},
    
    {"number": "33", "name": "Autres approvisionnements", "class": "3", "type": "asset", "group": True},
    {"number": "34", "name": "Produits en cours", "class": "3", "type": "asset", "group": True},
    {"number": "35", "name": "Services en cours", "class": "3", "type": "asset", "group": True},
    {"number": "36", "name": "Produits finis", "class": "3", "type": "asset", "group": True},
    {"number": "37", "name": "Produits intermédiaires et résiduels", "class": "3", "type": "asset", "group": True},
    {"number": "38", "name": "Stocks en cours de route, en consignation ou en dépôt", "class": "3", "type": "asset", "group": True},
    {"number": "39", "name": "Dépréciations des stocks", "class": "3", "type": "contra", "group": True},
    
    {"number": "40", "name": "Fournisseurs et comptes rattachés", "class": "4", "type": "liability", "group": True},
    {"number": "401", "name": "Fournisseurs", "class": "4", "type": "liability", "reconcilable": True},
    {"number": "402", "name": "Fournisseurs, effets à payer", "class": "4", "type": "liability"},
    {"number": "408", "name": "Fournisseurs, factures non parvenues", "class": "4", "type": "liability"},
    {"number": "409", "name": "Fournisseurs débiteurs", "class": "4", "type": "asset"},
    
    {"number": "41", "name": "Clients et comptes rattachés", "class": "4", "type": "asset", "group": True},
    {"number": "411", "name": "Clients", "class": "4", "type": "asset", "reconcilable": True},
    {"number": "412", "name": "Clients, effets à recevoir", "class": "4", "type": "asset"},
    {"number": "414", "name": "Créances sur cessions d'immobilisations", "class": "4", "type": "asset"},
    {"number": "416", "name": "Créances litigieuses ou douteuses", "class": "4", "type": "asset"},
    {"number": "418", "name": "Clients, produits à recevoir", "class": "4", "type": "asset"},
    {"number": "419", "name": "Clients créditeurs", "class": "4", "type": "liability"},
    
    {"number": "42", "name": "Personnel", "class": "4", "type": "liability", "group": True},
    {"number": "421", "name": "Personnel, avances et acomptes", "class": "4", "type": "asset"},
    {"number": "422", "name": "Personnel, rémunérations dues", "class": "4", "type": "liability"},
    {"number": "423", "name": "Personnel, oppositions, saisies-arrêts", "class": "4", "type": "liability"},
    {"number": "424", "name": "Personnel, œuvres sociales", "class": "4", "type": "liability"},
    {"number": "425", "name": "Représentants du personnel", "class": "4", "type": "liability"},
    {"number": "428", "name": "Personnel, charges à payer et produits à recevoir", "class": "4", "type": "liability"},
    
    {"number": "43", "name": "Organismes sociaux", "class": "4", "type": "liability", "group": True},
    {"number": "431", "name": "Sécurité sociale", "class": "4", "type": "liability"},
    {"number": "432", "name": "Caisses de retraite", "class": "4", "type": "liability"},
    {"number": "433", "name": "Autres organismes sociaux", "class": "4", "type": "liability"},
    {"number": "438", "name": "Organismes sociaux, charges à payer", "class": "4", "type": "liability"},
    
    {"number": "44", "name": "État et collectivités publiques", "class": "4", "type": "liability", "group": True},
    {"number": "441", "name": "État, impôt sur les bénéfices", "class": "4", "type": "liability"},
    {"number": "442", "name": "État, autres impôts et taxes", "class": "4", "type": "liability"},
    {"number": "443", "name": "État, TVA facturée", "class": "4", "type": "liability"},
    {"number": "4431", "name": "TVA facturée sur ventes", "class": "4", "type": "liability"},
    {"number": "4432", "name": "TVA facturée sur prestations de services", "class": "4", "type": "liability"},
    {"number": "4433", "name": "TVA facturée sur travaux", "class": "4", "type": "liability"},
    {"number": "4434", "name": "TVA facturée sur production livrée à soi-même", "class": "4", "type": "liability"},
    {"number": "4435", "name": "TVA sur factures à établir", "class": "4", "type": "liability"},
    {"number": "444", "name": "État, TVA due ou crédit de TVA", "class": "4", "type": "asset"},
    {"number": "4441", "name": "État, TVA due", "class": "4", "type": "liability"},
    {"number": "4449", "name": "État, crédit de TVA à reporter", "class": "4", "type": "asset"},
    {"number": "445", "name": "État, TVA récupérable", "class": "4", "type": "asset"},
    {"number": "4451", "name": "TVA récupérable sur immobilisations", "class": "4", "type": "asset"},
    {"number": "4452", "name": "TVA récupérable sur achats", "class": "4", "type": "asset"},
    {"number": "4453", "name": "TVA récupérable sur transports", "class": "4", "type": "asset"},
    {"number": "4454", "name": "TVA récupérable sur services extérieurs", "class": "4", "type": "asset"},
    {"number": "4455", "name": "TVA récupérable sur autres charges", "class": "4", "type": "asset"},
    {"number": "4456", "name": "TVA transférée par d'autres entreprises", "class": "4", "type": "asset"},
    {"number": "446", "name": "État, autres taxes sur le chiffre d'affaires", "class": "4", "type": "liability"},
    {"number": "447", "name": "État, impôts retenus à la source", "class": "4", "type": "liability"},
    {"number": "448", "name": "État, charges à payer et produits à recevoir", "class": "4", "type": "liability"},
    {"number": "449", "name": "État, créances et dettes diverses", "class": "4", "type": "asset"},
    
    {"number": "45", "name": "Organismes internationaux", "class": "4", "type": "liability", "group": True},
    {"number": "46", "name": "Associés et groupe", "class": "4", "type": "liability", "group": True},
    {"number": "47", "name": "Débiteurs et créditeurs divers", "class": "4", "type": "liability", "group": True},
    {"number": "48", "name": "Créances et dettes hors activités ordinaires", "class": "4", "type": "liability", "group": True},
    {"number": "49", "name": "Dépréciations et risques provisionnés", "class": "4", "type": "contra", "group": True},
    
    {"number": "50", "name": "Titres de placement", "class": "5", "type": "asset", "group": True},
    {"number": "51", "name": "Valeurs à encaisser", "class": "5", "type": "asset", "group": True},
    {"number": "52", "name": "Banques", "class": "5", "type": "asset", "group": True, "bank": True},
    {"number": "521", "name": "Banques locales", "class": "5", "type": "asset", "bank": True, "reconcilable": True},
    {"number": "522", "name": "Banques autres États UEMOA", "class": "5", "type": "asset", "bank": True},
    {"number": "523", "name": "Banques autres États zone franc", "class": "5", "type": "asset", "bank": True},
    {"number": "524", "name": "Banques hors zone franc", "class": "5", "type": "asset", "bank": True},
    {"number": "526", "name": "Banques, intérêts courus", "class": "5", "type": "asset"},
    
    {"number": "53", "name": "Établissements financiers et assimilés", "class": "5", "type": "asset", "group": True},
    {"number": "531", "name": "Chèques postaux", "class": "5", "type": "asset"},
    {"number": "532", "name": "Trésor", "class": "5", "type": "asset"},
    {"number": "533", "name": "Sociétés de gestion et d'intermédiation", "class": "5", "type": "asset"},
    
    {"number": "56", "name": "Banques, crédits de trésorerie et d'escompte", "class": "5", "type": "liability", "group": True},
    {"number": "561", "name": "Crédits de trésorerie", "class": "5", "type": "liability"},
    {"number": "564", "name": "Escompte de crédits de campagne", "class": "5", "type": "liability"},
    {"number": "565", "name": "Escompte de crédits ordinaires", "class": "5", "type": "liability"},
    {"number": "566", "name": "Banques, crédits de trésorerie, intérêts courus", "class": "5", "type": "liability"},
    
    {"number": "57", "name": "Caisse", "class": "5", "type": "asset", "group": True, "cash": True},
    {"number": "571", "name": "Caisse siège social", "class": "5", "type": "asset", "cash": True},
    {"number": "572", "name": "Caisse succursale A", "class": "5", "type": "asset", "cash": True},
    {"number": "573", "name": "Caisse succursale B", "class": "5", "type": "asset", "cash": True},
    
    {"number": "58", "name": "Régies d'avances, accréditifs et virements internes", "class": "5", "type": "asset", "group": True},
    {"number": "59", "name": "Dépréciations et risques provisionnés", "class": "5", "type": "contra", "group": True},
    
    {"number": "60", "name": "Achats et variations de stocks", "class": "6", "type": "expense", "group": True},
    {"number": "601", "name": "Achats de marchandises", "class": "6", "type": "expense"},
    {"number": "602", "name": "Achats de matières premières et fournitures liées", "class": "6", "type": "expense"},
    {"number": "603", "name": "Variations des stocks de biens achetés", "class": "6", "type": "expense"},
    {"number": "604", "name": "Achats stockés de matières et fournitures consommables", "class": "6", "type": "expense"},
    {"number": "605", "name": "Autres achats", "class": "6", "type": "expense"},
    {"number": "608", "name": "Achats d'emballages", "class": "6", "type": "expense"},
    
    {"number": "61", "name": "Transports", "class": "6", "type": "expense", "group": True},
    {"number": "611", "name": "Transports sur achats", "class": "6", "type": "expense"},
    {"number": "612", "name": "Transports sur ventes", "class": "6", "type": "expense"},
    {"number": "613", "name": "Transports pour le compte de tiers", "class": "6", "type": "expense"},
    {"number": "614", "name": "Transports du personnel", "class": "6", "type": "expense"},
    {"number": "618", "name": "Autres frais de transport", "class": "6", "type": "expense"},
    
    {"number": "62", "name": "Services extérieurs A", "class": "6", "type": "expense", "group": True},
    {"number": "621", "name": "Sous-traitance générale", "class": "6", "type": "expense"},
    {"number": "622", "name": "Locations et charges locatives", "class": "6", "type": "expense"},
    {"number": "623", "name": "Redevances de crédit-bail et contrats assimilés", "class": "6", "type": "expense"},
    {"number": "624", "name": "Entretien, réparations et maintenance", "class": "6", "type": "expense"},
    {"number": "625", "name": "Primes d'assurance", "class": "6", "type": "expense"},
    {"number": "626", "name": "Études, recherches et documentation", "class": "6", "type": "expense"},
    {"number": "627", "name": "Publicité, publications, relations publiques", "class": "6", "type": "expense"},
    {"number": "628", "name": "Frais de télécommunications", "class": "6", "type": "expense"},
    
    {"number": "63", "name": "Services extérieurs B", "class": "6", "type": "expense", "group": True},
    {"number": "631", "name": "Frais bancaires", "class": "6", "type": "expense"},
    {"number": "632", "name": "Rémunérations d'intermédiaires et de conseils", "class": "6", "type": "expense"},
    {"number": "633", "name": "Frais de formation du personnel", "class": "6", "type": "expense"},
    {"number": "634", "name": "Redevances pour brevets, licences, logiciels", "class": "6", "type": "expense"},
    {"number": "635", "name": "Cotisations", "class": "6", "type": "expense"},
    {"number": "637", "name": "Rémunérations du personnel extérieur à l'entreprise", "class": "6", "type": "expense"},
    {"number": "638", "name": "Autres charges externes", "class": "6", "type": "expense"},
    
    {"number": "64", "name": "Impôts et taxes", "class": "6", "type": "expense", "group": True},
    {"number": "641", "name": "Impôts et taxes directs", "class": "6", "type": "expense"},
    {"number": "645", "name": "Impôts et taxes indirects", "class": "6", "type": "expense"},
    {"number": "646", "name": "Droits d'enregistrement", "class": "6", "type": "expense"},
    {"number": "647", "name": "Pénalités et amendes fiscales", "class": "6", "type": "expense"},
    {"number": "648", "name": "Autres impôts et taxes", "class": "6", "type": "expense"},
    
    {"number": "65", "name": "Autres charges", "class": "6", "type": "expense", "group": True},
    {"number": "651", "name": "Pertes sur créances clients et autres débiteurs", "class": "6", "type": "expense"},
    {"number": "652", "name": "Quote-part de résultat sur opérations faites en commun", "class": "6", "type": "expense"},
    {"number": "653", "name": "Quote-part de résultat annulée sur exécution partielle de contrats", "class": "6", "type": "expense"},
    {"number": "654", "name": "Valeurs comptables des cessions courantes d'immobilisations", "class": "6", "type": "expense"},
    {"number": "658", "name": "Charges diverses", "class": "6", "type": "expense"},
    {"number": "659", "name": "Charges provisionnées d'exploitation", "class": "6", "type": "expense"},
    
    {"number": "66", "name": "Charges de personnel", "class": "6", "type": "expense", "group": True},
    {"number": "661", "name": "Rémunérations directes versées au personnel national", "class": "6", "type": "expense"},
    {"number": "662", "name": "Rémunérations directes versées au personnel non national", "class": "6", "type": "expense"},
    {"number": "663", "name": "Indemnités forfaitaires versées au personnel", "class": "6", "type": "expense"},
    {"number": "664", "name": "Charges sociales", "class": "6", "type": "expense"},
    {"number": "666", "name": "Rémunérations et charges sociales de l'exploitant individuel", "class": "6", "type": "expense"},
    {"number": "667", "name": "Rémunérations transférées de personnel extérieur", "class": "6", "type": "expense"},
    {"number": "668", "name": "Autres charges sociales", "class": "6", "type": "expense"},
    
    {"number": "67", "name": "Frais financiers et charges assimilées", "class": "6", "type": "expense", "group": True},
    {"number": "671", "name": "Intérêts des emprunts", "class": "6", "type": "expense"},
    {"number": "672", "name": "Intérêts dans loyers de crédit-bail et contrats assimilés", "class": "6", "type": "expense"},
    {"number": "673", "name": "Escomptes accordés", "class": "6", "type": "expense"},
    {"number": "674", "name": "Autres intérêts", "class": "6", "type": "expense"},
    {"number": "675", "name": "Escomptes des effets de commerce", "class": "6", "type": "expense"},
    {"number": "676", "name": "Pertes de change", "class": "6", "type": "expense"},
    {"number": "677", "name": "Pertes sur cessions de titres de placement", "class": "6", "type": "expense"},
    {"number": "678", "name": "Pertes sur risques financiers", "class": "6", "type": "expense"},
    {"number": "679", "name": "Charges provisionnées financières", "class": "6", "type": "expense"},
    
    {"number": "68", "name": "Dotations aux amortissements", "class": "6", "type": "expense", "group": True},
    {"number": "681", "name": "Dotations aux amortissements d'exploitation", "class": "6", "type": "expense"},
    {"number": "687", "name": "Dotations aux amortissements à caractère financier", "class": "6", "type": "expense"},
    
    {"number": "69", "name": "Dotations aux provisions", "class": "6", "type": "expense", "group": True},
    {"number": "691", "name": "Dotations aux provisions d'exploitation", "class": "6", "type": "expense"},
    {"number": "697", "name": "Dotations aux provisions financières", "class": "6", "type": "expense"},
    
    {"number": "70", "name": "Ventes", "class": "7", "type": "revenue", "group": True},
    {"number": "701", "name": "Ventes de marchandises", "class": "7", "type": "revenue"},
    {"number": "702", "name": "Ventes de produits finis", "class": "7", "type": "revenue"},
    {"number": "703", "name": "Ventes de produits intermédiaires", "class": "7", "type": "revenue"},
    {"number": "704", "name": "Ventes de produits résiduels", "class": "7", "type": "revenue"},
    {"number": "705", "name": "Travaux facturés", "class": "7", "type": "revenue"},
    {"number": "706", "name": "Services vendus", "class": "7", "type": "revenue"},
    {"number": "707", "name": "Produits accessoires", "class": "7", "type": "revenue"},
    
    {"number": "71", "name": "Subventions d'exploitation", "class": "7", "type": "revenue", "group": True},
    {"number": "72", "name": "Production immobilisée", "class": "7", "type": "revenue", "group": True},
    {"number": "73", "name": "Variations des stocks de biens et de services produits", "class": "7", "type": "revenue", "group": True},
    
    {"number": "75", "name": "Autres produits", "class": "7", "type": "revenue", "group": True},
    {"number": "752", "name": "Quote-part de résultat sur opérations faites en commun", "class": "7", "type": "revenue"},
    {"number": "753", "name": "Quote-part de résultat sur exécution partielle de contrats", "class": "7", "type": "revenue"},
    {"number": "754", "name": "Produits des cessions courantes d'immobilisations", "class": "7", "type": "revenue"},
    {"number": "758", "name": "Produits divers", "class": "7", "type": "revenue"},
    {"number": "759", "name": "Reprises de charges provisionnées d'exploitation", "class": "7", "type": "revenue"},
    
    {"number": "77", "name": "Revenus financiers et produits assimilés", "class": "7", "type": "revenue", "group": True},
    {"number": "771", "name": "Intérêts de prêts", "class": "7", "type": "revenue"},
    {"number": "772", "name": "Revenus de participations", "class": "7", "type": "revenue"},
    {"number": "773", "name": "Escomptes obtenus", "class": "7", "type": "revenue"},
    {"number": "774", "name": "Revenus de titres de placement", "class": "7", "type": "revenue"},
    {"number": "775", "name": "Revenus des créances commerciales", "class": "7", "type": "revenue"},
    {"number": "776", "name": "Gains de change", "class": "7", "type": "revenue"},
    {"number": "777", "name": "Gains sur cessions de titres de placement", "class": "7", "type": "revenue"},
    {"number": "778", "name": "Gains sur risques financiers", "class": "7", "type": "revenue"},
    {"number": "779", "name": "Reprises de charges provisionnées financières", "class": "7", "type": "revenue"},
    
    {"number": "78", "name": "Transferts de charges", "class": "7", "type": "revenue", "group": True},
    {"number": "781", "name": "Transferts de charges d'exploitation", "class": "7", "type": "revenue"},
    {"number": "787", "name": "Transferts de charges financières", "class": "7", "type": "revenue"},
    
    {"number": "79", "name": "Reprises de provisions", "class": "7", "type": "revenue", "group": True},
    {"number": "791", "name": "Reprises de provisions d'exploitation", "class": "7", "type": "revenue"},
    {"number": "797", "name": "Reprises de provisions financières", "class": "7", "type": "revenue"},
    
    {"number": "81", "name": "Valeurs comptables des cessions d'immobilisations", "class": "8", "type": "expense", "group": True},
    {"number": "82", "name": "Produits des cessions d'immobilisations", "class": "8", "type": "revenue", "group": True},
    {"number": "83", "name": "Charges hors activités ordinaires", "class": "8", "type": "expense", "group": True},
    {"number": "84", "name": "Produits hors activités ordinaires", "class": "8", "type": "revenue", "group": True},
    {"number": "85", "name": "Dotations hors activités ordinaires", "class": "8", "type": "expense", "group": True},
    {"number": "86", "name": "Reprises hors activités ordinaires", "class": "8", "type": "revenue", "group": True},
    {"number": "87", "name": "Participation des travailleurs", "class": "8", "type": "expense", "group": True},
    {"number": "88", "name": "Subventions d'équilibre", "class": "8", "type": "revenue", "group": True},
    {"number": "89", "name": "Impôts sur le résultat", "class": "8", "type": "expense", "group": True},
    {"number": "891", "name": "Impôts sur les bénéfices de l'exercice", "class": "8", "type": "expense"},
    {"number": "892", "name": "Rappels d'impôts sur résultats antérieurs", "class": "8", "type": "expense"},
    {"number": "895", "name": "Impôt minimum forfaitaire (IMF)", "class": "8", "type": "expense"},
]



TVA_RATES = {
    "XOF": {  # Zone UEMOA (Bénin, Burkina Faso, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, Togo)
        "standard": Decimal("18.00"),
        "reduced": Decimal("10.00"),
        "zero": Decimal("0.00"),
    },
    "XAF": {  # Zone CEMAC (Cameroun, Centrafrique, Congo, Gabon, Guinée équatoriale, Tchad)
        "standard": Decimal("19.25"),
        "reduced": Decimal("5.00"),
        "zero": Decimal("0.00"),
    },
}


def get_tva_rate(currency: str = "XOF", rate_type: str = "standard") -> Decimal:
    """Obtenir le taux de TVA selon la zone et le type"""
    rates = TVA_RATES.get(currency, TVA_RATES["XOF"])
    return rates.get(rate_type, rates["standard"])


def calculate_tva(amount_ht: Decimal, currency: str = "XOF", rate_type: str = "standard") -> Dict:
    """Calculer la TVA selon les normes OHADA"""
    rate = get_tva_rate(currency, rate_type)
    tva = amount_ht * rate / 100
    ttc = amount_ht + tva
    
    return {
        "amount_ht": float(amount_ht),
        "tva_rate": float(rate),
        "tva_amount": float(tva.quantize(Decimal("0.01"))),
        "amount_ttc": float(ttc.quantize(Decimal("0.01"))),
    }


def init_syscohada_chart(db: Session, tenant_id: UUID) -> int:
    """Initialiser le plan comptable SYSCOHADA pour un tenant"""
    from app.models.accounting_advanced import ChartOfAccounts
    
    count = 0
    for acc in SYSCOHADA_ACCOUNTS:
        existing = db.query(ChartOfAccounts).filter(
            ChartOfAccounts.tenant_id == tenant_id,
            ChartOfAccounts.account_number == acc["number"]
        ).first()
        
        if not existing:
            account = ChartOfAccounts(
                account_number=acc["number"],
                name=acc["name"],
                account_class=acc["class"],
                account_type=acc["type"],
                level=len(acc["number"]),
                is_group=acc.get("group", False),
                is_detail=not acc.get("group", False),
                is_reconcilable=acc.get("reconcilable", False),
                is_bank_account=acc.get("bank", False),
                is_cash_account=acc.get("cash", False),
                tenant_id=tenant_id
            )
            db.add(account)
            count += 1
    
    db.commit()
    return count



def calculate_balance_by_class(accounts: List, account_class: str) -> Dict:
    """Calculer le solde par classe de compte"""
    total_debit = Decimal("0")
    total_credit = Decimal("0")
    
    for acc in accounts:
        if acc.account_class == account_class:
            total_debit += Decimal(str(acc.current_debit or 0))
            total_credit += Decimal(str(acc.current_credit or 0))
    
    if account_class in ["1", "7"]:
        balance = total_credit - total_debit
    else:
        balance = total_debit - total_credit
    
    return {
        "class": account_class,
        "total_debit": float(total_debit),
        "total_credit": float(total_credit),
        "balance": float(balance),
    }


def calculate_result(accounts: List) -> Dict:
    """Calculer le résultat selon SYSCOHADA"""
    revenues = Decimal("0")
    expenses = Decimal("0")
    
    for acc in accounts:
        balance = Decimal(str(acc.balance))
        
        if acc.account_class == "7":
            revenues += abs(balance)
        elif acc.account_class == "6":
            expenses += abs(balance)
        elif acc.account_class == "8":
            if acc.account_type == "revenue":
                revenues += abs(balance)
            else:
                expenses += abs(balance)
    
    result = revenues - expenses
    
    return {
        "total_revenues": float(revenues),
        "total_expenses": float(expenses),
        "gross_result": float(result),
        "is_profit": result >= 0,
    }


def validate_entry_balance(lines: List[Dict]) -> bool:
    """Valider l'équilibre d'une écriture (Débit = Crédit)"""
    total_debit = sum(Decimal(str(l.get("debit", 0))) for l in lines)
    total_credit = sum(Decimal(str(l.get("credit", 0))) for l in lines)
    
    return abs(total_debit - total_credit) < Decimal("0.01")

"""
Donnees de seed pour le referentiel SYSCOHADA
Plan Comptable OHADA complet (classes 1-8)
"""

# ==============================================================================
# COMPTES SYSCOHADA - PLAN COMPTABLE OHADA COMPLET
# ==============================================================================

SYSCOHADA_ACCOUNTS = [
    # ==========================================================================
    # CLASSE 1 - RESSOURCES DURABLES
    # ==========================================================================
    {"number": "10", "label": "Capital", "class": 1, "level": 2, "is_detail": False},
    {"number": "101", "label": "Capital social", "class": 1, "level": 3, "parent": "10", "is_detail": True},
    {"number": "102", "label": "Capital par dotation", "class": 1, "level": 3, "parent": "10", "is_detail": True},
    {"number": "103", "label": "Capital personnel", "class": 1, "level": 3, "parent": "10", "is_detail": True},
    {"number": "105", "label": "Primes liees au capital", "class": 1, "level": 3, "parent": "10", "is_detail": True},
    {"number": "106", "label": "Ecarts de reevaluation", "class": 1, "level": 3, "parent": "10", "is_detail": True},

    {"number": "11", "label": "Reserves", "class": 1, "level": 2, "is_detail": False},
    {"number": "111", "label": "Reserve legale", "class": 1, "level": 3, "parent": "11", "is_detail": True},
    {"number": "112", "label": "Reserve statutaire", "class": 1, "level": 3, "parent": "11", "is_detail": True},
    {"number": "113", "label": "Reserve reglementee", "class": 1, "level": 3, "parent": "11", "is_detail": True},
    {"number": "118", "label": "Autres reserves", "class": 1, "level": 3, "parent": "11", "is_detail": True},

    {"number": "12", "label": "Report a nouveau", "class": 1, "level": 2, "is_detail": False},
    {"number": "121", "label": "Report a nouveau crediteur", "class": 1, "level": 3, "parent": "12", "is_detail": True},
    {"number": "129", "label": "Report a nouveau debiteur", "class": 1, "level": 3, "parent": "12", "is_detail": True},

    {"number": "13", "label": "Resultat net de l'exercice", "class": 1, "level": 2, "is_detail": False},
    {"number": "130", "label": "Resultat en instance d'affectation", "class": 1, "level": 3, "parent": "13", "is_detail": True},
    {"number": "131", "label": "Benefice net", "class": 1, "level": 3, "parent": "13", "is_detail": True},
    {"number": "139", "label": "Perte nette", "class": 1, "level": 3, "parent": "13", "is_detail": True},

    {"number": "14", "label": "Subventions d'investissement", "class": 1, "level": 2, "is_detail": False},
    {"number": "141", "label": "Subventions d'equipement A", "class": 1, "level": 3, "parent": "14", "is_detail": True},
    {"number": "142", "label": "Subventions d'equipement B", "class": 1, "level": 3, "parent": "14", "is_detail": True},
    {"number": "148", "label": "Autres subventions d'investissement", "class": 1, "level": 3, "parent": "14", "is_detail": True},

    {"number": "15", "label": "Provisions reglementees et fonds assimiles", "class": 1, "level": 2, "is_detail": False},
    {"number": "151", "label": "Amortissements derogatoires", "class": 1, "level": 3, "parent": "15", "is_detail": True},
    {"number": "152", "label": "Plus-values a reinvestir", "class": 1, "level": 3, "parent": "15", "is_detail": True},
    {"number": "159", "label": "Provisions pour investissement", "class": 1, "level": 3, "parent": "15", "is_detail": True},

    {"number": "16", "label": "Emprunts et dettes assimilees", "class": 1, "level": 2, "is_detail": False},
    {"number": "161", "label": "Emprunts obligataires", "class": 1, "level": 3, "parent": "16", "is_detail": True},
    {"number": "162", "label": "Emprunts aupres des etablissements de credit", "class": 1, "level": 3, "parent": "16", "is_detail": True},
    {"number": "165", "label": "Depots et cautionnements recus", "class": 1, "level": 3, "parent": "16", "is_detail": True},

    {"number": "17", "label": "Dettes de credit-bail", "class": 1, "level": 2, "is_detail": False},
    {"number": "172", "label": "Credit-bail immobilier", "class": 1, "level": 3, "parent": "17", "is_detail": True},
    {"number": "173", "label": "Credit-bail mobilier", "class": 1, "level": 3, "parent": "17", "is_detail": True},

    {"number": "18", "label": "Dettes liees a des participations", "class": 1, "level": 2, "is_detail": False},
    {"number": "184", "label": "Comptes de liaison des etablissements", "class": 1, "level": 3, "parent": "18", "is_detail": True},
    {"number": "185", "label": "Comptes de liaison des succursales", "class": 1, "level": 3, "parent": "18", "is_detail": True},

    {"number": "19", "label": "Provisions financieres pour risques et charges", "class": 1, "level": 2, "is_detail": False},
    {"number": "191", "label": "Provisions pour litiges", "class": 1, "level": 3, "parent": "19", "is_detail": True},
    {"number": "192", "label": "Provisions pour garanties clients", "class": 1, "level": 3, "parent": "19", "is_detail": True},
    {"number": "194", "label": "Provisions pour pertes de change", "class": 1, "level": 3, "parent": "19", "is_detail": True},
    {"number": "196", "label": "Provisions pour pensions", "class": 1, "level": 3, "parent": "19", "is_detail": True},

    # ==========================================================================
    # CLASSE 2 - ACTIF IMMOBILISE
    # ==========================================================================
    {"number": "20", "label": "Charges immobilisees", "class": 2, "level": 2, "is_detail": False},
    {"number": "201", "label": "Frais d'etablissement", "class": 2, "level": 3, "parent": "20", "is_detail": True},
    {"number": "202", "label": "Charges a repartir", "class": 2, "level": 3, "parent": "20", "is_detail": True},

    {"number": "21", "label": "Immobilisations incorporelles", "class": 2, "level": 2, "is_detail": False},
    {"number": "211", "label": "Frais de recherche et developpement", "class": 2, "level": 3, "parent": "21", "is_detail": True},
    {"number": "212", "label": "Brevets, licences, concessions", "class": 2, "level": 3, "parent": "21", "is_detail": True},
    {"number": "213", "label": "Logiciels", "class": 2, "level": 3, "parent": "21", "is_detail": True},
    {"number": "215", "label": "Fonds commercial", "class": 2, "level": 3, "parent": "21", "is_detail": True},

    {"number": "22", "label": "Terrains", "class": 2, "level": 2, "is_detail": False},
    {"number": "221", "label": "Terrains agricoles", "class": 2, "level": 3, "parent": "22", "is_detail": True},
    {"number": "222", "label": "Terrains nus", "class": 2, "level": 3, "parent": "22", "is_detail": True},
    {"number": "223", "label": "Terrains batis", "class": 2, "level": 3, "parent": "22", "is_detail": True},
    {"number": "225", "label": "Terrains de gisement", "class": 2, "level": 3, "parent": "22", "is_detail": True},

    {"number": "23", "label": "Batiments et installations", "class": 2, "level": 2, "is_detail": False},
    {"number": "231", "label": "Batiments sur sol propre", "class": 2, "level": 3, "parent": "23", "is_detail": True},
    {"number": "232", "label": "Batiments sur sol d'autrui", "class": 2, "level": 3, "parent": "23", "is_detail": True},
    {"number": "233", "label": "Ouvrages d'infrastructure", "class": 2, "level": 3, "parent": "23", "is_detail": True},

    {"number": "24", "label": "Materiel", "class": 2, "level": 2, "is_detail": False},
    {"number": "241", "label": "Materiel et outillage industriel", "class": 2, "level": 3, "parent": "24", "is_detail": True},
    {"number": "242", "label": "Materiel et outillage agricole", "class": 2, "level": 3, "parent": "24", "is_detail": True},
    {"number": "244", "label": "Mobilier et materiel de bureau", "class": 2, "level": 3, "parent": "24", "is_detail": True},
    {"number": "245", "label": "Materiel de transport", "class": 2, "level": 3, "parent": "24", "is_detail": True},

    {"number": "25", "label": "Avances et acomptes sur immobilisations", "class": 2, "level": 2, "is_detail": True},

    {"number": "26", "label": "Titres de participation", "class": 2, "level": 2, "is_detail": True},

    {"number": "27", "label": "Autres immobilisations financieres", "class": 2, "level": 2, "is_detail": False},
    {"number": "271", "label": "Prets et creances a long terme", "class": 2, "level": 3, "parent": "27", "is_detail": True},
    {"number": "272", "label": "Prets au personnel", "class": 2, "level": 3, "parent": "27", "is_detail": True},
    {"number": "274", "label": "Titres immobilises", "class": 2, "level": 3, "parent": "27", "is_detail": True},
    {"number": "275", "label": "Depots et cautionnements verses", "class": 2, "level": 3, "parent": "27", "is_detail": True},

    {"number": "28", "label": "Amortissements", "class": 2, "level": 2, "is_detail": False},
    {"number": "281", "label": "Amort. immobilisations incorporelles", "class": 2, "level": 3, "parent": "28", "is_detail": True},
    {"number": "282", "label": "Amort. terrains", "class": 2, "level": 3, "parent": "28", "is_detail": True},
    {"number": "283", "label": "Amort. batiments", "class": 2, "level": 3, "parent": "28", "is_detail": True},
    {"number": "284", "label": "Amort. materiel", "class": 2, "level": 3, "parent": "28", "is_detail": True},

    {"number": "29", "label": "Provisions pour depreciation", "class": 2, "level": 2, "is_detail": False},
    {"number": "291", "label": "Prov. deprec. immob. incorporelles", "class": 2, "level": 3, "parent": "29", "is_detail": True},
    {"number": "292", "label": "Prov. deprec. terrains", "class": 2, "level": 3, "parent": "29", "is_detail": True},
    {"number": "293", "label": "Prov. deprec. batiments", "class": 2, "level": 3, "parent": "29", "is_detail": True},
    {"number": "294", "label": "Prov. deprec. materiel", "class": 2, "level": 3, "parent": "29", "is_detail": True},

    # ==========================================================================
    # CLASSE 3 - STOCKS
    # ==========================================================================
    {"number": "31", "label": "Marchandises", "class": 3, "level": 2, "is_detail": True},

    {"number": "32", "label": "Matieres premieres et fournitures liees", "class": 3, "level": 2, "is_detail": True},

    {"number": "33", "label": "Autres approvisionnements", "class": 3, "level": 2, "is_detail": False},
    {"number": "331", "label": "Matieres consommables", "class": 3, "level": 3, "parent": "33", "is_detail": True},
    {"number": "332", "label": "Fournitures consommables", "class": 3, "level": 3, "parent": "33", "is_detail": True},
    {"number": "333", "label": "Emballages", "class": 3, "level": 3, "parent": "33", "is_detail": True},

    {"number": "34", "label": "Produits en cours", "class": 3, "level": 2, "is_detail": False},
    {"number": "341", "label": "Produits en cours", "class": 3, "level": 3, "parent": "34", "is_detail": True},
    {"number": "342", "label": "Travaux en cours", "class": 3, "level": 3, "parent": "34", "is_detail": True},

    {"number": "35", "label": "Services en cours", "class": 3, "level": 2, "is_detail": False},
    {"number": "351", "label": "Etudes en cours", "class": 3, "level": 3, "parent": "35", "is_detail": True},
    {"number": "352", "label": "Prestations de services en cours", "class": 3, "level": 3, "parent": "35", "is_detail": True},

    {"number": "36", "label": "Produits finis", "class": 3, "level": 2, "is_detail": True},

    {"number": "37", "label": "Produits intermediaires et residuels", "class": 3, "level": 2, "is_detail": True},

    {"number": "38", "label": "Stocks en cours de route, consignation, depot", "class": 3, "level": 2, "is_detail": True},

    {"number": "39", "label": "Depreciations des stocks", "class": 3, "level": 2, "is_detail": True},

    # ==========================================================================
    # CLASSE 4 - TIERS
    # ==========================================================================
    {"number": "40", "label": "Fournisseurs et comptes rattaches", "class": 4, "level": 2, "is_detail": False},
    {"number": "401", "label": "Fournisseurs", "class": 4, "level": 3, "parent": "40", "is_detail": True, "description": "Compte collectif fournisseurs"},
    {"number": "402", "label": "Fournisseurs - Effets a payer", "class": 4, "level": 3, "parent": "40", "is_detail": True},
    {"number": "408", "label": "Fournisseurs - Factures non parvenues", "class": 4, "level": 3, "parent": "40", "is_detail": True},
    {"number": "409", "label": "Fournisseurs debiteurs", "class": 4, "level": 3, "parent": "40", "is_detail": True},

    {"number": "41", "label": "Clients et comptes rattaches", "class": 4, "level": 2, "is_detail": False},
    {"number": "411", "label": "Clients", "class": 4, "level": 3, "parent": "41", "is_detail": True, "description": "Compte collectif clients"},
    {"number": "412", "label": "Clients - Effets a recevoir", "class": 4, "level": 3, "parent": "41", "is_detail": True},
    {"number": "416", "label": "Clients douteux ou litigieux", "class": 4, "level": 3, "parent": "41", "is_detail": True},
    {"number": "418", "label": "Clients - Produits a recevoir", "class": 4, "level": 3, "parent": "41", "is_detail": True},
    {"number": "419", "label": "Clients crediteurs", "class": 4, "level": 3, "parent": "41", "is_detail": True},

    {"number": "42", "label": "Personnel", "class": 4, "level": 2, "is_detail": False},
    {"number": "421", "label": "Personnel - Avances et acomptes", "class": 4, "level": 3, "parent": "42", "is_detail": True},
    {"number": "422", "label": "Personnel - Remunerations dues", "class": 4, "level": 3, "parent": "42", "is_detail": True},
    {"number": "424", "label": "Personnel - Oeuvres sociales", "class": 4, "level": 3, "parent": "42", "is_detail": True},

    {"number": "43", "label": "Organismes sociaux", "class": 4, "level": 2, "is_detail": False},
    {"number": "431", "label": "Securite sociale", "class": 4, "level": 3, "parent": "43", "is_detail": True},
    {"number": "432", "label": "Caisses de retraite", "class": 4, "level": 3, "parent": "43", "is_detail": True},
    {"number": "433", "label": "Autres organismes sociaux", "class": 4, "level": 3, "parent": "43", "is_detail": True},

    {"number": "44", "label": "Etat et collectivites publiques", "class": 4, "level": 2, "is_detail": False},
    {"number": "441", "label": "Etat - Impot sur les benefices", "class": 4, "level": 3, "parent": "44", "is_detail": True},
    {"number": "442", "label": "Etat - Autres impots et taxes", "class": 4, "level": 3, "parent": "44", "is_detail": True},
    {"number": "443", "label": "Etat - TVA facturee", "class": 4, "level": 3, "parent": "44", "is_detail": True},
    {"number": "444", "label": "Etat - TVA due", "class": 4, "level": 3, "parent": "44", "is_detail": True},
    {"number": "4451", "label": "Etat - TVA recuperable sur immobilisations", "class": 4, "level": 4, "parent": "44", "is_detail": True},
    {"number": "4452", "label": "Etat - TVA recuperable sur achats", "class": 4, "level": 4, "parent": "44", "is_detail": True},
    {"number": "4453", "label": "Etat - TVA recuperable sur transports", "class": 4, "level": 4, "parent": "44", "is_detail": True},
    {"number": "4454", "label": "Etat - TVA recuperable sur services", "class": 4, "level": 4, "parent": "44", "is_detail": True, "description": "TVA deductible standard"},
    {"number": "4455", "label": "Etat - TVA a regulariser", "class": 4, "level": 4, "parent": "44", "is_detail": True},
    {"number": "4456", "label": "Etat - TVA transferee", "class": 4, "level": 4, "parent": "44", "is_detail": True},
    {"number": "4457", "label": "Etat - TVA collectee", "class": 4, "level": 4, "parent": "44", "is_detail": True, "description": "TVA sur ventes"},
    {"number": "447", "label": "Etat - Impots retenus a la source", "class": 4, "level": 3, "parent": "44", "is_detail": True},
    {"number": "449", "label": "Etat - Creances et dettes diverses", "class": 4, "level": 3, "parent": "44", "is_detail": True},

    {"number": "45", "label": "Organismes internationaux", "class": 4, "level": 2, "is_detail": True},

    {"number": "46", "label": "Associes et groupe", "class": 4, "level": 2, "is_detail": False},
    {"number": "461", "label": "Associes - Operations sur le capital", "class": 4, "level": 3, "parent": "46", "is_detail": True},
    {"number": "462", "label": "Associes - Comptes courants", "class": 4, "level": 3, "parent": "46", "is_detail": True},
    {"number": "465", "label": "Associes - Dividendes a payer", "class": 4, "level": 3, "parent": "46", "is_detail": True},
    {"number": "466", "label": "Groupe - Comptes courants", "class": 4, "level": 3, "parent": "46", "is_detail": True},

    {"number": "47", "label": "Debiteurs et crediteurs divers", "class": 4, "level": 2, "is_detail": False},
    {"number": "471", "label": "Comptes d'attente", "class": 4, "level": 3, "parent": "47", "is_detail": True},
    {"number": "476", "label": "Charges constatees d'avance", "class": 4, "level": 3, "parent": "47", "is_detail": True},
    {"number": "477", "label": "Produits constates d'avance", "class": 4, "level": 3, "parent": "47", "is_detail": True},
    {"number": "478", "label": "Ecarts de conversion actif", "class": 4, "level": 3, "parent": "47", "is_detail": True},
    {"number": "479", "label": "Ecarts de conversion passif", "class": 4, "level": 3, "parent": "47", "is_detail": True},

    {"number": "48", "label": "Creances et dettes HAO", "class": 4, "level": 2, "is_detail": True},

    {"number": "49", "label": "Depreciations et risques provisionnes", "class": 4, "level": 2, "is_detail": False},
    {"number": "491", "label": "Depreciation des comptes fournisseurs", "class": 4, "level": 3, "parent": "49", "is_detail": True},
    {"number": "492", "label": "Depreciation des comptes clients", "class": 4, "level": 3, "parent": "49", "is_detail": True},

    # ==========================================================================
    # CLASSE 5 - TRESORERIE
    # ==========================================================================
    {"number": "50", "label": "Titres de placement", "class": 5, "level": 2, "is_detail": False},
    {"number": "502", "label": "Actions", "class": 5, "level": 3, "parent": "50", "is_detail": True},
    {"number": "503", "label": "Obligations", "class": 5, "level": 3, "parent": "50", "is_detail": True},
    {"number": "504", "label": "Bons de souscription", "class": 5, "level": 3, "parent": "50", "is_detail": True},

    {"number": "51", "label": "Valeurs a encaisser", "class": 5, "level": 2, "is_detail": False},
    {"number": "511", "label": "Effets a encaisser", "class": 5, "level": 3, "parent": "51", "is_detail": True},
    {"number": "513", "label": "Cheques a encaisser", "class": 5, "level": 3, "parent": "51", "is_detail": True},
    {"number": "514", "label": "Cheques a l'encaissement", "class": 5, "level": 3, "parent": "51", "is_detail": True},

    {"number": "52", "label": "Banques", "class": 5, "level": 2, "is_detail": False},
    {"number": "521", "label": "Banques locales", "class": 5, "level": 3, "parent": "52", "is_detail": True},
    {"number": "524", "label": "Banques hors zone monetaire", "class": 5, "level": 3, "parent": "52", "is_detail": True},

    {"number": "53", "label": "Etablissements financiers", "class": 5, "level": 2, "is_detail": False},
    {"number": "531", "label": "Cheques postaux", "class": 5, "level": 3, "parent": "53", "is_detail": True},
    {"number": "532", "label": "Tresor public", "class": 5, "level": 3, "parent": "53", "is_detail": True},

    {"number": "54", "label": "Instruments de tresorerie", "class": 5, "level": 2, "is_detail": True},

    {"number": "56", "label": "Banques - Credits de tresorerie et escompte", "class": 5, "level": 2, "is_detail": True},

    {"number": "57", "label": "Caisse", "class": 5, "level": 2, "is_detail": False},
    {"number": "571", "label": "Caisse siege social", "class": 5, "level": 3, "parent": "57", "is_detail": True},
    {"number": "572", "label": "Caisse succursale A", "class": 5, "level": 3, "parent": "57", "is_detail": True},
    {"number": "573", "label": "Caisse succursale B", "class": 5, "level": 3, "parent": "57", "is_detail": True},

    {"number": "58", "label": "Regies d'avances et virements internes", "class": 5, "level": 2, "is_detail": True},

    {"number": "59", "label": "Depreciations et risques provisionnes", "class": 5, "level": 2, "is_detail": True},

    # ==========================================================================
    # CLASSE 6 - CHARGES DES ACTIVITES ORDINAIRES
    # ==========================================================================
    {"number": "60", "label": "Achats et variations de stocks", "class": 6, "level": 2, "is_detail": False},
    {"number": "601", "label": "Achats de marchandises", "class": 6, "level": 3, "parent": "60", "is_detail": True},
    {"number": "602", "label": "Achats de matieres premieres", "class": 6, "level": 3, "parent": "60", "is_detail": True},
    {"number": "603", "label": "Variations de stocks", "class": 6, "level": 3, "parent": "60", "is_detail": True},
    {"number": "604", "label": "Achats d'emballages", "class": 6, "level": 3, "parent": "60", "is_detail": True},
    {"number": "605", "label": "Autres achats", "class": 6, "level": 3, "parent": "60", "is_detail": True},
    {"number": "608", "label": "Achats d'etudes et prestations", "class": 6, "level": 3, "parent": "60", "is_detail": True},

    {"number": "606", "label": "Achats non stockes de matieres", "class": 6, "level": 2, "is_detail": False},
    {"number": "6061", "label": "Electricite", "class": 6, "level": 4, "parent": "606", "is_detail": True, "description": "Factures electricite (SBEE, etc.)"},
    {"number": "6062", "label": "Eau", "class": 6, "level": 4, "parent": "606", "is_detail": True, "description": "Factures eau (SONEB, etc.)"},
    {"number": "6063", "label": "Carburants et lubrifiants", "class": 6, "level": 4, "parent": "606", "is_detail": True, "description": "Essence, gasoil"},
    {"number": "6064", "label": "Fournitures d'entretien", "class": 6, "level": 4, "parent": "606", "is_detail": True},
    {"number": "6065", "label": "Fournitures de bureau", "class": 6, "level": 4, "parent": "606", "is_detail": True, "description": "Papeterie, consommables bureau"},
    {"number": "6068", "label": "Autres achats non stockes", "class": 6, "level": 4, "parent": "606", "is_detail": True},

    {"number": "61", "label": "Transports", "class": 6, "level": 2, "is_detail": False},
    {"number": "611", "label": "Transports sur achats", "class": 6, "level": 3, "parent": "61", "is_detail": True},
    {"number": "612", "label": "Transports sur ventes", "class": 6, "level": 3, "parent": "61", "is_detail": True},
    {"number": "613", "label": "Transports pour le compte de tiers", "class": 6, "level": 3, "parent": "61", "is_detail": True},
    {"number": "614", "label": "Transports du personnel", "class": 6, "level": 3, "parent": "61", "is_detail": True},

    {"number": "62", "label": "Services exterieurs A", "class": 6, "level": 2, "is_detail": False},
    {"number": "621", "label": "Sous-traitance generale", "class": 6, "level": 3, "parent": "62", "is_detail": True},
    {"number": "622", "label": "Locations et charges locatives", "class": 6, "level": 3, "parent": "62", "is_detail": True},
    {"number": "6221", "label": "Locations de terrains", "class": 6, "level": 4, "parent": "622", "is_detail": True},
    {"number": "6222", "label": "Locations de batiments", "class": 6, "level": 4, "parent": "622", "is_detail": True, "description": "Loyers bureaux, entrepots"},
    {"number": "6223", "label": "Locations de materiel", "class": 6, "level": 4, "parent": "622", "is_detail": True},
    {"number": "6224", "label": "Malis sur emballages", "class": 6, "level": 4, "parent": "622", "is_detail": True},
    {"number": "623", "label": "Redevances de credit-bail", "class": 6, "level": 3, "parent": "62", "is_detail": True},
    {"number": "624", "label": "Entretien et reparations", "class": 6, "level": 3, "parent": "62", "is_detail": True},
    {"number": "6241", "label": "Entretien et reparations biens immobiliers", "class": 6, "level": 4, "parent": "624", "is_detail": True},
    {"number": "6242", "label": "Entretien et reparations biens mobiliers", "class": 6, "level": 4, "parent": "624", "is_detail": True},
    {"number": "6248", "label": "Autres entretiens et reparations", "class": 6, "level": 4, "parent": "624", "is_detail": True},
    {"number": "625", "label": "Primes d'assurance", "class": 6, "level": 3, "parent": "62", "is_detail": True},
    {"number": "6251", "label": "Assurances multirisques", "class": 6, "level": 4, "parent": "625", "is_detail": True},
    {"number": "6252", "label": "Assurances materiel de transport", "class": 6, "level": 4, "parent": "625", "is_detail": True},
    {"number": "6256", "label": "Assurances responsabilite civile", "class": 6, "level": 4, "parent": "625", "is_detail": True},
    {"number": "626", "label": "Etudes, recherches et documentation", "class": 6, "level": 3, "parent": "62", "is_detail": True},
    {"number": "627", "label": "Publicite, publications, relations publiques", "class": 6, "level": 3, "parent": "62", "is_detail": True},
    {"number": "6271", "label": "Annonces et insertions", "class": 6, "level": 4, "parent": "627", "is_detail": True},
    {"number": "6272", "label": "Catalogues et imprimes", "class": 6, "level": 4, "parent": "627", "is_detail": True},
    {"number": "6273", "label": "Foires et expositions", "class": 6, "level": 4, "parent": "627", "is_detail": True},
    {"number": "628", "label": "Frais de telecommunications", "class": 6, "level": 3, "parent": "62", "is_detail": True},

    {"number": "63", "label": "Services exterieurs B", "class": 6, "level": 2, "is_detail": False},
    {"number": "631", "label": "Frais bancaires", "class": 6, "level": 3, "parent": "63", "is_detail": True},
    {"number": "632", "label": "Remunerations d'intermediaires et conseils", "class": 6, "level": 3, "parent": "63", "is_detail": True},
    {"number": "6321", "label": "Commissions et courtages sur achats", "class": 6, "level": 4, "parent": "632", "is_detail": True},
    {"number": "6322", "label": "Commissions et courtages sur ventes", "class": 6, "level": 4, "parent": "632", "is_detail": True},
    {"number": "6324", "label": "Honoraires", "class": 6, "level": 4, "parent": "632", "is_detail": True, "description": "Avocats, notaires, experts-comptables"},
    {"number": "6328", "label": "Divers frais", "class": 6, "level": 4, "parent": "632", "is_detail": True},
    {"number": "633", "label": "Frais de formation du personnel", "class": 6, "level": 3, "parent": "63", "is_detail": True},
    {"number": "634", "label": "Redevances pour brevets et licences", "class": 6, "level": 3, "parent": "63", "is_detail": True},
    {"number": "637", "label": "Remunerations du personnel exterieur", "class": 6, "level": 3, "parent": "63", "is_detail": True},
    {"number": "638", "label": "Autres charges externes", "class": 6, "level": 3, "parent": "63", "is_detail": True},

    {"number": "6281", "label": "Telephone", "class": 6, "level": 4, "parent": "628", "is_detail": True, "description": "MTN, Moov, Orange, lignes fixes"},
    {"number": "6282", "label": "Internet", "class": 6, "level": 4, "parent": "628", "is_detail": True},
    {"number": "6283", "label": "Affranchissements", "class": 6, "level": 4, "parent": "628", "is_detail": True},

    {"number": "64", "label": "Impots et taxes", "class": 6, "level": 2, "is_detail": False},
    {"number": "641", "label": "Impots et taxes directs", "class": 6, "level": 3, "parent": "64", "is_detail": True},
    {"number": "6411", "label": "Patentes, licences et taxes annexes", "class": 6, "level": 4, "parent": "641", "is_detail": True},
    {"number": "6412", "label": "Taxes foncieres", "class": 6, "level": 4, "parent": "641", "is_detail": True},
    {"number": "6413", "label": "Taxes sur vehicules", "class": 6, "level": 4, "parent": "641", "is_detail": True},
    {"number": "645", "label": "Impots et taxes indirects", "class": 6, "level": 3, "parent": "64", "is_detail": True},
    {"number": "646", "label": "Droits d'enregistrement", "class": 6, "level": 3, "parent": "64", "is_detail": True},
    {"number": "647", "label": "Penalites et amendes fiscales", "class": 6, "level": 3, "parent": "64", "is_detail": True},
    {"number": "648", "label": "Autres impots et taxes", "class": 6, "level": 3, "parent": "64", "is_detail": True},

    {"number": "65", "label": "Autres charges", "class": 6, "level": 2, "is_detail": False},
    {"number": "651", "label": "Pertes sur creances clients", "class": 6, "level": 3, "parent": "65", "is_detail": True},
    {"number": "652", "label": "Quote-part de resultat sur operations faites en commun", "class": 6, "level": 3, "parent": "65", "is_detail": True},
    {"number": "654", "label": "Valeur comptable cessions courantes immob.", "class": 6, "level": 3, "parent": "65", "is_detail": True},
    {"number": "658", "label": "Charges diverses", "class": 6, "level": 3, "parent": "65", "is_detail": True},

    {"number": "66", "label": "Charges de personnel", "class": 6, "level": 2, "is_detail": False},
    {"number": "661", "label": "Remunerations directes versees au personnel national", "class": 6, "level": 3, "parent": "66", "is_detail": True},
    {"number": "662", "label": "Remunerations directes versees au personnel non national", "class": 6, "level": 3, "parent": "66", "is_detail": True},
    {"number": "663", "label": "Indemnites forfaitaires versees au personnel", "class": 6, "level": 3, "parent": "66", "is_detail": True},
    {"number": "664", "label": "Charges sociales", "class": 6, "level": 3, "parent": "66", "is_detail": True},
    {"number": "6641", "label": "Charges sociales sur remunerations", "class": 6, "level": 4, "parent": "664", "is_detail": True},
    {"number": "6642", "label": "Charges sociales sur indemnites", "class": 6, "level": 4, "parent": "664", "is_detail": True},
    {"number": "668", "label": "Autres charges sociales", "class": 6, "level": 3, "parent": "66", "is_detail": True},

    {"number": "67", "label": "Frais financiers et charges assimilees", "class": 6, "level": 2, "is_detail": False},
    {"number": "671", "label": "Interets des emprunts", "class": 6, "level": 3, "parent": "67", "is_detail": True},
    {"number": "672", "label": "Interets dans loyers credit-bail", "class": 6, "level": 3, "parent": "67", "is_detail": True},
    {"number": "673", "label": "Escomptes accordes", "class": 6, "level": 3, "parent": "67", "is_detail": True},
    {"number": "674", "label": "Autres interets", "class": 6, "level": 3, "parent": "67", "is_detail": True},
    {"number": "676", "label": "Pertes de change", "class": 6, "level": 3, "parent": "67", "is_detail": True},
    {"number": "678", "label": "Autres frais financiers", "class": 6, "level": 3, "parent": "67", "is_detail": True},

    {"number": "68", "label": "Dotations aux amortissements", "class": 6, "level": 2, "is_detail": False},
    {"number": "681", "label": "Dotations aux amortissements d'exploitation", "class": 6, "level": 3, "parent": "68", "is_detail": True},
    {"number": "687", "label": "Dotations aux amortissements financiers", "class": 6, "level": 3, "parent": "68", "is_detail": True},

    {"number": "69", "label": "Dotations aux provisions", "class": 6, "level": 2, "is_detail": False},
    {"number": "691", "label": "Dotations aux provisions d'exploitation", "class": 6, "level": 3, "parent": "69", "is_detail": True},
    {"number": "697", "label": "Dotations aux provisions financieres", "class": 6, "level": 3, "parent": "69", "is_detail": True},

    # ==========================================================================
    # CLASSE 7 - PRODUITS DES ACTIVITES ORDINAIRES
    # ==========================================================================
    {"number": "70", "label": "Ventes", "class": 7, "level": 2, "is_detail": False},
    {"number": "701", "label": "Ventes de marchandises", "class": 7, "level": 3, "parent": "70", "is_detail": True},
    {"number": "702", "label": "Ventes de produits finis", "class": 7, "level": 3, "parent": "70", "is_detail": True},
    {"number": "703", "label": "Ventes de produits intermediaires", "class": 7, "level": 3, "parent": "70", "is_detail": True},
    {"number": "704", "label": "Ventes de produits residuels", "class": 7, "level": 3, "parent": "70", "is_detail": True},
    {"number": "705", "label": "Travaux factures", "class": 7, "level": 3, "parent": "70", "is_detail": True},
    {"number": "706", "label": "Services vendus", "class": 7, "level": 3, "parent": "70", "is_detail": True},
    {"number": "707", "label": "Produits accessoires", "class": 7, "level": 3, "parent": "70", "is_detail": True},
    {"number": "7071", "label": "Ports, emballages perdus, autres frais factures", "class": 7, "level": 4, "parent": "707", "is_detail": True},
    {"number": "7072", "label": "Commissions et courtages", "class": 7, "level": 4, "parent": "707", "is_detail": True},
    {"number": "7073", "label": "Locations", "class": 7, "level": 4, "parent": "707", "is_detail": True},
    {"number": "7074", "label": "Bonis sur reprises d'emballages", "class": 7, "level": 4, "parent": "707", "is_detail": True},

    {"number": "71", "label": "Subventions d'exploitation", "class": 7, "level": 2, "is_detail": True},

    {"number": "72", "label": "Production immobilisee", "class": 7, "level": 2, "is_detail": True},

    {"number": "73", "label": "Variations de stocks de biens et services produits", "class": 7, "level": 2, "is_detail": True},

    {"number": "75", "label": "Autres produits", "class": 7, "level": 2, "is_detail": False},
    {"number": "754", "label": "Produits des cessions courantes d'immobilisations", "class": 7, "level": 3, "parent": "75", "is_detail": True},
    {"number": "758", "label": "Produits divers", "class": 7, "level": 3, "parent": "75", "is_detail": True},

    {"number": "77", "label": "Revenus financiers et produits assimiles", "class": 7, "level": 2, "is_detail": False},
    {"number": "771", "label": "Interets de prets", "class": 7, "level": 3, "parent": "77", "is_detail": True},
    {"number": "772", "label": "Revenus de participations", "class": 7, "level": 3, "parent": "77", "is_detail": True},
    {"number": "773", "label": "Escomptes obtenus", "class": 7, "level": 3, "parent": "77", "is_detail": True},
    {"number": "774", "label": "Revenus de titres de placement", "class": 7, "level": 3, "parent": "77", "is_detail": True},
    {"number": "776", "label": "Gains de change", "class": 7, "level": 3, "parent": "77", "is_detail": True},
    {"number": "778", "label": "Autres produits financiers", "class": 7, "level": 3, "parent": "77", "is_detail": True},

    {"number": "78", "label": "Transferts de charges", "class": 7, "level": 2, "is_detail": True},

    {"number": "79", "label": "Reprises de provisions", "class": 7, "level": 2, "is_detail": False},
    {"number": "791", "label": "Reprises de provisions d'exploitation", "class": 7, "level": 3, "parent": "79", "is_detail": True},
    {"number": "797", "label": "Reprises de provisions financieres", "class": 7, "level": 3, "parent": "79", "is_detail": True},

    # ==========================================================================
    # CLASSE 8 - AUTRES CHARGES ET AUTRES PRODUITS (HAO)
    # ==========================================================================
    {"number": "81", "label": "Valeurs comptables des cessions d'immobilisations", "class": 8, "level": 2, "is_detail": True},

    {"number": "82", "label": "Produits des cessions d'immobilisations", "class": 8, "level": 2, "is_detail": True},

    {"number": "83", "label": "Charges HAO", "class": 8, "level": 2, "is_detail": True},

    {"number": "84", "label": "Produits HAO", "class": 8, "level": 2, "is_detail": True},

    {"number": "85", "label": "Dotations HAO", "class": 8, "level": 2, "is_detail": True},

    {"number": "86", "label": "Reprises HAO", "class": 8, "level": 2, "is_detail": True},

    {"number": "87", "label": "Participation des travailleurs", "class": 8, "level": 2, "is_detail": True},

    {"number": "88", "label": "Subventions d'equilibre", "class": 8, "level": 2, "is_detail": True},

    {"number": "89", "label": "Impots sur le resultat", "class": 8, "level": 2, "is_detail": False},
    {"number": "891", "label": "Impots sur les benefices de l'exercice", "class": 8, "level": 3, "parent": "89", "is_detail": True},
    {"number": "892", "label": "Rappel d'impots sur resultat anterieur", "class": 8, "level": 3, "parent": "89", "is_detail": True},
    {"number": "895", "label": "Impot minimum forfaitaire (IMF)", "class": 8, "level": 3, "parent": "89", "is_detail": True},
]


# ==============================================================================
# CATEGORIES FOURNISSEURS
# ==============================================================================

SUPPLIER_CATEGORIES = [
    {
        "code": "ENERGIE",
        "label": "Energie (electricite, gaz)",
        "account": "6061",
        "keywords": ["electricite", "electric", "sbee", "sonelec", "ceb", "cie", "senelec", "eneo", "gaz", "sonagas", "energy"]
    },
    {
        "code": "EAU",
        "label": "Eau",
        "account": "6062",
        "keywords": ["eau", "water", "soneb", "onea", "sodeci", "regideso", "sde", "jirama"]
    },
    {
        "code": "CARBURANT",
        "label": "Carburant et lubrifiants",
        "account": "6063",
        "keywords": ["carburant", "essence", "gasoil", "diesel", "fuel", "total", "oryx", "shell", "oilibya", "petrolier", "station", "petrol", "lubrifiant"]
    },
    {
        "code": "FOURNITURES",
        "label": "Fournitures de bureau et consommables",
        "account": "6065",
        "keywords": ["fourniture", "papeterie", "bureau", "consommable", "cartouche", "encre", "papier", "stylo", "classeur"]
    },
    {
        "code": "TELECOM",
        "label": "Telecommunications",
        "account": "6281",
        "keywords": ["telephone", "telecom", "mtn", "moov", "orange", "airtel", "glo", "internet", "mobile", "communication", "togocel", "expresso", "free"]
    },
    {
        "code": "LOYER",
        "label": "Loyers et charges locatives",
        "account": "6222",
        "keywords": ["loyer", "bail", "location", "locatif", "immobilier", "rent"]
    },
    {
        "code": "ENTRETIEN",
        "label": "Entretien et reparations",
        "account": "6248",
        "keywords": ["entretien", "reparation", "maintenance", "nettoyage", "menage", "gardiennage", "securite"]
    },
    {
        "code": "ASSURANCE",
        "label": "Assurances",
        "account": "6251",
        "keywords": ["assurance", "insurance", "sanlam", "nsia", "axa", "allianz", "saham", "fedas", "sunu"]
    },
    {
        "code": "HONORAIRES",
        "label": "Honoraires et conseils",
        "account": "6324",
        "keywords": ["avocat", "notaire", "expert", "comptable", "consultant", "conseil", "audit", "honoraire", "cabinet"]
    },
    {
        "code": "TRANSPORT",
        "label": "Transport et livraison",
        "account": "612",
        "keywords": ["transport", "livraison", "coursier", "expedition", "fret", "logistique", "dhl", "fedex", "ups"]
    },
    {
        "code": "BANQUE",
        "label": "Services bancaires",
        "account": "631",
        "keywords": ["banque", "bank", "frais bancaire", "commission", "agios", "boa", "ecobank", "sgb", "bicis", "orabank"]
    },
    {
        "code": "PUBLICITE",
        "label": "Publicite et communication",
        "account": "6271",
        "keywords": ["publicite", "pub", "marketing", "affichage", "radio", "tv", "presse", "insertion", "communication"]
    },
]


# ==============================================================================
# MOTS-CLES -> COMPTES (pour suggestion fine)
# ==============================================================================

ACCOUNT_KEYWORDS = [
    # Energie
    {"keyword": "electricite", "account": "6061", "priority": 10},
    {"keyword": "sbee", "account": "6061", "priority": 10},
    {"keyword": "sonelec", "account": "6061", "priority": 10},
    {"keyword": "kwh", "account": "6061", "priority": 8},
    {"keyword": "compteur", "account": "6061", "priority": 5},

    # Eau
    {"keyword": "eau", "account": "6062", "priority": 10},
    {"keyword": "soneb", "account": "6062", "priority": 10},
    {"keyword": "m3", "account": "6062", "priority": 5},

    # Carburant
    {"keyword": "carburant", "account": "6063", "priority": 10},
    {"keyword": "essence", "account": "6063", "priority": 10},
    {"keyword": "gasoil", "account": "6063", "priority": 10},
    {"keyword": "diesel", "account": "6063", "priority": 10},
    {"keyword": "total", "account": "6063", "priority": 8},
    {"keyword": "oryx", "account": "6063", "priority": 8},
    {"keyword": "shell", "account": "6063", "priority": 8},
    {"keyword": "litre", "account": "6063", "priority": 5},

    # Fournitures bureau
    {"keyword": "papeterie", "account": "6065", "priority": 10},
    {"keyword": "fourniture", "account": "6065", "priority": 8},
    {"keyword": "cartouche", "account": "6065", "priority": 8},
    {"keyword": "papier", "account": "6065", "priority": 6},

    # Telecom
    {"keyword": "telephone", "account": "6261", "priority": 10},
    {"keyword": "mtn", "account": "6261", "priority": 10},
    {"keyword": "moov", "account": "6261", "priority": 10},
    {"keyword": "orange", "account": "6261", "priority": 10},
    {"keyword": "airtel", "account": "6261", "priority": 10},
    {"keyword": "internet", "account": "6262", "priority": 10},
    {"keyword": "fibre", "account": "6262", "priority": 8},

    # Loyer
    {"keyword": "loyer", "account": "6222", "priority": 10},
    {"keyword": "bail", "account": "6222", "priority": 10},
    {"keyword": "location", "account": "6222", "priority": 8},

    # Entretien
    {"keyword": "entretien", "account": "6248", "priority": 10},
    {"keyword": "reparation", "account": "6248", "priority": 10},
    {"keyword": "maintenance", "account": "6248", "priority": 10},
    {"keyword": "nettoyage", "account": "6248", "priority": 8},

    # Assurance
    {"keyword": "assurance", "account": "6251", "priority": 10},
    {"keyword": "sanlam", "account": "6251", "priority": 10},
    {"keyword": "nsia", "account": "6251", "priority": 10},
    {"keyword": "axa", "account": "6251", "priority": 10},

    # Honoraires
    {"keyword": "avocat", "account": "6324", "priority": 10},
    {"keyword": "notaire", "account": "6324", "priority": 10},
    {"keyword": "expert", "account": "6324", "priority": 8},
    {"keyword": "comptable", "account": "6324", "priority": 8},
    {"keyword": "consultant", "account": "6324", "priority": 8},
    {"keyword": "honoraire", "account": "6324", "priority": 10},

    # Transport
    {"keyword": "transport", "account": "612", "priority": 10},
    {"keyword": "livraison", "account": "612", "priority": 10},
    {"keyword": "coursier", "account": "612", "priority": 8},
    {"keyword": "fret", "account": "612", "priority": 8},
    {"keyword": "dhl", "account": "612", "priority": 8},

    # Banque
    {"keyword": "banque", "account": "631", "priority": 8},
    {"keyword": "agios", "account": "631", "priority": 10},
    {"keyword": "commission bancaire", "account": "631", "priority": 10},

    # Publicite
    {"keyword": "publicite", "account": "6271", "priority": 10},
    {"keyword": "marketing", "account": "6271", "priority": 8},
    {"keyword": "affichage", "account": "6271", "priority": 8},

    # Formation
    {"keyword": "formation", "account": "633", "priority": 10},
    {"keyword": "seminaire", "account": "633", "priority": 8},
    {"keyword": "stage", "account": "633", "priority": 6},

    # Default achats marchandises
    {"keyword": "achat", "account": "601", "priority": 3},
    {"keyword": "marchandise", "account": "601", "priority": 5},
]

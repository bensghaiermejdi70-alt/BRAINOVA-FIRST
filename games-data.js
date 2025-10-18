// Data for 37 ice breaker games
const gamesData = [
    {
        id: 1,
        title: "Deux Vérités et un Mensonge",
        duration: "10-15 min",
        players: "4-20 personnes",
        category: "rapide",
        description: "Chaque participant énonce trois affirmations à son sujet : deux vraies et une fausse. Les autres doivent deviner laquelle est fausse.",
        rules: [
            "Chaque joueur prépare 3 affirmations : 2 vraies, 1 fausse",
            "À tour de rôle, chacun énonce ses affirmations",
            "Les autres votent pour celle qu'ils pensent être fausse",
            "Le joueur révèle la vérité",
            "Continuez jusqu'à ce que tous aient participé"
        ],
        materials: ["Aucun matériel nécessaire"]
    },
    {
        id: 2,
        title: "La Toile d'Araignée",
        duration: "15-20 min",
        players: "8-30 personnes",
        category: "groupe",
        description: "Les participants forment un cercle et lancent une pelote de laine en partageant quelque chose sur eux-mêmes, créant ainsi une toile connectant tout le monde.",
        rules: [
            "Formez un cercle",
            "Le premier tient la pelote et partage quelque chose",
            "Il lance la pelote à quelqu'un en gardant le fil",
            "Chaque personne fait de même",
            "À la fin, observez la toile créée"
        ],
        materials: ["Pelote de laine"]
    },
    {
        id: 3,
        title: "Speed Meeting",
        duration: "20-30 min",
        players: "10-40 personnes",
        category: "rapide",
        description: "Inspiré du speed dating, les participants ont 2-3 minutes pour se présenter à leur partenaire avant de changer.",
        rules: [
            "Formez deux lignes face à face",
            "Chaque paire a 2-3 minutes pour échanger",
            "Au signal, une ligne se déplace d'une place",
            "Répétez jusqu'à ce que tous se soient rencontrés",
            "Proposez des questions guides si nécessaire"
        ],
        materials: ["Minuteur", "Questions guides (optionnel)"]
    },
    {
        id: 4,
        title: "Le Jeu du Prénom",
        duration: "10-15 min",
        players: "5-25 personnes",
        category: "rapide",
        description: "Chaque personne dit son prénom accompagné d'un adjectif qui commence par la même lettre.",
        rules: [
            "Formez un cercle",
            "Le premier dit son prénom avec un adjectif (ex: 'Marie Merveilleuse')",
            "Le suivant répète tous les prénoms précédents puis ajoute le sien",
            "Continuez jusqu'à ce que tous aient participé",
            "Aidez-vous mutuellement si quelqu'un oublie"
        ],
        materials: ["Aucun matériel nécessaire"]
    },
    {
        id: 5,
        title: "Dessine ton Voisin",
        duration: "15-20 min",
        players: "6-30 personnes",
        category: "creatif",
        description: "Les participants dessinent leur voisin sans le regarder, uniquement en observant le papier.",
        rules: [
            "Asseyez-vous en cercle",
            "Distribuez papier et crayons",
            "Chacun dessine son voisin sans regarder le papier",
            "Présentez les dessins avec humour",
            "Discutez des impressions"
        ],
        materials: ["Papier", "Crayons"]
    },
    {
        id: 6,
        title: "La Chasse aux Similitudes",
        duration: "15-20 min",
        players: "8-40 personnes",
        category: "groupe",
        description: "Les participants doivent trouver des personnes qui partagent des caractéristiques spécifiques avec eux.",
        rules: [
            "Distribuez une liste de caractéristiques",
            "Les participants circulent pour trouver des personnes correspondantes",
            "Notez les noms pour chaque critère",
            "Le premier à compléter sa liste gagne",
            "Partagez les découvertes intéressantes"
        ],
        materials: ["Liste de caractéristiques", "Stylos"]
    },
    {
        id: 7,
        title: "L'Interview Croisée",
        duration: "20-30 min",
        players: "6-30 personnes",
        category: "rapide",
        description: "Par paires, les participants s'interviewent mutuellement puis présentent leur partenaire au groupe.",
        rules: [
            "Formez des paires",
            "5 minutes d'interview dans chaque sens",
            "Chacun présente son partenaire au groupe",
            "Encouragez les questions intéressantes",
            "Applaudissez chaque présentation"
        ],
        materials: ["Questions guides (optionnel)"]
    },
    {
        id: 8,
        title: "La Pelote de Questions",
        duration: "15-25 min",
        players: "8-25 personnes",
        category: "groupe",
        description: "Une pelote est lancée dans le groupe, et celui qui l'attrape répond à une question personnelle.",
        rules: [
            "Formez un cercle",
            "Préparez des questions",
            "Lancez la pelote",
            "Qui l'attrape répond à une question",
            "Continuez jusqu'à ce que tous aient participé"
        ],
        materials: ["Pelote ou balle", "Liste de questions"]
    },
    {
        id: 9,
        title: "Bingo Humain",
        duration: "20-30 min",
        players: "10-50 personnes",
        category: "groupe",
        description: "Une grille bingo avec des caractéristiques à trouver parmi les participants.",
        rules: [
            "Distribuez les grilles bingo",
            "Les participants cherchent des personnes correspondant aux cases",
            "Une personne par case seulement",
            "Le premier à remplir une ligne crie 'Bingo!'",
            "Partagez les découvertes"
        ],
        materials: ["Grilles bingo personnalisées", "Stylos"]
    },
    {
        id: 10,
        title: "L'Île Déserte",
        duration: "15-20 min",
        players: "5-20 personnes",
        category: "creatif",
        description: "Chacun partage trois objets qu'ils apporteraient sur une île déserte et explique pourquoi.",
        rules: [
            "Formez un cercle",
            "Chaque personne réfléchit à 3 objets",
            "À tour de rôle, partagez vos choix",
            "Expliquez pourquoi ces objets",
            "Débattez des choix intéressants"
        ],
        materials: ["Aucun matériel nécessaire"]
    },
    {
        id: 11,
        title: "Le Cercle de Compliments",
        duration: "15-20 min",
        players: "6-20 personnes",
        category: "groupe",
        description: "En cercle, chacun fait un compliment à la personne à sa droite.",
        rules: [
            "Formez un cercle",
            "Commencez par un volontaire",
            "Chacun fait un compliment sincère à son voisin",
            "Continuez le tour du cercle",
            "Encouragez l'authenticité"
        ],
        materials: ["Aucun matériel nécessaire"]
    },
    {
        id: 12,
        title: "Charades de Métiers",
        duration: "20-30 min",
        players: "8-30 personnes",
        category: "mouvement",
        description: "Les participants miment leur métier ou profession de rêve, les autres devinent.",
        rules: [
            "Chaque personne pense à un métier",
            "À tour de rôle, mimez le métier",
            "Pas de paroles, uniquement des gestes",
            "Le groupe devine",
            "Discutez après chaque mime"
        ],
        materials: ["Aucun matériel nécessaire"]
    },
    {
        id: 13,
        title: "L'Histoire Collaborative",
        duration: "15-20 min",
        players: "6-20 personnes",
        category: "creatif",
        description: "Le groupe crée une histoire ensemble, chacun ajoutant une phrase à tour de rôle.",
        rules: [
            "Formez un cercle",
            "Le premier commence une histoire",
            "Chacun ajoute une phrase",
            "Continuez jusqu'à la fin du cercle",
            "Célébrez la créativité collective"
        ],
        materials: ["Aucun matériel nécessaire"]
    },
    {
        id: 14,
        title: "La Danse des Prénoms",
        duration: "10-15 min",
        players: "8-30 personnes",
        category: "mouvement",
        description: "Chaque personne crée un mouvement unique avec son prénom, le groupe répète.",
        rules: [
            "Formez un cercle",
            "Le premier dit son prénom avec un geste",
            "Tout le groupe répète prénom et geste",
            "Continuez avec chaque personne",
            "Répétez tous les gestes à la fin"
        ],
        materials: ["Espace pour bouger"]
    },
    {
        id: 15,
        title: "Si J'Étais...",
        duration: "15-20 min",
        players: "5-25 personnes",
        category: "rapide",
        description: "Chacun complète des phrases comme 'Si j'étais un animal, je serais...' et explique pourquoi.",
        rules: [
            "Préparez des phrases à compléter",
            "Chaque personne partage ses réponses",
            "Encouragez les explications",
            "Variez les catégories (animal, couleur, saison, etc.)",
            "Discutez des réponses intéressantes"
        ],
        materials: ["Liste de phrases (optionnel)"]
    },
    {
        id: 16,
        title: "La Machine Humaine",
        duration: "15-20 min",
        players: "8-30 personnes",
        category: "mouvement",
        description: "Le groupe crée une machine avec leurs corps, chacun ajoutant un mouvement répétitif.",
        rules: [
            "Un volontaire commence avec un mouvement et son",
            "Chacun se connecte et ajoute son mouvement",
            "Continuez jusqu'à ce que tous participent",
            "Observez la machine en action",
            "Discutez de l'expérience"
        ],
        materials: ["Espace pour bouger"]
    },
    {
        id: 17,
        title: "Le Détective",
        duration: "15-25 min",
        players: "10-30 personnes",
        category: "groupe",
        description: "Un détective sort, un leader est choisi, puis le groupe imite ses mouvements pendant que le détective devine qui est le leader.",
        rules: [
            "Choisissez un détective qui sort",
            "Le groupe choisit un leader",
            "Le leader change de mouvements, tous imitent",
            "Le détective a 3 chances de deviner",
            "Changez de détective et recommencez"
        ],
        materials: ["Aucun matériel nécessaire"]
    },
    {
        id: 18,
        title: "Points Communs",
        duration: "15-20 min",
        players: "6-30 personnes",
        category: "groupe",
        description: "En petits groupes, trouvez le maximum de points communs entre tous les membres.",
        rules: [
            "Formez des groupes de 4-6 personnes",
            "10 minutes pour trouver des points communs",
            "Notez toutes les similitudes",
            "Chaque groupe présente ses découvertes",
            "Le groupe avec le plus de points communs gagne"
        ],
        materials: ["Papier", "Stylos"]
    },
    {
        id: 19,
        title: "La Ligne de Vie",
        duration: "20-30 min",
        players: "5-15 personnes",
        category: "creatif",
        description: "Chacun dessine sa ligne de vie avec les moments clés et les partage avec le groupe.",
        rules: [
            "Distribuez papier et crayons",
            "15 minutes pour dessiner sa ligne de vie",
            "Incluez événements importants",
            "Chacun présente sa ligne au groupe",
            "Encouragez les questions"
        ],
        materials: ["Papier", "Crayons de couleur"]
    },
    {
        id: 20,
        title: "Le Téléphone Arabe Dessiné",
        duration: "20-25 min",
        players: "8-20 personnes",
        category: "creatif",
        description: "Une phrase devient un dessin, qui devient une phrase, etc., comme le téléphone arabe mais avec des dessins.",
        rules: [
            "Asseyez-vous en cercle avec papier et stylo",
            "Le premier écrit une phrase sur une feuille",
            "Passe à gauche, le voisin dessine la phrase",
            "Continue en alternant phrase/dessin",
            "Comparez le résultat final avec l'original"
        ],
        materials: ["Papier", "Stylos"]
    },
    {
        id: 21,
        title: "Qui Suis-Je?",
        duration: "15-20 min",
        players: "8-30 personnes",
        category: "rapide",
        description: "Chacun a un post-it avec un nom de personnage sur le front et doit deviner qui il est en posant des questions.",
        rules: [
            "Écrivez des noms de personnages sur des post-its",
            "Collez-en un sur le front de chacun",
            "Posez des questions oui/non aux autres",
            "Devinez votre personnage",
            "Continuez jusqu'à ce que tous aient deviné"
        ],
        materials: ["Post-its", "Stylos"]
    },
    {
        id: 22,
        title: "Le Portrait Chinois Collectif",
        duration: "20-25 min",
        players: "6-20 personnes",
        category: "creatif",
        description: "Le groupe crée un portrait chinois collectif représentant le groupe entier.",
        rules: [
            "Formez un cercle",
            "Posez des questions 'Si notre groupe était...'",
            "Votez ensemble pour chaque réponse",
            "Notez les réponses consensuelles",
            "Créez une affiche du portrait final"
        ],
        materials: ["Papier", "Stylos", "Affiche (optionnel)"]
    },
    {
        id: 23,
        title: "La Balle de Présentations",
        duration: "10-15 min",
        players: "8-25 personnes",
        category: "mouvement",
        description: "En cercle, lancez une balle en disant votre nom. Qui l'attrape dit son nom et lance à quelqu'un d'autre.",
        rules: [
            "Formez un cercle",
            "Lancez la balle en disant votre nom",
            "Qui attrape dit son nom et relance",
            "Accélérez progressivement",
            "Ajoutez des balles supplémentaires pour plus de défi"
        ],
        materials: ["Balles (1-3)"]
    },
    {
        id: 24,
        title: "L'Annonce Personnelle",
        duration: "20-30 min",
        players: "6-20 personnes",
        category: "creatif",
        description: "Chacun crée une annonce personnelle comme s'il se vendait dans un journal.",
        rules: [
            "Distribuez papier et stylos",
            "10 minutes pour rédiger son annonce",
            "Incluez qualités, passions, ce qu'on cherche",
            "Lisez les annonces à voix haute",
            "Devinez qui a écrit quoi"
        ],
        materials: ["Papier", "Stylos"]
    },
    {
        id: 25,
        title: "Le Nœud Humain",
        duration: "10-15 min",
        players: "8-20 personnes",
        category: "mouvement",
        description: "Le groupe forme un cercle, se tient les mains au hasard, puis doit se démêler sans lâcher.",
        rules: [
            "Formez un cercle serré",
            "Fermez les yeux et avancez",
            "Prenez deux mains différentes au hasard",
            "Ouvrez les yeux",
            "Démêlez-vous sans lâcher les mains"
        ],
        materials: ["Espace suffisant"]
    },
    {
        id: 26,
        title: "Les Superpouvoirs",
        duration: "15-20 min",
        players: "5-25 personnes",
        category: "rapide",
        description: "Chacun partage quel superpouvoir il aimerait avoir et pourquoi.",
        rules: [
            "Formez un cercle",
            "Chaque personne choisit un superpouvoir",
            "Expliquez pourquoi et comment l'utiliser",
            "Discutez des choix créatifs",
            "Votez pour le superpouvoir le plus original"
        ],
        materials: ["Aucun matériel nécessaire"]
    },
    {
        id: 27,
        title: "L'Alphabet du Groupe",
        duration: "15-20 min",
        players: "6-30 personnes",
        category: "groupe",
        description: "Le groupe trouve un mot pour chaque lettre de l'alphabet qui les représente.",
        rules: [
            "Formez un grand groupe",
            "Parcourez l'alphabet de A à Z",
            "Trouvez un mot collectif pour chaque lettre",
            "Le mot doit représenter le groupe",
            "Notez tous les mots pour créer votre identité"
        ],
        materials: ["Tableau ou grande feuille", "Marqueurs"]
    },
    {
        id: 28,
        title: "Speed Friending",
        duration: "20-30 min",
        players: "10-40 personnes",
        category: "rapide",
        description: "Conversations rapides de 3 minutes sur des sujets spécifiques pour créer des connexions.",
        rules: [
            "Formez deux lignes face à face",
            "Donnez un sujet de conversation",
            "3 minutes d'échange",
            "Changez de partenaire",
            "Répétez avec 5-7 sujets différents"
        ],
        materials: ["Minuteur", "Liste de sujets"]
    },
    {
        id: 29,
        title: "La Constellation Humaine",
        duration: "15-20 min",
        players: "8-30 personnes",
        category: "mouvement",
        description: "Les participants se positionnent dans l'espace selon des critères donnés.",
        rules: [
            "Désignez les extrémités de l'espace",
            "Annoncez un critère (ex: âge, ville d'origine)",
            "Chacun se positionne sur l'échelle",
            "Observez et discutez des positions",
            "Changez de critère plusieurs fois"
        ],
        materials: ["Grand espace"]
    },
    {
        id: 30,
        title: "Le Compliment Secret",
        duration: "20-25 min",
        players: "6-30 personnes",
        category: "groupe",
        description: "Chacun écrit un compliment anonyme pour chaque personne du groupe.",
        rules: [
            "Distribuez des fiches avec les noms",
            "Écrivez un compliment pour chaque personne",
            "Restez anonyme",
            "Ramassez et mélangez les compliments",
            "Lisez les compliments pour chaque personne"
        ],
        materials: ["Fiches", "Stylos"]
    },
    {
        id: 31,
        title: "La Toile de Souhaits",
        duration: "20-30 min",
        players: "8-25 personnes",
        category: "groupe",
        description: "Comme la toile d'araignée, mais en partageant un souhait ou objectif pour le groupe.",
        rules: [
            "Formez un cercle avec une pelote",
            "Le premier partage un souhait pour le groupe",
            "Lance la pelote en gardant le fil",
            "Continuez jusqu'à former une toile",
            "Discutez des souhaits collectifs"
        ],
        materials: ["Pelote de laine"]
    },
    {
        id: 32,
        title: "Les 5 Sens",
        duration: "15-20 min",
        players: "5-20 personnes",
        category: "creatif",
        description: "Chacun partage son son, goût, odeur, texture et image préférés et pourquoi.",
        rules: [
            "Formez un cercle",
            "Chaque personne partage pour chaque sens",
            "Expliquez vos choix",
            "Discutez des similitudes",
            "Trouvez les préférences communes"
        ],
        materials: ["Aucun matériel nécessaire"]
    },
    {
        id: 33,
        title: "L'Évolution",
        duration: "15-20 min",
        players: "10-40 personnes",
        category: "mouvement",
        description: "Un jeu actif où les participants évoluent d'œuf à poulet à dinosaure à suprême en gagnant aux pierres-papier-ciseaux.",
        rules: [
            "Tous commencent en œufs (accroupis)",
            "Trouvez quelqu'un du même stade",
            "Jouez à pierre-papier-ciseaux",
            "Le gagnant évolue, le perdant descend",
            "Évoluez: œuf → poulet → dinosaure → suprême"
        ],
        materials: ["Grand espace"]
    },
    {
        id: 34,
        title: "La Carte Mentale Collective",
        duration: "25-35 min",
        players: "8-30 personnes",
        category: "creatif",
        description: "Le groupe crée ensemble une carte mentale représentant leurs intérêts, compétences et rêves.",
        rules: [
            "Placez une grande feuille au centre",
            "Écrivez le nom du groupe au milieu",
            "Chacun ajoute branches et éléments",
            "Connectez les éléments similaires",
            "Admirez la création collective"
        ],
        materials: ["Grande feuille", "Marqueurs colorés"]
    },
    {
        id: 35,
        title: "Le Photomaton Humain",
        duration: "15-25 min",
        players: "8-30 personnes",
        category: "mouvement",
        description: "Par petits groupes, créez des photos amusantes avec des poses créatives.",
        rules: [
            "Formez des groupes de 4-6 personnes",
            "Donnez un thème à chaque groupe",
            "5 minutes pour créer une pose",
            "Prenez des photos",
            "Présentez et expliquez les poses"
        ],
        materials: ["Appareil photo ou smartphones"]
    },
    {
        id: 36,
        title: "La Pyramide de Questions",
        duration: "20-30 min",
        players: "6-20 personnes",
        category: "rapide",
        description: "Les questions deviennent progressivement plus personnelles pour créer des connexions profondes.",
        rules: [
            "Préparez 3 niveaux de questions",
            "Commencez par des questions légères",
            "Progressez vers plus personnel",
            "Chacun répond à tour de rôle",
            "Respectez le confort de chacun"
        ],
        materials: ["Liste de questions préparées"]
    },
    {
        id: 37,
        title: "Le Cercle de Gratitude",
        duration: "15-20 min",
        players: "6-25 personnes",
        category: "groupe",
        description: "En cercle, chaque personne partage quelque chose pour laquelle elle est reconnaissante aujourd'hui.",
        rules: [
            "Formez un cercle confortable",
            "Le premier partage sa gratitude",
            "Continuez autour du cercle",
            "Soyez authentique et sincère",
            "Accueillez chaque partage avec bienveillance"
        ],
        materials: ["Aucun matériel nécessaire"]
    }
];

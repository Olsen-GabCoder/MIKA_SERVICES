package com.mikaservices.platform.modules.ia.service

import com.mikaservices.platform.config.AnthropicProperties
import com.mikaservices.platform.modules.ia.dto.*
import com.mikaservices.platform.modules.user.dto.response.UserResponse
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper

@Service
class MikaAssistantService(
    private val anthropicClient: AnthropicClientService,
    private val anthropicProperties: AnthropicProperties,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun ask(request: MikaAssistantRequest, user: UserResponse): MikaAssistantResponse {
        if (anthropicProperties.apiKey.isBlank()) {
            return MikaAssistantResponse(
                reply = "L'assistant IA n'est pas configuré. Contactez votre administrateur.",
                tokensUsed = 0
            )
        }

        val systemPrompt = buildSystemPrompt(request, user)
        val userContent = buildUserContent(request)
        val tool = buildTool()

        return try {
            val (json, usage) = anthropicClient.callWithToolUse(systemPrompt, userContent, tool)
            parseResponse(json, usage.inputTokens + usage.outputTokens)
        } catch (e: Exception) {
            logger.error("Erreur assistant Mika: {}", e.message)
            MikaAssistantResponse(
                reply = "Désolé, je rencontre un problème technique. Réessayez dans quelques instants.",
                tokensUsed = 0
            )
        }
    }

    private fun buildSystemPrompt(request: MikaAssistantRequest, user: UserResponse): String {
        val pageGuide = PAGE_CONTEXT_GUIDES[request.pageContext] ?: ""

        return """
Tu es Mika, l'assistant intelligent de la plateforme MIKA Services — une application de gestion de chantiers BTP au Gabon.

TON ROLE :
- Guider l'utilisateur dans l'utilisation de la plateforme
- Expliquer les fonctionnalités, la terminologie BTP et les données affichées
- Recommander les prochaines actions pertinentes
- Répondre de manière concise, utile et bienveillante

UTILISATEUR ACTUEL :
- Prénom : ${user.prenom}
- Rôle : ${user.roles.firstOrNull()?.code ?: "UTILISATEUR"}

PAGE ACTUELLE : ${request.pageRoute}
${if (pageGuide.isNotBlank()) "\nCONTEXTE DE LA PAGE :\n$pageGuide" else ""}
${if (request.pageData.isNotEmpty()) "\nDONNEES VISIBLES :\n${formatPageData(request.pageData)}" else ""}

REGLES :
1. Réponds toujours en français, de manière concise (2-5 phrases max sauf si détail demandé).
2. Utilise un ton professionnel mais accessible.
3. Si tu recommandes une action, propose un lien (route) quand c'est possible.
4. Explique la terminologie BTP simplement quand elle apparaît.
5. Ne mentionne jamais que tu es un modèle IA, tu es "Mika, l'assistant de la plateforme".
6. Si la question sort du périmètre de la plateforme, redirige poliment vers les fonctionnalités existantes.
7. Quand tu proposes des actions, remplis le champ "actions" du tool avec les routes pertinentes.
""".trimIndent()
    }

    private fun buildUserContent(request: MikaAssistantRequest): List<Map<String, Any>> {
        val sb = StringBuilder()

        if (request.conversationHistory.isNotEmpty()) {
            sb.appendLine("HISTORIQUE DE CONVERSATION :")
            for (msg in request.conversationHistory.takeLast(10)) {
                val role = if (msg.role == "user") "Utilisateur" else "Mika"
                sb.appendLine("$role : ${msg.content}")
            }
            sb.appendLine()
        }

        sb.appendLine("QUESTION ACTUELLE : ${request.message}")

        return listOf(mapOf("type" to "text", "text" to sb.toString()))
    }

    private fun buildTool(): Map<String, Any> = mapOf(
        "name" to "mika_respond",
        "description" to "Génère une réponse contextuelle pour l'utilisateur avec des suggestions d'actions optionnelles.",
        "input_schema" to mapOf(
            "type" to "object",
            "properties" to mapOf(
                "reply" to mapOf(
                    "type" to "string",
                    "description" to "La réponse textuelle à afficher à l'utilisateur. Markdown léger autorisé (gras, listes)."
                ),
                "actions" to mapOf(
                    "type" to "array",
                    "description" to "Actions suggérées (boutons cliquables). Max 3.",
                    "items" to mapOf(
                        "type" to "object",
                        "properties" to mapOf(
                            "label" to mapOf("type" to "string", "description" to "Texte du bouton"),
                            "route" to mapOf("type" to "string", "description" to "Route frontend (ex: /projets, /qshe/incidents)"),
                            "type" to mapOf("type" to "string", "enum" to listOf("navigate", "info"), "description" to "Type d'action")
                        ),
                        "required" to listOf("label", "type")
                    )
                )
            ),
            "required" to listOf("reply")
        )
    )

    private fun parseResponse(json: JsonNode, tokensUsed: Int): MikaAssistantResponse {
        val reply = json.path("reply").asText("Je n'ai pas pu formuler une réponse. Réessayez.")

        val actions = mutableListOf<SuggestedAction>()
        val actionsNode = json.path("actions")
        if (actionsNode.isArray) {
            for (actionNode in actionsNode) {
                actions.add(
                    SuggestedAction(
                        label = actionNode.path("label").asText(""),
                        route = actionNode.path("route").asText(null),
                        type = actionNode.path("type").asText("navigate")
                    )
                )
            }
        }

        return MikaAssistantResponse(
            reply = reply,
            actions = actions.take(3),
            tokensUsed = tokensUsed
        )
    }

    private fun formatPageData(data: Map<String, Any?>): String {
        return data.entries
            .filter { it.value != null }
            .joinToString("\n") { "- ${it.key}: ${it.value}" }
            .take(2000)
    }

    companion object {
        val PAGE_CONTEXT_GUIDES = mapOf(
            "dashboard" to """
Page d'accueil avec indicateurs clés (KPI) de tous les projets.
Affiche : nombre de projets actifs, budget global, tâches en retard, alertes critiques.
L'utilisateur peut cliquer sur un projet pour voir ses détails.
Termes : CA = Chiffre d'Affaires, HT = Hors Taxes, avancement physique = % de travaux réalisés.
""".trimIndent(),

            "projets" to """
Liste de tous les projets de l'entreprise avec filtres (statut, type, client, dates).
Actions possibles : créer un projet (admin), filtrer, trier, exporter en Excel, supprimer.
Statuts : EN_PREPARATION, EN_COURS, EN_PAUSE, TERMINE, ANNULE.
L'utilisateur peut cliquer sur un projet pour accéder à sa fiche détaillée.
""".trimIndent(),

            "projet-detail" to """
Vue complète d'un projet : informations générales, sous-projets, avancement, budget, équipe.
L'assistant IA (ce chatbot) peut analyser des rapports de chantier (PDF, Word, Excel, photos).
Actions : modifier le projet, importer un rapport IA, voir le DQE, exporter en PDF/Word.
Termes : DQE = Devis Quantitatif Estimatif, PB = Point Bloquant, prévision = tâche planifiée.
""".trimIndent(),

            "budget" to """
Suivi budgétaire par projet : budget de référence, dépenses, reste à dépenser, taux de consommation.
Code couleur : vert < 70%, orange 70-90%, rouge > 90% de consommation.
L'utilisateur sélectionne un projet pour voir son budget détaillé.
Termes : taux de consommation = dépenses / budget × 100.
""".trimIndent(),

            "incidents" to """
Module QSHE — Déclaration et suivi des incidents de sécurité sur les chantiers.
Types : ACCIDENT_TRAVAIL, PRESQU_ACCIDENT, SITUATION_DANGEREUSE, INCIDENT_ENVIRONNEMENTAL, DOMMAGE_MATERIEL, MALADIE_PROFESSIONNELLE.
Gravité : MINEURE, LEGERE, GRAVE, MORTELLE.
Workflow : BROUILLON → DECLARE → EN_INVESTIGATION → CLOTURE.
Rôles autorisés à déclarer : ADMIN, CHEF_PROJET, CHEF_CHANTIER.
""".trimIndent(),

            "planning" to """
Gestion des tâches du projet avec statuts et priorités.
Statuts : A_FAIRE, EN_COURS, EN_ATTENTE, TERMINEE, ANNULEE.
Priorités : CRITIQUE, HAUTE, NORMALE, BASSE.
Les tâches en retard sont mises en évidence (date d'échéance dépassée).
""".trimIndent(),

            "equipes" to """
Gestion des équipes de chantier. Chaque équipe a un type, un chef et des membres.
Types : TERRASSEMENT, VOIRIE, ASSAINISSEMENT, GENIE_CIVIL, BATIMENT, PONT, TOPOGRAPHIE, LABORATOIRE, MECANIQUE, POLYVALENTE.
""".trimIndent(),

            "engins" to """
Parc d'engins et de machines. Suivi du taux d'utilisation et des pannes.
Statuts : DISPONIBLE, EN_SERVICE, EN_PANNE, EN_MAINTENANCE, HORS_SERVICE.
L'utilisateur peut créer un engin, voir les détails, transférer entre chantiers.
""".trimIndent(),

            "materiaux" to """
Gestion du stock de matériaux par chantier. Alertes de stock bas automatiques.
""".trimIndent(),

            "dma" to """
Demandes de Matériel et d'Approvisionnement (DMA).
Circuit de validation : BROUILLON → SOUMISE → VALIDEE_CHEF_PROJET → VALIDEE_DG → EN_COMMANDE → LIVREE.
Chaque DMA contient des lignes (articles, quantités, unités).
""".trimIndent(),

            "messagerie" to """
Messagerie interne entre utilisateurs. Conversations par pair.
Fonctionnalités : mentions @nom, pièces jointes, archivage.
""".trimIndent(),

            "notifications" to """
Centre de notifications : alertes, tâches assignées, échéances, messages, incidents.
17 types de notifications avec code couleur.
Actions : marquer comme lu (individuel ou tout).
""".trimIndent(),

            "documents" to """
Gestion documentaire centralisée. Types : PLAN, RAPPORT, PHOTO, CONTRAT, FACTURE, PV_REUNION, FICHE_TECHNIQUE, etc.
Upload, téléchargement, suppression. Filtres par type et projet.
""".trimIndent(),

            "fournisseurs" to """
Répertoire fournisseurs et suivi des commandes.
Statuts commande : BROUILLON, ENVOYEE, CONFIRMEE, EN_LIVRAISON, LIVREE, ANNULEE.
""".trimIndent(),

            "bareme" to """
Catalogue de référence des prix BTP (articles, unités, prix unitaires).
Organisé par corps d'état (Terrassement, Gros Oeuvre, Assainissement, etc.).
Import depuis fichier Excel possible.
""".trimIndent(),

            "qshe-dashboard" to """
Tableau de bord QSHE (Qualité, Sécurité, Hygiène, Environnement).
KPIs : nombre d'incidents, inspections, risques critiques, actions correctives.
""".trimIndent(),

            "risques" to """
Évaluation des risques professionnels (DUERP).
Matrice : Probabilité (1-5) × Gravité (1-5) = Niveau de risque.
Niveaux : FAIBLE (1-4), MOYEN (5-9), ELEVE (10-14), CRITIQUE (15-25).
""".trimIndent(),

            "inspections" to """
Inspections de chantier planifiées avec checklists et scores.
Score : 0-100. Vert >= 80 (conforme), Orange >= 50, Rouge < 50 (non conforme).
Types : HEBDOMADAIRE, MENSUELLE, TRIMESTRIELLE, PONCTUELLE.
""".trimIndent(),

            "qualite-evenements" to """
Événements qualité : NC (Non-Conformité), RC (Remarque Constructive), PPI (Proposition de Progrès et Innovation).
Workflow : BROUILLON → DETECTEE → EN_TRAITEMENT → TRAITEE → CLOTUREE.
""".trimIndent(),

            "qualite-synthese" to """
Synthèse mensuelle qualité : agrège réceptions, agréments, NC, essais labo, levées topo.
Barres de statut colorées montrant la répartition par état.
""".trimIndent(),

            "reporting" to """
Tableaux de bord analytiques avec graphiques (barres, camemberts, jauges).
KPIs avec tendances (hausse/baisse/stable).
""".trimIndent(),

            "profil" to """
Page de profil utilisateur : informations personnelles, photo, mot de passe, 2FA, sessions actives.
2FA = Vérification en deux étapes via application d'authentification (Google Authenticator, etc.).
""".trimIndent(),

            "parametres" to """
Préférences de l'application : thème (clair/sombre), langue (FR/EN), taille de police, densité d'affichage,
format de date/heure/nombres, mode hors-ligne, cache, qualité de connexion.
""".trimIndent(),

            "utilisateurs" to """
Administration des comptes utilisateurs (admin uniquement).
Créer, modifier, activer/désactiver des comptes. Assigner des rôles.
Rôles : SUPER_ADMIN, ADMIN, CHEF_PROJET, CHEF_CHANTIER, INGENIEUR, TECHNICIEN, LOGISTICIEN, COMPTABLE, RH, STAGIAIRE.
""".trimIndent(),

            "salle-mika" to """
Salle de visioconférence intégrée (Jitsi/JaaS).
L'admin ouvre/ferme la salle. Les participants rejoignent.
Raccourcis clavier disponibles. Onglet PV pour les procès-verbaux de réunion.
""".trimIndent(),

            "reunions-hebdo" to """
Réunions hebdomadaires et procès-verbaux (PV).
Chaque PV contient les points par projet discutés en réunion.
Statuts : BROUILLON, VALIDE.
""".trimIndent(),

            "dqe" to """
DQE = Devis Quantitatif et Estimatif. Liste tous les postes de dépenses du projet.
Structure : Chapitres > Lignes (N° prix, désignation, unité, quantité, PU, montant).
Import IA depuis fichier Excel/PDF possible.
Unités courantes : m², ml, m³, kg, U (unité), FT (forfait), FF (forfait fixe), t (tonne).
""".trimIndent(),

            "essais-labo" to """
Résultats des essais laboratoire béton : slump (affaissement), résistance à 7j et 28j.
Slump = test d'affaissement du béton frais, mesure sa consistance (norme NF EN 12350-2).
""".trimIndent(),

            "epi" to """
EPI = Équipements de Protection Individuelle (casque, gants, gilet, lunettes, chaussures, harnais...).
Suivi des dotations, dates de péremption, stocks.
""".trimIndent(),

            "causeries" to """
Causeries sécurité = réunions courtes (10-15 min) de sensibilisation sur le terrain.
Objectif recommandé : 1 par semaine et par chantier.
""".trimIndent(),

            "permis-travail" to """
Permis de travail = autorisations pour travaux à risque (hauteur, espace confiné, feu, fouilles...).
Chaque permis a une durée de validité limitée.
""".trimIndent(),

            "environnement" to """
Suivi environnemental : mesures (bruit, poussière, eau), déchets, produits chimiques.
""".trimIndent()
        )
    }
}

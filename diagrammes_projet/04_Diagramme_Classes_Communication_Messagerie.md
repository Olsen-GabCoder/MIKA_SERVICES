# Diagramme de Classes — 04 · Communication & Messagerie

```mermaid
classDiagram
    direction TB

    %% ══════════════ BASE ══════════════
    class BaseEntity {
        <<abstract>>
        +Long id
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
        +String createdBy
        +String updatedBy
    }

    %% ══════════════ ENUMS ══════════════
    class TypeNotification {
        <<enumeration>>
        INFO
        ALERTE
        TACHE_ASSIGNEE
        INCIDENT
        NON_CONFORMITE
        ECHEANCE
        STOCK_BAS
        MESSAGE
        SYSTEME
        DMA_SOUMISE
        DMA_VALIDEE_CHANTIER
        DMA_VALIDEE_PROJET
        DMA_PRISE_EN_CHARGE
        DMA_COMPLEMENT_REQUIS
        DMA_COMMANDEE
        DMA_LIVREE
        DMA_REJETEE
        MOUVEMENT_ORDRE_CREE
        MOUVEMENT_DEPART_CONFIRME
        MOUVEMENT_RECEPTION_CONFIRMEE
        MOUVEMENT_ANNULE
    }

    %% ══════════════ ENTITÉS ══════════════
    class Message {
        +String sujet
        +String contenu
        +LocalDateTime dateEnvoi
        +Boolean lu
        +LocalDateTime dateLecture
    }

    class Notification {
        +String titre
        +String contenu
        +TypeNotification typeNotification
        +String lien
        +Boolean lu
        +LocalDateTime dateCreation
        +LocalDateTime dateLecture
    }

    class MessageMention {
        +Long id
    }

    class MessagePieceJointe {
        +String nomOriginal
        +String nomStockage
        +String cheminStockage
        +String typeMime
        +Long tailleOctets
    }

    class MessageSuppression {
        +Long id
        +LocalDateTime suppressedAt
    }

    class ConversationArchive {
        +Long id
        +Long peerUserId
        +LocalDateTime archivedAt
    }

    class User {
        +String matricule
        +String nom
        +String prenom
        +String email
    }

    %% ══════════════ HÉRITAGE ══════════════
    BaseEntity <|-- Message
    BaseEntity <|-- Notification
    BaseEntity <|-- MessagePieceJointe

    %% ══════════════ RELATIONS ══════════════
    Message "n" --> "1" User : expediteur
    Message "n" --> "1" User : destinataire
    Message "n" --> "0..1" Message : parent

    Notification "n" --> "1" User : destinataire

    MessageMention "n" --> "1" Message : message
    MessageMention "n" --> "1" User : user

    MessagePieceJointe "n" --> "1" Message : message

    MessageSuppression "n" --> "1" User : user
    MessageSuppression "n" --> "1" Message : message

    ConversationArchive "n" --> "1" User : user

    %% ══════════════ ENUMS ══════════════
    Notification --> TypeNotification
```

## Tables DB

| Entité | Table |
|--------|-------|
| Message | `messages` |
| Notification | `notifications` |
| MessageMention | `message_mentions` |
| MessagePieceJointe | `message_pieces_jointes` |
| MessageSuppression | `message_suppressions` |
| ConversationArchive | `conversation_archives` |

## Règles métier

- Un `Message` peut avoir un `parent` (réponse → thread de conversation).
- `MessageSuppression` : suppression "pour moi" uniquement (l'autre utilisateur voit toujours le message).
- `ConversationArchive` : archive une conversation entre deux utilisateurs (user ↔ peerUserId).
- `MessageMention` : l'utilisateur est mentionné dans le corps du message (`@user`).

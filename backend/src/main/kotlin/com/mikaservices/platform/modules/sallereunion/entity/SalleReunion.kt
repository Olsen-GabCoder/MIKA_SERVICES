package com.mikaservices.platform.modules.sallereunion.entity

import com.mikaservices.platform.common.entity.BaseEntity
import com.mikaservices.platform.modules.user.entity.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "salles_reunion")
class SalleReunion(

    @Column(name = "room_name", nullable = false, unique = true, length = 200)
    val roomName: String,

    @Column(name = "ouverte", nullable = false)
    var ouverte: Boolean = false,

    @Column(name = "date_ouverture")
    var dateOuverture: LocalDateTime? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ouverte_par_id")
    var ouvertePar: User? = null,

    @Column(name = "date_fermeture")
    var dateFermeture: LocalDateTime? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fermee_par_id")
    var fermeePar: User? = null,

    @Column(name = "libelle", nullable = false, length = 100)
    val libelle: String = "Salle MIKA"
) : BaseEntity()

package com.mikaservices.platform.modules.qualite.dto.request

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull

data class EssaiLaboBetonCreateRequest(
    @field:NotNull val projetId: Long,
    val moisReference: String? = null,
    @field:Min(0) val nbCamionsMalaxeursVolumeCoulee: Int = 0,
    @field:Min(0) val nbEssaisSlump: Int = 0,
    @field:Min(0) val nbJoursCoulage: Int = 0,
    @field:Min(0) val nbPrelevements: Int = 0,
    val observations: String? = null,
    val saisiParId: Long? = null,
)

data class EssaiLaboBetonUpdateRequest(
    @field:Min(0) val nbCamionsMalaxeursVolumeCoulee: Int? = null,
    @field:Min(0) val nbEssaisSlump: Int? = null,
    @field:Min(0) val nbJoursCoulage: Int? = null,
    @field:Min(0) val nbPrelevements: Int? = null,
    val observations: String? = null,
)

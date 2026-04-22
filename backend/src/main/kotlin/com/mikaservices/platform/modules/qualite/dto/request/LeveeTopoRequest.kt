package com.mikaservices.platform.modules.qualite.dto.request

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull

data class LeveeTopoCreateRequest(
    @field:NotNull val projetId: Long,
    val moisReference: String? = null,
    @field:Min(0) val nbProfilsImplantes: Int = 0,
    @field:Min(0) val nbProfilsReceptionnes: Int = 0,
    @field:Min(0) val nbControlesRealises: Int = 0,
    val observations: String? = null,
    val saisiParId: Long? = null,
)

data class LeveeTopoUpdateRequest(
    @field:Min(0) val nbProfilsImplantes: Int? = null,
    @field:Min(0) val nbProfilsReceptionnes: Int? = null,
    @field:Min(0) val nbControlesRealises: Int? = null,
    val observations: String? = null,
)

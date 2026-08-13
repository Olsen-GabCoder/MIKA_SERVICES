package com.mikaservices.platform.modules.planning.dto.request

import com.mikaservices.platform.common.enums.TypeDependance
import jakarta.validation.constraints.NotNull

data class DependanceCreateRequest(
    @field:NotNull
    val tacheSourceId: Long,

    @field:NotNull
    val tacheCibleId: Long,

    val typeDependance: TypeDependance = TypeDependance.FIN_DEBUT,

    val delaiJours: Int = 0
)

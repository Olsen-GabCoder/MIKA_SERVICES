package com.mikaservices.platform.modules.planning.dto.response

import com.mikaservices.platform.common.enums.TypeDependance

data class DependanceResponse(
    val id: Long,
    val tacheSourceId: Long,
    val tacheSourceTitre: String,
    val tacheCibleId: Long,
    val tacheCibleTitre: String,
    val typeDependance: TypeDependance,
    val delaiJours: Int
)

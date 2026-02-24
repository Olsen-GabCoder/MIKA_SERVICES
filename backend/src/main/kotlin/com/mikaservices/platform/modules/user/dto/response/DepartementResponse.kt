package com.mikaservices.platform.modules.user.dto.response

import com.mikaservices.platform.common.enums.TypeDepartement

data class DepartementResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val type: TypeDepartement,
    val description: String?,
    val responsable: UserSummaryResponse?,
    val actif: Boolean
)

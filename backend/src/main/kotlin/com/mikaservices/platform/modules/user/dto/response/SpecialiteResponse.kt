package com.mikaservices.platform.modules.user.dto.response

import com.mikaservices.platform.common.enums.TypeSpecialite

data class SpecialiteResponse(
    val id: Long,
    val code: String,
    val nom: String,
    val categorie: TypeSpecialite,
    val description: String?,
    val actif: Boolean
)

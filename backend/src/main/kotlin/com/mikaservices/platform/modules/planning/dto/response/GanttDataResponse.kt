package com.mikaservices.platform.modules.planning.dto.response

data class GanttDataResponse(
    val taches: List<TacheResponse>,
    val dependances: List<DependanceResponse>
)

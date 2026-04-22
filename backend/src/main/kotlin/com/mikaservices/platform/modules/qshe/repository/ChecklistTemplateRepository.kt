package com.mikaservices.platform.modules.qshe.repository

import com.mikaservices.platform.modules.qshe.entity.ChecklistTemplate
import com.mikaservices.platform.modules.qshe.enums.TypeInspection
import org.springframework.data.jpa.repository.JpaRepository

interface ChecklistTemplateRepository : JpaRepository<ChecklistTemplate, Long> {
    fun findByCode(code: String): ChecklistTemplate?
    fun findByActifTrue(): List<ChecklistTemplate>
    fun findByTypeInspectionAndActifTrue(typeInspection: TypeInspection): List<ChecklistTemplate>
}

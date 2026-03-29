package com.mikaservices.platform.modules.bareme.repository

import com.mikaservices.platform.modules.bareme.entity.BaremeMatRefSequence
import org.springframework.data.jpa.repository.JpaRepository

interface BaremeMatRefSequenceRepository : JpaRepository<BaremeMatRefSequence, Int>

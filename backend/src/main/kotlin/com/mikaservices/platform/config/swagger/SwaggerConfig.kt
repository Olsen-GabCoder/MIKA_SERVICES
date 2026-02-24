package com.mikaservices.platform.config.swagger

import com.mikaservices.platform.common.constants.SecurityConstants
import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.info.License
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class SwaggerConfig {
    
    @Bean
    fun customOpenAPI(): OpenAPI {
        val securitySchemeName = "bearerAuth"
        
        return OpenAPI()
            .info(
                Info()
                    .title("MIKA Services Platform API")
                    .version("1.0.0")
                    .description("API REST pour la plateforme digitale de gestion de chantiers MIKA SERVICES")
                    .contact(
                        Contact()
                            .name("MIKA SERVICES")
                            .email("contact@mikaservices.ga")
                    )
                    .license(
                        License()
                            .name("Proprietary")
                    )
            )
            .addSecurityItem(
                SecurityRequirement()
                    .addList(securitySchemeName)
            )
            .components(
                Components()
                    .addSecuritySchemes(
                        securitySchemeName,
                        SecurityScheme()
                            .name(securitySchemeName)
                            .type(SecurityScheme.Type.HTTP)
                            .scheme("bearer")
                            .bearerFormat("JWT")
                            .description("JWT token. Format: Bearer {token}")
                    )
            )
    }
}

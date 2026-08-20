package com.mikaservices.platform.config.security

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.annotation.Order
import org.springframework.http.HttpMethod
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.AuthenticationException
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfigurationSource

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig(
    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
    private val corsConfigurationSource: CorsConfigurationSource
) {

    companion object {
        /** Rôles autorisés sur la partie web (pilotage). Les autres sont mobile-only. */
        val WEB_ROLES = arrayOf(
            "SUPER_ADMIN", "ADMIN", "CHEF_PROJET", "LOGISTIQUE",
            "DIRECTEUR_TECHNIQUE", "RESPONSABLE_QUALITE", "INGENIEUR_QUALITE", "CONTROLEUR_TECHNIQUE"
        )
    }
    
    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }
    
    @Bean
    fun authenticationManager(config: AuthenticationConfiguration): AuthenticationManager {
        return config.authenticationManager
    }
    
    @Bean
    @Order(0)
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .cors { it.configurationSource(corsConfigurationSource) }
            .csrf { it.disable() }
            .httpBasic { it.disable() }
            .formLogin { it.disable() }
            .headers { headers ->
                headers.frameOptions { it.deny() }
                headers.contentTypeOptions { }
                headers.httpStrictTransportSecurity { hsts ->
                    hsts.includeSubDomains(true)
                    hsts.maxAgeInSeconds(31536000)
                }
                headers.referrerPolicy { }
            }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .exceptionHandling { it.authenticationEntryPoint(unauthorizedEntryPoint()) }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                    .requestMatchers(HttpMethod.POST, "/auth/refresh").permitAll()
                    .requestMatchers(HttpMethod.POST, "/auth/forgot-password").permitAll()
                    .requestMatchers(HttpMethod.POST, "/auth/reset-password").permitAll()
                    .requestMatchers(HttpMethod.POST, "/auth/verify-2fa").permitAll()
                    .requestMatchers(HttpMethod.GET, "/auth/login-policy").permitAll()
                    .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/swagger-ui.htm", "/swagger-ui/index.html").permitAll()
                    .requestMatchers("/v3/api-docs/**").permitAll()
                    .requestMatchers("/webjars/**").permitAll()
                    .requestMatchers("/ws/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/health").permitAll()
                    // Auth terrain (cookie dédié, cloisonnée du web) : mêmes règles que /auth
                    .requestMatchers(HttpMethod.POST, "/terrain/auth/login").permitAll()
                    .requestMatchers(HttpMethod.POST, "/terrain/auth/refresh").permitAll()
                    .requestMatchers(HttpMethod.POST, "/terrain/auth/verify-2fa").permitAll()
                    // Application mobile terrain : authentification requise, tous rôles
                    // (le périmètre des données est imposé dans les services terrain)
                    .requestMatchers("/terrain/**").authenticated()
                    .requestMatchers("/error").permitAll()
                    .requestMatchers("/").permitAll()
                    // Auth & 2FA : self-service, tous rôles authentifiés (logout, me, refresh…)
                    .requestMatchers("/auth/**", "/2fa/**").authenticated()
                    // Profil self-service (/users/me…) : accessible aussi aux rôles terrain-only
                    // (l'app mobile affiche et modifie le profil de l'utilisateur connecté)
                    .requestMatchers("/users/me/**", "/users/me").authenticated()
                    // Toutes les autres API = partie web (pilotage) : réservées aux rôles web.
                    // Les rôles terrain-only (USER, CONDUCTEUR, CHEF_CHANTIER, ASSISTANT_QUALITE,
                    // TECHNICIEN_LABORATOIRE, TECHNICIEN_TOPOGRAPHIE) reçoivent 403 même avec un token valide.
                    .anyRequest().hasAnyRole(*WEB_ROLES)
            }
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)
        
        return http.build()
    }
    
    @Bean
    fun unauthorizedEntryPoint(): AuthenticationEntryPoint {
        return AuthenticationEntryPoint { _: HttpServletRequest, response: HttpServletResponse, _: AuthenticationException ->
            response.contentType = "application/json"
            response.status = HttpServletResponse.SC_UNAUTHORIZED
            response.writer.write("""{"status":401,"error":"Unauthorized","message":"Token manquant ou invalide"}""")
        }
    }
}

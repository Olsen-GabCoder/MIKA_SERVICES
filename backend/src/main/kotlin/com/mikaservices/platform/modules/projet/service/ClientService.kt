package com.mikaservices.platform.modules.projet.service

import com.mikaservices.platform.common.exception.ConflictException
import com.mikaservices.platform.common.exception.ResourceNotFoundException
import com.mikaservices.platform.modules.projet.dto.request.ClientCreateRequest
import com.mikaservices.platform.modules.projet.dto.request.ClientUpdateRequest
import com.mikaservices.platform.modules.projet.dto.response.ClientResponse
import com.mikaservices.platform.modules.projet.entity.Client
import com.mikaservices.platform.modules.projet.mapper.ClientMapper
import com.mikaservices.platform.modules.projet.repository.ClientRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class ClientService(
    private val clientRepository: ClientRepository
) {
    private val logger = LoggerFactory.getLogger(ClientService::class.java)

    fun create(request: ClientCreateRequest): ClientResponse {
        if (clientRepository.existsByCode(request.code)) {
            throw ConflictException("Un client avec le code '${request.code}' existe déjà")
        }
        val client = ClientMapper.fromCreateRequest(request)
        val saved = clientRepository.save(client)
        logger.info("Client créé: ${saved.code} - ${saved.nom}")
        return ClientMapper.toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun findAll(pageable: Pageable): Page<ClientResponse> {
        return clientRepository.findByActifTrue(pageable).map { ClientMapper.toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun findById(id: Long): ClientResponse {
        val client = getClientById(id)
        return ClientMapper.toResponse(client)
    }

    @Transactional(readOnly = true)
    fun findByCode(code: String): ClientResponse {
        val client = clientRepository.findByCode(code)
            .orElseThrow { ResourceNotFoundException("Client non trouvé avec le code: $code") }
        return ClientMapper.toResponse(client)
    }

    @Transactional(readOnly = true)
    fun search(nom: String, pageable: Pageable): Page<ClientResponse> {
        return clientRepository.findByNomContainingIgnoreCaseAndActifTrue(nom, pageable)
            .map { ClientMapper.toResponse(it) }
    }

    fun update(id: Long, request: ClientUpdateRequest): ClientResponse {
        val client = getClientById(id)
        request.nom?.let { client.nom = it }
        request.type?.let { client.type = it }
        request.ministere?.let { client.ministere = it }
        request.telephone?.let { client.telephone = it }
        request.email?.let { client.email = it }
        request.adresse?.let { client.adresse = it }
        request.contactPrincipal?.let { client.contactPrincipal = it }
        request.telephoneContact?.let { client.telephoneContact = it }
        val saved = clientRepository.save(client)
        logger.info("Client mis à jour: ${saved.code}")
        return ClientMapper.toResponse(saved)
    }

    fun delete(id: Long) {
        val client = getClientById(id)
        client.actif = false
        clientRepository.save(client)
        logger.info("Client désactivé: ${client.code}")
    }

    internal fun getClientById(id: Long): Client {
        return clientRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Client non trouvé avec l'ID: $id") }
    }
}

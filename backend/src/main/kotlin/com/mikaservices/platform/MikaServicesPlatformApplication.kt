package com.mikaservices.platform

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling
import java.io.File
import java.nio.charset.StandardCharsets

@SpringBootApplication
@EnableScheduling
@EnableAsync
class MikaServicesPlatformApplication

fun main(args: Array<String>) {
	loadEnvFile()
	runApplication<MikaServicesPlatformApplication>(*args)
}

/**
 * Charge le fichier .env (backend/.env ou .env) et définit les variables comme propriétés système
 * pour que Spring les utilise (ex. MAIL_HOST, MAIL_USERNAME, JWT_SECRET).
 */
private fun loadEnvFile() {
	val cwd = File(System.getProperty("user.dir"))
	val envFile = when {
		File(cwd, "backend/.env").exists() -> File(cwd, "backend/.env")
		File(cwd, ".env").exists() -> File(cwd, ".env")
		else -> return
	}
	envFile.readLines(StandardCharsets.UTF_8).forEach { line ->
		val trimmed = line.trim()
		if (trimmed.isNotEmpty() && !trimmed.startsWith("#")) {
			val eq = trimmed.indexOf('=')
			if (eq > 0) {
				val key = trimmed.substring(0, eq).trim()
				var value = trimmed.substring(eq + 1).trim()
				if (value.startsWith("\"") && value.endsWith("\"") && value.length >= 2) {
					value = value.substring(1, value.length - 1)
				}
				if (key.isNotEmpty()) {
					System.setProperty(key, value)
				}
			}
		}
	}
}

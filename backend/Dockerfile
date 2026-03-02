# Build stage: Maven + Kotlin
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /build

# Install Maven
RUN apk add --no-cache maven

# Copie des fichiers de dépendances
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copie du code source et build
COPY src ./src
RUN mvn package -DskipTests -B

# Run stage: JAR uniquement (Jammy = Ubuntu 22.04, mises à jour de sécu régulières)
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Utilisateur non-root + répertoire uploads
RUN groupadd -g 1000 app && useradd -u 1000 -g app -d /app -m app \
    && mkdir -p /app/uploads && chown -R app:app /app
USER app

COPY --from=builder /build/target/platform-*.jar app.jar

EXPOSE 9090

ENTRYPOINT ["java", "-jar", "app.jar"]

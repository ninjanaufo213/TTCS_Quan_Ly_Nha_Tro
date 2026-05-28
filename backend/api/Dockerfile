#
# Build stage
#
FROM eclipse-temurin:21-jdk-jammy AS build

WORKDIR /workspace

# Copy Maven wrapper + pom first for better layer caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

RUN chmod +x mvnw && ./mvnw -q -DskipTests dependency:go-offline

# Copy source and build
COPY src/ src/
RUN ./mvnw -q -DskipTests package

#
# Runtime stage
#
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

RUN useradd -r -u 10001 -g root spring && \
    mkdir -p /app/uploads && \
    chown -R spring:root /app

COPY --from=build /workspace/target/*.jar /app/app.jar

ENV JAVA_OPTS=""

EXPOSE 8080
VOLUME ["/app/uploads"]

USER spring
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]

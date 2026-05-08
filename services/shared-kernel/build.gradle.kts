plugins {
    `java-library`
}

dependencies {
    api("org.springframework.boot:spring-boot-starter-aop")
    api("org.springframework.boot:spring-boot-starter-web")
    api("org.springframework.boot:spring-boot-starter-validation")
    api("org.springframework.boot:spring-boot-starter-data-jpa")
    api("org.springframework.boot:spring-boot-starter-security")
    api("org.springframework.kafka:spring-kafka")
    api("com.fasterxml.jackson.core:jackson-databind")
    compileOnly("org.projectlombok:lombok:1.18.34")
    annotationProcessor("org.projectlombok:lombok:1.18.34")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

rootProject.name = "kaori-services"

include(
    "shared-kernel",
    "auth-service",
    "tenant-service",
    "api-gateway",
    "realtime-gateway",
    "notification-service",
    "booking-service",
    "catalog-service",
    "customer-service",
    "inventory-service",
    "content-service"
)

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

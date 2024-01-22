plugins {
   kotlin("jvm") version "1.9.22"
   id("com.google.cloud.tools.jib") version "3.4.0"
}

group = "de.melnichuk.autocomplete"
version = "0.1-SNAPSHOT"

repositories {
   mavenCentral()
}

dependencies {
   // web
   implementation("io.javalin:javalin:5.6.3")
   implementation("org.slf4j:slf4j-simple:2.0.7")
   implementation("com.fasterxml.jackson.core:jackson-databind:2.15.0")
   implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.15.0")
}

java{
   sourceCompatibility = JavaVersion.VERSION_21
}

kotlin {
   jvmToolchain(21)
}

jib {
   from {
      image = "openjdk:21"

      platforms {
         platform {
            os = "linux"
            architecture = "amd64"
         }
      }

      container {
         ports = listOf("8000")
      }
   }
}

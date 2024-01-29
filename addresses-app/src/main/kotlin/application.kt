package de.melnichuk.addresses

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import io.javalin.Javalin
import io.javalin.http.ContentType
import io.javalin.http.Context
import io.javalin.http.HttpStatus
import io.javalin.http.staticfiles.Location
import io.javalin.json.JavalinJackson

private val serverPort: Int = System.getenv("SERVER_PORT")?.toInt() ?: 8000

val ObjectMapper = ObjectMapper()
   .registerKotlinModule()
   .enable(SerializationFeature.INDENT_OUTPUT)
   .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)

fun main() {
   Javalin.create {
      it.jsonMapper(JavalinJackson(ObjectMapper))

      it.staticFiles.add {
         it.hostedPath = "/"
         it.directory = "/public"
         it.location = Location.CLASSPATH
      }

      it.plugins.enableCors {
         it.add {
            it.anyHost()
         }
      }
   }.apply {
      setupErrorHandler()

      get("/", ::handleIndexGet)
      get("/addresses", ::handleAddressesGet)

      start(serverPort)
   }
}

private fun  Javalin.setupErrorHandler() {
   error(HttpStatus.NOT_FOUND) {
      it.result("Not Found.")
   }

   error(HttpStatus.INTERNAL_SERVER_ERROR) {
      it.result("Application Error.")
   }
}

private fun handleIndexGet(ctx: Context) {
   ctx.html(
      renderPage("""
         ${renderCard("Autocomplete, receiving HTML", renderAutocomplete(label = "Search Address (html)", suggestionsContentType = "text/html"))}
         ${renderCard("Autocomplete, receiving JSON", renderAutocomplete(label = "Search Address (json)", suggestionsContentType = "application/json"))}
      """.trimIndent())
   )
}

private fun handleAddressesGet(ctx: Context) {
   val filter = ctx.queryParam("filter") ?: ""
   val limit = ctx.queryParam("limit")?.toInt() ?: 5
   val addresses = AddressRepository.findAddresses(filter, limit)
   val accept = ctx.header("Accept")
   when (accept) {
      ContentType.JSON -> ctx.json(addresses)
      else -> ctx.html(renderAutocompleteSuggestions(addresses))
   }
}
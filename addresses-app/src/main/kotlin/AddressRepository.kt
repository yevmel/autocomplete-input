package de.melnichuk.addresses

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import java.util.function.Predicate

data class Address(
   val id: Int,
   val firstname: String,
   val lastname: String,
   val street: String,
   val city: String
)

private val json = """
   [
     {
       "id": 1,
       "firstname": "John",
       "lastname": "Doe",
       "street": "123 Main St",
       "city": "Anytown"
     },
     {
       "id": 2,
       "firstname": "Alice",
       "lastname": "Johnson",
       "street": "456 Oak Ave",
       "city": "Somewhere"
     },
     {
       "id": 3,
       "firstname": "David",
       "lastname": "Smith",
       "street": "789 Pine Blvd",
       "city": "Everyville"
     },
     {
       "id": 4,
       "firstname": "Emily",
       "lastname": "Williams",
       "street": "234 Maple Ln",
       "city": "Nowhere"
     },
     {
       "id": 5,
       "firstname": "Michael",
       "lastname": "Brown",
       "street": "567 Cedar Rd",
       "city": "Anywhere"
     },
     {
       "id": 6,
       "firstname": "Olivia",
       "lastname": "Jones",
       "street": "890 Birch Dr",
       "city": "Someplace"
     },
     {
       "id": 7,
       "firstname": "Robert",
       "lastname": "Miller",
       "street": "321 Elm Ct",
       "city": "Everytown"
     },
     {
       "id": 8,
       "firstname": "Sophia",
       "lastname": "Davis",
       "street": "654 Spruce Ave",
       "city": "Noway"
     },
     {
       "id": 9,
       "firstname": "Matthew",
       "lastname": "Garcia",
       "street": "987 Oakwood Pkwy",
       "city": "Everyplace"
     },
     {
       "id": 10,
       "firstname": "Emma",
       "lastname": "Martinez",
       "street": "135 Pinecrest Dr",
       "city": "Somecity"
     },
     {
       "id": 11,
       "firstname": "Daniel",
       "lastname": "Rodriguez",
       "street": "468 Cedarwood Ln",
       "city": "Anywhereville"
     },
     {
       "id": 12,
       "firstname": "Ava",
       "lastname": "Brown",
       "street": "246 Maplewood Rd",
       "city": "Nowheretown"
     },
     {
       "id": 13,
       "firstname": "William",
       "lastname": "Taylor",
       "street": "579 Birchwood Blvd",
       "city": "Everyplaceville"
     },
     {
       "id": 14,
       "firstname": "Mia",
       "lastname": "Wilson",
       "street": "802 Sprucewood Dr",
       "city": "Somevilletown"
     },
     {
       "id": 15,
       "firstname": "James",
       "lastname": "Lopez",
       "street": "123 Evergreen Ln",
       "city": "Nowheresville"
     }
   ]
""".trimIndent()

object AddressRepository {
   private val addresses = jacksonObjectMapper().readValue<List<Address>>(json)

   fun findAddresses(
      filter: String,
      limit: Int
   ): List<Address> = (if (filter.isEmpty()) addresses else addresses.filter {
      it.firstname.containsIgnoreCase(filter) ||
      it.lastname.containsIgnoreCase(filter) ||
      it.street.containsIgnoreCase(filter) ||
      it.city.containsIgnoreCase(filter)
   }).take(limit)
}

fun String.containsIgnoreCase(str: String) =
   this.lowercase().contains(str.lowercase())

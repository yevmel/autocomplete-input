package de.melnichuk.addresses

private val staticFilesBaseURL: String = System.getenv("STATIC_FILES_BASE_URL") ?: ""

fun renderPage(
   content: String
): String = """
   <!doctype html>
   <html>
   <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${staticFilesBaseURL}/style.css" rel="stylesheet">
      <script src="${staticFilesBaseURL}/script.js"></script>
   </head>
   <body class="bg-gray-50">
      ${content}
   </body>
   </html>
""".trimIndent()

fun renderAutocomplete(
   label: String = "Search Address",
   suggestionsContentType: String = "text/html"
): String = """
   <div class="autocomplete">
      <div class="text-input">
         <div class="input-group">
            <!-- an icon or something similar can be places here -->
   
            <div>
               <label for="name">${label}</label>
               <input type="text" id="name" placeholder="John Doe" class="autocomplete-text" 
                  data-suggestions-url="/addresses"
                  data-suggestions-content-type="${suggestionsContentType}">
               <input type="hidden" class="autocomplete-value">
            </div>
         </div>
   
         <div class="actions">
            <button type="button" class="success">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
               </svg>
            </button>
   
            <button type="button" class="danger">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
               </svg>
            </button>
         </div>
      </div>
   </div>
""".trimIndent()

fun renderAutocompleteSuggestions(addresses: List<Address>): String = """
<div class="suggestions">
   <table>
      <thead>
      <tr>
         <th scope="col">Firstname</th>
         <th scope="col">Lastname</th>
         <th scope="col">Address</th>
      </tr>
      </thead>
      <tbody>
      ${if (addresses.isEmpty()) """<tr><td colspan="999">no suggestions for you ¯\_(ツ)_/¯</td></tr>""" else addresses.joinToString("") { """
         <tr data-autocomplete-suggestion="${it.id}" data-autocomplete-suggestion-text="${it.firstname} ${it.lastname}, ${it.city}, ${it.street}">
            <td>${it.firstname}</td>
            <td>${it.lastname}</td>
            <td>${it.city}, ${it.street}</td>
         </tr>   
      """.trimIndent() }}
      </tbody>
   </table>
</div>
""".trimIndent()

fun renderCard(
   heading: String,
   content: String
): String = """
   <div class="p-6 bg-white shadow rounded-lg flex flex-col gap-6 w-full">
      <h3 class="truncate text-sm font-medium text-gray-900">${heading}</h3>
      <div>${content}</div>
   </div>
""".trimIndent()

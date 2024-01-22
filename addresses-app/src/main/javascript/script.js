/**
 * executes <b>eventHandlerFn</b> only if there is an ancestor to the target matching <b>closestElementSelector</b>
 *
 * @param closestElementSelector selector to find relevant ancestor
 * @param eventHandlerFn event handler receiving the event and the relevant ancestor as parameters.
 * @returns conditional event handler expecting event as the only parameter
 */
function withClosestElement(closestElementSelector, eventHandlerFn) {
   return function (event) {
      const relevantAncestor = event.target.closest(closestElementSelector)
      if (relevantAncestor) {
         eventHandlerFn(event, relevantAncestor)
      }
   }
}

/**
 * argument passing debounce implementation
 */
function debounce(fn, timeout = 350) {
   let timeoutId

   return function() {
      clearTimeout(timeoutId)
      const args = arguments
      timeoutId = setTimeout(function() {
         fn(...args)
      }, timeout)
   }
}

function restoreCurrentText(target) {
   const currentText = target.dataset.autocompleteCurrentText
   if (currentText !== target.value) {
      target.value = currentText || ''
   }
}

function applySuggestion(autocompleteContainerEl, suggestionEl) {
   autocompleteContainerEl.querySelector('.autocomplete-value').value =
      suggestionEl.dataset.autocompleteSuggestion

   const autocompleteTextEl = autocompleteContainerEl.querySelector('.autocomplete-text')
   autocompleteTextEl.value = autocompleteTextEl.dataset.autocompleteCurrentText =
      suggestionEl.dataset.autocompleteSuggestionText
}

async function setupSuggestionsHtml(response) {
   const contentType = response.headers.get("Content-Type")

   if ('application/json' === contentType) {
      const addresses = await response.json();
      return setupSuggestionsHtmlFromAddresses(addresses)
   } else if ('text/html' === contentType) {
      return await response.text()
   }

   throw Error('can not handle content type: ' + contentType)
}

function setupSuggestionsHtmlFromAddresses(addresses) {
   const rows = addresses.length === 0 ? `<tr><td colspan="999">no suggestions for you ¯\\_(ツ)_/¯</td></tr>` : addresses.map(address => `
      <tr data-autocomplete-suggestion="${address.id}" 
          data-autocomplete-suggestion-text="${address.firstname} ${address.lastname}, ${address.city}, ${address.street}">
         <td>${address.firstname}</td>
         <td>${address.lastname}</td>
         <td>${address.city}, ${address.street}</td>
      </tr>   
   `).join('')


   return `
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
                ${rows}
            </tbody>
         </table>
      </div>
   `
}

(function setupAutocomplete(root = document) {
      let abortController

      root.addEventListener("focusout", withClosestElement(".autocomplete", function(event, autocompleteContainer) {
         restoreCurrentText(event.target)

         const suggestions = autocompleteContainer.querySelector('.suggestions')
         if (suggestions) {
            suggestions.remove()
         }
      }))

      root.addEventListener("mousedown", withClosestElement("[data-autocomplete-suggestion]", function(event, suggestion) {
         const autocompleteContainer = suggestion.closest('.autocomplete')
         applySuggestion(autocompleteContainer, suggestion)
      }))

      root.addEventListener('keydown', withClosestElement(".autocomplete", function(event, autocompleteContainerEl) {
         const suggestionsContainer = autocompleteContainerEl.querySelector('.suggestions')
         if (!suggestionsContainer) {
            return
         }

         if (["ArrowDown", "ArrowUp"].indexOf(event.key) > -1) {
            event.preventDefault()

            const suggestions = Array.from(suggestionsContainer.querySelectorAll('[data-autocomplete-suggestion]'))
            const selectedIdx = suggestions.findIndex(el => el.matches('.selected'))

            if ("ArrowDown" === event.key) {
               if (selectedIdx === -1) {
                  suggestions[0].classList.add('selected')
               } else if (selectedIdx < (suggestions.length - 1)) {
                  suggestions[selectedIdx].classList.remove('selected')
                  suggestions[selectedIdx + 1].classList.add('selected')
               }
            } else if ("ArrowUp" === event.key) {
               if (selectedIdx === -1) {
                  suggestions[suggestions.length - 1].classList.add('selected')
               } else if (selectedIdx > 0) {
                  suggestions[selectedIdx].classList.remove('selected')
                  suggestions[selectedIdx - 1].classList.add('selected')
               }
            }
         } else if ("Escape" === event.key) {
            suggestionsContainer.remove()
            restoreCurrentText(event.target)
         } else if ("Enter" === event.key) {
            const selectedSuggestionEl = suggestionsContainer.querySelector('.selected')
            if (selectedSuggestionEl) {
               applySuggestion(autocompleteContainerEl, selectedSuggestionEl)
               suggestionsContainer.remove()
            }
         }
      }))

      root.addEventListener('input', debounce(event => {
         const suggestionsBaseUrl = event.target.dataset.suggestionsUrl
         if (suggestionsBaseUrl === undefined) {
            return
         }

         const filter = event.target.value
         const suggestionsContentType = event.target.dataset.suggestionsContentType || 'text/html'
         const suggestionsUrl = suggestionsBaseUrl.includes("?") ?
            `${suggestionsBaseUrl}&filter=${filter}` : `${suggestionsBaseUrl}?filter=${filter}`

         if (abortController) {
            abortController.abort()
         }

         abortController = new AbortController()

         fetch(suggestionsUrl, {
            headers: { "Accept": suggestionsContentType },
            signal: abortController.signal
         }).then(async response => {
            const html = await setupSuggestionsHtml(response)
            const autocompleteContainer = event.target.closest('.autocomplete')

            const existingSuggestions = autocompleteContainer.querySelector('.suggestions')
            if (existingSuggestions) {
               existingSuggestions.remove()
            }

            const temp = document.createElement("div");
            temp.innerHTML = html

            autocompleteContainer.appendChild(temp.firstElementChild)
         })
      }))
   }
)()

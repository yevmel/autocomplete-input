const CurrentSuggestions = new WeakMap()

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

function applySuggestion(autocompleteContainerEl, suggestionEl, valueMapper, displayMapper) {
   const suggestionIdx = Array.from(
      autocompleteContainerEl.querySelectorAll('.suggestion')
   ).indexOf(suggestionEl)

   const suggestionsEl = autocompleteContainerEl.querySelector('.suggestions')
   const values = CurrentSuggestions.get(suggestionsEl)[suggestionIdx]

   const autocompleteValueEl = autocompleteContainerEl.querySelector('.autocomplete-value')
   autocompleteValueEl.value = valueMapper(values)

   const autocompleteTextEl = autocompleteContainerEl.querySelector('.autocomplete-text')
   autocompleteTextEl.value = autocompleteTextEl.dataset.autocompleteCurrentText = displayMapper(values)
}

function setupSuggestionsHtmlFromJson(addresses) {
   const rows = addresses.length === 0 ? `<tr><td colspan="999">no suggestions for you ¯\\_(ツ)_/¯</td></tr>` : addresses.map(address => `
      <tr class="suggestion" 
        data-autocomplete-suggestion="${address.id}" 
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

function removeSuggestions(suggestionsEl) {
   const deleted = CurrentSuggestions.delete(suggestionsEl)
   if (!deleted) {
      console.warn("failed to cleanup suggestion values.")
   }

   suggestionsEl.remove()
}

function setupAutocomplete({
   root = document,
   valueMapper = values => values.id,
   displayMapper = values => values.id
} = {}) {
   let abortController

   root.addEventListener("focusout", withClosestElement(".autocomplete", function(event, autocompleteContainerEl) {
      if (abortController) {
         abortController.abort()
         abortController = null
      }

      restoreCurrentText(event.target)

      const suggestionsEl = autocompleteContainerEl.querySelector('.suggestions')
      if (suggestionsEl) {
         removeSuggestions(suggestionsEl)
      }
   }))

   root.addEventListener("mousedown", withClosestElement(".suggestion", function(event, suggestionEl) {
      const autocompleteContainerEl = suggestionEl.closest('.autocomplete')
      applySuggestion(autocompleteContainerEl, suggestionEl, valueMapper, displayMapper)
   }))

   root.addEventListener('keydown', withClosestElement(".autocomplete", function(event, autocompleteContainerEl) {
      const suggestionsContainerEl = autocompleteContainerEl.querySelector('.suggestions')
      if (!suggestionsContainerEl) {
         return
      }

      if (["ArrowDown", "ArrowUp"].indexOf(event.key) > -1) {
         event.preventDefault()

         const suggestions = Array.from(suggestionsContainerEl.querySelectorAll('[data-autocomplete-suggestion]'))
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
         removeSuggestions(suggestionsContainerEl)
         restoreCurrentText(event.target)
      } else if ("Enter" === event.key) {
         const selectedSuggestionEl = suggestionsContainerEl.querySelector('.selected')
         if (selectedSuggestionEl) {
            applySuggestion(autocompleteContainerEl, selectedSuggestionEl, valueMapper, displayMapper)
            removeSuggestions(suggestionsContainerEl)
         }
      }
   }))

   root.addEventListener('input', debounce(event => {
      const suggestionsBaseUrl = event.target.dataset.suggestionsUrl
      if (suggestionsBaseUrl === undefined) {
         return
      }

      const filter = event.target.value
      const suggestionsUrl = suggestionsBaseUrl.includes("?") ?
         `${suggestionsBaseUrl}&filter=${filter}` : `${suggestionsBaseUrl}?filter=${filter}`

      if (abortController) {
         abortController.abort()
         abortController = null
      }

      abortController = new AbortController()

      fetch(suggestionsUrl, {
         headers: { "Accept": "application/json" },
         signal: abortController.signal
      }).then(async response => {
         const contentType = response.headers.get("Content-Type")

         if ('application/json' === contentType) {
            const addresses = await response.json();
            const html = setupSuggestionsHtmlFromJson(addresses)
            const autocompleteContainerEl = event.target.closest('.autocomplete')

            const existingSuggestionsEl = autocompleteContainerEl.querySelector('.suggestions')
            if (existingSuggestionsEl) {
               removeSuggestions(existingSuggestionsEl)
            }

            const tempEl = document.createElement("div");
            tempEl.innerHTML = html

            const newSuggestionsEl = tempEl.firstElementChild;
            CurrentSuggestions.set(newSuggestionsEl, addresses)

            autocompleteContainerEl.appendChild(newSuggestionsEl)
         } else {
            throw Error('can not handle content type: ' + contentType)
         }
      })
   }))
}

setupAutocomplete({
   displayMapper: values => `${values.firstname} ${values.lastname}, ${values.city}, ${values.street}`
})

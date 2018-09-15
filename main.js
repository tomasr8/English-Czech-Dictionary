const DEBUGGING = true
const debug = {
  log(...args) {
    if (DEBUGGING) {
      console.log("English-Czech-Dictionary:", ...args)
    }
  },
  error(...args) {
    console.error("English-Czech-Dictionary:", ...args)
  }
}

// crossbrowser fix
const browserPrefix = typeof browser !== "undefined" ? browser : chrome
// extension assets
const HTML_URL = browserPrefix.extension.getURL("translator.html")
const CSS_URL = browserPrefix.extension.getURL("styles.css")
const DOWN_ARROW_URL = browserPrefix.extension.getURL("da.svg")
const UP_ARROW_URL = browserPrefix.extension.getURL("ua.svg")
const DICT_BASE_PATH = "./dictionary"

// max length of phrases stored in the local dictionary
const MAX_PHRASE_LENGTH = 4
const LETTERS = "abcdefghijklmnopqrstuvwxyz"

const createApiUrl = phrase =>
  `https://glosbe.com/gapi/translate?from=eng&dest=ces&format=json&phrase=${encodeURI(phrase)}`


//  fetch css from URL and insert it into the <HEAD> tag
function loadCSS(url) {
  return fetch(url)
    .then(res => res.text())
    .then(css => {
      const head = document.head
      const style = document.createElement("style")
      style.type = "text/css"
      style.appendChild(document.createTextNode(css))
      head.appendChild(style)
      debug.log("css loaded")
    })
}

class LocalDictionary {
  constructor() {
    this.dictionary = Object.create(null)
    for (let i = 1; i <= MAX_PHRASE_LENGTH; i++) {
      this.dictionary[i] = Object.create(null)
    }
  }

  fetchDictionary(phraseLength, start) {
    debug.log(`fetching local ${phraseLength}/${start}`)
    return fetch(browserPrefix.extension.getURL(`${DICT_BASE_PATH}/${phraseLength}/${start}.json`))
      .then(res => res.json())
  }

  removeDuplicates(arr) {
    const obj = Object.create(null)
    arr.forEach(elem => obj[elem] = elem)
    return Object.keys(obj)
  }

  async translate(phrase) {
    if (phrase === "") {
      return []
    }

    phrase = phrase.toLowerCase()
    const length = phrase.split(/\s+/).length
    const start = LETTERS.includes(phrase[0]) ? phrase[0] : "other"

    if (length > MAX_PHRASE_LENGTH) {
      return []
    }

    if (!this.dictionary[length][start]) {
      return this.fetchDictionary(length, start)
        .then(data => {
          this.dictionary[length][start] = data
          return this.removeDuplicates(
            this.dictionary[length][start][phrase] || []
          )
        })
    } else {
      return this.removeDuplicates(
        this.dictionary[length][start][phrase] || []
      )
    }
  }
}

class OnlineDictionary {
  constructor() {
    this.cache = Object.create(null)
    this.fetching = false
  }

  async translate(phrase) {
    if (phrase === "") {
      return []
    }

    phrase = phrase.toLowerCase()

    if (this.cache[phrase]) {
      return this.cache[phrase]
    } else if (!this.fetching) {
      this.fetching = true

      try {
        debug.log(`fetching "${phrase}" from online API`)
        const response = await fetch(createApiUrl(phrase))
          .then(res => res.json())

        const translations = response.tuc
          .filter(item => item.phrase)
          .map(item => item.phrase.text)

        this.cache[phrase] = translations
        return translations
      } finally {
        // do not catch errors here, only reset the fetching status & let the error bubble up
        this.fetching = false
      }
    }
  }
}

class Translator {
  constructor(localDictionary, onlineDictionary) {
    this.localDictionary = localDictionary
    this.onlineDictionary = onlineDictionary
  }

  setResults(translations) {
    const container = this.root.querySelector(".results")

    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }

    translations.forEach(translation => {
      const span = document.createElement("span")
      span.textContent = translation
      span.classList.add("translation")
      container.appendChild(span)
    })
  }

  triggerLocalTranslation() {
    this.root.querySelector(".form .offlineBtn").click()
  }

  hide() {
    this.root.style.setProperty("display", "none", "important")
  }

  onSelect(event) {
    const selectedText = window
      .getSelection().toString().trim()

    this.setResults([])

    if (selectedText === "") {
      this.root.style.setProperty("display", "none", "important")
      return
    }

    debug.log(`selected text: >${selectedText}<`)

    const x = event.pageX
    const y = event.pageY

    const top = y + 20
    const left = Math.max(0, x - 30)
    this.root.style.setProperty("top", `${top}px`, "important")
    this.root.style.setProperty("left", `${left}px`, "important")
    this.root.style.setProperty("display", "block", "important")
    this.root.querySelector(".form input").value = selectedText
  }

  htmlToElement(html) {
    const template = document.createElement("template")
    html = html.trim()
    template.innerHTML = html
    return template.content.firstChild
  }

  createElement() {
    return fetch(HTML_URL)
      .then(res => res.text())
      .then(html => {
        this.root = this.htmlToElement(html)
        this.root.addEventListener("mouseup", e => e.stopPropagation())

        const offlineBtn = this.root.querySelector(".form .offlineBtn")
        offlineBtn.style.setProperty("background-image", `url(${DOWN_ARROW_URL})`, "important")

        const onlineBtn = this.root.querySelector(".form .onlineBtn")
        onlineBtn.style.setProperty("background-image", `url(${UP_ARROW_URL})`, "important")

        const input = this.root.querySelector(".form input")
        const results = this.root.querySelector(".results")

        input.addEventListener("keyup", () => {
          const phrase = input.value.toLowerCase()
          this.localDictionary
            .translate(phrase)
            .then(translations => {
              results.style.setProperty("background-color", "#e4e7f1", "important")
              this.setResults(translations)
            })
            .catch(err => debug.error(err))
        })

        offlineBtn.addEventListener("click", () => {
          const phrase = input.value.toLowerCase()
          this.localDictionary
            .translate(phrase)
            .then(translations => {
              results.style.setProperty("background-color", "#e4e7f1", "important")
              this.setResults(translations)
            })
            .catch(err => debug.error(err))
        })

        onlineBtn.addEventListener("click", () => {
          const phrase = input.value.toLowerCase()
          this.onlineDictionary
            .translate(phrase)
            .then(translations => {
              results.style.setProperty("background-color", "#f1e7e4", "important")
              this.setResults(translations)
            })
            .catch(err => debug.error(err))
        })

        // prevent selection of text in the translation box
        onlineBtn.addEventListener("keypress", e => e.preventDefault())
        return this.root
      })
  }
}


const localDictionary = new LocalDictionary()
const onlineDictionary = new OnlineDictionary()
const translator = new Translator(localDictionary, onlineDictionary)

loadCSS(CSS_URL)
  .then(() => {
    return translator.createElement()
  })
  .then(root => {
    document.body.appendChild(root)
    document.addEventListener("mouseup", event => setTimeout(() => translator.onSelect(event), 50))
    document.addEventListener("keypress", ({ key }) => {
      console.log(key)
      key = key.toLowerCase()
      if (key === "escape") {
        translator.hide()
      } else if (key === "enter" && root.style.display !== "none") {
        translator.triggerLocalTranslation()
      }
    })
  })
  .catch(err => debug.error(err))
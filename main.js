(() => {
  function removeDuplicates(arr) {
    const obj = Object.create(null)

    arr.forEach(elem => obj[elem] = elem)
    return Object.keys(obj)
  }

  function setResults(translations, container) {
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

  function createTranslator(dictionary, cache) {
    const id = "tb-1347589031475"
    const parent = document.createElement("div")
    parent.id = id
    parent.addEventListener("mouseup", e => e.stopPropagation())

    const form = document.createElement("div")
    form.classList.add("form")
    parent.appendChild(form)

    const input = document.createElement("input")
    input.type = "text"
    input.placeholder = "..."
    form.appendChild(input)

    const offlineBtn = document.createElement("button")
    // offlineBtn.innerHTML = "&#8595;"
    offlineBtn.classList.add("offlineBtn")
    offlineBtn.style.setProperty("background-image", `url(${browser.extension.getURL("./da.svg")})`, "important")
    form.appendChild(offlineBtn)

    const onlineBtn = document.createElement("button")
    // onlineBtn.innerHTML = "Nenalezeno<br />Zkusit internet?"
    onlineBtn.classList.add("onlineBtn")
    onlineBtn.style.setProperty("background-image", `url(${browser.extension.getURL("./ta.svg")})`, "important")
    form.appendChild(onlineBtn)

    const results = document.createElement("div")
    results.classList.add("results")
    parent.appendChild(results)

    const offlineResults = document.createElement("div")
    offlineResults.classList.add("offlineResults")
    results.appendChild(offlineResults)

    input.addEventListener("keyup", () => {
      const word = input.value.toLowerCase()
      const translations = removeDuplicates(dictionary[word] || [])
      results.style.setProperty("background-color", "#e4e7f1", "important")
      setResults(translations, offlineResults)
    })

    offlineBtn.addEventListener("click", () => {
      const word = input.value.toLowerCase()
      const translations = removeDuplicates(dictionary[word] || [])
      results.style.setProperty("background-color", "#e4e7f1", "important")
      setResults(translations, offlineResults)
    })

    let fetching = false
    onlineBtn.addEventListener("click", () => {
      const word = input.value.toLowerCase()

      if (cache[word]) {
        results.style.setProperty("background-color", "#f1e7e4", "important")
        setResults(cache[word], offlineResults)
      } else if(!fetching) {
        fetching = true
        fetch(`https://glosbe.com/gapi/translate?from=eng&dest=ces&format=json&phrase=${encodeURI(word)}`)
          .then(res => res.json())
          .then(json => {
            const translations = json.tuc
              .filter(item => item.phrase)
              .map(item => item.phrase.text)

            results.style.setProperty("background-color", "#f1e7e4", "important")
            setResults(translations, offlineResults)
            cache[word] = translations
          })
          .catch(err => console.error("English-Czech-Dictionary:", err))
          .then(() => fetching = false)
      }
    })

    onlineBtn.addEventListener("keypress", e => e.preventDefault())

    return parent
  }

  function copySelection(e, translator) {
    const selectedText = window
      .getSelection().toString().trim()
      .split(/\s+/)[0]
    console.log(`>${selectedText}<`)

    setResults([], translator.childNodes[1].firstChild)

    if (selectedText === "") {
      translator.style.setProperty("display", "none", "important")
      return
    }

    const x = e.pageX
    const y = e.pageY

    const top = y + 20
    const left = Math.max(0, x - 30)

    translator.style.setProperty("top", `${top}px`, "important")
    translator.style.setProperty("left", `${left}px`, "important")
    translator.style.setProperty("display", "block", "important")
    translator.firstChild.firstChild.value = selectedText
  }

  function insertStyle(css) {
    const head = document.head
    const style = document.createElement("style")

    style.type = "text/css"
    style.appendChild(document.createTextNode(css))
    head.appendChild(style)
  }

  const cache = {}
  const cssPromise = fetch(browser.extension.getURL("styles.css"))
  const dictionaryPromise = fetch(browser.extension.getURL("dictionary.json"))

  Promise.all([cssPromise, dictionaryPromise])
    .then(([css, dictionary]) => Promise.all([css.text(), dictionary.json()]))
    .then(([css, dictionary]) => {

      insertStyle(css)

      const translator = createTranslator(dictionary, cache)

      document.body.appendChild(translator)
      document.addEventListener("mouseup", e => setTimeout(() => copySelection(e, translator), 50))
      document.addEventListener("keypress", ({ key }) => {
        key = key.toLowerCase()
        if (key === "escape") {
          translator.style.display = "none"
        } else if (key === "enter" && translator.style.display !== "none") {
          const btn = translator.firstChild.childNodes[1]
          btn.click()
        }
      })
    })
    .catch(err => console.error("English-Czech-Dictionary:", err))
})()
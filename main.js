(() => {
  function removeDuplicates(arr) {
    const obj = Object.create(null)

    arr.forEach(elem => obj[elem] = elem)
    return Object.keys(obj)
  }

  function resetResults(results, container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }

    results.forEach(r => {
      const span = document.createElement("span")
      span.textContent = r
      span.style.cssText = `
        border-top: 1px dashed #bfbfbf;
        box-sizing: border-box;
        width: 150px;
        padding: 8px 8px;
      `
      container.appendChild(span)
    })
  }

  const css = {
    parent: [
      "all: initial",
      "box-sizing: border-box",
      "position: absolute",
      "display: none",
      "width: 200px",
      "height: auto",
      "font-size: 14px",
      "color: #303030",
      "overflow: hidden",
      "background-color: rgba(0, 0, 0, 0)",
      "z-index: 999999",
    ]
  }

  const parentCSS = `
    all: initial;
    box-sizing: border-box;
    position: absolute;
    display: none;
    width: 200px;
    height: auto;
    font-size: 14px;
    color: #303030;
    overflow: hidden;
    background-color: rgba(0, 0, 0, 0);
    z-index: 999999;
    border: 0 none !important;
  `

  const formCSS = `
    all: initial;
    border-radius: 4px 4px 4px 0px;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    border: 0 none !important;
  `

  const resultsCSS = `
    all: initial;
    display: flex;
    flex-direction: column;
    background-color: #ebebeb;
    width: 150px;
    border-radius: 0 0 4px 4px;
    border: 0 none !important;
  `

  const sourceLangCSS = `
    all: initial;
    box-sizing: border-box;
    width: 150px;
    height: 35px;
    padding-left: 8px;
    background-color: #ebebeb;
  `

  const btnCSS = `
    all: initial;
    box-sizing: border-box;
    overflow: hidden;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    text-align: center;
    white-space: nowrap;
    text-decoration: none !important;
    text-transform: none;
    text-transform: capitalize;
    user-select: none;
    padding: 4px 4px;
    width: 50px;
    height: 35px;
    border: 0 none;
    cursor: pointer;
    transition: all 150ms linear;
    color: #fff;
    font-size: 15px;
    justify-content: center;
    align-items: center;
    background: #416dea;
    color: #FFFFFF;
    outline: none;
  `

  function createTranslator(dictionary) {
    const parent = document.createElement("div")
    parent.style.cssText = parentCSS
    parent.addEventListener("mouseup", e => e.stopPropagation())

    const form = document.createElement("div")
    form.style.cssText = formCSS
    parent.appendChild(form)

    const results = document.createElement("div")
    results.style.cssText = resultsCSS
    parent.appendChild(results)

    const sourceLang = document.createElement("input")
    sourceLang.type = "text"
    sourceLang.placeholder = "..."
    sourceLang.style.cssText = sourceLangCSS
    form.appendChild(sourceLang)

    const btn = document.createElement("button")
    btn.textContent = "GO"
    btn.style.cssText = btnCSS
    form.appendChild(btn)

    btn.addEventListener("click", () => {
      const word = sourceLang.value.toLowerCase()
      const translations = removeDuplicates(dictionary[word] || [])
      resetResults(translations, results)
    })

    btn.addEventListener("mouseover", () => {
      btn.style.background = "#7192ef"
    })

    btn.addEventListener("mousedown", () => {
      btn.style.background = "#436fea"
    })

    btn.addEventListener("mouseleave", () => {
      btn.style.background = "#416dea"
    })

    btn.addEventListener("mouseup", () => {
      btn.style.background = "#416dea"
    })

    return parent
  }

  function copySelection(e, translator) {
    const selectedText = window
      .getSelection().toString().trim()
      .split(/\s+/)[0]
    console.log(`>${selectedText}<`)

    resetResults([], translator.childNodes[1])

    if (selectedText === "") {
      translator.style.display = "none"
      return
    }

    const x = e.pageX
    const y = e.pageY

    const top = y + 20
    const left = Math.max(0, Math.min(x - 30, document.body.clientWidth))

    translator.style.top = `${top}px`
    translator.style.left = `${left}px`
    translator.style.display = "block"
    translator.firstChild.firstChild.value = selectedText
  }

  window
    .fetch(browser.extension.getURL("dictionary.json"))
    .then(res => res.json())
    .then(dictionary => {
      const translator = createTranslator(dictionary)

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
    .catch(err => console.error(err))
})()

// const execPlugin = () => {
// }
// execPlugin()
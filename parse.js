/*
Create simplfied JSON file from eng-ces.xml and filter
multi word entries.
*/

const fs = require("fs")
// const util = require("util")
const xml2js = require("xml2js")

const parser = new xml2js.Parser()

fs.readFile(__dirname + "/eng-ces.xml", function (err, data) {
  parser.parseString(data, function (err, result) {
    const entries = result.TEI.text[0].body[0].entry
    const LETTERS = "abcdefghijklmnopqrstuvwxyz"
    const MAX_PHRASE_LENGTH = 4

    const dictionary = Object.create(null)

    for (let i = 1; i <= MAX_PHRASE_LENGTH; i++) {
      dictionary[i] = Object.create(null)
      for(let letter of LETTERS) {
        dictionary[i][letter] = Object.create(null)
      }
      dictionary[i].other = Object.create(null)
    }

    entries.forEach(entry => {
      let phrase = entry.form[0].orth[0]

      if (phrase && phrase.split(/\s+/).length <= MAX_PHRASE_LENGTH) {
        phrase = phrase.toLowerCase()
        const length = phrase.split(/\s+/).length
        const letter = phrase[0]

        const key = LETTERS.includes(letter) ? letter : "other"

        if (!dictionary[length][key][phrase]) {
          dictionary[length][key][phrase] = []
        }

        const translations = entry.sense[0].cit.filter(cit => cit["$"].type === "trans").map(cit => cit.quote[0])
        dictionary[length][key][phrase].push(...translations)
      }

      // if (!key) {
      //   console.log(entry.form[0])
      // } else if (key.split(/\s+/).length !== 1) {
      //   // multi word key
      // } else {
      //   key = key.toLowerCase()
      //   if (!dictionary[key]) {
      //     dictionary[key] = []
      //   }

      //   const translations = entry.sense[0].cit.filter(cit => cit["$"].type === "trans").map(cit => cit.quote[0])
      //   try {
      //     dictionary[key].push(...translations)
      //   } catch(err) {
      //     console.log(typeof key)
      //     console.log(key)
      //     console.log(dictionary[key])
      //   }
      // }

    })

    for (let i = 1; i <= MAX_PHRASE_LENGTH; i++) {
      for(let letter of LETTERS) {
        fs.writeFileSync(`./dictionary/${i}/${letter}.json`, JSON.stringify(dictionary[i][letter]), "utf8")
      }
      fs.writeFileSync(`./dictionary/${i}/other.json`, JSON.stringify(dictionary[i].other), "utf8")
    }

    // fs.writeFileSync(__dirname + `dic/1/a.json`, JSON.stringify({}), "utf8")

    // fs.writeFileSync("./dictionary6.json", JSON.stringify(dictionary), "utf8")
    console.log("Done")
    // console.log(Object.values(letters).reduce((p, c) => p + c))
  })
})
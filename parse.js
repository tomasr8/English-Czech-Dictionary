/*
Create simplfied JSON file from eng-ces.xml and filter
multi word entries.
*/

const fs = require("fs")
const util = require("util")
const xml2js = require("xml2js")

const parser = new xml2js.Parser()
fs.readFile(__dirname + "/eng-ces.xml", function (err, data) {
  parser.parseString(data, function (err, result) {
    const entries = result.TEI.text[0].body[0].entry
    const dictionary = Object.create(null)
    entries.forEach(entry => {
      let key = entry.form[0].orth[0]

      if (!key) {
        console.log(entry.form[0])
      } else if (key.split(/\s+/).length > 1) {
        // multi word key
      } else {
        key = key.toLowerCase()
        if (!dictionary[key]) {
          dictionary[key] = []
        }

        const translations = entry.sense[0].cit.filter(cit => cit["$"].type === "trans").map(cit => cit.quote[0])
        try {
          dictionary[key].push(...translations)
        } catch(err) {
          console.log(typeof key)
          console.log(key)
          console.log(dictionary[key])
        }
      }

    })

    fs.writeFileSync("./dictionary.json", JSON.stringify(dictionary), "utf8")
    console.log("Done")
  })
})
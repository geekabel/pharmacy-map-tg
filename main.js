const fs = require('fs')
// const XLSX = require("xlsx");
const pharmaciesData = require('./pharmacies.json')

function extractPharmaciesInfo(pharmaciesData) {
  const pharmacies = []

  pharmaciesData.elements.forEach((element) => {
    const pharmacy = {}

    if (element.type === 'node' && element.tags?.amenity === 'pharmacy') {
      pharmacy.lat = element.lat
      pharmacy.lon = element.lon
      pharmacy.name = element.tags?.name
      (pharmacy.dispensing = element.tags?.dispensing || null), (pharmacy.phone = element.tags?.phone || ''), (pharmacy.onDuty = false)

      pharmacies.push(pharmacy)
    }
  })

  return pharmacies
}

const pharmacies = extractPharmaciesInfo(pharmaciesData)
fs.writeFile('filtered-data.json', JSON.stringify(pharmacies, null, 2), (err) => {
  if (err) {
    console.error(err)
    return
  }
  console.log('Filtered data saved to filtered-data.json')
})
console.log(pharmacies)


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

// // Function to convert Excel data to JSON
// function excelToJson(workbook) {
//   const result = {};
//   workbook.SheetNames.forEach(sheetName => {
//     const sheet = workbook.Sheets[sheetName];
//     result[sheetName] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
//   });
//   return result;
// }

// //const workbook = 'table_dta.csv';
// const workbook_xlsx = "IT_232_2022_2023 Grades.xlsx"
// // let res = workbook_xlsx.arrayBuffer();
// // console.log(res);
// let workbook = XLSX.readFile(workbook_xlsx, opts);
// console.log(workbook_xlsx);
// // excelToJson(workbook_xlsx)

var fs = require('fs');
var xlsx = require('xlsx');
var cvcsv = require('csv');

exports = module.exports = XLSX_json;

function XLSX_json (config, callback) {
  if(!config.input) {
    console.error("You miss a input file");
    process.exit(1);
  }
  if (config.headerRow && config.headerRow < 0) {
    console.error("Header row must be equal to or greater than 0");
    process.exit(2);
  }
  if (config.bodyStart && config.bodyStart < 1) {
    console.error("The body start must be greater than 0");
    process.exit(3);
  }
  if (config.bodyStart && config.headerRow && config.bodyStart <= config.headerRow) {
    console.error("The body start must be greater than the header row");
    process.exit(4);
  }

  var cv = new CV(config, callback);

}

function CV(config, callback) {
  var wb = this.load_xlsx(config.input)
  var ws = this.ws(config, wb);
  var csv = this.csv(ws)
  this.cvjson(csv, config, callback)
}

CV.prototype.load_xlsx = function(input) {
  return xlsx.readFile(input);
}

CV.prototype.ws = function(config, wb) {
  var target_sheet = config.sheet;

  if (target_sheet == null)
    target_sheet = wb.SheetNames[0];

  ws = wb.Sheets[target_sheet];
  return ws;
}

CV.prototype.csv = function(ws) {
  return csv_file = xlsx.utils.make_csv(ws)
}

CV.prototype.cvjson = function(csv, config, callback) {
  var record = []
  var header = []

  var headerRow = config.headerRow || 0;
  var bodyStart = config.bodyRow || config.headerRow + 1;

  cvcsv()
    .from.string(csv)
    .transform( function(row){
      row.unshift(row.pop());
      return row;
    })
    .on('record', function(row, index){

      if (index === config.headerRow) {
        header = row;
      } else if (index >= bodyStart) {
        var obj = {};
        header.forEach(function(column, index) {
          var key = config.lowerCaseHeaders ? column.trim().toLowerCase() : column.trim();
          obj[key] = row[index].trim();
        })
        record.push(obj);
      }
    })
    .on('end', function(count){
      // when writing to a file, use the 'close' event
      // the 'end' event may fire before the file has been written
      if(config.output !== null) {
      	var stream = fs.createWriteStream(config.output, { flags : 'w' });
      	stream.write(JSON.stringify(record));
	callback(null, record);
      }else {
      	callback(null, record);
      }

    })
    .on('error', function(error){
      console.error(error.message);
    });
}

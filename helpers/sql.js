const { BadRequestError } = require("../expressError");
/*  This function after received data from the request 
  to prepares the data to make the SET clause of an SQL format.

    Variable "dataToUpdate" collects from this function
  all data to update from data models companies and users.
  Variable jsToSql takes in all object JavaScript camelCase 
  variables then saves them to SQL and naming conventions
  with underscores like { firstName: "first_name", age: "age" }.
  */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  /* -keys- will save the output of Object.keys() method.*/
  const keys = Object.keys(dataToUpdate);
  /* Here validates there is data with keys.length, but if not, 
        error is thrown. */
  if (keys.length === 0) throw new BadRequestError("No data");
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  /* => { setCols: '"first_name"=$1, "age"=$2', values: ['Aliya', 32] }
     -cols- will map out column names and index number to be stored 
     as strings into a new array */
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  /* Function will return an object wit the column names and 
  the indexed object value */
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };

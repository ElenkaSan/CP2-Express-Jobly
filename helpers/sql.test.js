const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate Test", function () {
    let getData;
    let getJsToSQL;
    let wrongData = {};

    let wrongJsToSQL = {};

    beforeEach(function () {
        getData = {
            "firstName": "Lola",
            "lastName": "Lastone",
            "email": "user@user.com",
            "isAdmin": false,
            "name": "World",
            "description": "Best place",
            "numEmployees": 50,
            "logoUrl": "No logo"
        };
        getJsToSQL = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
            numEmployees: "num_employees",
            logoUrl: "logo_url"
        };
        wrongJsToSQL = {
            firstName: "first-name",
            lastName: "lastName",
            numEmployees: "num_employees",
            logoUrl: "logo-url"
        };

    });

    test("Receive data with correct inputs provides the output of a string and array", function () {
        let { setCols, values } = sqlForPartialUpdate(getData, getJsToSQL);
        expect.stringContaining(setCols);
        expect(setCols).toBe(`"first_name"=$1, "last_name"=$2, "email"=$3, "is_admin"=$4, "name"=$5, "description"=$6, "num_employees"=$7, "logo_url"=$8`);
        expect.arrayContaining(values);
        expect(values).toEqual(['Lola', 
                                'Lastone', 
                                'user@user.com',
                                false, 'World', 
                                'Best place', 
                                50,
                                'No logo']);

    });

    test("jsSQl is good, but data is wrong", function () {
        try {
            sqlForPartialUpdate(wrongData, getJsToSQL);
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("Receive data, but jsSQl not correct but will still pair as requested so function does not fail", function () {
        let { setCols, values } = sqlForPartialUpdate(getData, wrongJsToSQL);
        expect(setCols).toBe(`\"first-name\"=$1, \"lastName\"=$2, \"email\"=$3, \"isAdmin\"=$4, \"name\"=$5, \"description\"=$6, \"num_employees\"=$7, \"logo-url\"=$8`);
    });
    
    test("works with one item", function () {
        let result = sqlForPartialUpdate( { firstName: "Lola" },
                                          { firstName: "firstName", lastNamee: "LastName" });
        expect(result).toEqual({
          setCols: "\"firstName\"=$1",
          values: ["Lola"],
        });
      });
    
});
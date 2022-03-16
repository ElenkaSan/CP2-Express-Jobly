"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return job company data.
   * data should be { title, salary, equity, company_handle }
   * Returns new job { id, title, salary, equity, company_handle }
   *  Throws BadRequestError if job already in database. 
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
          `SELECT title
           FROM jobs
           WHERE title = $1`,
           [title]);

        if (duplicateCheck.rows[0])
            throw new BadRequestError(`Duplicate job: ${title}`);

        const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle`,
            [
                title,
                salary,
                equity,
                companyHandle
            ],
        );
        let job = result.rows[0];
        return job;
    }

  /** Find all jobs.
   * When filters are sent, then go through the keys 
   * and create a string for the where clause
   * Returns [{ id, title, salary, equity, company_handle }, ...]
  */

  static async findAll(filters = {}) {
      let parameters = "";
      let filteringValue = [];
  
          //determine if we got query filters
          //if so build the "where clause"
          //we check for those are expected if an unknown parameter is given we throw an error
          const keys = Object.keys(filters);
          if (keys.length > 0) {
  
              //start the where clause string
              parameters = "WHERE ";
              //used for building the where string
              let filteringArray = [];
              //will be used to match inputs with values provided for query string
              let count = 1;
  
  
              //run through the query parameters given, build strings and push to arrays
              for (let key of Object.keys(filters)) {
  
                  if (key == "title") {
                      filteringArray.push(`title ILIKE $${count}`);
                      filteringValue.push(`%${filters[key]}%`);
                  }
                  else if (key == "minSalary") {
                      filteringArray.push(`salary > $${count}`);
                      filteringValue.push(`${filters[key]}`);
                  }
                  else if (key == "hasEquity") {
                      filteringArray.push(`equity <> 0`);
                  }
  
                  else {
                      throw new BadRequestError(`Invalid filter: ${key}`);
                  }//end if.else clauses
                  count += 1;
              }//end of for loop for filters object
  
              //upon running through all query parameters, create the string by joining
              if (filteringArray.length > 1) {
                  parameters += filteringArray.join(" AND ");
              }
              else {
                  parameters += filteringArray[0];
              }
  
          }}

  /** Given a job id, return data about the job
   * Returns [{ id, title, salary, equity, companyHandle, company }]
   * where job is id and company is { handle, name, description, numEmployees, logoUrl }
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobsRes = await db.query(
        `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
         FROM jobs
         WHERE id = $1`,
        [id]);

    const job = jobsRes.rows[0];
    if (!job) throw new NotFoundError(`No found job: ${id}`);

    const companyRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies
         WHERE handle = $1`,
        [job.companyHandle]);

    delete job.companyHandle;
    job.company = companyRes.rows[0];

    return job;
  }

  /** Update job information with data received.
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   * Returns {id, title, salary, equity, company_handle}
   * Throws NotFoundError if job not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        { });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE handle = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job found: ${id}`);
    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job found: ${id}`);
  }
}


module.exports = Job;
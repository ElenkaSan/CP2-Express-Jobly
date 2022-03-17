"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");

// const { sqlForPartialUpdate } = require("../helpers/sql.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create job", function () {
  const newJob = {
    companyHandle: "c2",
    title: "ThisIsTest",
    salary: 20000,
    equity: "0.06",
  };

  test("create job works", async function () {
    let job = await Job.create(newJob);
    expect(job).toHaveProperty("title", "ThisIsTest");
    expect(job).toHaveProperty("id");
    expect(job).toHaveProperty("equity", "0.06");
});

test("bad request with dupe", async function () {
    try {
        await Job.create(newJob);
        await Job.create(newJob);
        fail();
    } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  const newJob = {
    title: "testNewJob",
    salary: 10000,
    equity: "0.04",
    handle: "c2",
    companyHandle: "c2",
    companyName: "C2",
  };
  
  test("works no filter", async function () {
    let job = await Job.create(newJob);
    let jobs = await Job.findAll(job.id);
    expect(jobs).toEqual([
      {
        id: job.id,
        title: "testNewJob",
        salary: 10000,
        equity: "0.04",
        handle: "c2"
      }
    ]);
  });
});

/************************************** get */
describe("get job", function () {
  const newJob = {
  companyHandle: "c2",
  title: "ThisIsTest",
  salary: 20000,
  equity: "0.06",
  };

  test("get job works", async function () {
    const job = await Job.create(newJob);
    let jobT = await Job.get(job.id);
    expect(jobT).toEqual({
      id: job.id,
      title: "ThisIsTest",
      salary: 20000,
      equity: "0.06",
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    });
  });

  test("not found if no such job", async function () {
      try {
          await Job.get(0);
          fail();
      } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
      }
  });
});


/************************************** update */

describe("update", function () {
  const newJob = {
    title: "testNewJob",
    salary: 10000,
    equity: "0.05",
    companyHandle: "c1"
  };

  const updateData = {
    title: "testOne",
    salary: 5000,
    equity: "0.02"
  };

  test("update works", async function () {
    const job = await Job.create(newJob);
    let jobUpdate = await Job.update(job.id, updateData);
    expect(jobUpdate).not.toEqual(job);
    expect(jobUpdate).toHaveProperty("title", "testOne");
  });

 
  test("not found if no such job", async function () {
    try {
      await Job.update(1, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
        const job = await Job.create(newJob);
        await Job.update(job.id, {});
        fail();
    } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  const newJob = {
    title: "testNewJob",
    salary: 10000,
    equity: "0.05",
    companyHandle: "c2"
  };
  
  test("remove job", async function () {
    const job = await Job.create(newJob);
    await Job.remove(job.id);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id=${job.id}`);
    expect(res.rows.length).toEqual(0);
  });
  
  test("not found if no such company", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

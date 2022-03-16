"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  testJobIds,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "jobTest",
        salary: 100000,
        equity: 0.06,
        companyHandle: "c1",
        equity: "0.2"
    };

    test("not good for users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("good for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: newJob,
          });
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                salary: 100000
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                salary: "22"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(401);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("good for anon", async function () {
        const resp = await request(app).get(`/jobs`);
        expect(resp.body).toEqual({
			jobs : [
				{
					id: expect.any(Number),
					title         : 'test1',
					salary        : 100,
					equity        : '0.1',
					companyHandle : 'c1',
					companyName   : 'C1'
				},
				{
					id: expect.any(Number),
					title         : 'test2',
					salary        : 200,
					equity        : '0.2',
					companyHandle : 'c1',
					companyName   : 'C1'
				},
				{
					id: expect.any(Number),
					title         : 'test3',
					salary        : 300,
					equity        : null,
					companyHandle : 'c1',
					companyName   : 'C1'
				}
			]
		});
	});
    
      test("bad request on invalid filter key", async function () {
        const resp = await request(app)
            .get(`/jobs`)
            .query({ minSalary: 2, nope: "nope" });
        expect(resp.statusCode).toEqual(400);
      });
    });
    

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const jobs = await db.query(`SELECT * FROM jobs`);
        const resp = await request(app).get(`/jobs/${jobs.testJobIds}`)
        const { job } = resp.body;
        expect(job).toHaveProperty("title", `${jobs.testJobIds}`);
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admins", async function () {
        const jobs = await db.query(`SELECT * FROM jobs`);
        const resp = await request(app)
            .patch(`/jobs/${jobs.row[0].id}`)
            .send({ title: "Updated job title" })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body.job).toEqual({
            job: {
              id: expect.any(Number),
              title: "Updated job title"
            },
        });
    }); 

    test("unauth for anon", async function () {
        const jobs = await db.query(`SELECT * FROM jobs`);
        const resp = await request(app)
            .patch(`/jobs/${jobs.testJobIds}`)
            .send({ title: "update to job title" });
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for any logged in user that is not an admin", async function () {
        const jobs = await db.query(`SELECT * FROM jobs`);
        const resp = await request(app)
            .patch(`/jobs/${jobs.testJobIds}`)
            .send({ title: "update to job title" })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "new title",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request on handle change attempt", async function () {
        const jobs = await db.query(`SELECT * FROM jobs`);
        const resp = await request(app)
            .patch(`/jobs/${jobs.testJobIds}`)
            .send({ companyHandle: "c1-new" })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request on invalid data", async function () {
        const jobs = await db.query(`SELECT * FROM jobs`);
        const resp = await request(app)
            .patch(`/jobs/${jobs.testJobIds}`)
            .send({ equity: 0.80 })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
        const jobs = await db.query(`SELECT * FROM jobs`);
        const resp = await request(app)
          .delete(`/jobs/${jobs.rows[0]}`)
          .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({"error": {"message": "Unauthorized", "status": 401}});
    });
  
    test("unauth for others", async function () {
        const jobs = await db.query(`SELECT * FROM jobs`);
        const resp = await request(app)
          .delete(`/jobs/${jobs.rows[0]}`)
          .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });
  
    test("unauth for anon", async function () {
        const jobs = await db.query(`SELECT * FROM jobs`);
        const resp = await request(app)
          .delete(`/jobs/${jobs.rows[0]}`)
        expect(resp.statusCode).toEqual(401);
    });
  
    test("not found for no such job", async function () {
        const resp = await request(app)
          .delete(`/jobs/0`)
          .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
  });
  

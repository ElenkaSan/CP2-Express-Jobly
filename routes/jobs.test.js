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
        equity: "0.06",
        companyHandle: "c1"
    };

    test("good for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: 		{
                id: expect.any(Number),
                title         : "jobTest",
                salary        : 100000,
                equity        : "0.06",
                company_handle : "c1",
            }
          });
    });

    test("not good for users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                salary: 100000
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                salary: "22"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("good for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
			jobs : [
				{
					id: expect.any(Number),
					title         : 'test1',
					salary        : 100,
					equity        : '0.1',
					handle : 'c1',
				},
				{
					id: expect.any(Number),
					title         : 'test2',
					salary        : 200,
					equity        : '0.2',
					handle : 'c1',
				},
				{
					id: expect.any(Number),
					title         : 'test3',
					salary        : 300,
					equity        : null,
					handle : 'c1',
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
        const resp = await request(app).get(`/jobs/${testJobIds[1]}`)
        const { job } = resp.body;
        expect(job).toHaveProperty("title", "testJob2");
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("good for admins", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({ title: "Updated job title" })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            jobs:
             {
              id: testJobIds[0],
              title: "Updated job title",
              companyHandle: "c1",
              equity: "0.1",
              salary: 1,
            },
        });
        expect(resp.body).toHaveProperty('[]', {jobs: {"companyHandle": "c1", "equity": "0.1", "id": testJobIds[0], "salary": 1, "title": "Updated job title"}});
    }); 

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({ title: "update to job title" });
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for any logged in user that is not an admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
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
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on handle change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({ companyHandle: "c1-new" })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({ equity: 0.80 })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
          .delete(`/jobs/${testJobIds[0]}`)
          .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({deleted: `${testJobIds[0]}` });
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
  

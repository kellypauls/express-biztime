process.env.NODE_ENV = 'test';
const req = require('supertest');
const app = require('../app');
const db = require('../db');


let company;
let invoice;

beforeEach(async function(){
    let resp1 = await db.query(`INSERT INTO companies (code, name, description)
        VALUES ('apple-computer', 'Apple Computer', 'Maker of OSX.') 
        RETURNING code, name, description`);
    let resp2 = await db.query(`INSERT INTO invoices (comp_Code, amt, paid, paid_date)
        VALUES ('apple-computer', 100, false, null) 
        RETURNING id, comp_code, amt, paid, add_date, paid_date`)
    company = resp1.rows[0]
    invoice = resp2.rows[0]
})

afterEach(async function(){
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
})

afterAll(async function(){
    await db.end();
})


describe('GET /companies', function(){
    test("gets all companies", async function(){
        const resp = await req(app).get('/companies');
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual(`{companies: [{"code":"apple-computer","name":"Apple Computer","description":"Maker of OSX."}]}`)
    })
})

describe('GET /companies/:code', function(){
    test('gets single company', async function(){
        const resp = await req(app).get(`/companies/${company.code}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual(`{company: {"code":"apple-computer","name":"Apple Computer","description":"Maker of OSX."}}`)
    })

    test("doesn't get fake company", async function(){
        const resp = await req(app).get(`/companies/burp`);
        expect(resp.statusCode).toBe(404);
    })
})

describe('POST /companies', function(){
    test('posts new company', async function(){
        const resp = await req(app).post('/companies').send({"name": "New Company", "description": "New description"});
        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual(`{company: {"code":"new-company","name":"New Company","description":"New description"}}`)
    })

    test('throws error if missing info', async function(){
        const resp = await req(app).post('/companies').send({"name": "New Company"});
        expect(resp.statusCode).toBe(400);
    })
})

describe('PUT /companies/:code', function(){
    test('updates company', async function(){
        const resp = await req(app).put(`/companies/${company.code}`).send({"name": "New Company", "description": "New description"});
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual(`{company: {"code":"apple-computer","name":"New Company","description":"New description"}}`)
    })

    test("doesn't update fake company", async function(){
        const resp = await req(app).put(`/companies/flop`).send({"name": "New Company", "description": "New description"});
        expect(resp.statusCode).toBe(404);
    })
})

describe('DELETE /companies/:code', function(){
    test('deletes company', async function(){
        const resp = await req(app).delete(`/companies/${company.code}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({"status": "deleted"})
    })

    test("doesn't delete fake company", async function(){
        const resp = await req(app).delete(`/companies/hole`);
        expect(resp.statusCode).toBe(404);
    })
})
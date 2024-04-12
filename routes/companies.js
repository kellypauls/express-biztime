const express = require('express');
const router = new express.Router();
const db = require('../db')
const expressError = require('../expressError')
const slugify = require('slugify')


router.get('/', async function(req, res, next){
    try{
        let companies = await db.query(`SELECT * FROM companies;`);
        companies = JSON.stringify(companies.rows)
        return res.json(`{companies: ${companies}}`);
    } catch(e){
        return next(e);
    }
})

router.get('/:code', async function(req, res, next){
    try{
        const code = req.params.code;
        let company = await db.query(`SELECT * FROM companies JOIN 
            company_industries ON companies.code=company_industries.comp_code 
            JOIN industries ON company_industries.ind_code=industries.code 
            WHERE companies.code=$1`, [code]);
        company = JSON.stringify(company.rows[0])
        if (typeof company === 'undefined'){
            throw new expressError('Company not found', 404);
        }
        return res.json(`{company: ${company}}`);
    } catch(e){
        return next(e)
    }
})

router.post('/', async function(req, res, next){
    try{
        const { name, description } = req.body;
        if (!name || !description){
            throw new expressError('All parameters must be defined', 400);
        }
        let code = name.toLowerCase();
        code = slugify(code);
        let result = await db.query(`INSERT INTO companies 
            (code, name, description) VALUES 
            ($1, $2, $3) RETURNING code, name, description`, [code, name, description]);
        result = JSON.stringify(result.rows[0]);
        return res.status(201).json(`{company: ${result}}`);
    } catch(e){
        return next(e)
    }
})

router.put('/:code', async function(req, res, next){
    try{
        const { name, description } = req.body;
        let result = await db.query(`UPDATE companies
            SET name=$1, description=$2
            WHERE code=$3 RETURNING code, name, description`, 
            [name, description, req.params.code]);
            result = JSON.stringify(result.rows[0]);
            if (typeof result === 'undefined'){
                throw new expressError('Company not found', 404);
            }
            return res.json(`{company: ${result}}`);
    } catch(e){
        return next(e)
    }
})

router.delete('/:code', async function(req, res, next){
    try{
        let company = await db.query(`SELECT * FROM companies WHERE code=$1`, [req.params.code]);
        if (company.rows.length === 0){
            throw new expressError('Company not found', 404);
        }
        const result = await db.query(`DELETE FROM companies
            WHERE code = $1`, [req.params.code]);
            return res.json({"status": "deleted"})
    } catch(e){
        return next(e)
    }
})


module.exports = router